# Tourism Demand Analysis and Smart Travel Planning System

An enterprise-grade, full-stack travel intelligence and automated planning platform combining **Scikit-Learn Machine Learning Demand Forecasting** with an end-to-end, weather-adaptive travel planning suite.

---

## 🌟 Key Objectives & Core Features

1. **Tourism Demand Analysis & ML Visitor Prediction**:
   - Time-series harmonic regression & polynomial trend modeling in Python using `scikit-learn`.
   - Forecasts visitor demand 3 to 24 months forward with 80% & 95% confidence bands.
   - Evaluates empirical out-of-sample accuracy: RMSE, MAE, and Holdout MAPE (%).
   - Identifies high-demand overtourism peaks, seasonal indices, and weather correlation.
2. **Smart Itinerary Generator**:
   - Automated day-wise, hour-by-hour travel scheduling (9:00 AM, 12:30 PM, 2:00 PM, 5:00 PM, 8:00 PM).
   - **Weather-Adaptive Intelligence**: Automatically substitutes outdoor hikes/boating with indoor museums and heritage palaces when rainfall is forecast!
   - Itemized budget allocation, cost per person, and hotel suggestions matching user budget.
3. **Interactive Maps & Navigation**:
   - Leaflet & OpenStreetMap GIS with live destination pin markers.
   - Real-time highway distance calculation, driving duration, fuel estimation, and traffic status.
   - Geolocation detection ("Find My Current Location").
4. **Multi-Modal Transportation Comparator**:
   - Side-by-side comparison across Flight, Train, Sleeper Bus, Private Car, Motorcycle, and Taxi.
   - Highlights fastest routes and cheapest options.
5. **Hotels & Verified Accommodation**:
   - Search by distance to attractions, star rating, and budget per night.
   - One-click booking simulator generating instant vouchers stored in **My Bookings**.
6. **Budget & Expense Planner**:
   - Fiscal distribution tool (Accommodation 35%, Transport 25%, Food 20%, Tickets 10%, Shopping 10%).
   - Group expense splitting and real-time expense logging.
7. **AI Travel Assistant (Aero)**:
   - Interactive conversational chatbot providing instant recommendations, packing advice, and local tips.
8. **Emergency & Safety Hub**:
   - Directory of verified national hotlines (Tourist Helpline 1363, Emergency 112, Medical 108, Women Safety 1091).
9. **Admin Dashboard**:
   - Full control suite for destination catalogs, hotel registries, user monitoring, and demand report CSV export.

---

## 🚀 How to Run the Platform

### Option 1: One-Click Desktop Batch Launcher (Windows)
Simply double-click:
```
launch_platform.bat
```

### Option 2: Command Line (PowerShell / Terminal)
```powershell
python run_server.py
```

### Option 3: Direct Uvicorn Launch
```powershell
uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

The web server will automatically open your default browser at:
👉 **`http://127.0.0.1:8000`**

Interactive OpenAPI / Swagger Documentation is available at:
👉 **`http://127.0.0.1:8000/docs`**

---

## 📁 Repository Directory Structure

```
smart_tourism_platform/
├── backend/
│   ├── app.py                  # FastAPI application entry point & 18 REST endpoints
│   ├── models/
│   │   ├── demand_ml.py        # Scikit-Learn Ridge & Harmonic Fourier Regressor
│   │   └── itinerary_engine.py # Weather-Adaptive Day-Wise Itinerary Generator
│   └── data/
│       ├── destinations.json   # Curated database of iconic tourist destinations
│       ├── hotels.json         # Curated hotel listings with pricing & amenities
│       ├── historical_data.csv # 576 monthly observations (2020-2025)
│       └── transport_routes.json # Multi-modal route & fare matrix
├── frontend/
│   ├── index.html              # Home page with hero banner & universal search
│   ├── destinations.html       # Explore destinations with category filters & modals
│   ├── demand_analysis.html    # Tourism demand analysis & ML prediction dashboard
│   ├── trip_planner.html       # Smart trip planner & day-wise itinerary generator
│   ├── weather.html            # 7-day weather forecast & smart activity advisory
│   ├── maps.html               # Leaflet GIS maps & multi-stop route calculator
│   ├── transportation.html     # Transport comparison & road analysis
│   ├── hotels.html             # Hotel directory & instant booking vouchers
│   ├── budget.html             # Budget calculator & live expense tracker
│   ├── profile.html            # My Bookings, Wishlist & User Profile
│   ├── assistant.html          # Aero AI Travel Assistant & Safety Directory
│   ├── admin.html              # Admin portal for destination & demand management
│   ├── css/
│   │   └── style.css           # Master stylesheet (Bootstrap 5, Glassmorphism)
│   └── js/
│       ├── main.js             # Global navigation, auth, and state controller
│       ├── demand_charts.js    # Chart.js demand analysis & ML curves
│       ├── planner.js          # Trip planner interactivity & PDF export
│       └── map_logic.js        # Leaflet routing & marker clustering
├── launch_platform.bat         # 1-Click Windows shortcut
├── run_server.py               # Desktop server launcher with auto browser open
└── README.md                   # Full documentation
```