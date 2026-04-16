"""
Quick smoke tests for the prediction service.
Run with:  python test_predict.py
(service must be running on localhost:8000)
"""

import httpx
import json

BASE = "http://localhost:8000"

CASES = [
    {
        "name": "Healthy user",
        "payload": {"avgProblemsPerDay": 3.5, "consistencyScore": 82, "growthRate": 15, "weakTopicsCount": 1},
        "expect_risk": "low",
    },
    {
        "name": "Declining user",
        "payload": {"avgProblemsPerDay": 0.8, "consistencyScore": 28, "growthRate": -40, "weakTopicsCount": 6},
        "expect_risk": "high",
    },
    {
        "name": "Medium risk user",
        "payload": {"avgProblemsPerDay": 1.5, "consistencyScore": 50, "growthRate": -10, "weakTopicsCount": 3},
        "expect_risk": "medium",
    },
]

def run():
    print(f"\n{'='*60}")
    print("  LeetCode ML Service — Smoke Tests")
    print(f"{'='*60}\n")

    # Health check
    r = httpx.get(f"{BASE}/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print(f"✅  /health  →  {r.json()}\n")

    passed = 0
    for case in CASES:
        r = httpx.post(f"{BASE}/predict", json=case["payload"])
        assert r.status_code == 200, f"FAIL [{case['name']}]: {r.text}"
        result = r.json()

        risk_ok = result["streakRisk"] == case["expect_risk"]
        status = "✅" if risk_ok else "⚠️ "
        if risk_ok:
            passed += 1

        print(f"{status}  {case['name']}")
        print(f"     risk={result['streakRisk']} (expected {case['expect_risk']})"
              f"  score={result['riskScore']:.3f}"
              f"  week={result['predictedSolvesNextWeek']}"
              f"  confidence={result['confidence']:.2f}"
              f"  decline={result['declineSeverity']}")
        print(f"     {result['message'][:90]}...")
        print()

    print(f"{'='*60}")
    print(f"  {passed}/{len(CASES)} tests passed")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    run()
