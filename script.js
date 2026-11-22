
// ULTIMATE HUB - AUTHENTICATION

const SUPABASE_URL = "https://nvcsyigvsivtjbyjsbfb.supabase.co";

const SUPABASE_KEY = "sb_publishable_ZQQLO6j1kgf-ZoEZUtqahg_gWI4O4C4";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const app = document.getElementById("app");

let currentUser = null;
let currentProfile = null;
let currentPage = "Dashboard";
let authMessage = "";

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// AUTHENTICATION SCREEN
function showAuth() {
  app.innerHTML = `
    <div style="
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
    ">
      <div class="card" style="
        width:100%;
        max-width:420px;
        padding:30px;
      ">
        <h1 style="text-align:center;font-size:28px">
          ULTIMATE HUB
        </h1>

        <p class="muted" style="text-align:center;margin:12px 0 25px">
          Your Community. Your Economy. Your Rewards.
        </p>

        <h2 id="auth-title">Welcome Back!</h2>

        <p id="auth-description" class="muted" style="margin:8px 0 20px">
          Login to your account.
        </p>

        <form id="auth-form">
          <label>Email</label>
          <input id="email" type="email" required
            placeholder="Your email"
            style="width:100%;padding:13px;margin:8px 0 18px;
            background:#191927;color:white;border:1px solid #33334a;
            border-radius:8px">

          <label>Password</label>
          <input id="password" type="password" required
            minlength="6" placeholder="Your password"
            style="width:100%;padding:13px;margin:8px 0 18px;
            background:#191927;color:white;border:1px solid #33334a;
            border-radius:8px">

          <input id="username" type="text"
            placeholder="Choose a username"
            maxlength="20"
            style="display:none;width:100%;padding:13px;margin-bottom:18px;
            background:#191927;color:white;border:1px solid #33334a;
            border-radius:8px">

          <button class="primary-btn" type="submit"
            id="auth-submit" style="width:100%">
            Login
          </button>
        </form>

        <p id="auth-message" style="margin-top:15px;color:#a78bfa">
          ${escapeHTML(authMessage)}
        </p>

        <p style="margin-top:20px;text-align:center;font-size:13px">
          <span id="toggle-text">Don't have an account?</span>
          <button id="toggle-auth"
            style="background:none;color:#a78bfa;font-weight:bold">
            Register
          </button>
        </p>
      </div>
    </div>
  `;

  let isRegister = false;

  const form = document.getElementById("auth-form");
  const username = document.getElementById("username");

  document.getElementById("toggle-auth").onclick = () => {
    isRegister = !isRegister;

    document.getElementById("auth-title").textContent =
      isRegister ? "Create Account" : "Welcome Back!";

    document.getElementById("auth-description").textContent =
      isRegister ? "Join the Ultimate Hub community." : "Login to your account.";

    document.getElementById("auth-submit").textContent =
      isRegister ? "Create Account" : "Login";

    document.getElementById("toggle-text").textContent =
      isRegister ? "Already have an account?" : "Don't have an account?";

    document.getElementById("toggle-auth").textContent =
      isRegister ? "Login" : "Register";

    username.style.display = isRegister ? "block" : "none";
    username.required = isRegister;
  };

  form.onsubmit = async event => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const name = username.value.trim();

    const message = document.getElementById("auth-message");
    const submit = document.getElementById("auth-submit");

    if (isRegister && !/^[a-zA-Z0-9_]{3,20}$/.test(name)) {
      message.textContent =
        "Username must be 3-20 characters using letters, numbers or underscores.";
      return;
    }

    submit.disabled = true;
    submit.textContent = "Please wait...";
    message.textContent = "";

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });

        if (error) throw error;

        if (data.session) {
          await loadDashboard();
        } else {
          message.textContent =
            "Account created! Check your email to confirm your account, then log in.";
          submit.disabled = false;
          submit.textContent = "Create Account";
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        await loadDashboard();
      }
    } catch (error) {
      message.textContent = error.message;
      submit.disabled = false;
      submit.textContent = isRegister ? "Create Account" : "Login";
    }
  };
}

// DASHBOARD
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

async function loadDashboard() {
  const { data: { user }, error } =
    await supabase.auth.getUser();

  if (error || !user) {
    currentUser = null;
    currentProfile = null;
    showAuth();
    return;
  }

  currentUser = user;

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

  if (profileError || !profile) {
    app.innerHTML = `
      <div class="card" style="margin:30px">
        <h2>Loading your profile...</h2>
        <p class="muted">If this continues, contact an administrator.</p>
        <button class="secondary-btn" onclick="logout()">Logout</button>
      </div>
    `;
    return;
  }

  currentProfile = profile;
  render();
}

function render() {
  if (!currentUser || !currentProfile) {
    showAuth();
    return;
  }

  const name = escapeHTML(currentProfile.username);

  app.innerHTML = `
    <header class="topbar">
      <h1>ULTIMATE HUB</h1>

      <div class="user-area">
        <span>👤 ${name}</span>
        <button class="primary-btn" onclick="logout()">
          Logout
        </button>
      </div>
    </header>

    <div class="layout">
      <aside class="sidebar">
        <h3>MENU</h3>

        ${pages.map(([page, icon]) => `
          <button class="nav-item ${currentPage === page ? "active" : ""}"
            onclick="showPage('${page}')">
            ${icon} ${page}
          </button>
        `).join("")}
      </aside>

      <main class="main-content">
        <div class="welcome">
          <p class="muted">WELCOME TO ULTIMATE HUB</p>
          <h2>${escapeHTML(currentPage)}</h2>
          <p class="muted">Your Community. Your Economy. Your Rewards.</p>
        </div>

        <div class="stats-grid">
          <div class="card">
            <span>👤 Member</span>
            <h2 style="font-size:20px">${name}</h2>
          </div>

          <div class="card">
            <span>🪙 Your Coins</span>
            <h2>${Number(currentProfile.coins).toLocaleString()}</h2>
          </div>

          <div class="card">
            <span>⭐ Your Level</span>
            <h2>${currentProfile.level}</h2>
          </div>

          <div class="card">
            <span>👑 Your Rank</span>
            <h2 style="font-size:20px">${escapeHTML(currentProfile.role)}</h2>
          </div>
        </div>

        <section class="card content-card">
          <h2>${escapeHTML(currentPage)}</h2>
          <p class="muted">
            ${getDescription(currentPage)}
          </p>
        </section>
      </main>
    </div>
  `;
}

function getDescription(page) {
  const descriptions = {
    Dashboard: "Welcome to your Ultimate Hub dashboard!",
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

async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  currentUser = null;
  currentProfile = null;
  authMessage = "";
  showAuth();
}

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    currentUser = null;
    currentProfile = null;
    showAuth();
  }
});

showAuth();

supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    authMessage = error.message;
    showAuth();
  } else if (data.session) {
    loadDashboard();
  }
});
