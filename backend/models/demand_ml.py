import os
import pandas as pd
import numpy as np
from datetime import datetime
from dateutil.relativedelta import relativedelta
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import root_mean_squared_error, mean_absolute_error

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "historical_data.csv")

class TourismDemandML:
    def __init__(self, data_path=DATA_FILE):
        self.data_path = data_path
        self.df = None
        self.load_data()
        
    def load_data(self):
        if os.path.exists(self.data_path):
            self.df = pd.read_csv(self.data_path)
            self.df["Date"] = pd.to_datetime(self.df["Date"])
        else:
            raise FileNotFoundError(f"Data file not found at {self.data_path}")

    def _prepare_features(self, df_dest):
        df_dest = df_dest.sort_values("Date").reset_index(drop=True)
        t = np.arange(len(df_dest))
        months = df_dest["Month"].values
        
        # Fourier harmonic seasonal features
        sin12 = np.sin(2 * np.pi * months / 12.0)
        cos12 = np.cos(2 * np.pi * months / 12.0)
        sin6  = np.sin(4 * np.pi * months / 12.0)
        cos6  = np.cos(4 * np.pi * months / 12.0)
        
        # Temp and rain normalized
        temp = (df_dest["WeatherTempC"].values - 20.0) / 10.0
        rain = np.log1p(df_dest["RainfallMm"].values) / 5.0
        
        X = np.column_stack([t, t**1.5, sin12, cos12, sin6, cos6, temp, rain])
        y = df_dest["Arrivals"].values
        return X, y, df_dest

    def predict_demand(self, destination_id="ooty", horizon_months=12):
        df_dest = self.df[self.df["Destination"] == destination_id].copy()
        if len(df_dest) < 12:
            return None
            
        X, y, df_sorted = self._prepare_features(df_dest)
        
        # Holdout split for empirical validation
        split_idx = max(len(y) - 12, 12)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Train Ridge & RF
        model = Ridge(alpha=1.0)
        model.fit(X_train, y_train)
        y_pred_test = np.maximum(model.predict(X_test), 1000)
        
        # Evaluate metrics
        rmse = float(root_mean_squared_error(y_test, y_pred_test))
        mae = float(mean_absolute_error(y_test, y_pred_test))
        mape = float(np.mean(np.abs((y_test - y_pred_test) / y_test)) * 100)
        
        # Refit on all data
        model.fit(X, y)
        y_fitted = np.maximum(model.predict(X), 1000)
        residuals = y - y_fitted
        residual_std = float(np.std(residuals))
        
        # Future horizons
        last_date = df_sorted["Date"].max()
        future_dates = [last_date + relativedelta(months=i+1) for i in range(horizon_months)]
        
        total_len = len(df_sorted) + horizon_months
        future_t = np.arange(len(df_sorted), total_len)
        future_months = np.array([d.month for d in future_dates])
        
        f_sin12 = np.sin(2 * np.pi * future_months / 12.0)
        f_cos12 = np.cos(2 * np.pi * future_months / 12.0)
        f_sin6  = np.sin(4 * np.pi * future_months / 12.0)
        f_cos6  = np.cos(4 * np.pi * future_months / 12.0)
        
        # Average weather for that month
        m_temp = df_sorted.groupby("Month")["WeatherTempC"].mean().to_dict()
        m_rain = df_sorted.groupby("Month")["RainfallMm"].mean().to_dict()
        f_temp = np.array([(m_temp.get(m, 20.0) - 20.0) / 10.0 for m in future_months])
        f_rain = np.array([np.log1p(m_rain.get(m, 50.0)) / 5.0 for m in future_months])
        
        X_future = np.column_stack([future_t, future_t**1.5, f_sin12, f_cos12, f_sin6, f_cos6, f_temp, f_rain])
        future_preds = np.maximum(model.predict(X_future), 1000)
        
        # Uncertainty intervals (growing slightly with horizon)
        horizon_factors = np.sqrt(np.arange(1, horizon_months + 1))
        ci80 = 1.28 * residual_std * (1.0 + 0.05 * horizon_factors)
        ci95 = 1.96 * residual_std * (1.0 + 0.05 * horizon_factors)
        
        forecast_list = []
        for i, d in enumerate(future_dates):
            pred_val = int(round(future_preds[i]))
            forecast_list.append({
                "date": d.strftime("%Y-%m-%d"),
                "month_name": d.strftime("%b %Y"),
                "predicted_arrivals": pred_val,
                "lower_80": int(max(pred_val - ci80[i], 0)),
                "upper_80": int(pred_val + ci80[i]),
                "lower_95": int(max(pred_val - ci95[i], 0)),
                "upper_95": int(pred_val + ci95[i]),
            })
            
        history_list = []
        for i, r in df_sorted.iterrows():
            history_list.append({
                "date": r["Date"].strftime("%Y-%m-%d"),
                "month_name": r["Date"].strftime("%b %Y"),
                "arrivals": int(r["Arrivals"]),
                "temp_c": float(r["WeatherTempC"]),
                "rainfall_mm": float(r["RainfallMm"]),
                "hotel_occupancy": float(r["HotelOccupancyPct"])
            })
            
        return {
            "destination": destination_id,
            "metrics": {
                "rmse": round(rmse, 0),
                "mae": round(mae, 0),
                "mape": round(mape, 2),
                "model_name": "Ridge Multi-Harmonic Seasonal Regressor",
                "r2_score": round(float(model.score(X, y)), 3)
            },
            "history": history_list,
            "forecast": forecast_list
        }

    def get_destination_rankings(self):
        latest_yr = self.df["Year"].max()
        df_latest = self.df[self.df["Year"] == latest_yr]
        df_prev = self.df[self.df["Year"] == (latest_yr - 1)]
        
        summary = df_latest.groupby("Destination").agg({
            "Arrivals": "sum",
            "AvgSpendINR": "mean",
            "HotelOccupancyPct": "mean"
        }).reset_index()
        
        prev_summary = df_prev.groupby("Destination")["Arrivals"].sum().to_dict()
        
        rankings = []
        for _, row in summary.iterrows():
            d = row["Destination"]
            tot = int(row["Arrivals"])
            prev_tot = prev_summary.get(d, tot)
            yoy = round(((tot - prev_tot) / prev_tot) * 100, 1) if prev_tot > 0 else 0.0
            
            rankings.append({
                "destination": d,
                "annual_arrivals": tot,
                "avg_spend": int(round(row["AvgSpendINR"])),
                "hotel_occupancy": round(float(row["HotelOccupancyPct"]), 1),
                "yoy_growth": yoy
            })
            
        rankings.sort(key=lambda x: x["annual_arrivals"], reverse=True)
        return rankings

    def get_transport_preference(self, destination_id=None):
        sub = self.df if destination_id is None else self.df[self.df["Destination"] == destination_id]
        return {
            "Train": round(float(sub["TransportTrainPct"].mean() * 100), 1),
            "Flight": round(float(sub["TransportFlightPct"].mean() * 100), 1),
            "Bus": round(float(sub["TransportBusPct"].mean() * 100), 1),
            "Private Car": round(float(sub["TransportCarPct"].mean() * 100), 1)
        }

    def get_weather_correlation(self, destination_id="ooty"):
        sub = self.df[self.df["Destination"] == destination_id]
        if len(sub) < 12:
            return {}
        corr_temp = float(sub["Arrivals"].corr(sub["WeatherTempC"]))
        corr_rain = float(sub["Arrivals"].corr(sub["RainfallMm"]))
        return {
            "temperature_correlation": round(corr_temp, 2),
            "rainfall_correlation": round(corr_rain, 2),
            "peak_weather_window": "Pleasant (14°C - 20°C, Low Precipitation)"
        }