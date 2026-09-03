import sys, io, base64
sys.path.insert(0,'/home/claude/repo')
from PIL import Image
import numpy as np

# Stub the engine so the HTTP layer can be tested without torch.
class StubEngine:
    model_version = "densenet169-dr5-a3f91c02"
    architecture = "densenet169"
    checkpoint_path = "artifacts/dr-model.ckpt"
    def analyze(self, pil, bgr, want_heatmap=True):
        # ungradable path triggered by a very dark image
        if np.array(pil).mean() < 20:
            return {"status":"ungradable","imageQuality":{"status":"rejected","score":0.2,
                    "gradable":False,"retinaPlausible":True,"issues":["Image is too dark — increase illumination"],"metrics":{}},
                    "prediction":None,"confidence":None,"probabilities":None,"uncertainty":None,
                    "explainability":None,"modelVersion":self.model_version,"processingTimeMs":40,"isMock":False}
        return {"status":"ok","imageQuality":{"status":"good","score":0.9,"gradable":True,
                "retinaPlausible":True,"issues":[],"metrics":{}},
                "prediction":"Moderate","confidence":0.78,
                "probabilities":{"noDR":0.05,"mild":0.11,"moderate":0.78,"severe":0.04,"proliferative":0.02},
                "uncertainty":{"level":"LOW","entropy":1.0,"margin":0.67,"isBorderline":False,
                               "reviewRequired":False,"message":"ok"},
                "explainability":{"heatmapBase64":"iVBOR","overlayBase64":"iVBOR","attentionScore":0.4,
                                  "regions":[],"method":"grad-cam","note":"x"},
                "modelVersion":self.model_version,"processingTimeMs":300,"isMock":False}
    def assess_quality(self, bgr):
        return {"status":"good","score":0.9,"gradable":True,"retinaPlausible":True,"issues":[],"metrics":{}}

import ml_service.main as M
from fastapi.testclient import TestClient

def img_bytes(val=120):
    b=io.BytesIO(); Image.fromarray(np.full((256,256,3), val, np.uint8)).save(b,'JPEG'); return b.getvalue()

print("=== model NOT loaded (startup failed) ===")
M._engine=None; M._load_error="artifacts/dr-model.ckpt is a Git LFS pointer"
c=TestClient(M.app, raise_server_exceptions=False)
r=c.get("/health"); print(f"  GET  /health  -> {r.status_code} status={r.json()['status']} modelLoaded={r.json()['modelLoaded']}")
r=c.post("/predict", files={"file":("a.jpg", img_bytes(), "image/jpeg")})
print(f"  POST /predict -> {r.status_code} error={r.json()['detail']['error']}")
print(f"  {'PASS' if r.status_code==503 else 'FAIL'}: refuses rather than returning a result\n")

print("=== model loaded ===")
M._engine=StubEngine(); M._load_error=None
r=c.get("/health"); j=r.json(); print(f"  GET  /health -> {r.status_code} modelLoaded={j['modelLoaded']} version={j['modelVersion']}")
r=c.get("/model-info"); j=r.json()
print(f"  GET  /model-info -> lesionDetection={j['capabilities']['lesionDetection']} (must be False)")

r=c.post("/predict", files={"file":("a.jpg", img_bytes(), "image/jpeg")}); j=r.json()
print(f"  POST /predict -> {r.status_code} {j['prediction']} @ {j['confidence']} isMock={j['isMock']}")

r=c.post("/predict", files={"file":("dark.jpg", img_bytes(5), "image/jpeg")}); j=r.json()
print(f"  POST /predict (dark) -> {r.status_code} status={j['status']} prediction={j['prediction']}")
print(f"  {'PASS' if j['status']=='ungradable' and j['prediction'] is None else 'FAIL'}: ungradable yields no prediction")

print("\n=== input validation ===")
for label, kw, expect in [
    ("empty file",        {"files":{"file":("e.jpg", b"", "image/jpeg")}}, 400),
    ("not an image",      {"files":{"file":("x.txt", b"hello world", "text/plain")}}, 415),
    ("corrupt image",     {"files":{"file":("c.jpg", b"\xff\xd8notjpeg", "image/jpeg")}}, 400),
    ("oversized",         {"files":{"file":("b.jpg", b"\x00"*(31*1024*1024), "image/jpeg")}}, 413),
]:
    r=c.post("/predict", **kw)
    print(f"  {label:<16} -> {r.status_code} {'PASS' if r.status_code==expect else f'FAIL (want {expect})'}")

print("\n=== metrics ===")
j=c.get("/metrics").json()
print(f"  totalRequests={j['totalRequests']} errorRate={j['errorRate']} ungradable={j['ungradableCount']}")
print(f"  predictionDistribution={j['predictionDistribution']}")
print(f"  latency p50={j['latencyMs']['p50']}ms")
print(f"  note: {j['note'][:60]}...")
