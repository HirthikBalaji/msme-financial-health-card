import os
import sys
import pickle

try:
    import numpy as np
    import sklearn
    from sklearn.ensemble import RandomForestRegressor
except ImportError:
    print("numpy and scikit-learn are required. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "numpy", "scikit-learn"])
    import numpy as np
    from sklearn.ensemble import RandomForestRegressor

# Define backend paths
backend_dir = "/Users/hirthikbalaji/Documents/IDB/msme-health-card/backend"
os.makedirs(backend_dir, exist_ok=True)
model_path = os.path.join(backend_dir, "credit_model.pkl")

def generate_synthetic_data(num_samples=1000):
    np.random.seed(42)
    
    # Features
    gst_rev = np.random.uniform(2, 50, num_samples) # Monthly revenue (Lakhs)
    gst_comp = np.random.uniform(0.5, 1.0, num_samples) # GSTR filing ratio
    
    upi_cnt = np.random.uniform(10, 1000, num_samples) # Monthly txn count
    upi_vol = np.random.uniform(0.1, 0.9, num_samples) # Volatility (lower is better)
    
    epfo_emp = np.random.randint(0, 100, num_samples).astype(float) # Employees
    epfo_comp = np.random.uniform(0.4, 1.0, num_samples) # PF regularity
    
    bank_bal = np.random.uniform(0.5, 10, num_samples) # Average Daily Balance (Lakhs)
    
    X = np.column_stack([gst_rev, gst_comp, upi_cnt, upi_vol, epfo_emp, epfo_comp, bank_bal])
    
    # Calculate a credit score (base 500, range 300 to 900)
    # Weights for calculation
    # gst_rev: max 120, gst_comp: max 50, upi_cnt: max 60, upi_vol: max -40 (penalty),
    # epfo_emp: max 50, epfo_comp: max 30, bank_bal: max 80.
    y_raw = (500 + 
             (gst_rev / 50.0) * 120 + 
             (gst_comp - 0.5) * 100 + 
             (upi_cnt / 1000.0) * 60 - 
             (upi_vol) * 60 + 
             (epfo_emp / 100.0) * 50 + 
             (epfo_comp - 0.4) * 50 + 
             (bank_bal / 10.0) * 80 + 
             np.random.normal(0, 15, num_samples))
    
    # Bounds check [300 - 900]
    y = np.clip(y_raw, 300, 900)
    return X, y

def train_and_save():
    print("Generating synthetic MSME profile training data...")
    X, y = generate_synthetic_data()
    
    print("Training RandomForest scoring model...")
    model = RandomForestRegressor(n_estimators=50, random_state=42, max_depth=8)
    model.fit(X, y)
    
    # Calculate base expected value of the model predictions
    expected_value = float(np.mean(y))
    
    # Save the model, expected value and features mapping
    metadata = {
        "model": model,
        "expected_value": expected_value,
        "feature_names": [
            "gst_revenue",
            "gst_compliance",
            "upi_count",
            "upi_volatility",
            "epfo_employees",
            "epfo_compliance",
            "bank_balance"
        ]
    }
    
    with open(model_path, "wb") as f:
        pickle.dump(metadata, f)
        
    print(f"Model saved successfully to {model_path}!")
    print(f"Baseline Score (Expected Value): {expected_value:.1f}")

if __name__ == "__main__":
    train_and_save()
