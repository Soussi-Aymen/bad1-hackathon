import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = Path(__file__).parent / "data"


def load_json(name: str):
    with open(DATA_DIR / name, "r", encoding="utf-8") as f:
        return json.load(f)


app = FastAPI(title="DealBridge Berlin API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/api/investor")
def get_investor():
    return load_json("investor.json")


@app.get("/api/deals")
def get_deals():
    return load_json("deals.json")


@app.get("/api/deals/{deal_id}")
def get_deal_detail(deal_id: str):
    if deal_id != "routepilot":
        raise HTTPException(status_code=404, detail="Deal detail not available for this id")
    return load_json("routepilot.json")
