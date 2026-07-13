# CrediCard-MSME Onboarding & Underwriting Dashboard

The interactive **full-stack web application** for the **MSME Financial Health Card (Problem Statement 3)** has been successfully implemented and is active. 

The application utilizes a **FastAPI backend** that trains and runs an actual **Machine Learning scoring model** and exposes file-parsing REST APIs connected to a glassmorphic Next-gen frontend dashboard.

---

## File Directory Structure

All implementation code has been written directly to the project folder:
* **FastAPI Server Entrypoint**: [main.py](file:///Users/hirthikbalaji/Documents/IDB/msme-health-card/backend/main.py)
* **ML Model Core & SHAP Calculations**: [model_core.py](file:///Users/hirthikbalaji/Documents/IDB/msme-health-card/backend/model_core.py)
* **Model Training Script**: [train_model.py](file:///Users/hirthikbalaji/Documents/IDB/msme-health-card/backend/train_model.py)
* **File Ingestion Parsers**: [parsers.py](file:///Users/hirthikbalaji/Documents/IDB/msme-health-card/backend/parsers.py)
* **HTML Entrypoint**: [index.html](file:///Users/hirthikbalaji/Documents/IDB/msme-health-card/index.html)
* **Glassmorphic Styling**: [styles.css](file:///Users/hirthikbalaji/Documents/IDB/msme-health-card/styles.css)
* **Interactive Engine Logic**: [app.js](file:///Users/hirthikbalaji/Documents/IDB/msme-health-card/app.js)

---

## Technical Features & Implementation Highlights

### 1. Trained Machine Learning Engine (`model_core.py`)
* **Scoring Core**: Runs a local **RandomForestRegressor** trained on a generated dataset of 1,000 synthetic MSME profiles, mapped along 7 alternate data features.
* **Explainable AI (SHAP)**: Bypasses simple mockup weights. The backend implements a **Marginal Attribution Explainer** (SHAP approximation) that calculates the exact local feature contributions. It explains how much each variable pushed the score up (positive green bars) or down (negative red bars) from the baseline expected average of **669**.

### 2. Alternate Data File Ingestion Parsers (`parsers.py`)
Integrates actual file parsers to simulate an automated underwriting portal. Users can upload raw files, which are immediately parsed by the backend to dynamically adjust the UI inputs:
* **GST Parser**: Reads GSTR-3B JSON logs to extract average monthly taxable sales revenue and filing timeliness ratios.
* **UPI Parser**: Analyzes credit transaction logs in a CSV file, calculates monthly frequency, and derives cash flow volatility (coefficient of variation).
* **EPFO Parser**: Ingests member salary JSON registries to verify employee count and payment regularity.

### 3. Public Sandbox Sample File Downloader
* To facilitate immediate testing by judges, the UI includes **"Sample" buttons** next to the file uploads.
* Clicking these triggers a dynamic download of mock files (`sample_gst.json`, `sample_upi.csv`, and `sample_epfo.json`) constructed by the backend, which can then be directly uploaded to test the parser in real-time.

### 4. ULI & OCEN Hub Walkthrough
* **Step 1 (ULI)**: Sends a REST request to pull aggregated alternative profiles from the Account Aggregator network.
* **Step 2 (OCEN)**: Performs underwriting, assigns credit card limits (up to ₹5,00,000), and sanctions interest rates dynamically based on the final ML credit score.
* **Step 3 (Disbursement)**: Simulates IMPS settlement to the MSME's VPA, activating a virtual glowing **IDBI BIZ GROW** credit card with the approved limit.

---

## How to Test the Live Application

The FastAPI full-stack server is running in the background under task ID `task-102`:
1. Open your browser and navigate to **[http://localhost:8080](http://localhost:8080)**.
2. In the **MSME Onboarding** tab, click the **"Sample"** buttons next to GST, UPI, and EPFO to download the mock test files.
3. Upload these files using the corresponding file inputs, and watch the manual sliders instantly slide to the parsed values!
4. Click **"Calculate Health Score"** to run the trained model and view your SHAP local attributions and credit score on the dashboard.
