import json
import csv
import io
from datetime import datetime

def parse_gst_json(content_bytes) -> dict:
    try:
        data = json.loads(content_bytes.decode("utf-8"))
        filings = data.get("filings", [])
        
        # Calculate monthly average revenue from GSTR-3B taxable supplies
        sales = []
        filed_on_time = 0
        total_filings = len(filings)
        
        for f in filings:
            sales.append(f.get("taxable_supplies_value", 0))
            if f.get("status") == "FILLED" and f.get("delay_days", 0) <= 0:
                filed_on_time += 1
                
        avg_revenue = sum(sales) / len(sales) / 100000.0 if sales else 15.0 # default to 15L
        compliance = filed_on_time / total_filings if total_filings else 0.8
        
        return {
            "gst_revenue": round(min(50.0, max(0.0, avg_revenue)), 2),
            "gst_compliance": round(min(1.0, max(0.0, compliance)), 2),
            "business_name": data.get("legalName", "Mock MSME Business")
        }
    except Exception as e:
        print(f"Error parsing GST: {e}")
        # Fallbacks
        return {
            "gst_revenue": 18.0,
            "gst_compliance": 0.95,
            "business_name": "Doremon Crafts MSME"
        }

def parse_upi_csv(content_bytes) -> dict:
    try:
        csv_text = content_bytes.decode("utf-8")
        reader = csv.DictReader(io.StringIO(csv_text))
        
        txns = list(reader)
        credit_amounts = []
        
        for t in txns:
            amount = float(t.get("Amount", t.get("amount", 0)))
            txn_type = t.get("Type", t.get("type", "CREDIT")).upper()
            if txn_type == "CREDIT":
                credit_amounts.append(amount)
                
        # Monthly transaction count (scaled to 1 month if sample is smaller)
        txn_count = len(credit_amounts)
        
        # Volatility: standard deviation / mean of amounts
        if len(credit_amounts) > 1:
            mean = sum(credit_amounts) / len(credit_amounts)
            variance = sum((x - mean) ** 2 for x in credit_amounts) / (len(credit_amounts) - 1)
            std_dev = variance ** 0.5
            volatility = std_dev / mean if mean > 0 else 0.5
        else:
            volatility = 0.3
            
        # Volatility bounded between 0.1 and 0.9
        volatility = min(0.9, max(0.1, volatility))
        
        return {
            "upi_count": min(1000, max(10, txn_count * 4)), # scale weekly to monthly if needed
            "upi_volatility": round(volatility, 2)
        }
    except Exception as e:
        print(f"Error parsing UPI: {e}")
        return {
            "upi_count": 350,
            "upi_volatility": 0.25
        }

def parse_epfo_json(content_bytes) -> dict:
    try:
        data = json.loads(content_bytes.decode("utf-8"))
        employees = data.get("activeSubscribers", 20)
        contributions = data.get("contributions", [])
        
        regular_deposits = 0
        total_months = len(contributions)
        
        for c in contributions:
            if c.get("delay_days", 0) <= 3: # 3 days grace
                regular_deposits += 1
                
        compliance = regular_deposits / total_months if total_months else 0.9
        
        return {
            "epfo_employees": int(employees),
            "epfo_compliance": round(min(1.0, max(0.0, compliance)), 2)
        }
    except Exception as e:
        print(f"Error parsing EPFO: {e}")
        return {
            "epfo_employees": 24,
            "epfo_compliance": 0.92
        }
