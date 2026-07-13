import os
import pickle
import numpy as np

# Load the model metadata
backend_dir = "/Users/hirthikbalaji/Documents/IDB/msme-health-card/backend"
model_path = os.path.join(backend_dir, "credit_model.pkl")

# Mean baseline values computed from training distribution
BASELINE_VALUES = {
    "gst_revenue": 26.0,      # Lakhs
    "gst_compliance": 0.75,    # Ratio GSTR on-time
    "upi_count": 500.0,        # Transactions
    "upi_volatility": 0.5,     # Cash volatility
    "epfo_employees": 50.0,    # Active employees
    "epfo_compliance": 0.7,    # EPFO deposit ratio
    "bank_balance": 5.25       # ADB Lakhs
}

class ScoringEngine:
    def __init__(self):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Scoring model pickle not found at {model_path}. Please run train_model.py first.")
            
        with open(model_path, "rb") as f:
            metadata = pickle.dump = pickle.load(f)
            
        self.model = metadata["model"]
        self.expected_value = metadata["expected_value"]
        self.feature_names = metadata["feature_names"]
        
        # Create baseline numpy vector
        self.baseline_vector = np.array([BASELINE_VALUES[f] for f in self.feature_names])

    def predict(self, features: dict) -> float:
        # Construct features vector
        x = np.array([features[f] for f in self.feature_names])
        score = self.model.predict([x])[0]
        return float(np.clip(score, 300, 900))

    def explain(self, features: dict) -> dict:
        x = np.array([features[f] for f in self.feature_names])
        current_pred = self.model.predict([x])[0]
        
        # Calculate marginal contributions (SHAP approximation)
        contributions = []
        for i, name in enumerate(self.feature_names):
            x_perturbed = x.copy()
            x_perturbed[i] = self.baseline_vector[i]
            pred_perturbed = self.model.predict([x_perturbed])[0]
            
            # The contribution is how much the prediction changed when this feature was present
            diff = current_pred - pred_perturbed
            contributions.append(diff)
            
        # Distribute the remainder so they sum up to (current_pred - expected_value)
        total_explained = sum(contributions)
        target_diff = current_pred - self.expected_value
        
        if abs(total_explained) > 1e-5:
            scaling_factor = target_diff / total_explained
            contributions = [c * scaling_factor for c in contributions]
        else:
            contributions = [0.0] * len(self.feature_names)
            
        # Return as dict mapping feature name -> SHAP value
        shap_values = {name: float(contributions[i]) for i, name in enumerate(self.feature_names)}
        
        return {
            "score": float(np.clip(current_pred, 300, 900)),
            "expected_value": self.expected_value,
            "shap_values": shap_values
        }

# Singleton instance
try:
    engine = ScoringEngine()
except Exception as e:
    print(f"Warning: ScoringEngine initialization failed: {e}")
    engine = None
