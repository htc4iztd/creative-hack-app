import os
import sys
import uvicorn

# Add the current directory to the Python path
current_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, current_dir)
print(f"Added {current_dir} to Python path")
print(f"Python path: {sys.path}")

if __name__ == "__main__":
    # Run the FastAPI application
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
