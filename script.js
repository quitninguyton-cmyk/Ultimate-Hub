
const app = document.getElementById("app");

const pages = [
  ["Dashboard", "🏠"],
  ["Giveaways", "🎁"],
  ["Hierarchy", "👑"],
  ["Chat", "💬"],
  ["Economy", "🪙"],
  ["Shop", "🛒"],
  ["Leaderboard", "🏆"],
  ["Inventory", "🎒"],
  ["Profile", "👤"]
];

let currentPage = "Dashboard";

function render() {
  app.innerHTML = `
    <header class="topbar">
      <h1>ULTIMATE HUB</h1>
      <div class="user-area">
        <span>👤 Guest</span>
        <button class="primary-btn" onclick="showPage('Profile')">
          Account
        </button>
      </div>
    </header>

    <div class="layout">
      <aside class="sidebar">
        <h3>MENU</h3>
        ${pages.map(([name, icon]) => `
          <button class="nav-item ${currentPage === name ? "active" : ""}"
            onclick="showPage('${name}')">
            <span>${icon}</span> ${name}
          </button>
        `).join("")}
      </aside>

      <main class="main-content">
        <div class="welcome">
          <p class="muted">WELCOME TO</p>
          <h2>${currentPage}</h2>
          <p class="muted">Your Community. Your Economy. Your Rewards.</p>
        </div>

        <div class="stats-grid">
          <div class="card">
            <span>👥 Members</span>
            <h2>0</h2>
          </div>
          <div class="card">
            <span>🎁 Giveaways</span>
            <h2>0</h2>
          </div>
          <div class="card">
            <span>🪙 Your Coins</span>
            <h2>0</h2>
          </div>
          <div class="card">
            <span>⭐ Your Level</span>
            <h2>1</h2>
          </div>
        </div>

        <section class="card content-card">
          <h2>${currentPage}</h2>
          <p class="muted">${getDescription(currentPage)}</p>
          <div id="page-content"></div>
        </section>
      </main>
    </div>
  `;
}

function getDescription(page) {
  const descriptions = {
    Dashboard: "Everything Cool happening in Ultimate Hub.",
    Giveaways: "Enter exciting community giveaways.",
    Hierarchy: "Explore member ranks and permissions.",
    Chat: "Talk with the Ultimate Hub community.",
    Economy: "Earn coins and build your wealth.",
    Shop: "Spend your coins on exclusive rewards.",
    Leaderboard: "See the top members.",
    Inventory: "View your collected items.",
    Profile: "Manage your account."
  };

  return descriptions[page] || "Welcome to Ultimate Hub!";
}

function showPage(page) {
  currentPage = page;
  render();
}

render();
