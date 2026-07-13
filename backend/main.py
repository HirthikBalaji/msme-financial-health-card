import os
import sys
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse, JSONResponse
from pydantic import BaseModel

# Add backend dir to path to import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from model_core import engine
from parsers import parse_gst_json, parse_upi_csv, parse_epfo_json

app = FastAPI(title="CrediCard-MSME APIs", version="1.0.0")

# CORS middleware for testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Project root path
root_dir = "/Users/hirthikbalaji/Documents/IDB/msme-health-card"

# Pydantic schemas
class MSMEProfile(BaseModel):
    gst_revenue: float
    gst_compliance: float
    upi_count: float
    upi_volatility: float
    epfo_employees: float
    epfo_compliance: float
    bank_balance: float

# --- Root HTML / Static files routers ---
@app.get("/")
def read_root():
    return FileResponse(os.path.join(root_dir, "index.html"))

@app.get("/styles.css")
def read_styles():
    return FileResponse(os.path.join(root_dir, "styles.css"))

@app.get("/app.js")
def read_js():
    return FileResponse(os.path.join(root_dir, "app.js"))

# --- Core ML Scoring API ---
@app.post("/api/score")
def calculate_credit_score(profile: MSMEProfile):
    try:
        if not engine:
            raise HTTPException(status_code=500, detail="Scoring engine is not initialized.")
        
        # Calculate scores & SHAP weights
        explanation = engine.explain(profile.dict())
        return explanation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Ingestion File Upload APIs ---
@app.post("/api/upload-gst")
async def upload_gst(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        parsed = parse_gst_json(contents)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse GST file: {e}")

@app.post("/api/upload-upi")
async def upload_upi(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        parsed = parse_upi_csv(contents)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse UPI file: {e}")

@app.post("/api/upload-epfo")
async def upload_epfo(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        parsed = parse_epfo_json(contents)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse EPFO file: {e}")

# --- Sample Data Downloader Endpoints (Wow Factor) ---
@app.get("/api/samples/gst")
def get_sample_gst():
    sample_gst = {
        "legalName": "Doremon Crafts Private Limited",
        "gstin": "27AAACD9921A1Z0",
        "filings": [
            {"month": "Jan 2026", "status": "FILLED", "delay_days": 0, "taxable_supplies_value": 1850000},
            {"month": "Feb 2026", "status": "FILLED", "delay_days": 0, "taxable_supplies_value": 1920000},
            {"month": "Mar 2026", "status": "FILLED", "delay_days": 0, "taxable_supplies_value": 1780000},
            {"month": "Apr 2026", "status": "FILLED", "delay_days": 0, "taxable_supplies_value": 2100000},
            {"month": "May 2026", "status": "FILLED", "delay_days": 0, "taxable_supplies_value": 1950000},
            {"month": "Jun 2026", "status": "FILLED", "delay_days": 0, "taxable_supplies_value": 1800000}
        ]
    }
    return JSONResponse(content=sample_gst)

@app.get("/api/samples/upi")
def get_sample_upi():
    # Construct sample CSV transactions
    csv_content = """Date,TransactionID,VPA,Amount,Type
2026-06-01,TXN10029,cust1@okaxis,4500,CREDIT
2026-06-02,TXN10030,vendor@paytm,1200,DEBIT
2026-06-02,TXN10031,cust2@okhdfc,8900,CREDIT
2026-06-05,TXN10032,cust3@oksbi,15000,CREDIT
2026-06-08,TXN10033,taxdept@gov,4500,DEBIT
2026-06-10,TXN10034,cust4@okicici,6200,CREDIT
2026-06-12,TXN10035,cust5@okaxis,9200,CREDIT
2026-06-15,TXN10036,supplier@ybl,11000,DEBIT
2026-06-18,TXN10037,cust6@okaxis,3400,CREDIT
2026-06-20,TXN10038,cust7@okaxis,5800,CREDIT
2026-06-22,TXN10039,rent@hdfc,22000,DEBIT
2026-06-25,TXN10040,cust8@okaxis,7300,CREDIT
2026-06-28,TXN10041,cust9@okaxis,12500,CREDIT
2026-06-30,TXN10042,cust10@okaxis,8200,CREDIT"""
    return PlainTextResponse(content=csv_content)

@app.get("/api/samples/epfo")
def get_sample_epfo():
    sample_epfo = {
        "employerName": "Doremon Crafts Private Limited",
        "activeSubscribers": 24,
        "contributions": [
            {"month": "Jan 2026", "delay_days": 0},
            {"month": "Feb 2026", "delay_days": 1},
            {"month": "Mar 2026", "delay_days": 0},
            {"month": "Apr 2026", "delay_days": 0},
            {"month": "May 2026", "delay_days": 2},
            {"month": "Jun 2026", "delay_days": 0}
        ]
    }
    return JSONResponse(content=sample_epfo)
