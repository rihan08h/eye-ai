import sys, asyncio, time, threading
sys.path.insert(0, '/home/claude/repo')
from ml_service.execution import run_inference, metrics, MAX_QUEUE_DEPTH, ServiceBusyError

active = 0
max_concurrent = 0
lock = threading.Lock()

def fake_inference(delay=0.25, status="ok", prediction="Moderate"):
    def fn():
        global active, max_concurrent
        with lock:
            active += 1
            max_concurrent = max(max_concurrent, active)
        time.sleep(delay)   # stands in for the forward pass
        with lock:
            active -= 1
        return {"status": status, "prediction": prediction,
                "imageQuality": {"issues": ["Image is blurry — hold camera steady"] if status=="ungradable" else []}}
    return fn

async def main():
    print("TEST 1 — 10 concurrent predictions must never overlap")
    print("  (overlap would let Grad-CAM hooks capture the wrong image's activations)")
    t0 = time.perf_counter()
    await asyncio.gather(*[run_inference(fake_inference(0.15)) for _ in range(8)])
    elapsed = time.perf_counter() - t0
    print(f"  max concurrent executions = {max_concurrent}  {'PASS' if max_concurrent==1 else 'FAIL'}")
    print(f"  8 x 0.15s ran in {elapsed:.2f}s (serialised, as intended)")

    print("\nTEST 2 — event loop stays responsive during inference")
    ticks = 0
    async def heartbeat():
        nonlocal ticks
        for _ in range(20):
            await asyncio.sleep(0.02); ticks += 1
    await asyncio.gather(run_inference(fake_inference(0.4)), heartbeat())
    print(f"  heartbeat ticked {ticks}/20 times while the model was busy  {'PASS' if ticks>=18 else 'FAIL'}")

    print("\nTEST 3 — queue saturation sheds load instead of piling up")
    tasks = [asyncio.create_task(run_inference(fake_inference(0.3))) for _ in range(MAX_QUEUE_DEPTH + 6)]
    await asyncio.sleep(0.05)
    results = await asyncio.gather(*tasks, return_exceptions=True)
    busy = sum(isinstance(r, ServiceBusyError) for r in results)
    okc  = sum(isinstance(r, dict) for r in results)
    print(f"  {okc} served, {busy} rejected with ServiceBusyError  {'PASS' if busy>0 else 'FAIL'}")

    print("\nTEST 4 — metrics reflect reality")
    await run_inference(fake_inference(0.05, status="ungradable", prediction=None))
    try:
        await run_inference(lambda: (_ for _ in ()).throw(RuntimeError("boom")))
    except RuntimeError:
        pass
    m = metrics.snapshot()
    print(f"  totalRequests={m['totalRequests']} errors={m['totalErrors']} errorRate={m['errorRate']}")
    print(f"  ungradable={m['ungradableCount']} rejectedBusy={m['rejectedBusy']}")
    print(f"  latency p50={m['latencyMs']['p50']}ms p95={m['latencyMs']['p95']}ms")
    print(f"  predictionDistribution={m['predictionDistribution']}")
    print(f"  topQualityIssues={m['topQualityIssues']}")
    ok = m['totalErrors']==1 and m['ungradableCount']==1 and m['rejectedBusy']>0
    print(f"  {'PASS' if ok else 'FAIL'}")

asyncio.run(main())
