// Initialize Lucide Icons and App Setup on Load
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    initApp();
    setupThemeToggle();
});

// Global state variables
let currentScore = 785;
let cashFlowChart = null;

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
            
            // Toggle nav active class
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");
            
            // Toggle tab display
            tabContents.forEach(content => {
                content.classList.remove("active");
                if (content.id === tabId) {
                    content.classList.add("active");
                }
            });

            // Update Page Headers
            if (tabMetadata[tabId]) {
                pageTitle.textContent = tabMetadata[tabId].title;
                pageDesc.textContent = tabMetadata[tabId].desc;
            }

            // If entering dashboard, trigger chart redraw
            if (tabId === "tab-dashboard") {
                updateDashboardCharts();
            }
        });
    });

    // 2. Input Sliders Event Listeners (Live Value Updates)
    setupSliders();

    // 3. File Uploads Listeners
    setupFileUploads();

    // 4. Calculator Button Trigger
    const btnCalculate = document.getElementById("btn-calculate");
    btnCalculate.addEventListener("click", () => {
        calculateScore();
    });

    // 5. API Integration Flow Handler
    setupApiSimulation();
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

    // Load theme preference from localStorage or default to light
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

        // Update Chart colors dynamically if visible
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
    lucide.createIcons(); // refresh lucide icons
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
        const formData = new FormData();
        formData.append("file", file);

        fetch("/api/upload-gst", {
            method: "POST",
            body: formData
        })
        .then(res => {
            if (!res.ok) throw new Error("Parser failed to read GSTR layout.");
            return res.json();
        })
        .then(data => {
            document.getElementById("sim-gst-revenue").value = data.gst_revenue;
            document.getElementById("val-gst-revenue").textContent = `₹${data.gst_revenue} Lakhs`;
            
            let compRating = "poor";
            if (data.gst_compliance >= 0.98) compRating = "perfect";
            else if (data.gst_compliance >= 0.90) compRating = "good";
            else if (data.gst_compliance >= 0.70) compRating = "average";
            document.getElementById("sim-gst-filing").value = compRating;

            document.getElementById("msme-legal-title").textContent = data.business_name;

            logTerminal(`[INGESTION] GST parse SUCCESS. Business: '${data.business_name}', Avg Sales: ₹${data.gst_revenue}L, Compliance: ${Math.round(data.gst_compliance * 100)}%.`);
        })
        .catch(err => {
            logTerminal(`[ERROR] GST file ingestion failed: ${err.message}`);
        });
    });

    // UPI Upload
    const fileUpi = document.getElementById("file-upi");
    fileUpi.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        logTerminal(`[INGESTION] Uploading UPI transactions statement: ${file.name}...`);
        const formData = new FormData();
        formData.append("file", file);

        fetch("/api/upload-upi", {
            method: "POST",
            body: formData
        })
        .then(res => {
            if (!res.ok) throw new Error("Parser failed to read UPI schema.");
            return res.json();
        })
        .then(data => {
            document.getElementById("sim-upi-count").value = data.upi_count;
            document.getElementById("val-upi-count").textContent = `${data.upi_count} txn`;

            let vol = "high";
            if (data.upi_volatility <= 0.3) vol = "low";
            else if (data.upi_volatility <= 0.6) vol = "medium";
            document.getElementById("sim-upi-volatility").value = vol;

            logTerminal(`[INGESTION] UPI statement parse SUCCESS. Transactions found: ${data.upi_count}, Volatility Coefficient: ${data.upi_volatility}.`);
        })
        .catch(err => {
            logTerminal(`[ERROR] UPI file ingestion failed: ${err.message}`);
        });
    });

    // EPFO Upload
    const fileEpfo = document.getElementById("file-epfo");
    fileEpfo.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        logTerminal(`[INGESTION] Uploading EPFO wage registry logs: ${file.name}...`);
        const formData = new FormData();
        formData.append("file", file);

        fetch("/api/upload-epfo", {
            method: "POST",
            body: formData
        })
        .then(res => {
            if (!res.ok) throw new Error("Parser failed to read EPFO registry.");
            return res.json();
        })
        .then(data => {
            document.getElementById("sim-epfo-employees").value = data.epfo_employees;
            document.getElementById("val-epfo-employees").textContent = `${data.epfo_employees} staff`;

            let dep = data.epfo_compliance >= 0.9 ? "regular" : "irregular";
            document.getElementById("sim-epfo-deposit").value = dep;

            logTerminal(`[INGESTION] EPFO parse SUCCESS. Active Subscribers: ${data.epfo_employees}, PF Payment punctuality: ${Math.round(data.epfo_compliance * 100)}%.`);
        })
        .catch(err => {
            logTerminal(`[ERROR] EPFO file ingestion failed: ${err.message}`);
        });
    });
}

window.downloadSample = function(type) {
    logTerminal(`[SYSTEM] Initiating sample file download for ${type.toUpperCase()}...`);
    fetch(`/api/samples/${type}`)
        .then(res => {
            if (type === 'upi') return res.text();
            return res.json().then(j => JSON.stringify(j, null, 2));
        })
        .then(content => {
            const blob = new Blob([content], { type: type === 'upi' ? 'text/csv' : 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `sample_${type}.${type === 'upi' ? 'csv' : 'json'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            logTerminal(`[SYSTEM] Sample ${type.toUpperCase()} file generated and downloaded.`);
        })
        .catch(err => {
            logTerminal(`[ERROR] Failed to fetch sample file: ${err.message}`);
        });
};

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
    .then(data => {
        currentScore = Math.round(data.score);
        const baselineExpected = Math.round(data.expected_value);

        document.getElementById("baseline-expected-num").textContent = baselineExpected;

        document.querySelector("[data-tab='tab-dashboard']").click();

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
        logTerminal(`[AI ENGINE] Credit prediction complete. Score: ${currentScore}. Local SHAP weights loaded successfully.`);

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
    })
    .catch(err => {
        logTerminal(`[ERROR] ML Engine API call failed: ${err.message}`);
    });
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
