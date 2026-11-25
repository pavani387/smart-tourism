// TourisMetrics AI & Smart Travel Planning Platform - Global JavaScript Controller

const API_BASE = window.location.origin;

// State management in localStorage
const TravelState = {
  getUser() {
    const u = localStorage.getItem("travel_user");
    return u ? JSON.parse(u) : { name: "Guest Traveler", role: "tourist", email: "guest@smarttourism.com" };
  },
  setUser(user) {
    localStorage.setItem("travel_user", JSON.stringify(user));
    this.updateUserUI();
  },
  getWishlist() {
    const w = localStorage.getItem("travel_wishlist");
    return w ? JSON.parse(w) : [];
  },
  toggleWishlist(destId) {
    let list = this.getWishlist();
    if (list.includes(destId)) {
      list = list.filter(id => id !== destId);
      showToast("Removed from Wishlist", "info");
    } else {
      list.push(destId);
      showToast("Saved to your Wishlist!", "success");
    }
    localStorage.setItem("travel_wishlist", JSON.stringify(list));
    this.updateBadges();
    return list.includes(destId);
  },
  getBookings() {
    const b = localStorage.getItem("travel_bookings");
    return b ? JSON.parse(b) : [];
  },
  saveBooking(booking) {
    let bookings = this.getBookings();
    bookings.unshift(booking);
    localStorage.setItem("travel_bookings", JSON.stringify(bookings));
    this.updateBadges();
  },
  updateBadges() {
    const wCount = this.getWishlist().length;
    const bCount = this.getBookings().length;
    const wEl = document.getElementById("wishlist-badge");
    const bEl = document.getElementById("bookings-badge");
    if (wEl) wEl.textContent = wCount;
    if (bEl) bEl.textContent = bCount;
  },
  updateUserUI() {
    const user = this.getUser();
    const userBtn = document.getElementById("user-profile-btn");
    if (userBtn) {
      userBtn.innerHTML = `<i class="fa-solid fa-circle-user text-primary"></i> ${user.name} <span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'} fs-7 ms-1">${user.role.toUpperCase()}</span>`;
    }
  }
};

// Toast notification helper
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container") || createToastContainer();
  const toast = document.createElement("div");
  const bg = type === "success" ? "bg-success" : (type === "danger" ? "bg-danger" : "bg-primary");
  toast.className = `toast align-items-center text-white ${bg} border-0 show mb-2 shadow`;
  toast.setAttribute("role", "alert");
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body fs-7 fw-semibold"><i class="fa-solid fa-info-circle me-2"></i> ${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 4000);
}

function createToastContainer() {
  const c = document.createElement("div");
  c.id = "toast-container";
  c.className = "toast-container position-fixed top-0 end-0 p-3";
  c.style.zIndex = "1090";
  document.body.appendChild(c);
  return c;
}

// Global Nav Injection (if container exists)
function renderGlobalNav(activePage = "home") {
  const navContainer = document.getElementById("global-navbar");
  if (!navContainer) return;

  const pages = [
    { id: "home", title: "Home", href: "index.html", icon: "fa-house" },
    { id: "destinations", title: "Explore Destinations", href: "destinations.html", icon: "fa-compass" },
    { id: "demand", title: "Tourism Demand", href: "demand_analysis.html", icon: "fa-chart-line text-primary" },
    { id: "planner", title: "Plan Your Trip", href: "trip_planner.html", icon: "fa-wand-magic-sparkles text-warning" },
    { id: "weather", title: "Weather", href: "weather.html", icon: "fa-cloud-sun" },
    { id: "maps", title: "Maps & Routes", href: "maps.html", icon: "fa-map-location-dot" },
    { id: "transport", title: "Transportation", href: "transportation.html", icon: "fa-bus-simple" },
    { id: "hotels", title: "Hotels", href: "hotels.html", icon: "fa-hotel" },
    { id: "budget", title: "Budget", href: "budget.html", icon: "fa-calculator" },
    { id: "bookings", title: "My Bookings", href: "profile.html#bookings", icon: "fa-suitcase-rolling" },
    { id: "admin", title: "Admin Suite", href: "admin.html", icon: "fa-gauge-high text-danger" }
  ];

  let linksHtml = pages.map(p => `
    <li class="nav-item">
      <a class="nav-link-custom ${activePage === p.id ? 'active' : ''}" href="${p.href}">
        <i class="fa-solid ${p.icon}"></i> ${p.title}
      </a>
    </li>
  `).join("");

  navContainer.innerHTML = `
    <nav class="navbar navbar-expand-xl navbar-custom">
      <div class="container-fluid px-3 px-lg-4">
        <a class="navbar-brand d-flex align-items-center" href="index.html">
          <i class="fa-solid fa-earth-asia text-primary me-2 fa-xl"></i>
          <span class="brand-title">SmartTravel<span class="text-primary">AI</span></span>
          <span class="brand-badge">Demand & Planning</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navContent">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navContent">
          <ul class="navbar-nav me-auto mb-2 mb-xl-0 ms-xl-2 gap-1">
            ${linksHtml}
          </ul>
          <div class="d-flex align-items-center gap-2 mt-2 mt-xl-0">
            <a href="profile.html#wishlist" class="btn btn-outline-secondary btn-sm position-relative rounded-pill px-3" title="View Saved Destinations">
              <i class="fa-solid fa-heart text-danger me-1"></i> Wishlist
              <span id="wishlist-badge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">0</span>
            </a>
            <button id="user-profile-btn" class="btn btn-outline-primary btn-sm rounded-pill px-3" data-bs-toggle="modal" data-bs-target="#authModal">
              <i class="fa-solid fa-circle-user"></i> Guest Traveler
            </button>
          </div>
        </div>
      </div>
    </nav>
  `;

  TravelState.updateBadges();
  TravelState.updateUserUI();
}

// Global Footer Injection
function renderGlobalFooter() {
  const fContainer = document.getElementById("global-footer");
  if (!fContainer) return;

  fContainer.innerHTML = `
    <footer>
      <div class="container">
        <div class="row g-4">
          <div class="col-lg-4">
            <div class="d-flex align-items-center mb-2">
              <i class="fa-solid fa-earth-asia text-primary me-2 fa-xl"></i>
              <h5 class="fw-bold text-white mb-0">Tourism Demand & Smart Travel Platform</h5>
            </div>
            <p class="text-muted small">
              An intelligent, data-driven tourism platform integrating Scikit-Learn machine learning demand predictions with weather-adaptive, multi-modal travel itineraries.
            </p>
            <div class="d-flex gap-2">
              <a href="#" class="btn btn-sm btn-dark border rounded-circle"><i class="fa-brands fa-github"></i></a>
              <a href="#" class="btn btn-sm btn-dark border rounded-circle"><i class="fa-brands fa-linkedin"></i></a>
              <a href="#" class="btn btn-sm btn-dark border rounded-circle"><i class="fa-brands fa-twitter"></i></a>
            </div>
          </div>
          <div class="col-lg-2 col-6">
            <h6 class="text-white fw-bold mb-3 fs-7 text-uppercase">Navigation</h6>
            <ul class="list-unstyled d-flex flex-direction-column flex-column gap-2 small">
              <li><a href="index.html">Home</a></li>
              <li><a href="destinations.html">Explore Destinations</a></li>
              <li><a href="demand_analysis.html">Tourism Demand ML</a></li>
              <li><a href="trip_planner.html">Smart Trip Planner</a></li>
            </ul>
          </div>
          <div class="col-lg-2 col-6">
            <h6 class="text-white fw-bold mb-3 fs-7 text-uppercase">Planning Tools</h6>
            <ul class="list-unstyled d-flex flex-direction-column flex-column gap-2 small">
              <li><a href="weather.html">Weather Forecasts</a></li>
              <li><a href="maps.html">Interactive GIS Maps</a></li>
              <li><a href="transportation.html">Transportation Fares</a></li>
              <li><a href="hotels.html">Hotel Bookings</a></li>
            </ul>
          </div>
          <div class="col-lg-4">
            <h6 class="text-white fw-bold mb-3 fs-7 text-uppercase">Emergency & Assistance</h6>
            <p class="small text-muted mb-2">24x7 India Tourist Helpline: <strong class="text-white">1363</strong> / National Emergency: <strong class="text-white">112</strong></p>
            <div class="p-2 rounded bg-dark border border-secondary small">
              <span class="badge bg-success mb-1">Server Online</span>
              <div class="text-muted">Machine Learning Forecast Engine running with scikit-learn & FastAPI.</div>
            </div>
          </div>
        </div>
        <hr class="border-secondary my-4">
        <div class="d-flex flex-wrap justify-content-between align-items-center small text-muted">
          <span>&copy; 2026 Tourism Demand Analysis and Smart Travel Planning System. All rights reserved.</span>
          <span>Engineered for Smart Sustainable Tourism</span>
        </div>
      </div>
    </footer>
  `;
}

// Global Auth Modal Injection
function injectAuthModal() {
  if (document.getElementById("authModal")) return;
  const modalHtml = `
    <div class="modal fade" id="authModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title fw-bold"><i class="fa-solid fa-lock me-2"></i> User Sign In & Mode Switch</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <p class="text-muted fs-7 mb-3">Switch between Tourist Explorer mode and Destination Admin Management mode:</p>
            <div class="d-grid gap-2 mb-3">
              <button class="btn btn-outline-primary py-2 d-flex align-items-center justify-content-between" onclick="switchUserRole('tourist')">
                <span><i class="fa-solid fa-user me-2"></i> Continue as <strong>Tourist Traveler</strong></span>
                <span class="badge bg-primary">Active Portal</span>
              </button>
              <button class="btn btn-outline-danger py-2 d-flex align-items-center justify-content-between" onclick="switchUserRole('admin')">
                <span><i class="fa-solid fa-shield-halved me-2"></i> Switch to <strong>Tourism Authority (Admin)</strong></span>
                <span class="badge bg-danger">Control Suite</span>
              </button>
            </div>
            <div class="p-3 bg-light rounded border text-muted fs-7">
              <i class="fa-solid fa-circle-check text-success me-1"></i> <strong>No passwords required in local mode:</strong> Profiles and simulated bookings persist directly in your browser session.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

function switchUserRole(role) {
  if (role === "admin") {
    TravelState.setUser({ name: "Tourism Officer (Admin)", role: "admin", email: "admin@tourismboard.gov" });
    showToast("Switched to Administrator Mode", "danger");
  } else {
    TravelState.setUser({ name: "Alex Johnson", role: "tourist", email: "alex.traveler@gmail.com" });
    showToast("Signed in as Tourist Traveler", "success");
  }
  const modal = bootstrap.Modal.getInstance(document.getElementById("authModal"));
  if (modal) modal.hide();
}

// Floating AI Assistant Widget
function injectAssistantWidget() {
  if (document.getElementById("floating-assistant-wrap")) return;
  const widgetHtml = `
    <div id="floating-assistant-wrap">
      <button class="floating-assistant-btn" onclick="toggleChatDrawer()">
        <i class="fa-solid fa-robot fa-lg"></i>
        <span>Ask Aero AI</span>
      </button>

      <div id="chat-drawer" class="chat-drawer hidden">
        <div class="chat-header">
          <div class="d-flex align-items-center gap-2">
            <i class="fa-solid fa-robot fa-lg text-info"></i>
            <div>
              <div class="fw-bold fs-6">Aero - Smart Travel AI</div>
              <div class="fs-7 opacity-75">Online • Destination & Weather Expert</div>
            </div>
          </div>
          <button class="btn btn-sm btn-link text-white p-0" onclick="toggleChatDrawer()"><i class="fa-solid fa-xmark fa-lg"></i></button>
        </div>
        <div id="chat-messages" class="chat-messages">
          <div class="msg-bubble msg-ai">
            👋 Hello! I am <strong>Aero</strong>, your smart tourism assistant. Ask me anything about Ooty, Manali, Goa, weather recommendations, or planning a trip on a budget!
          </div>
        </div>
        <div class="p-2 border-top bg-white d-flex gap-1 overflow-x-auto fs-7" style="white-space: nowrap;">
          <button class="btn btn-xs btn-light border rounded-pill px-2" onclick="sendQuickPrompt('What is the best time to visit Ooty?')">Best time Ooty?</button>
          <button class="btn btn-xs btn-light border rounded-pill px-2" onclick="sendQuickPrompt('Plan a 3-day budget trip under 15k')">Trip under ₹15k</button>
          <button class="btn btn-xs btn-light border rounded-pill px-2" onclick="sendQuickPrompt('Indoor places to visit if it rains')">Rain alternatives</button>
        </div>
        <div class="chat-input-bar">
          <input type="text" id="chat-input" class="form-control form-control-sm" placeholder="Ask about places, costs, weather..." onkeypress="handleChatEnter(event)">
          <button class="btn btn-sm btn-primary px-3" onclick="sendChatMessage()"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", widgetHtml);
}

function toggleChatDrawer() {
  const d = document.getElementById("chat-drawer");
  if (d) d.classList.toggle("hidden");
}

function handleChatEnter(e) {
  if (e.key === "Enter") sendChatMessage();
}

function sendQuickPrompt(txt) {
  document.getElementById("chat-input").value = txt;
  sendChatMessage();
}

async function sendChatMessage() {
  const inp = document.getElementById("chat-input");
  const msg = inp.value.trim();
  if (!msg) return;

  inp.value = "";
  const container = document.getElementById("chat-messages");
  
  // User bubble
  const userDiv = document.createElement("div");
  userDiv.className = "msg-bubble msg-user";
  userDiv.textContent = msg;
  container.appendChild(userDiv);
  container.scrollTop = container.scrollHeight;

  // Typing placeholder
  const aiDiv = document.createElement("div");
  aiDiv.className = "msg-bubble msg-ai";
  aiDiv.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i> Aero is thinking...`;
  container.appendChild(aiDiv);
  container.scrollTop = container.scrollHeight;

  try {
    const res = await fetch(`${API_BASE}/api/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    aiDiv.innerHTML = data.reply;
  } catch (err) {
    aiDiv.innerHTML = "Sorry, I could not connect to the travel knowledge base right now. Please try again.";
  }
  container.scrollTop = container.scrollHeight;
}

// Auto init on page load
document.addEventListener("DOMContentLoaded", () => {
  injectAuthModal();
  injectAssistantWidget();
  renderGlobalFooter();
});