# CrediCard-MSME | AI/ML MSME Financial Health Card

**CrediCard-MSME** is a full-stack financial profiling and cash-flow-based underwriting platform built for the **IDBI Innovate Hackathon** under **Problem Statement 3: MSME Financial Health Score**.

Our solution addresses the credit-access gap for New-to-Credit (NTC) and New-to-Bank (NTB) enterprises by aggregating alternative digital footprints, running a trained Machine Learning scoring engine, and providing real-time Explainable AI (XAI) details to underwriters. It interfaces with India's Unified Lending Interface (ULI) and Open Credit Enablement Network (OCEN) rails for instant digital loan provisioning.

---

## 🚀 Live Demo & Repository
* **GitHub Repository**: [https://github.com/HirthikBalaji/msme-financial-health-card](https://github.com/HirthikBalaji/msme-financial-health-card)
* **Local Landing Port**: `http://localhost:8080`

---

## 🛠 Key Features

1. **Alternate Data Ingestion Pipeline (`parsers.py`)**:
   * **GST Inward/Outward Ledger (JSON)**: Ingests GSTR-3B filings to parse monthly average taxable revenue and tax compliance filing consistency.
   * **UPI Statement Log (CSV)**: Parses transaction records to evaluate inflow cash velocity, frequency, and cash flow volatility (coefficient of variation).
   * **EPFO Member Registry (JSON)**: Ingests subscriber registries to verify employee count size and monthly wage deposit punctuality.
   
2. **Trained ML Underwriting Engine (`model_core.py`)**:
   * Powered by a local **RandomForestRegressor** trained on a synthetic dataset of 1,000 MSME profiles. 
   * Computes a dynamic Financial Health Score (300 to 1000) and routes the rating classification (Outstanding, Excellent, Good, Poor).

3. **Explainable AI (SHAP Local Explanations)**:
   * Uses a **Marginal Attribution Explainer** (SHAP approximation) to calculate the exact numerical contribution of each alternate data feature.
   * Displays local feature attributions as positive (green) and negative (red) impact weights relative to the baseline training average (**669**).

4. **ULI / OCEN Integration Sandbox walkthrough**:
   * **Step 1 (ULI)**: Simulates pulling consent profiles from the Account Aggregator network.
   * **Step 2 (OCEN)**: Performs underwriting, assigns credit card limits (up to ₹5,00,000), and sanctions interest rates dynamically based on the final ML credit score.
   * **Step 3 (Disbursement)**: Simulates IMPS settlement to the MSME's UPI VPA, activating a virtual glowing **IDBI BIZ GROW** credit card.

5. **Professional Dual-Theme UI**:
   * Sleek, modern, glassmorphic layout.
   * Default **White Theme** for a clean corporate banking feel, with a **togglable Dark Mode** for modern dashboard visuals.
   * Persistence of theme selections via `localStorage`.

---

## 🏗 Tech Stack

* **Backend & API**: FastAPI, Uvicorn, Python 3.11
* **Machine Learning**: Scikit-Learn (RandomForestRegressor), NumPy, Pandas
* **Frontend UI**: Vanilla HTML5, CSS3 Custom Properties (Variables), JavaScript (ES6 DOM & Fetch APIs)
* **Visualizations**: Chart.js, Lucide Icons

---

## 📂 Project Structure

```text
msme-financial-health-card/
├── msme-health-card/
│   ├── backend/
│   │   ├── train_model.py      # Generates synthetic data and trains the RandomForest model
│   │   ├── model_core.py       # Scoring engine and SHAP attribution calculations
│   │   ├── parsers.py          # Ingestion parsers for GSTR, UPI, and EPFO files
│   │   ├── main.py             # FastAPI REST endpoints and static file routers
│   │   └── run_backend.py      # Startup script (checks dependencies, trains model, launches server)
│   ├── index.html              # Main frontend HTML layout (Tabbed: Simulator, Dashboard, APIs)
│   ├── styles.css              # Glassmorphic light/dark mode stylesheet
│   └── app.js                  # Frontend controller communicating with FastAPI and Chart.js
├── Prototype Submission Deck _ IDBI Innovate.pptx  # Populated pitch deck
├── hackathon_problem_analysis.md                  # Detailed problem evaluation report
├── pitch_deck_summary.md                          # PPTX slide content outline
├── prototype_implementation.md                    # Working application documentation
├── .gitignore                                     # Ignored cache files
└── README.md                                      # Project overview
```

---

## 💻 Getting Started

### Prerequisites
Make sure you have **Python 3.8+** installed on your system.

### Running the Application

1. **Clone the repository**:
   ```bash
   git clone https://github.com/HirthikBalaji/msme-financial-health-card.git
   cd msme-financial-health-card
   ```

2. **Run the launcher script**:
   The launcher automatically checks for dependencies (`fastapi`, `uvicorn`, `scikit-learn`, `numpy`, `python-multipart`), installs any that are missing, trains the machine learning scoring model, and launches the uvicorn server:
   ```bash
   python3 msme-health-card/backend/run_backend.py
   ```

3. **Open the App**:
   Navigate to **[http://localhost:8080](http://localhost:8080)** in your web browser.

---

## 🧪 Testing Ingestion with Sample Files

To verify the alternate data parser:
1. In the **MSME Onboarding** tab of the UI, click the **"Sample"** button next to any data registry to download a mock file (`sample_gst.json`, `sample_upi.csv`, or `sample_epfo.json`).
2. Upload the file using the file inputs.
3. The sliders and dropdowns in the simulator will instantly adjust to show the parsed values extracted from the upload.
4. Click **"Calculate Health Score"** to run the prediction and view the SHAP explanations.

---

## 👥 Team Doremon
* **Anandhappriya** (Leader) - [anandhappriya@gmail.com](mailto:anandhappriya@gmail.com)
* **Hirthik Balaji C** - [hirthikbalaji2006@gmail.com](mailto:hirthikbalaji2006@gmail.com)
