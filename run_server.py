import os
import sys
import webbrowser
import uvicorn
from threading import Timer

def open_browser():
    webbrowser.open("http://127.0.0.1:8000")

if __name__ == "__main__":
    print("\n" + "="*70)
    print("   Tourism Demand Analysis and Smart Travel Planning System   ")
    print("="*70)
    print("\nStarting FastAPI & Uvicorn Web Server on http://127.0.0.1:8000 ...")
    print("Launching default browser automatically in 2 seconds...\n")
    
    # Automatically open browser after 2 seconds
    Timer(2.0, open_browser).start()
    
    # Run server
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=False)