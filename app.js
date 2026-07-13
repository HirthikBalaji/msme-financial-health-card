// Initialize Lucide Icons and App Setup on Load
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    initApp();
    setupThemeToggle();
});

// Global state variables
let currentScore = 785;
let cashFlowChart = null;

// Static Mock Datasets for Client-side Fallbacks (Wow Factor: works fully on GitHub Pages!)
const STATIC_SAMPLES = {
    gst: {
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
    },
    upi: `Date,TransactionID,VPA,Amount,Type
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
2026-06-30,TXN10042,cust10@okaxis,8200,CREDIT`,
    epfo: {
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
};

function initApp() {
    // 1. Tab Switching Logic
    const navItems = document.querySelectorAll(".nav-item");
    const tabContents = document.querySelectorAll(".tab-content");
    const pageTitle = document.getElementById("page-title");
    const pageDesc = document.getElementById("page-desc");

    const tabMetadata = {
        "tab-simulator": {
            title: "MSME Onboarding & Simulator",
            desc: "Simulate alternate data points manually or upload raw data files to calculate a dynamic Financial Health Score."
        },
        "tab-dashboard": {
            title: "Financial Health Card",
            desc: "View the multidimensional credit profile, sub-scores, and Explainable AI (SHAP) local model attributions."
        },
        "tab-apis": {
            title: "ULI / OCEN Integration Hub",
            desc: "Mock real-time interactions with Unified Lending Interface (ULI) and Open Credit Enablement Network (OCEN) protocols."
        }
    };

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const tabId = item.getAttribute("data-tab");
            
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");
            
            tabContents.forEach(content => {
                content.classList.remove("active");
                if (content.id === tabId) {
                    content.classList.add("active");
                }
            });

            if (tabMetadata[tabId]) {
                pageTitle.textContent = tabMetadata[tabId].title;
                pageDesc.textContent = tabMetadata[tabId].desc;
            }

            if (tabId === "tab-dashboard") {
                updateDashboardCharts();
            }
        });
    });

    setupSliders();
    setupFileUploads();

    const btnCalculate = document.getElementById("btn-calculate");
    btnCalculate.addEventListener("click", () => {
        calculateScore();
    });

    setupApiSimulation();

    // Handle URL parameters for automated testing & screenshot taking
    const urlParams = new URLSearchParams(window.location.search);
    const targetTab = urlParams.get("tab");
    const autoCalc = urlParams.get("calc");
    
    // Parse slider parameters if present
    const pGstRev = urlParams.get("gst_rev");
    const pGstFile = urlParams.get("gst_file");
    const pUpiCnt = urlParams.get("upi_cnt");
    const pUpiVol = urlParams.get("upi_vol");
    const pEpfoEmp = urlParams.get("epfo_emp");
    const pEpfoDep = urlParams.get("epfo_dep");
    const pBankBal = urlParams.get("bank_bal");

    if (pGstRev) {
        document.getElementById("sim-gst-revenue").value = pGstRev;
        document.getElementById("val-gst-revenue").textContent = `₹${pGstRev} Lakhs`;
    }
    if (pGstFile) {
        document.getElementById("sim-gst-filing").value = pGstFile;
    }
    if (pUpiCnt) {
        document.getElementById("sim-upi-count").value = pUpiCnt;
        document.getElementById("val-upi-count").textContent = `${pUpiCnt} txn`;
    }
    if (pUpiVol) {
        document.getElementById("sim-upi-volatility").value = pUpiVol;
    }
    if (pEpfoEmp) {
        document.getElementById("sim-epfo-employees").value = pEpfoEmp;
        document.getElementById("val-epfo-employees").textContent = `${pEpfoEmp} staff`;
    }
    if (pEpfoDep) {
        document.getElementById("sim-epfo-deposit").value = pEpfoDep;
    }
    if (pBankBal) {
        document.getElementById("sim-bank-balance").value = pBankBal;
        document.getElementById("val-bank-balance").textContent = `₹${pBankBal} Lakhs`;
    }

    if (autoCalc === "true") {
        calculateScore();
    }
    
    if (targetTab) {
        const targetBtn = document.querySelector(`[data-tab="${targetTab}"]`);
        if (targetBtn) {
            targetBtn.click();
        }
    }
}


function setupSliders() {
    const sliders = [
        { id: "sim-gst-revenue", valId: "val-gst-revenue", suffix: " Lakhs", prefix: "₹" },
        { id: "sim-upi-count", valId: "val-upi-count", suffix: " txn", prefix: "" },
        { id: "sim-epfo-employees", valId: "val-epfo-employees", suffix: " staff", prefix: "" },
        { id: "sim-bank-balance", valId: "val-bank-balance", suffix: " Lakhs", prefix: "₹" }
    ];

    sliders.forEach(slider => {
        const sliderEl = document.getElementById(slider.id);
        const valEl = document.getElementById(slider.valId);
        
        if (sliderEl && valEl) {
            sliderEl.addEventListener("input", (e) => {
                let val = parseFloat(e.target.value).toFixed(slider.id.includes("balance") || slider.id.includes("revenue") ? 1 : 0);
                if (slider.id.includes("count") || slider.id.includes("employees")) {
                    val = parseInt(val);
                }
                valEl.textContent = `${slider.prefix}${val}${slider.suffix}`;
            });
        }
    });
}

// ----------------- TOOGLABLE LIGHT / DARK THEME -----------------
function setupThemeToggle() {
    const themeToggleBtn = document.getElementById("theme-toggle");
    if (!themeToggleBtn) return;

    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);

    themeToggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateThemeIcon(newTheme);
        logTerminal(`[SYSTEM] Interface theme toggled to: ${newTheme.toUpperCase()}`);

        if (cashFlowChart) {
            applyThemeToChart(newTheme);
        }
    });
}

function updateThemeIcon(theme) {
    const iconContainer = document.getElementById("theme-toggle");
    if (theme === "dark") {
        iconContainer.innerHTML = '<i data-lucide="sun"></i>';
    } else {
        iconContainer.innerHTML = '<i data-lucide="moon"></i>';
    }
    lucide.createIcons();
}

function applyThemeToChart(theme) {
    if (!cashFlowChart) return;
    
    const isDark = theme === "dark";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.06)";
    const textColor = isDark ? "#94a3b8" : "#475569";

    cashFlowChart.options.scales.x.grid.color = gridColor;
    cashFlowChart.options.scales.x.ticks.color = textColor;
    cashFlowChart.options.scales.y.grid.color = gridColor;
    cashFlowChart.options.scales.y.ticks.color = textColor;
    cashFlowChart.options.plugins.legend.labels.color = isDark ? "#f1f5f9" : "#0f172a";
    
    cashFlowChart.update();
}

// ----------------- FILE INGESTION PARSERS (UPLOAD HANDLING) -----------------
function setupFileUploads() {
    // GST Upload
    const fileGst = document.getElementById("file-gst");
    fileGst.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        logTerminal(`[INGESTION] Uploading GST invoice log file: ${file.name}...`);
        const reader = new FileReader();
        reader.onload = (event) => {
            const fileContent = event.target.result;
            
            // Try uploading to backend, fallback to client-side parsing
            const formData = new FormData();
            formData.append("file", file);
            
            fetch("/api/upload-gst", { method: "POST", body: formData })
            .then(res => {
                if (!res.ok) throw new Error("Backend parser offline.");
                return res.json();
            })
            .then(data => updateGstUI(data))
            .catch(() => {
                logTerminal(`[SYSTEM] Backend offline. Running client-side GST parser fallback...`);
                try {
                    const parsed = parseGstClient(fileContent);
                    updateGstUI(parsed);
                } catch(err) {
                    logTerminal(`[ERROR] Client-side GST parse failed: ${err.message}`);
                }
            });
        };
        reader.readAsText(file);
    });

    // UPI Upload
    const fileUpi = document.getElementById("file-upi");
    fileUpi.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        logTerminal(`[INGESTION] Uploading UPI transactions statement: ${file.name}...`);
        const reader = new FileReader();
        reader.onload = (event) => {
            const fileContent = event.target.result;
            const formData = new FormData();
            formData.append("file", file);

            fetch("/api/upload-upi", { method: "POST", body: formData })
            .then(res => {
                if (!res.ok) throw new Error("Backend parser offline.");
                return res.json();
            })
            .then(data => updateUpiUI(data))
            .catch(() => {
                logTerminal(`[SYSTEM] Backend offline. Running client-side UPI parser fallback...`);
                try {
                    const parsed = parseUpiClient(fileContent);
                    updateUpiUI(parsed);
                } catch(err) {
                    logTerminal(`[ERROR] Client-side UPI parse failed: ${err.message}`);
                }
            });
        };
        reader.readAsText(file);
    });

    // EPFO Upload
    const fileEpfo = document.getElementById("file-epfo");
    fileEpfo.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        logTerminal(`[INGESTION] Uploading EPFO wage registry logs: ${file.name}...`);
        const reader = new FileReader();
        reader.onload = (event) => {
            const fileContent = event.target.result;
            const formData = new FormData();
            formData.append("file", file);

            fetch("/api/upload-epfo", { method: "POST", body: formData })
            .then(res => {
                if (!res.ok) throw new Error("Backend parser offline.");
                return res.json();
            })
            .then(data => updateEpfoUI(data))
            .catch(() => {
                logTerminal(`[SYSTEM] Backend offline. Running client-side EPFO parser fallback...`);
                try {
                    const parsed = parseEpfoClient(fileContent);
                    updateEpfoUI(parsed);
                } catch(err) {
                    logTerminal(`[ERROR] Client-side EPFO parse failed: ${err.message}`);
                }
            });
        };
        reader.readAsText(file);
    });
}

// UI Updaters for parsed files
function updateGstUI(data) {
    document.getElementById("sim-gst-revenue").value = data.gst_revenue;
    document.getElementById("val-gst-revenue").textContent = `₹${data.gst_revenue} Lakhs`;
    
    let compRating = "poor";
    if (data.gst_compliance >= 0.98) compRating = "perfect";
    else if (data.gst_compliance >= 0.90) compRating = "good";
    else if (data.gst_compliance >= 0.70) compRating = "average";
    document.getElementById("sim-gst-filing").value = compRating;
    document.getElementById("msme-legal-title").textContent = data.business_name;

    logTerminal(`[INGESTION] GST parse success. Business: '${data.business_name}', Avg Sales: ₹${data.gst_revenue}L, Compliance: ${Math.round(data.gst_compliance * 100)}%.`);
}

function updateUpiUI(data) {
    document.getElementById("sim-upi-count").value = data.upi_count;
    document.getElementById("val-upi-count").textContent = `${data.upi_count} txn`;

    let vol = "high";
    if (data.upi_volatility <= 0.3) vol = "low";
    else if (data.upi_volatility <= 0.6) vol = "medium";
    document.getElementById("sim-upi-volatility").value = vol;

    logTerminal(`[INGESTION] UPI parse success. Transactions found: ${data.upi_count}, Volatility: ${data.upi_volatility}.`);
}

function updateEpfoUI(data) {
    document.getElementById("sim-epfo-employees").value = data.epfo_employees;
    document.getElementById("val-epfo-employees").textContent = `${data.epfo_employees} staff`;

    let dep = data.epfo_compliance >= 0.9 ? "regular" : "irregular";
    document.getElementById("sim-epfo-deposit").value = dep;

    logTerminal(`[INGESTION] EPFO parse success. Subscribers: ${data.epfo_employees}, PF regular: ${Math.round(data.epfo_compliance * 100)}%.`);
}

// Client-side file parsers (standalone fallbacks)
function parseGstClient(text) {
    const data = JSON.parse(text);
    const filings = data.filings || [];
    const sales = filings.map(f => f.taxable_supplies_value || 0);
    const avgRevenue = sales.length ? (sales.reduce((a,b)=>a+b, 0) / sales.length / 100000) : 15;
    const onTime = filings.filter(f => f.status === 'FILLED' && (f.delay_days || 0) <= 0).length;
    const compliance = filings.length ? (onTime / filings.length) : 0.8;
    return {
        gst_revenue: Math.min(50, Math.max(2, parseFloat(avgRevenue.toFixed(1)))),
        gst_compliance: compliance,
        business_name: data.legalName || "Mock MSME Business"
    };
}

function parseUpiClient(text) {
    const lines = text.split("\n");
    const headers = lines[0].split(",");
    const amountIdx = headers.indexOf("Amount");
    const typeIdx = headers.indexOf("Type");
    
    let creditAmounts = [];
    for(let i=1; i<lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(",");
        const type = cols[typeIdx] ? cols[typeIdx].trim().toUpperCase() : "CREDIT";
        const amount = parseFloat(cols[amountIdx]);
        if (type === "CREDIT" && !isNaN(amount)) {
            creditAmounts.push(amount);
        }
    }
    const count = creditAmounts.length;
    let volatility = 0.3;
    if (count > 1) {
        const mean = creditAmounts.reduce((a,b)=>a+b,0) / count;
        const variance = creditAmounts.reduce((a,b)=>a + Math.pow(b - mean, 2), 0) / (count - 1);
        const stdDev = Math.sqrt(variance);
        volatility = mean > 0 ? (stdDev / mean) : 0.5;
    }
    return {
        upi_count: Math.min(1000, Math.max(10, count * 4)),
        upi_volatility: Math.min(0.9, Math.max(0.1, volatility))
    };
}

function parseEpfoClient(text) {
    const data = JSON.parse(text);
    const employees = data.activeSubscribers || 24;
    const contributions = data.contributions || [];
    const onTime = contributions.filter(c => (c.delay_days || 0) <= 3).length;
    const compliance = contributions.length ? (onTime / contributions.length) : 0.9;
    return {
        epfo_employees: employees,
        epfo_compliance: compliance
    };
}

window.downloadSample = function(type) {
    logTerminal(`[SYSTEM] Initiating sample file download for ${type.toUpperCase()}...`);
    
    fetch(`/api/samples/${type}`)
        .then(res => {
            if (type === 'upi') return res.text();
            return res.json().then(j => JSON.stringify(j, null, 2));
        })
        .then(content => downloadBlob(content, type))
        .catch(() => {
            // Local fallback if server offline
            logTerminal(`[SYSTEM] Server offline. Accessing local static sample assets for ${type.toUpperCase()}...`);
            const content = type === 'upi' ? STATIC_SAMPLES.upi : JSON.stringify(STATIC_SAMPLES[type], null, 2);
            downloadBlob(content, type);
        });
};

function downloadBlob(content, type) {
    const blob = new Blob([content], { type: type === 'upi' ? 'text/csv' : 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sample_${type}.${type === 'upi' ? 'csv' : 'json'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logTerminal(`[SYSTEM] Sample ${type.toUpperCase()} file generated and downloaded successfully.`);
}

// ----------------- ML BACKEND SCORING CALLS -----------------
function calculateScore() {
    const consentGst = document.getElementById("chk-gst").checked;
    const consentUpi = document.getElementById("chk-upi").checked;
    const consentEpfo = document.getElementById("chk-epfo").checked;
    const consentAa = document.getElementById("chk-aa").checked;

    const gstRevenue = parseFloat(document.getElementById("sim-gst-revenue").value);
    const gstFiling = document.getElementById("sim-gst-filing").value;

    const upiCount = parseInt(document.getElementById("sim-upi-count").value);
    const upiVolatility = document.getElementById("sim-upi-volatility").value;

    const epfoEmployees = parseInt(document.getElementById("sim-epfo-employees").value);
    const epfoDeposit = document.getElementById("sim-epfo-deposit").value;

    const bankBalance = parseFloat(document.getElementById("sim-bank-balance").value);

    const profile = {
        gst_revenue: consentGst ? gstRevenue : 0.0,
        gst_compliance: consentGst ? (gstFiling === "perfect" ? 1.0 : gstFiling === "good" ? 0.92 : gstFiling === "average" ? 0.8 : 0.5) : 0.0,
        upi_count: consentUpi ? upiCount : 0.0,
        upi_volatility: consentUpi ? (upiVolatility === "low" ? 0.2 : upiVolatility === "medium" ? 0.5 : 0.8) : 0.0,
        epfo_employees: consentEpfo ? epfoEmployees : 0.0,
        epfo_compliance: consentEpfo ? (epfoDeposit === "regular" ? 1.0 : 0.5) : 0.0,
        bank_balance: consentAa ? bankBalance : 0.0
    };

    logTerminal(`[AI ENGINE] Sending MSME profile payload to trained RandomForest model backend...`);

    fetch("/api/score", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(profile)
    })
    .then(res => {
        if (!res.ok) throw new Error("FastAPI ML prediction service returned 500.");
        return res.json();
    })
    .then(data => renderScoreDashboard(data, profile))
    .catch(() => {
        // Run local model fallback on error (e.g. backend offline / static hosting)
        const localAttribution = runClientSideScore(profile);
        renderScoreDashboard(localAttribution, profile);
    });
}

function runClientSideScore(profile) {
    logTerminal(`[SYSTEM] FastAPI offline (Static Mode). Launching browser client-side ML scoring fallback...`);
    const baseScore = 500;
    
    // Exact mapping of backend weights
    let dGstRev = (profile.gst_revenue / 50.0) * 120 - 30;
    let dGstFile = (profile.gst_compliance - 0.5) * 100;
    let dUpiCount = (profile.upi_count / 1000.0) * 60 - 15;
    let dUpiVol = -profile.upi_volatility * 60;
    let dEpfoStaff = (profile.epfo_employees / 100.0) * 50 - 10;
    let dEpfoDep = (profile.epfo_compliance - 0.4) * 50;
    let dBankBal = (profile.bank_balance / 10.0) * 80 - 20;

    // Apply Consent penalties
    const consentGst = document.getElementById("chk-gst").checked;
    const consentUpi = document.getElementById("chk-upi").checked;
    const consentEpfo = document.getElementById("chk-epfo").checked;
    const consentAa = document.getElementById("chk-aa").checked;

    let consentPenalty = 0;
    if (!consentGst) consentPenalty -= 100;
    if (!consentUpi) consentPenalty -= 80;
    if (!consentEpfo) consentPenalty -= 50;
    if (!consentAa) consentPenalty -= 120;

    let calculated = baseScore + dGstRev + dGstFile + dUpiCount + dUpiVol + dEpfoStaff + dEpfoDep + dBankBal + consentPenalty;
    let score = Math.max(300, Math.min(1000, Math.round(calculated)));

    return {
        score: score,
        expected_value: 669,
        shap_values: {
            gst_revenue: dGstRev,
            gst_compliance: dGstFile,
            upi_count: dUpiCount,
            upi_volatility: dUpiVol,
            epfo_employees: dEpfoStaff,
            epfo_compliance: dEpfoDep,
            bank_balance: dBankBal
        }
    };
}

function renderScoreDashboard(data, profile) {
    currentScore = Math.round(data.score);
    const baselineExpected = Math.round(data.expected_value);

    document.getElementById("baseline-expected-num").textContent = baselineExpected;

    // Route to dashboard tab
    document.querySelector("[data-tab='tab-dashboard']").click();

    // Update score UI
    document.getElementById("dashboard-score-num").textContent = currentScore;
    
    let ratingText = "AVERAGE";
    let ratingColor = "var(--warning)";
    let ratingBg = "rgba(255, 183, 3, 0.15)";
    let scoreColor = "var(--warning)";

    if (currentScore >= 800) {
        ratingText = "OUTSTANDING";
        ratingColor = "var(--success)";
        ratingBg = "rgba(46, 196, 182, 0.15)";
        scoreColor = "var(--success)";
    } else if (currentScore >= 700) {
        ratingText = "EXCELLENT";
        ratingColor = "#3b82f6";
        ratingBg = "rgba(59, 130, 246, 0.15)";
        scoreColor = "#3b82f6";
    } else if (currentScore >= 550) {
        ratingText = "GOOD";
        ratingColor = "#a855f7";
        ratingBg = "rgba(168, 85, 247, 0.15)";
        scoreColor = "#a855f7";
    } else {
        ratingText = "POOR/RISK";
        ratingColor = "var(--danger)";
        ratingBg = "rgba(255, 0, 84, 0.15)";
        scoreColor = "var(--danger)";
    }

    const ratingEl = document.getElementById("dashboard-score-rating");
    ratingEl.textContent = ratingText;
    ratingEl.style.color = ratingColor;
    ratingEl.style.backgroundColor = ratingBg;

    const fillPercent = currentScore / 1000.0;
    const dashOffset = 251.2 - (251.2 * fillPercent);
    const gaugeFill = document.getElementById("dashboard-gauge-fill");
    gaugeFill.style.strokeDashoffset = dashOffset;
    gaugeFill.style.stroke = scoreColor;

    // Consent check for sub-dimensions
    const consentGst = document.getElementById("chk-gst").checked;
    const consentUpi = document.getElementById("chk-upi").checked;
    const consentAa = document.getElementById("chk-aa").checked;

    let liquidityVal = Math.round(Math.max(0, Math.min(100, (profile.bank_balance * 8 + (profile.upi_count / 10)) * 1.1)));
    let complianceVal = Math.round(Math.max(0, Math.min(100, (profile.gst_compliance * 50 + profile.epfo_compliance * 50))));
    let stabilityVal = Math.round(Math.max(0, Math.min(100, (profile.gst_revenue * 1.5 + (profile.epfo_employees / 2)) * 1.2)));
    let fraudVal = (consentGst && consentUpi && consentAa) ? 100 : 50;

    document.getElementById("score-val-liquidity").textContent = `${liquidityVal}/100`;
    document.getElementById("score-val-compliance").textContent = `${complianceVal}/100`;
    document.getElementById("score-val-stability").textContent = `${stabilityVal}/100`;
    document.getElementById("score-val-fraud").textContent = fraudVal === 100 ? "Perfect" : "High Risk";

    updateProgressBar("bar-liquidity", liquidityVal);
    updateProgressBar("bar-compliance", complianceVal);
    updateProgressBar("bar-stability", stabilityVal);
    updateProgressBar("bar-fraud", fraudVal);

    const shapItems = [
        { label: "GST Sales Vol", val: data.shap_values.gst_revenue },
        { label: "GST Filing Consistency", val: data.shap_values.gst_compliance },
        { label: "UPI Txn Frequency", val: data.shap_values.upi_count },
        { label: "UPI Inflow Volatility", val: data.shap_values.upi_volatility },
        { label: "EPFO Subscriber Size", val: data.shap_values.epfo_employees },
        { label: "EPFO Pay Regularity", val: data.shap_values.epfo_compliance },
        { label: "Bank Average Balance", val: data.shap_values.bank_balance }
    ];

    renderShapItems(shapItems);
    logTerminal(`[SYSTEM] Credit prediction processed successfully. Score: ${currentScore}. SHAP local values rendered.`);

    const btnCallUli = document.getElementById("btn-call-uli");
    btnCallUli.classList.remove("disabled", "completed");
    btnCallUli.textContent = "GET Profile";
    
    const btnCallOcen = document.getElementById("btn-call-ocen");
    btnCallOcen.classList.add("disabled");
    btnCallOcen.classList.remove("completed");
    btnCallOcen.disabled = true;

    const btnDisburse = document.getElementById("btn-call-disburse");
    btnDisburse.classList.add("disabled");
    btnDisburse.classList.remove("completed");
    btnDisburse.disabled = true;

    const virtualCard = document.getElementById("virtual-credit-card");
    virtualCard.classList.add("inactive");
    virtualCard.classList.remove("active");
    document.getElementById("cc-limit-val").textContent = "₹0.00";
}

function updateProgressBar(id, value) {
    const bar = document.getElementById(id);
    bar.style.width = `${value}%`;
    bar.className = "progress-bar"; 
    if (value >= 75) {
        bar.classList.add("green");
    } else if (value >= 45) {
        bar.classList.add("yellow");
    } else {
        bar.classList.add("red");
    }
}

function renderShapItems(items) {
    const container = document.getElementById("shap-container");
    container.innerHTML = ""; 

    items.sort((a, b) => Math.abs(b.val) - Math.abs(a.val)); 

    items.forEach(item => {
        const row = document.createElement("div");
        row.className = "shap-item";

        const label = document.createElement("div");
        label.className = "shap-label";
        label.textContent = item.label;

        const negContainer = document.createElement("div");
        negContainer.className = "shap-bar-neg-container";

        const divider = document.createElement("div");
        divider.className = "shap-divider";

        const posContainer = document.createElement("div");
        posContainer.className = "shap-bar-pos-container";

        const valLabel = document.createElement("div");
        valLabel.className = "shap-val";

        const bar = document.createElement("div");
        bar.className = "shap-bar";

        const widthPercent = Math.min(100, Math.round((Math.abs(item.val) / 100) * 100));
        bar.style.width = `${widthPercent}%`;

        const integerVal = Math.round(item.val);

        if (integerVal < 0) {
            bar.classList.add("neg");
            negContainer.appendChild(bar);
            valLabel.textContent = `${integerVal}`;
            valLabel.classList.add("neg-text");
        } else {
            bar.classList.add("pos");
            posContainer.appendChild(bar);
            valLabel.textContent = `+${integerVal}`;
            valLabel.classList.add("pos-text");
        }

        row.appendChild(label);
        row.appendChild(negContainer);
        row.appendChild(divider);
        row.appendChild(posContainer);
        row.appendChild(valLabel);

        container.appendChild(row);
    });
}

function updateDashboardCharts() {
    const ctx = document.getElementById("cashFlowChart").getContext("2d");
    
    if (cashFlowChart) {
        cashFlowChart.destroy();
    }

    const gstRevenue = parseFloat(document.getElementById("sim-gst-revenue").value) || 0;
    const bankBalance = parseFloat(document.getElementById("sim-bank-balance").value) || 0;

    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const inflows = [
        (gstRevenue * 0.9).toFixed(1),
        (gstRevenue * 1.1).toFixed(1),
        (gstRevenue * 0.8).toFixed(1),
        (gstRevenue * 1.2).toFixed(1),
        (gstRevenue * 0.95).toFixed(1),
        gstRevenue.toFixed(1)
    ];
    const outflows = [
        (gstRevenue * 0.7 + bankBalance * 0.1).toFixed(1),
        (gstRevenue * 0.85 + bankBalance * 0.05).toFixed(1),
        (gstRevenue * 0.65 + bankBalance * 0.12).toFixed(1),
        (gstRevenue * 0.9 + bankBalance * 0.08).toFixed(1),
        (gstRevenue * 0.72 + bankBalance * 0.15).toFixed(1),
        (gstRevenue * 0.8).toFixed(1)
    ];

    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const isDark = currentTheme === "dark";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.06)";
    const textColor = isDark ? "#94a3b8" : "#475569";
    const legendColor = isDark ? "#f1f5f9" : "#0f172a";

    cashFlowChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Inflows (Lakhs)",
                    data: inflows,
                    backgroundColor: "rgba(16, 185, 129, 0.4)",
                    borderColor: "#10b981",
                    borderWidth: 1.5
                },
                {
                    label: "Outflows (Lakhs)",
                    data: outflows,
                    backgroundColor: "rgba(239, 68, 68, 0.3)",
                    borderColor: "#ef4444",
                    borderWidth: 1.5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                }
            },
            plugins: {
                legend: {
                    labels: { color: legendColor, font: { family: "Outfit" } }
                }
            }
        }
    });
}

// ----------------- API INTEGRATION SIMULATOR -----------------
function setupApiSimulation() {
    const btnCallUli = document.getElementById("btn-call-uli");
    const btnCallOcen = document.getElementById("btn-call-ocen");
    const btnDisburse = document.getElementById("btn-call-disburse");
    const btnClearLogs = document.getElementById("btn-clear-logs");

    btnClearLogs.addEventListener("click", () => {
        document.getElementById("terminal-logs").textContent = "[SYSTEM] Console logs cleared.\n";
    });

    btnCallUli.addEventListener("click", () => {
        if (btnCallUli.classList.contains("disabled")) return;

        logTerminal(`[ULI ROUTER] GET request sent to /uli/v1/consent-data-pull...`);
        
        setTimeout(() => {
            const consentGst = document.getElementById("chk-gst").checked;
            const consentUpi = document.getElementById("chk-upi").checked;
            const consentEpfo = document.getElementById("chk-epfo").checked;
            const consentAa = document.getElementById("chk-aa").checked;

            const uliRequestPayload = {
                transactionId: "uli_tx_99281a021",
                timestamp: new Date().toISOString(),
                consentToken: "token_aa_doremon_091",
                dataRegistries: {
                    gstin: consentGst ? "active" : "null",
                    vpa_history: consentUpi ? "active" : "null",
                    epf_member_id: consentEpfo ? "active" : "null",
                    aa_bank_link: consentAa ? "active" : "null"
                }
            };

            logTerminal(`[HTTP GET] Payload:\n${JSON.stringify(uliRequestPayload, null, 2)}`);
            
            setTimeout(() => {
                const uliResponsePayload = {
                    status: "SUCCESS",
                    code: 200,
                    data: {
                        msme_business_name: document.getElementById("msme-legal-title").textContent,
                        owner_pan: "XXXXX4821A",
                        calculated_metrics: {
                            derived_credit_score: currentScore,
                            risk_classification: currentScore >= 700 ? "LOW_RISK" : "MEDIUM_HIGH_RISK",
                            recommended_underwrite: currentScore >= 550 ? "APPROVE" : "REJECT"
                        }
                    }
                };
                logTerminal(`[HTTP RESPONSE] 200 OK:\n${JSON.stringify(uliResponsePayload, null, 2)}`);
                logTerminal(`[SYSTEM] ULI data aggregation verified. Underwriting score resolved to ${currentScore}. Ready for OCEN Loan Sanction.`);
                
                btnCallUli.classList.add("completed");
                btnCallUli.textContent = "Profile Retrieved ✓";
                
                btnCallOcen.classList.remove("disabled");
                btnCallOcen.disabled = false;
            }, 1000);
        }, 500);
    });

    btnCallOcen.addEventListener("click", () => {
        if (btnCallOcen.classList.contains("disabled")) return;

        logTerminal(`[OCEN PROTOCOL] POST request sent to /ocen/v2/proposal-sanction...`);

        setTimeout(() => {
            let limitAmt = 0;
            let interestRate = 1.8;
            
            if (currentScore >= 800) {
                limitAmt = 500000;
                interestRate = 1.0;
            } else if (currentScore >= 700) {
                limitAmt = 350000;
                interestRate = 1.25;
            } else if (currentScore >= 550) {
                limitAmt = 150000;
                interestRate = 1.5;
            } else {
                limitAmt = 50000;
                interestRate = 1.9;
            }

            const ocenRequestPayload = {
                protocolVersion: "2.0.0",
                leadGeneratorId: "credi_card_msme_01",
                lenderId: "idbi_bank_innovate",
                borrowerId: "msme_doremon_crafts",
                assessmentMetrics: {
                    healthScore: currentScore
                },
                proposedTerms: {
                    maxSanctionLimit: limitAmt,
                    monthlyInterestRate: `${interestRate}%`,
                    tenureMonths: 12,
                    repaymentFrequency: "WEEKLY"
                }
            };

            logTerminal(`[HTTP POST] Payload:\n${JSON.stringify(ocenRequestPayload, null, 2)}`);

            setTimeout(() => {
                const ocenResponsePayload = {
                    offerId: "offer_ocen_77391b",
                    status: "SANCTIONED",
                    approvedLimit: limitAmt,
                    terms: {
                        interestRate: `${interestRate}%`,
                        processingFee: "₹950",
                        disbursalChannel: "UPI_DIRECT"
                    }
                };

                logTerminal(`[HTTP RESPONSE] 201 Created:\n${JSON.stringify(ocenResponsePayload, null, 2)}`);
                logTerminal(`[SYSTEM] Loan sanctioned via OCEN rails. Pre-approved Card limit set to: ₹${limitAmt.toLocaleString('en-IN')}. Ready for disbursement.`);

                document.getElementById("cc-limit-val").textContent = `₹${limitAmt.toLocaleString('en-IN')}`;

                btnCallOcen.classList.add("completed");
                btnCallOcen.textContent = "Offer Sanctioned ✓";
                
                btnDisburse.classList.remove("disabled");
                btnDisburse.disabled = false;
            }, 1000);
        }, 500);
    });

    btnDisburse.addEventListener("click", () => {
        if (btnDisburse.classList.contains("disabled")) return;

        logTerminal(`[BANK DISBURSE] POST request sent to /settlement/disburse...`);

        setTimeout(() => {
            const disburseRequest = {
                settlementId: "settle_upi_992178a",
                beneficiaryVpa: "doremoncrafts@okidbi",
                beneficiaryName: document.getElementById("msme-legal-title").textContent,
                amount: document.getElementById("cc-limit-val").textContent,
                bankGateway: "IDBI_IMPS_ROUTER"
            };

            logTerminal(`[HTTP POST] Payload:\n${JSON.stringify(disburseRequest, null, 2)}`);

            setTimeout(() => {
                logTerminal(`[HTTP RESPONSE] 200 OK:\nDisbursement Status: SUCCESS\nUPI RRN Reference: 662810928172`);
                logTerminal(`[SYSTEM] Funds routed directly to beneficiary UPI wallet. The virtual 'IDBI BIZ GROW' card is now ACTIVE.`);

                const virtualCard = document.getElementById("virtual-credit-card");
                virtualCard.classList.remove("inactive");
                virtualCard.classList.add("active");

                btnDisburse.classList.add("completed");
                btnDisburse.textContent = "Disbursed & Active ✓";
            }, 1000);
        }, 500);
    });
}

function logTerminal(message) {
    const term = document.getElementById("terminal-logs");
    const timestamp = new Date().toLocaleTimeString();
    term.textContent += `\n[${timestamp}] ${message}\n`;
    term.scrollTop = term.scrollHeight; 
}
