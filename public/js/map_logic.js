// TourisMetrics AI - Interactive Leaflet GIS Map Logic

let mapInstance = null;
let markersLayer = null;
let routePolyline = null;

const CITY_COORDS = {
  "bangalore": [12.9716, 77.5946],
  "delhi": [28.6139, 77.2090],
  "mumbai": [19.0760, 72.8777],
  "chennai": [13.0827, 80.2707],
  "hyderabad": [17.3850, 78.4867],
  "kolkata": [22.5726, 88.3639],
  "ooty": [11.4102, 76.6950],
  "manali": [32.2432, 77.1892],
  "goa": [15.2993, 74.1240],
  "jaipur": [26.9124, 75.7873],
  "varanasi": [25.3176, 82.9739],
  "munnar": [10.0889, 77.0595],
  "rishikesh": [30.0869, 78.2676],
  "andaman": [11.6234, 92.7265]
};

async function initMap() {
  if (mapInstance) return;

  // Center on India
  mapInstance = L.map("leaflet-map-canvas").setView([20.5937, 78.9629], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(mapInstance);

  markersLayer = L.layerGroup().addTo(mapInstance);

  await loadDestinationMarkers();

  // Check URL params
  const params = new URLSearchParams(window.location.search);
  const dest = params.get("dest");
  if (dest && CITY_COORDS[dest]) {
    document.getElementById("map-to-select").value = dest;
    calculateRoute();
  }
}

async function loadDestinationMarkers() {
  try {
    const res = await fetch(`${API_BASE}/api/destinations`);
    const dests = await res.json();

    markersLayer.clearLayers();

    dests.forEach(d => {
      const marker = L.circleMarker([d.lat, d.lon], {
        radius: 9,
        fillColor: "#2563eb",
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 160px;">
          <strong style="color: #1e3a8a; font-size: 14px;">${d.name}</strong><br>
          <span style="font-size: 12px; color: #64748b;">${d.state} • ${d.category}</span><br>
          <strong style="font-size: 13px; color: #059669;">Rating: ⭐ ${d.rating}</strong><br>
          <button onclick="selectDestinationFromMap('${d.id}')" style="margin-top: 6px; padding: 3px 8px; background: #2563eb; color: #fff; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">
            Plan Route Here
          </button>
        </div>
      `);

      marker.on("click", () => {
        showDestinationSideCard(d);
      });

      markersLayer.addLayer(marker);
    });

  } catch (e) {
    console.error(e);
  }
}

function selectDestinationFromMap(id) {
  document.getElementById("map-to-select").value = id;
  calculateRoute();
}

function showDestinationSideCard(d) {
  const card = document.getElementById("selected-poi-card");
  card.innerHTML = `
    <div class="card border rounded-3 overflow-hidden shadow-sm">
      <img src="${d.image}" style="height: 140px; object-fit: cover;">
      <div class="p-3">
        <span class="badge bg-primary mb-1">${d.category}</span>
        <h6 class="fw-bold mb-1">${d.name}</h6>
        <p class="text-muted fs-7 mb-2">${d.description.substring(0, 85)}...</p>
        <div class="d-flex justify-content-between align-items-center fs-7 border-top pt-2">
          <span>Est. Cost: <strong>₹${d.avg_daily_cost}/day</strong></span>
          <a href="trip_planner.html?dest=${d.id}" class="btn btn-sm btn-outline-primary py-1 px-2 rounded-pill">Plan Trip</a>
        </div>
      </div>
    </div>
  `;
}

function calculateRoute() {
  const fromCity = document.getElementById("map-from-select").value;
  const toCity = document.getElementById("map-to-select").value;

  const startCoord = CITY_COORDS[fromCity] || CITY_COORDS["bangalore"];
  const endCoord = CITY_COORDS[toCity] || CITY_COORDS["ooty"];

  // Haversine distance
  const dKm = haversine(startCoord[0], startCoord[1], endCoord[0], endCoord[1]);
  const estHrs = (dKm / 55.0).toFixed(1); // avg 55 km/h driving speed
  const fuelCost = Math.round((dKm / 15.0) * 102); // 15 km/l @ ₹102/L

  document.getElementById("route-distance").textContent = `${Math.round(dKm)} km`;
  document.getElementById("route-duration").textContent = `~${estHrs} Hours`;
  document.getElementById("route-fuel").textContent = `₹${fuelCost.toLocaleString()}`;

  // Traffic randomizer
  const trafficStatus = ["Smooth Traffic (Highway NH)", "Moderate Traffic near Ghats", "Congested near Toll Plazas"];
  document.getElementById("route-traffic").textContent = trafficStatus[Math.floor(Math.random() * trafficStatus.length)];

  // Draw polyline
  if (routePolyline) mapInstance.removeLayer(routePolyline);

  routePolyline = L.polyline([startCoord, endCoord], {
    color: "#dc2626",
    weight: 4,
    dashArray: "6, 8"
  }).addTo(mapInstance);

  mapInstance.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });
}

function detectUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        mapInstance.setView([lat, lon], 10);
        L.marker([lat, lon]).addTo(mapInstance).bindPopup("<b>You are here!</b>").openPopup();
        showToast("Current location detected!", "success");
      },
      () => {
        showToast("Location permission denied or unavailable.", "danger");
      }
    );
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}