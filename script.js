
// ==========================================
// ULTIMATE HUB - COMPLETE WEBSITE SCRIPT
// Dashboard + Authentication + Giveaways
// Hierarchy + Live Chat
// ==========================================

const SUPABASE_URL = "https://nvcsyigvsivtjbyjsbfb.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZQQLO6j1kgf-ZoEZUtqahg_gWI4O4C4";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const app = document.getElementById("app");

let currentUser = null;
let currentProfile = null;
let currentPage = "Dashboard";
let chatChannel = null;
let chatRefreshTimer = null;

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

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function inputStyle() {
  return "display:block;width:100%;padding:12px;margin:8px 0 16px;background:#191927;color:white;border:1px solid #33334a;border-radius:8px;box-sizing:border-box";
}

function isAdmin() {
  return currentProfile?.role === "Admin";
}

// ==========================================
// AUTHENTICATION
// ==========================================

function showAuth(message = "") {
  app.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px">
      <div class="card" style="width:100%;max-width:420px;padding:30px">
        <h1 style="text-align:center">ULTIMATE HUB</h1>
        <p class="muted" style="text-align:center;margin:12px 0 25px">
          Your Community. Your Economy. Your Rewards.
        </p>

        <h2 id="auth-title">Welcome Back!</h2>
        <p class="muted" id="auth-description" style="margin:10px 0 20px">
          Login to your account.
        </p>

        <form id="auth-form">
          <label>Email</label>
          <input id="email" type="email" required
            placeholder="Your email" style="${inputStyle()}">

          <label>Password</label>
          <input id="password" type="password" required minlength="6"
            placeholder="Your password" style="${inputStyle()}">

          <input id="username" type="text" maxlength="20"
            placeholder="Choose a username"
            style="display:none;${inputStyle()}">

          <button class="primary-btn" id="auth-submit" type="submit"
            style="width:100%">Login</button>
        </form>

        <p id="auth-message" style="margin-top:15px;color:#ff9999">
          ${escapeHTML(message)}
        </p>

        <p style="margin-top:20px;text-align:center;font-size:13px">
          <span id="toggle-text">Don't have an account?</span>
          <button id="toggle-auth" type="button"
            style="background:none;color:#a78bfa;font-weight:bold">Register</button>
        </p>
      </div>
    </div>
  `;

  let isRegister = false;

  const form = document.getElementById("auth-form");
  const usernameInput = document.getElementById("username");

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

    usernameInput.style.display = isRegister ? "block" : "none";
    usernameInput.required = isRegister;
  };

  form.onsubmit = async event => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const username = usernameInput.value.trim();
    const messageBox = document.getElementById("auth-message");
    const submit = document.getElementById("auth-submit");

    if (isRegister && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      messageBox.textContent =
        "Username must be 3-20 characters using letters, numbers or underscores.";
      return;
    }

    submit.disabled = true;
    submit.textContent = "Please wait...";

    try {
      if (isRegister) {
        const { error } = await supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: { username }
          }
        });

        if (error) throw error;

        messageBox.textContent =
          "Account created! Check your email to confirm, then log in.";

        submit.disabled = false;
        submit.textContent = "Create Account";
      } else {
        const { error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        await loadDashboard();
      }
    } catch (error) {
      messageBox.textContent = error.message;
      submit.disabled = false;
      submit.textContent = isRegister ? "Create Account" : "Login";
    }
  };
}

// ==========================================
// DASHBOARD
// ==========================================

async function loadDashboard() {
  app.innerHTML = `
    <div style="padding:40px;color:white">
      <h1>ULTIMATE HUB</h1>
      <p>Loading your account...</p>
    </div>
  `;

  try {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
      currentUser = null;
      currentProfile = null;
      showAuth();
      return;
    }

    currentUser = data.user;

    const { data: profile, error: profileError } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

    if (profileError) throw profileError;

    currentProfile = profile;
    currentPage = "Dashboard";

    render();

  } catch (error) {
    app.innerHTML = `
      <div class="card" style="margin:30px;padding:25px">
        <h2>Profile Loading Error</h2>
        <p style="color:#ff7777;margin:15px 0">
          ${escapeHTML(error.message)}
        </p>
        <button class="secondary-btn" onclick="logout()">Logout</button>
      </div>
    `;
  }
}

function render() {
  if (!currentUser || !currentProfile) {
    showAuth();
    return;
  }

  const name = escapeHTML(currentProfile.username);
  const coins = Number(currentProfile.coins || 0).toLocaleString();

  app.innerHTML = `
    <header class="topbar">
      <h1>ULTIMATE HUB</h1>
      <div class="user-area">
        <span>👤 ${name}</span>
        <button class="primary-btn" onclick="logout()">Logout</button>
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
            <h2>${coins}</h2>
          </div>

          <div class="card">
            <span>⭐ Your Level</span>
            <h2>${escapeHTML(currentProfile.level ?? 1)}</h2>
          </div>

          <div class="card">
            <span>👑 Your Rank</span>
            <h2 style="font-size:20px">
              ${escapeHTML(currentProfile.role)}
            </h2>
          </div>
        </div>

        <section class="card content-card">
          <h2>${escapeHTML(currentPage)}</h2>
          <p class="muted">${getDescription(currentPage)}</p>
          <div id="page-content" style="margin-top:20px">
            <p>Loading...</p>
          </div>
        </section>
      </main>
    </div>
  `;

  loadPageContent();
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

function stopChat() {
  if (chatRefreshTimer) {
    clearInterval(chatRefreshTimer);
    chatRefreshTimer = null;
  }

  if (chatChannel) {
    supabaseClient.removeChannel(chatChannel);
    chatChannel = null;
  }
}

function showPage(page) {
  stopChat();
  currentPage = page;
  render();
}

async function loadPageContent() {
  const container = document.getElementById("page-content");
  if (!container) return;

  if (currentPage === "Giveaways") {
    await loadGiveaways();
    return;
  }

  if (currentPage === "Hierarchy") {
    await loadHierarchy();
    return;
  }

  if (currentPage === "Chat") {
    await loadChat();
    return;
  }

  if (currentPage === "Dashboard") {
    container.innerHTML = `
      <h3>Welcome back, ${escapeHTML(currentProfile.username)}!</h3>
      <p class="muted" style="margin-top:10px">
        Explore the menu to discover everything Ultimate Hub has to offer.
      </p>
      <button class="primary-btn" style="margin-top:20px"
        onclick="showPage('Giveaways')">
        Explore Giveaways 🎁
      </button>
    `;
    return;
  }

  container.innerHTML = `
    <div style="padding:20px;text-align:center">
      <h3>${escapeHTML(currentPage)} is coming soon!</h3>
      <p class="muted" style="margin-top:10px">
        We're building this section next.
      </p>
    </div>
  `;
}

// ==========================================
// GIVEAWAYS
// ==========================================

async function loadGiveaways() {
  const container = document.getElementById("page-content");
  if (!container) return;

  container.innerHTML = "<p>Loading giveaways...</p>";

  try {
    const { data: giveaways, error } = await supabaseClient
      .from("giveaways")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    let html = "";

    if (isAdmin()) {
      html += `
        <div class="card" style="padding:20px;margin-bottom:25px">
          <h3>➕ Create a Giveaway</h3>

          <form id="create-giveaway-form" style="margin-top:15px">
            <label>Giveaway title</label>
            <input id="giveaway-title" required maxlength="100"
              placeholder="Example: 1,000 Coins Giveaway"
              style="${inputStyle()}">

            <label>Prize</label>
            <input id="giveaway-prize" required maxlength="100"
              placeholder="What can members win?"
              style="${inputStyle()}">

            <label>Description</label>
            <textarea id="giveaway-description"
              placeholder="Tell members about the giveaway..."
              style="${inputStyle()}"></textarea>

            <label>End date and time</label>
            <input id="giveaway-end" type="datetime-local" required
              style="${inputStyle()}">

            <button class="primary-btn" type="submit"
              style="width:100%;margin-top:15px">
              Create Giveaway
            </button>
          </form>

          <p id="create-message" style="margin-top:12px"></p>
        </div>
      `;
    }

    html += `<h3 style="margin-bottom:15px">🎁 Community Giveaways</h3>`;

    if (!giveaways || giveaways.length === 0) {
      html += `
        <div class="card" style="padding:25px;text-align:center">
          <h3>No giveaways yet!</h3>
          <p class="muted" style="margin-top:10px">
            Check back soon for exciting prizes.
          </p>
        </div>
      `;
    } else {
      for (const giveaway of giveaways) {
        const { data: myEntry, error: entryError } =
          await supabaseClient
            .from("giveaway_entries")
            .select("id")
            .eq("giveaway_id", giveaway.id)
            .eq("user_id", currentUser.id)
            .maybeSingle();

        if (entryError) throw entryError;

        const endedByTime =
          giveaway.ends_at && new Date(giveaway.ends_at) <= new Date();

        const isOpen = giveaway.status === "open" && !endedByTime;
        const entered = Boolean(myEntry);

        let statusText = "OPEN";

        if (giveaway.status === "completed") statusText = "COMPLETED";
        else if (giveaway.status === "closed" || endedByTime) statusText = "CLOSED";

        html += `
          <div class="card" style="padding:20px;margin-bottom:15px">
            <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <h3>${escapeHTML(giveaway.title)}</h3>
              <strong style="color:${isOpen ? "#4ade80" : "#fbbf24"}">
                ${statusText}
              </strong>
            </div>

            <p style="margin-top:12px">
              🏆 Prize: <strong>${escapeHTML(giveaway.prize)}</strong>
            </p>

            <p class="muted" style="margin-top:10px">
              ${escapeHTML(giveaway.description || "No description provided.")}
            </p>

            <p class="muted" style="margin-top:10px">
              🕒 Ends: ${giveaway.ends_at
                ? escapeHTML(new Date(giveaway.ends_at).toLocaleString())
                : "No end date"}
            </p>

            ${giveaway.winner_id ? `
              <p style="margin-top:12px;color:#a78bfa">
                👑 A winner has been selected!
              </p>
            ` : ""}

            ${isOpen ? `
              <button class="primary-btn" style="margin-top:15px"
                ${entered ? "disabled" : ""}
                onclick="enterGiveaway('${giveaway.id}')">
                ${entered ? "Already Entered ✓" : "Enter Giveaway 🎉"}
              </button>
            ` : `
              <p class="muted" style="margin-top:15px">
                Entries are closed.
              </p>
            `}

            ${isAdmin() && giveaway.status === "open" ? `
              <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:15px">
                <button class="secondary-btn"
                  onclick="closeGiveaway('${giveaway.id}')">
                  Close
                </button>

                <button class="primary-btn"
                  onclick="drawWinner('${giveaway.id}')">
                  Pick Winner 👑
                </button>
              </div>
            ` : ""}
          </div>
        `;
      }
    }

    container.innerHTML = html;

    const createForm = document.getElementById("create-giveaway-form");

    if (createForm) {
      createForm.onsubmit = createGiveaway;
    }

  } catch (error) {
    container.innerHTML = `
      <div class="card" style="padding:20px">
        <h3 style="color:#ff7777">Giveaway Error</h3>
        <p style="margin-top:10px">${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}

async function createGiveaway(event) {
  event.preventDefault();

  if (!isAdmin()) {
    alert("Only admins can create giveaways.");
    return;
  }

  const title = document.getElementById("giveaway-title").value.trim();
  const prize = document.getElementById("giveaway-prize").value.trim();
  const description = document.getElementById("giveaway-description").value.trim();
  const endValue = document.getElementById("giveaway-end").value;
  const message = document.getElementById("create-message");

  const endsAt = new Date(endValue);

  if (!title || !prize || !endValue || Number.isNaN(endsAt.getTime())) {
    message.textContent = "Please fill in all required fields.";
    return;
  }

  if (endsAt <= new Date()) {
    message.textContent = "The end date must be in the future.";
    return;
  }

  message.textContent = "Creating giveaway...";

  try {
    const { error } = await supabaseClient
      .from("giveaways")
      .insert({
        title,
        prize,
        description,
        ends_at: endsAt.toISOString(),
        created_by: currentUser.id
      });

    if (error) throw error;

    alert("Giveaway created successfully!");
    await loadGiveaways();

  } catch (error) {
    message.textContent = "Error: " + error.message;
  }
}

async function enterGiveaway(id) {
  try {
    const { error } = await supabaseClient
      .from("giveaway_entries")
      .insert({
        giveaway_id: id,
        user_id: currentUser.id
      });

    if (error) throw error;

    alert("You're entered in the giveaway! Good luck!");
    await loadGiveaways();

  } catch (error) {
    alert("Could not enter giveaway: " + error.message);
  }
}

async function closeGiveaway(id) {
  if (!isAdmin()) return;
  if (!confirm("Are you sure you want to close this giveaway?")) return;

  try {
    const { error } = await supabaseClient
      .from("giveaways")
      .update({ status: "closed" })
      .eq("id", id);

    if (error) throw error;

    alert("Giveaway closed!");
    await loadGiveaways();

  } catch (error) {
    alert("Error: " + error.message);
  }
}

async function drawWinner(id) {
  if (!isAdmin()) return;
  if (!confirm("Pick a random winner from the entries?")) return;

  try {
    const { data: entries, error: entriesError } = await supabaseClient
      .from("giveaway_entries")
      .select("user_id")
      .eq("giveaway_id", id);

    if (entriesError) throw entriesError;

    if (!entries || entries.length === 0) {
      alert("Nobody has entered this giveaway yet.");
      return;
    }

    const winner = entries[Math.floor(Math.random() * entries.length)];

    const { error: updateError } = await supabaseClient
      .from("giveaways")
      .update({
        winner_id: winner.user_id,
        status: "completed"
      })
      .eq("id", id);

    if (updateError) throw updateError;

    alert("Winner selected successfully!");
    await loadGiveaways();

  } catch (error) {
    alert("Could not pick winner: " + error.message);
  }
}

// ==========================================
// HIERARCHY
// ==========================================

async function loadHierarchy() {
  const container = document.getElementById("page-content");
  if (!container) return;

  container.innerHTML = "<p>Loading members...</p>";

  try {
    const { data: members, error } = await supabaseClient
      .from("profiles")
      .select("id, username, role, level, coins")
      .order("username", { ascending: true });

    if (error) throw error;

    const rankColors = {
      Owner: "#fbbf24",
      Admin: "#a78bfa",
      Moderator: "#60a5fa",
      VIP: "#4ade80",
      Member: "#cbd5e1"
    };

    let html = `
      <h3>👑 Community Hierarchy</h3>
      <p class="muted" style="margin:10px 0 20px">
        View members, ranks, levels, and community positions.
      </p>

      <div class="card" style="padding:18px;margin-bottom:20px">
        <h3>Rank Guide</h3>
        <p style="margin-top:12px;color:#fbbf24">👑 Owner</p>
        <p style="margin-top:8px;color:#a78bfa">🛡️ Admin</p>
        <p style="margin-top:8px;color:#60a5fa">🔨 Moderator</p>
        <p style="margin-top:8px;color:#4ade80">⭐ VIP</p>
        <p style="margin-top:8px;color:#cbd5e1">👤 Member</p>
      </div>
    `;

    if (!members || members.length === 0) {
      html += "<p>No members found.</p>";
    }

    for (const member of members || []) {
      const role = member.role || "Member";
      const color = rankColors[role] || "#cbd5e1";

      html += `
        <div class="card" style="padding:16px;margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap">
            <div>
              <h3>👤 ${escapeHTML(member.username)}</h3>
              <p class="muted" style="margin-top:6px">
                Level ${escapeHTML(member.level ?? 1)}
                · ${Number(member.coins || 0).toLocaleString()} coins
              </p>
            </div>

            <strong style="color:${color}">
              ${escapeHTML(role)}
            </strong>
          </div>

          ${isAdmin() && !["Owner", "Admin"].includes(role) ? `
            <div style="margin-top:15px">
              <label>Change rank</label>

              <select id="rank-${escapeHTML(member.id)}"
                style="${inputStyle()}">
                <option value="Member" ${role === "Member" ? "selected" : ""}>Member</option>
                <option value="VIP" ${role === "VIP" ? "selected" : ""}>VIP</option>
                <option value="Moderator" ${role === "Moderator" ? "selected" : ""}>Moderator</option>
              </select>

              <button class="primary-btn"
                onclick="changeMemberRank('${member.id}')">
                Save Rank
              </button>
            </div>
          ` : ""}
        </div>
      `;
    }

    container.innerHTML = html;

  } catch (error) {
    container.innerHTML = `
      <div class="card" style="padding:20px">
        <h3 style="color:#ff7777">Hierarchy Error</h3>
        <p style="margin-top:10px">${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}

async function changeMemberRank(memberId) {
  if (!isAdmin()) {
    alert("Only admins can change ranks.");
    return;
  }

  const select = document.getElementById("rank-" + memberId);
  if (!select) return;

  const newRole = select.value;

  if (!["Member", "VIP", "Moderator"].includes(newRole)) {
    alert("Invalid rank.");
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("profiles")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) throw error;

    alert("Member rank updated!");
    await loadHierarchy();

  } catch (error) {
    alert("Could not update rank: " + error.message);
  }
}

// ==========================================
// LIVE COMMUNITY CHAT
// ==========================================

async function loadChat() {
  const container = document.getElementById("page-content");
  if (!container) return;

  container.innerHTML = `
    <div style="padding:10px 0">
      <h3>💬 Community Chat</h3>
      <p class="muted" style="margin-top:8px">
        Talk with other Ultimate Hub members!
      </p>

      <div id="chatMessages" style="
        height:400px;
        overflow-y:auto;
        background:#151515;
        border:1px solid #333;
        border-radius:12px;
        padding:12px;
        margin:15px 0;
      ">
        Loading messages...
      </div>

      <form id="chatForm" style="display:flex;gap:8px;flex-wrap:wrap">
        <input
          id="chatInput"
          type="text"
          maxlength="1000"
          placeholder="Write a message..."
          required
          style="flex:1;min-width:150px;padding:12px;border-radius:8px;"
        >
        <button class="primary-btn" type="submit">Send</button>
      </form>

      <p id="chatStatus" style="margin-top:10px"></p>
    </div>
  `;

  await refreshChat();

  const form = document.getElementById("chatForm");

  form.onsubmit = async event => {
    event.preventDefault();

    const input = document.getElementById("chatInput");
    const status = document.getElementById("chatStatus");
    const message = input.value.trim();

    if (!message) return;

    if (!currentUser) {
      status.textContent = "Please log in first.";
      return;
    }

    status.textContent = "Sending...";

    try {
      const username =
        currentProfile?.username ||
        currentUser.user_metadata?.username ||
        "Member";

      const { error } = await supabaseClient
        .from("chat_messages")
        .insert({
          user_id: currentUser.id,
          username,
          message
        });

      if (error) throw error;

      input.value = "";
      status.textContent = "";

      await refreshChat();

    } catch (error) {
      status.textContent = "Could not send: " + error.message;
    }
  };

  // Live updates when another member sends a message.
  chatChannel = supabaseClient
    .channel("ultimate-hub-chat")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages"
      },
      () => {
        if (currentPage === "Chat") refreshChat();
      }
    )
    .subscribe();

  // Backup refresh in case realtime is unavailable.
  chatRefreshTimer = setInterval(() => {
    if (
      currentPage === "Chat" &&
      document.getElementById("chatMessages")
    ) {
      refreshChat();
    }
  }, 10000);
}

async function refreshChat() {
  const container = document.getElementById("chatMessages");
  if (!container) return;

  const { data, error } = await supabaseClient
    .from("chat_messages")
    .select("id, username, message, created_at")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    container.textContent = "Chat error: " + error.message;
    return;
  }

  const wasNearBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight < 80;

  if (!data || data.length === 0) {
    container.textContent = "No messages yet. Start the conversation!";
    return;
  }

  container.innerHTML = "";

  data.forEach(msg => {
    const item = document.createElement("div");

    item.style.cssText =
      "padding:10px;margin-bottom:8px;background:#222;border-radius:8px;overflow-wrap:anywhere;";

    const name = document.createElement("strong");
    name.textContent = msg.username || "Member";

    const body = document.createElement("p");
    body.textContent = msg.message;
    body.style.margin = "5px 0";

    const time = document.createElement("small");
    time.style.color = "#aaa";
    time.textContent = msg.created_at
      ? new Date(msg.created_at).toLocaleString()
      : "";

    item.append(name, body, time);
    container.appendChild(item);
  });

  if (wasNearBottom) {
    container.scrollTop = container.scrollHeight;
  }
}

// ==========================================
// LOGOUT AND STARTUP
// ==========================================

async function logout() {
  stopChat();

  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  currentUser = null;
  currentProfile = null;
  showAuth();
}

async function startWebsite() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) throw error;

    if (data.session) {
      await loadDashboard();
    } else {
      showAuth();
    }

  } catch (error) {
    app.innerHTML = `
      <div class="card" style="margin:30px;padding:25px">
        <h2>Ultimate Hub Error</h2>
        <p style="color:#ff7777;margin-top:15px">
          ${escapeHTML(error.message)}
        </p>
      </div>
    `;
  }
}

// Make functions available to the website buttons.
window.showPage = showPage;
window.logout = logout;
window.enterGiveaway = enterGiveaway;
window.closeGiveaway = closeGiveaway;
window.drawWinner = drawWinner;
window.changeMemberRank = changeMemberRank;

startWebsite();
