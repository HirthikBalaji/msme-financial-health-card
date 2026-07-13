import sys
import subprocess

# List of required pip packages for backend
REQUIRED_PACKAGES = ["fastapi", "uvicorn", "pydantic", "python-multipart"]

def install_and_run():
    print("Checking dependencies...")
    for pkg in REQUIRED_PACKAGES:
        try:
            __import__(pkg.replace("-", "_"))
        except ImportError:
            print(f"Installing {pkg}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])
            
    # Also verify model exists
    import os
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(backend_dir, "credit_model.pkl")
    if not os.path.exists(model_path):
        print("Training scoring model first...")
        import train_model
        train_model.train_and_save()
        
    print("Starting FastAPI Backend Server on port 8080...")
    # Import uvicorn to run programmatically
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=False)

if __name__ == "__main__":
    install_and_run()
