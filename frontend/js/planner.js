// TourisMetrics AI - Smart Trip Planner Logic & Itinerary Renderer

let currentGeneratedItinerary = null;

async function initPlannerPage() {
  // Read URL query params if populated from home or destinations page
  const params = new URLSearchParams(window.location.search);
  const origin = params.get("origin");
  const dest = params.get("dest");
  const date = params.get("date");
  const travelers = params.get("travelers");

  if (origin) document.getElementById("plan-origin").value = origin;
  if (dest) document.getElementById("plan-dest").value = dest;
  if (date) document.getElementById("plan-start-date").value = date;
  if (travelers) document.getElementById("plan-travelers").value = travelers;

  // Auto-generate if destination was passed
  if (dest) {
    generateSmartItinerary();
  }
}

async function handlePlannerSubmit(e) {
  e.preventDefault();
  await generateSmartItinerary();
}

async function generateSmartItinerary() {
  const origin = document.getElementById("plan-origin").value || "Bangalore";
  const destId = document.getElementById("plan-dest").value || "ooty";
  const startDate = document.getElementById("plan-start-date").value || "2026-12-10";
  const days = parseInt(document.getElementById("plan-days").value) || 3;
  const travelers = parseInt(document.getElementById("plan-travelers").value) || 2;
  const budget = parseInt(document.getElementById("plan-budget").value) || 15000;
  const travelStyle = document.getElementById("plan-style").value || "Moderate";
  const transportPref = document.getElementById("plan-transport").value || "Car";
  const isRainy = document.getElementById("plan-rain-check").checked;

  const btn = document.getElementById("btn-generate-plan");
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i> Generating Itinerary...`;
  btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/api/planner/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: origin,
        destination_id: destId,
        start_date: startDate,
        days: days,
        num_people: travelers,
        total_budget: budget,
        travel_style: travelStyle,
        transport_pref: transportPref,
        is_rainy: isRainy
      })
    });

    const data = await res.json();
    currentGeneratedItinerary = data;
    renderItineraryResults(data);

    // Scroll to results
    document.getElementById("itinerary-results-container").scrollIntoView({ behavior: "smooth" });

  } catch (err) {
    console.error("Error generating itinerary:", err);
    showToast("Error generating itinerary. Please try again.", "danger");
  } finally {
    btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles me-2"></i> Generate Smart Itinerary`;
    btn.disabled = false;
  }
}

function renderItineraryResults(data) {
  const container = document.getElementById("itinerary-results-container");
  container.classList.remove("d-none");

  // Destination Header & Hotel Card
  document.getElementById("itin-dest-name").textContent = `${data.destination.name} (${data.days_count}-Day Journey)`;
  document.getElementById("itin-dates-sub").textContent = `Origin: ${data.origin} • ${data.travelers} Travelers • Style: ${data.travel_style}`;

  // Weather Alert Box
  const alertBox = document.getElementById("itin-weather-alert");
  if (data.weather_alert) {
    alertBox.classList.remove("d-none");
    alertBox.innerHTML = `
      <div class="d-flex align-items-center gap-3">
        <i class="fa-solid fa-cloud-showers-heavy fa-2x text-warning"></i>
        <div>
          <strong class="d-block">${data.weather_alert.title}</strong>
          <span class="fs-7">${data.weather_alert.message}</span>
        </div>
      </div>
    `;
  } else {
    alertBox.classList.add("d-none");
  }

  // Recommended Hotel Box
  const hotel = data.hotel;
  document.getElementById("itin-hotel-box").innerHTML = `
    <div class="p-3 bg-white border rounded-3 d-flex align-items-center gap-3 mb-4 shadow-sm">
      <img src="${hotel.image}" style="width: 110px; height: 90px; object-fit: cover; border-radius: 10px;">
      <div class="flex-grow-1">
        <div class="d-flex justify-content-between align-items-center">
          <span class="badge bg-success bg-opacity-10 text-success border border-success">Recommended Base Hotel</span>
          <span class="badge bg-warning text-dark"><i class="fa-solid fa-star"></i> ${hotel.rating}</span>
        </div>
        <h5 class="fw-bold mb-1 mt-1">${hotel.name}</h5>
        <p class="text-muted fs-7 mb-1"><i class="fa-solid fa-location-dot text-danger"></i> ${hotel.distance_km} km from attractions center • ${hotel.amenities.join(", ")}</p>
        <strong class="text-primary">₹${hotel.price_night.toLocaleString()} / night</strong>
      </div>
    </div>
  `;

  // Render Day-Wise Schedule
  const daysContainer = document.getElementById("itin-days-accordion");
  daysContainer.innerHTML = data.days.map((day, dIdx) => `
    <div class="card border mb-3 shadow-sm rounded-3 overflow-hidden">
      <div class="card-header bg-light py-3 d-flex justify-content-between align-items-center cursor-pointer" data-bs-toggle="collapse" data-bs-target="#dayCollapse${dIdx}">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-primary rounded-pill px-3 py-2">Day ${day.day_number}</span>
          <strong class="text-dark fs-6">${day.theme}</strong>
        </div>
        <span class="text-muted fs-7">${day.date} <i class="fa-solid fa-chevron-down ms-2"></i></span>
      </div>
      <div id="dayCollapse${dIdx}" class="collapse ${dIdx === 0 ? 'show' : ''}">
        <div class="card-body p-4">
          <div class="timeline">
            ${day.events.map(ev => `
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span class="badge bg-secondary mb-1"><i class="fa-solid fa-clock me-1"></i> ${ev.time}</span>
                      <h6 class="fw-bold mb-0 text-dark">${ev.title}</h6>
                    </div>
                    <div class="text-end">
                      ${ev.cost > 0 ? `<span class="badge bg-light text-dark border">₹${ev.cost.toLocaleString()}</span>` : `<span class="badge bg-success bg-opacity-10 text-success">Free / Included</span>`}
                      ${ev.indoor ? `<span class="badge bg-info text-dark ms-1">Indoor</span>` : ``}
                    </div>
                  </div>
                  <p class="text-muted fs-7 mb-0">${ev.desc}</p>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  `).join("");

  // Render Budget Breakdown
  const b = data.budget;
  document.getElementById("budget-estimated-total").textContent = `₹${b.estimated_total.toLocaleString()}`;
  document.getElementById("budget-per-person").textContent = `₹${b.per_person_cost.toLocaleString()} / person`;
  
  const statusBadge = document.getElementById("budget-status-badge");
  statusBadge.textContent = b.status;
  statusBadge.className = `badge ${b.variance >= 0 ? 'bg-success' : 'bg-warning text-dark'}`;

  const breakdownContainer = document.getElementById("budget-breakdown-list");
  breakdownContainer.innerHTML = b.breakdown.map(item => `
    <div class="mb-2">
      <div class="d-flex justify-content-between fs-7 mb-1">
        <span>${item.category}</span>
        <strong>₹${item.amount.toLocaleString()} (${item.share_pct}%)</strong>
      </div>
      <div class="progress" style="height: 6px;">
        <div class="progress-bar bg-primary" style="width: ${item.share_pct}%;"></div>
      </div>
    </div>
  `).join("");
}

function saveCurrentItinerary() {
  if (!currentGeneratedItinerary) return;

  const booking = {
    id: "TRIP-" + Math.floor(100000 + Math.random() * 900000),
    type: "Itinerary Trip",
    destination: currentGeneratedItinerary.destination.name,
    dest_id: currentGeneratedItinerary.destination.id,
    start_date: currentGeneratedItinerary.start_date,
    days: currentGeneratedItinerary.days_count,
    travelers: currentGeneratedItinerary.travelers,
    hotel: currentGeneratedItinerary.hotel.name,
    estimated_total: currentGeneratedItinerary.budget.estimated_total,
    saved_at: new Date().toLocaleDateString(),
    status: "Confirmed & Saved"
  };

  TravelState.saveBooking(booking);
  showToast("Itinerary successfully saved to My Bookings!", "success");
}

function printItinerary() {
  window.print();
}