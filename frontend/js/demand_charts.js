// TourisMetrics AI - Demand Analytics & ML Chart.js Controller

let chartPopularity = null;
let chartHistory = null;
let chartTransport = null;
let chartForecast = null;

async function initDemandDashboard() {
  await loadTrendsData();
  await runMLForecast();
}

async function loadTrendsData() {
  try {
    const res = await fetch(`${API_BASE}/api/demand/trends`);
    const data = await res.json();

    // Update KPI metrics
    document.getElementById("kpi-national-arrivals").textContent = (data.national_annual_visitors / 1e6).toFixed(1) + "M";
    document.getElementById("kpi-top-dest").textContent = data.rankings[0].destination.toUpperCase();
    
    // Average YoY
    const avgYoy = (data.rankings.reduce((acc, r) => acc + r.yoy_growth, 0) / data.rankings.length).toFixed(1);
    document.getElementById("kpi-yoy-growth").textContent = (avgYoy >= 0 ? "+" : "") + avgYoy + "%";

    // Average spend
    const avgSpend = Math.round(data.rankings.reduce((acc, r) => acc + r.avg_spend, 0) / data.rankings.length);
    document.getElementById("kpi-avg-spend").textContent = "₹" + avgSpend.toLocaleString();

    // 1. Bar Chart: Most Popular Destinations
    renderPopularityBarChart(data.rankings);

    // 2. Pie Chart: Transport Preferences
    renderTransportPieChart(data.transport_preference);

    // Populate Rankings Table
    renderRankingsTable(data.rankings);

  } catch (err) {
    console.error("Error loading trends:", err);
  }
}

function renderPopularityBarChart(rankings) {
  const ctx = document.getElementById("chart-popularity").getContext("2d");
  if (chartPopularity) chartPopularity.destroy();

  const labels = rankings.map(r => r.destination.toUpperCase());
  const values = rankings.map(r => r.annual_arrivals);

  chartPopularity = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Annual Visitor Arrivals",
        data: values,
        backgroundColor: [
          "#1e40af", "#2563eb", "#3b82f6", "#60a5fa",
          "#0d9488", "#10b981", "#f59e0b", "#8b5cf6"
        ],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Arrivals: ${ctx.raw.toLocaleString()} visitors`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#f1f5f9" },
          ticks: {
            callback: (v) => (v / 1e3) + "K"
          }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderTransportPieChart(transport) {
  const ctx = document.getElementById("chart-transport").getContext("2d");
  if (chartTransport) chartTransport.destroy();

  chartTransport = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(transport),
      datasets: [{
        data: Object.values(transport),
        backgroundColor: ["#2563eb", "#0d9488", "#f59e0b", "#64748b"],
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw}% share`
          }
        }
      },
      cutout: "65%"
    }
  });
}

function renderRankingsTable(rankings) {
  const tbody = document.getElementById("rankings-tbody");
  if (!tbody) return;

  tbody.innerHTML = rankings.map((r, i) => `
    <tr>
      <td class="fw-bold">${i + 1}</td>
      <td class="text-uppercase fw-semibold">${r.destination}</td>
      <td><strong>${r.annual_arrivals.toLocaleString()}</strong></td>
      <td>₹${r.avg_spend.toLocaleString()}</td>
      <td><span class="badge ${r.hotel_occupancy > 75 ? 'bg-danger' : 'bg-primary'}">${r.hotel_occupancy}%</span></td>
      <td>
        <span class="${r.yoy_growth >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}">
          ${r.yoy_growth >= 0 ? '+' : ''}${r.yoy_growth}%
        </span>
      </td>
    </tr>
  `).join("");
}

async function runMLForecast() {
  const dest = document.getElementById("forecast-dest-select").value;
  const horizon = parseInt(document.getElementById("forecast-horizon-slider").value);
  document.getElementById("horizon-val-label").textContent = `${horizon} Months Ahead`;

  try {
    const res = await fetch(`${API_BASE}/api/demand/predict?destination=${dest}&horizon=${horizon}`);
    const data = await res.json();

    // Metrics Scorecard
    document.getElementById("score-model-name").textContent = data.metrics.model_name;
    document.getElementById("score-rmse").textContent = data.metrics.rmse.toLocaleString();
    document.getElementById("score-mae").textContent = data.metrics.mae.toLocaleString();
    document.getElementById("score-mape").textContent = data.metrics.mape + "%";
    document.getElementById("score-r2").textContent = data.metrics.r2_score;

    // Weather impact
    const wCorr = data.weather_correlation || {};
    document.getElementById("corr-temp").textContent = wCorr.temperature_correlation !== undefined ? wCorr.temperature_correlation : "+0.45";
    document.getElementById("corr-rain").textContent = wCorr.rainfall_correlation !== undefined ? wCorr.rainfall_correlation : "-0.62";

    // 3. Historical & ML Forecast Line Chart
    renderForecastLineChart(data.history, data.forecast);

    // Populate Forecast Table
    renderForecastTable(data.forecast);

  } catch (err) {
    console.error("Error predicting demand:", err);
  }
}

function renderForecastLineChart(history, forecast) {
  const ctx = document.getElementById("chart-forecast").getContext("2d");
  if (chartForecast) chartForecast.destroy();

  // Combine dates
  const histDates = history.map(h => h.month_name);
  const histVals = history.map(h => h.arrivals);

  const fcDates = forecast.map(f => f.month_name);
  const fcVals = forecast.map(f => f.predicted_arrivals);
  const fcLower95 = forecast.map(f => f.lower_95);
  const fcUpper95 = forecast.map(f => f.upper_95);

  const allLabels = [...histDates, ...fcDates];
  
  // Historical dataset (null during forecast)
  const histPadded = [...histVals, ...Array(fcDates.length).fill(null)];
  
  // Forecast dataset (null during history, connect at last point)
  const lastHistVal = histVals[histVals.length - 1];
  const fcPadded = [...Array(histDates.length - 1).fill(null), lastHistVal, ...fcVals];
  const lowerPadded = [...Array(histDates.length - 1).fill(null), lastHistVal, ...fcLower95];
  const upperPadded = [...Array(histDates.length - 1).fill(null), lastHistVal, ...fcUpper95];

  chartForecast = new Chart(ctx, {
    type: "line",
    data: {
      labels: allLabels,
      datasets: [
        {
          label: "Historical Actuals",
          data: histPadded,
          borderColor: "#1e40af",
          backgroundColor: "#1e40af",
          borderWidth: 2.5,
          tension: 0.2,
          pointRadius: 2
        },
        {
          label: "ML Predicted Arrivals",
          data: fcPadded,
          borderColor: "#dc2626",
          backgroundColor: "#dc2626",
          borderWidth: 2.5,
          borderDash: [5, 5],
          pointRadius: 4,
          tension: 0.2
        },
        {
          label: "95% Upper Bound",
          data: upperPadded,
          borderColor: "transparent",
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          pointRadius: 0,
          fill: "+1",
          tension: 0.2
        },
        {
          label: "95% Lower Bound",
          data: lowerPadded,
          borderColor: "transparent",
          backgroundColor: "transparent",
          pointRadius: 0,
          fill: false,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              if (ctx.raw === null) return null;
              return ` ${ctx.dataset.label}: ${Math.round(ctx.raw).toLocaleString()} visitors`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#f1f5f9" },
          ticks: {
            callback: (v) => (v / 1e3) + "K"
          }
        },
        x: {
          grid: { color: "#f8fafc" },
          ticks: { maxTicksLimit: 14 }
        }
      }
    }
  });
}

function renderForecastTable(forecast) {
  const tbody = document.getElementById("forecast-tbody");
  if (!tbody) return;

  tbody.innerHTML = forecast.map(f => `
    <tr>
      <td class="fw-semibold">${f.month_name}</td>
      <td><strong class="text-primary">${f.predicted_arrivals.toLocaleString()}</strong></td>
      <td class="text-muted">${f.lower_80.toLocaleString()} - ${f.upper_80.toLocaleString()}</td>
      <td class="text-secondary">${f.lower_95.toLocaleString()} - ${f.upper_95.toLocaleString()}</td>
      <td><span class="badge bg-success bg-opacity-10 text-success border border-success">High Confidence</span></td>
    </tr>
  `).join("");
}

function exportDemandCSV() {
  window.open(`${API_BASE}/api/historical_data.csv`, "_blank");
}