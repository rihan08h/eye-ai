"""
RETINAAI — inference execution and runtime metrics.

Two production concerns that the naive `async def` endpoint gets wrong:

1. BLOCKING THE EVENT LOOP.
   `engine.analyze()` is CPU-bound and takes hundreds of milliseconds to
   several seconds. Calling it directly inside an `async def` handler blocks
   the whole event loop, so a single in-flight prediction stalls every other
   request — including /health, which makes the service look dead to a load
   balancer while it is merely busy.

2. SHARED MUTABLE MODEL STATE.
   GradCAMExplainer registers forward and backward hooks on a shared module
   and stores the captured activations on the explainer instance. Two
   concurrent predictions would overwrite each other's activations and
   produce a heatmap belonging to the wrong image — silently, with no error.
   That is a patient-safety bug, not just a correctness one.

Both are solved by running inference in a single-worker thread pool: the
event loop stays free, and inference is serialised so the hooks can never
interleave. Throughput is bounded by one prediction at a time, which is the
correct trade for a single CPU-bound model. Scale out with more replicas
rather than more threads.
"""
import asyncio
import logging
import threading
import time
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from typing import Callable, Optional

logger = logging.getLogger(__name__)

# One worker: serialises inference so Grad-CAM hooks cannot interleave.
_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="inference")

# Requests waiting for the single worker. Beyond this, shed load rather than
# letting a queue build up that will time out anyway — a client that waits
# 90 seconds for a 45-second timeout gets a worse experience than one told
# immediately to retry.
MAX_QUEUE_DEPTH = 8

_queue_depth = 0
_queue_lock = threading.Lock()


class ServiceBusyError(RuntimeError):
    """Raised when too many requests are already waiting for the model."""


class Metrics:
    """
    In-process runtime metrics for the AI operations view (Module 23).

    Deliberately not persisted and not aggregated across replicas — these are
    observed operational counters, not model performance figures. Nothing here
    describes accuracy, sensitivity, or specificity, because this service has
    no ground truth to compute them against.
    """

    def __init__(self, window: int = 500):
        self._lock = threading.Lock()
        self._latencies = deque(maxlen=window)
        self.started_at = time.time()
        self.total_requests = 0
        self.total_errors = 0
        self.ungradable = 0
        self.rejected_busy = 0
        self.predictions = {}
        self.quality_issues = {}

    def record_success(self, result: dict, latency_ms: float) -> None:
        with self._lock:
            self.total_requests += 1
            self._latencies.append(latency_ms)

            if result.get("status") == "ungradable":
                self.ungradable += 1
            elif result.get("prediction"):
                label = result["prediction"]
                self.predictions[label] = self.predictions.get(label, 0) + 1

            for issue in (result.get("imageQuality") or {}).get("issues", []):
                self.quality_issues[issue] = self.quality_issues.get(issue, 0) + 1

    def record_error(self) -> None:
        with self._lock:
            self.total_requests += 1
            self.total_errors += 1

    def record_busy(self) -> None:
        with self._lock:
            self.rejected_busy += 1

    def snapshot(self) -> dict:
        with self._lock:
            latencies = sorted(self._latencies)
            total = self.total_requests

            def percentile(p: float) -> Optional[float]:
                if not latencies:
                    return None
                index = min(int(len(latencies) * p), len(latencies) - 1)
                return round(latencies[index], 1)

            return {
                "uptimeSeconds": int(time.time() - self.started_at),
                "totalRequests": total,
                "totalErrors": self.total_errors,
                "errorRate": round(self.total_errors / total, 4) if total else None,
                "ungradableCount": self.ungradable,
                "ungradableRate": round(self.ungradable / total, 4) if total else None,
                "rejectedBusy": self.rejected_busy,
                "queueDepth": _queue_depth,
                "latencyMs": {
                    "p50": percentile(0.50),
                    "p95": percentile(0.95),
                    "p99": percentile(0.99),
                    "samples": len(latencies),
                },
                "predictionDistribution": dict(self.predictions),
                "topQualityIssues": dict(
                    sorted(self.quality_issues.items(), key=lambda kv: -kv[1])[:5]
                ),
                "note": (
                    "Operational counters observed by this process since start. "
                    "Not model accuracy — no ground truth is available here."
                ),
            }


metrics = Metrics()


async def run_inference(fn: Callable[[], dict]) -> dict:
    """
    Execute a blocking inference callable off the event loop, serialised.

    Raises ServiceBusyError when the queue is saturated.
    """
    global _queue_depth

    with _queue_lock:
        if _queue_depth >= MAX_QUEUE_DEPTH:
            metrics.record_busy()
            raise ServiceBusyError(
                f"{_queue_depth} requests already waiting for the model."
            )
        _queue_depth += 1

    started = time.perf_counter()
    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(_executor, fn)
        metrics.record_success(result, (time.perf_counter() - started) * 1000)
        return result
    except Exception:
        metrics.record_error()
        raise
    finally:
        with _queue_lock:
            _queue_depth -= 1


def shutdown() -> None:
    """Let the in-flight prediction finish rather than killing it mid-forward-pass."""
    logger.info("Draining inference executor...")
    _executor.shutdown(wait=True, cancel_futures=False)
