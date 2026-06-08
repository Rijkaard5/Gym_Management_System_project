const API = "/api";
let token = localStorage.getItem("gympro_token");
let currentUser = JSON.parse(localStorage.getItem("gympro_user") || "null");
let allMembers = [],
  allTrainers = [],
  allPayments = [],
  allEquipment = [];

// ============================================================
// ICONS (inline SVG, replaces emoji glyphs)
// ============================================================
const ICONS = {
  dumbbell: '<path d="M6 5v14M18 5v14M3 9v6M21 9v6M6 12h12"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  users:
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  "user-check":
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>',
  calendar:
    '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  "check-square":
    '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  "check-circle":
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  "dollar-sign":
    '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  "credit-card":
    '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  award:
    '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
  monitor:
    '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  "log-out":
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  "trending-up":
    '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  "alert-triangle":
    '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  search:
    '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  edit: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  play: '<polygon points="5 3 19 12 5 21 5 3"/>',
  pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
  "rotate-ccw":
    '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
  target:
    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
};

function icon(name, size = 18) {
  const inner = ICONS[name];
  if (!inner) return "";
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

// ============================================================
// TOAST
// ============================================================
function toast(msg, type = "info") {
  const icons = {
    success: icon("check-circle", 16),
    error: icon("x", 16),
    warning: icon("alert-triangle", 16),
    info: icon("activity", 16),
  };
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  document.getElementById("toast-container").appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ============================================================
// API HELPER
// ============================================================
async function api(method, path, body) {
  try {
    const opts = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (token) opts.headers["Authorization"] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(API + path, opts);
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Request failed");
    return data;
  } catch (e) {
    toast(e.message, "error");
    throw e;
  }
}

// ============================================================
// AUTH
// ============================================================
function switchAuthTab(tab) {
  const subtitles = {
    login: "Sign in to your account",
    register: "Create a new account",
    forgot: "Reset your password",
    reset: "Enter reset details",
  };
  document.getElementById("auth-subtitle").textContent = subtitles[tab] || "";
  ["login", "register", "forgot", "reset"].forEach((t) => {
    document.getElementById(`form-${t}`).classList.add("hidden");
  });
  document.getElementById(`form-${tab}`).classList.remove("hidden");
  document.querySelectorAll(".auth-tab").forEach((el, i) => {
    el.classList.toggle(
      "active",
      (i === 0 && tab === "login") || (i === 1 && tab === "register"),
    );
  });
}

function showForgotPassword() {
  switchAuthTab("forgot");
}

async function doLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  if (!email || !password)
    return toast("Please enter email and password", "warning");
  try {
    const data = await api("POST", "/auth/login", { email, password });
    token = data.token;
    currentUser = data.user;
    localStorage.setItem("gympro_token", token);
    localStorage.setItem("gympro_user", JSON.stringify(currentUser));
    toast(`Welcome back, ${data.user.name}!`, "success");
    initApp();
  } catch (e) {}
}

async function doRegister() {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const phone = document.getElementById("reg-phone").value.trim();
  const password = document.getElementById("reg-password").value;
  if (!name || !email || !password)
    return toast("Name, email and password required", "warning");
  if (password.length < 6)
    return toast("Password must be at least 6 characters", "warning");
  try {
    const data = await api("POST", "/auth/register", {
      name,
      email,
      phone,
      password,
    });
    token = data.token;
    currentUser = data.user;
    localStorage.setItem("gympro_token", token);
    localStorage.setItem("gympro_user", JSON.stringify(currentUser));
    toast(`Account created! Welcome, ${name}`, "success");
    initApp();
  } catch (e) {}
}

async function doForgotPassword() {
  const email = document.getElementById("forgot-email").value.trim();
  if (!email) return toast("Please enter your email", "warning");
  try {
    await api("POST", "/auth/forgot-password", { email });
    toast(
      "Reset token generated! Check the server console (terminal window).",
      "success",
    );
    document.getElementById("reset-email").value = email;
    switchAuthTab("reset");
  } catch (e) {}
}

async function doResetPassword() {
  const email = document.getElementById("reset-email").value.trim();
  const token_val = document.getElementById("reset-token").value.trim();
  const newPassword = document.getElementById("reset-newpwd").value;
  if (!email || !token_val || !newPassword)
    return toast("All fields required", "warning");
  if (newPassword.length < 6)
    return toast("Password must be at least 6 characters", "warning");
  try {
    await api("POST", "/auth/reset-password", {
      email,
      token: token_val,
      newPassword,
    });
    toast("Password reset successful! Please login.", "success");
    switchAuthTab("login");
  } catch (e) {}
}

function doLogout() {
  localStorage.removeItem("gympro_token");
  localStorage.removeItem("gympro_user");
  token = null;
  currentUser = null;
  document.getElementById("app").style.display = "none";
  document.getElementById("auth-screen").style.display = "flex";
  switchAuthTab("login");
  toast("Logged out successfully", "info");
}

// ============================================================
// APP INIT
// ============================================================
function initApp() {
  document.getElementById("auth-screen").style.display = "none";
  document.getElementById("app").style.display = "flex";

  document.getElementById("topbar-name").textContent = currentUser.name;
  document.getElementById("topbar-role").textContent =
    currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
  document.getElementById("user-avatar-btn").textContent = currentUser.name
    .charAt(0)
    .toUpperCase();

  const isAdmin = currentUser.role === "admin";
  const isTrainer = currentUser.role === "trainer";
  const isMember = currentUser.role === "member";
  document
    .querySelectorAll(".admin-only")
    .forEach((el) => el.classList.toggle("hidden", !isAdmin));
  document.querySelectorAll(".trainer-only").forEach((el) => {
    if (!isAdmin) el.classList.toggle("hidden", !isTrainer);
  });
  document
    .querySelectorAll(".member-only")
    .forEach((el) => el.classList.toggle("hidden", !isMember));

  navigate("dashboard");
}

// ============================================================
// NAVIGATION - DYNAMIC PAGE LOADING
// ============================================================
async function navigate(page) {
  // Hide all pages
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));

  // Mark nav item as active
  document.querySelectorAll(".nav-item").forEach((n) => {
    if (
      n.getAttribute("onclick") &&
      n.getAttribute("onclick").includes(`'${page}'`)
    )
      n.classList.add("active");
  });

  let pageEl = document.getElementById(`page-${page}`);

  // Load page dynamically if not already in DOM
  if (!pageEl) {
    try {
      const response = await fetch(`pages/${page}.html`);
      if (!response.ok) throw new Error(`Failed to load page: ${page}`);
      const html = await response.text();
      const container = document.getElementById("pages-container");
      container.innerHTML = html;
      pageEl = document.getElementById(`page-${page}`);
    } catch (e) {
      console.error(`Error loading page ${page}:`, e);
      toast(`Error loading page: ${page}`, "error");
      return;
    }
  }

  // Show page
  if (pageEl) pageEl.classList.add("active");

  // Execute page loader function
  const loaders = {
    dashboard: loadDashboard,
    members: loadMembers,
    trainers: loadTrainers,
    sessions: loadSessions,
    attendance: loadAttendance,
    payments: loadPayments,
    plans: loadPlans,
    equipment: loadEquipment,
    "my-membership": loadMyMembership,
    profile: loadProfile,
    trainer3d: initTrainer3D,
  };
  if (loaders[page]) loaders[page]();
}

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("collapsed");
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDashboard() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  document.getElementById("dashboard-greeting").textContent =
    `${greeting}, ${currentUser.name}! Here's your overview.`;

  try {
    const { data } = await api("GET", "/reports/dashboard");
    const cards = [
      {
        icon: icon("users", 22),
        label: "Active Members",
        value: data.totalMembers,
        color: "#3b82f6",
        change: "+3 this week",
      },
      {
        icon: icon("user-check", 22),
        label: "Trainers",
        value: data.totalTrainers,
        color: "#a855f7",
        change: "On staff",
      },
      {
        icon: icon("check-circle", 22),
        label: "Today's Check-ins",
        value: data.todayAttendance,
        color: "#22c55e",
        change: "Live count",
      },
      {
        icon: icon("dollar-sign", 22),
        label: "Monthly Revenue",
        value: "$" + data.monthlyRevenue.toFixed(2),
        color: "#f97316",
        change: "This month",
      },
      {
        icon: icon("calendar", 22),
        label: "Active Sessions",
        value: data.activeSessions,
        color: "#06b6d4",
        change: "Scheduled",
      },
      {
        icon: icon("alert-triangle", 22),
        label: "Expiring Soon",
        value: data.expiringMemberships,
        color: "#eab308",
        change: "In 7 days",
      },
      {
        icon: icon("settings", 22),
        label: "Equipment",
        value: data.totalEquipment,
        color: "#ec4899",
        change: "In inventory",
      },
      {
        icon: icon("trending-up", 22),
        label: "Total Revenue",
        value: "$" + data.totalRevenue.toFixed(2),
        color: "#22c55e",
        change: "All time",
      },
    ];

    const cardsEl = document.getElementById("stat-cards");
    cardsEl.innerHTML = cards
      .map(
        (c) => `
      <div class="stat-card">
        <div class="stat-icon" style="background:${c.color}22;font-size:22px;">${c.icon}</div>
        <div class="stat-value" style="color:${c.color};">${c.value}</div>
        <div class="stat-label">${c.label}</div>
        <div class="stat-change text-muted">${c.change}</div>
      </div>
    `,
      )
      .join("");

    const maxRev = Math.max(...data.revenueByMonth.map((r) => r.revenue), 1);
    document.getElementById("revenue-chart").innerHTML = data.revenueByMonth
      .map(
        (r) => `
      <div class="chart-bar-wrap">
        <div class="chart-bar-val">$${r.revenue}</div>
        <div class="chart-bar" style="height:${Math.max((r.revenue / maxRev) * 140, 4)}px;" title="${r.month}: $${r.revenue}"></div>
        <div class="chart-bar-label">${r.month}</div>
      </div>
    `,
      )
      .join("");

    const rmEl = document.getElementById("recent-members-list");
    if (!data.recentMembers?.length) {
      rmEl.innerHTML = '<p class="text-muted text-sm p-3">No members yet.</p>';
    } else {
      rmEl.innerHTML = data.recentMembers
        .map(
          (m) => `
        <div class="flex items-center gap-3 p-2 rounded" style="border-bottom:1px solid var(--border2);">
          <div class="avatar-circle">${(m.name || "?").charAt(0)}</div>
          <div style="flex:1;"><div style="font-size:13px;font-weight:500;">${m.name || "Unknown"}</div>
          <div class="text-xs text-muted">${m.planName} · ${m.status}</div></div>
          <span class="badge badge-${m.status === "active" ? "green" : "red"}">${m.status}</span>
        </div>
      `,
        )
        .join("");
    }

    const eqRes = await api("GET", "/equipment");
    const eqEl = document.getElementById("equipment-status-list");
    eqEl.innerHTML = eqRes.data
      .slice(0, 5)
      .map((e) => {
        const colors = {
          excellent: "var(--green)",
          good: "var(--green)",
          fair: "#eab308",
          poor: "var(--red)",
          out_of_order: "var(--red)",
        };
        return `<div class="flex items-center justify-between p-2" style="border-bottom:1px solid var(--border2);">
        <span style="font-size:13px;">${e.name}</span>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted">Qty: ${e.quantity}</span>
          <span style="font-size:11px;color:${colors[e.conditionStatus] || "var(--text2)"};">${e.conditionStatus}</span>
        </div>
      </div>`;
      })
      .join("");

    const sessRes = await api("GET", "/sessions");
    const sessEl = document.getElementById("upcoming-sessions-list");
    const upcoming = sessRes.data
      .filter((s) => s.status === "scheduled")
      .slice(0, 5);
    if (!upcoming.length) {
      sessEl.innerHTML =
        '<p class="text-muted text-sm p-3">No upcoming sessions.</p>';
    } else {
      sessEl.innerHTML = upcoming
        .map(
          (s) => `
        <div class="flex items-center justify-between p-2" style="border-bottom:1px solid var(--border2);">
          <div>
            <div class="text-sm font-medium">Member #${s.memberId} × Trainer #${s.trainerId}</div>
            <div class="text-xs text-muted">${s.date} at ${s.startTime}</div>
          </div>
          <span class="badge badge-blue">Scheduled</span>
        </div>
      `,
        )
        .join("");
    }
  } catch (e) {}
}

// ============================================================
// MEMBERS
// ============================================================
async function loadMembers() {
  const tbody = document.getElementById("members-tbody");
  tbody.innerHTML =
    '<tr><td colspan="6" class="text-center p-4"><div class="loader"></div></td></tr>';
  try {
    const { data } = await api("GET", "/members");
    allMembers = data;
    renderMembersTable(data);
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted p-4">Failed to load members</td></tr>';
  }
}

function renderMembersTable(data) {
  const tbody = document.getElementById("members-tbody");
  if (!data.length) {
    tbody.innerHTML =
      `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">${icon("users", 36)}</div>No members found</div></td></tr>`;
    return;
  }
  tbody.innerHTML = data
    .map(
      (m) => `
    <tr>
      <td>
        <div class="flex items-center gap-2">
          <div class="avatar-circle" style="width:32px;height:32px;font-size:12px;">${(m.name || "?").charAt(0)}</div>
          <div>
            <div style="font-weight:500;font-size:13px;">${m.name || "N/A"}</div>
            <div class="text-xs text-muted">${m.email || ""}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-blue">${m.planName}</span></td>
      <td class="text-sm text-muted">${m.joinDate || ""}</td>
      <td class="text-sm">${m.expiryDate || ""}</td>
      <td><span class="badge badge-${m.status === "active" ? "green" : m.status === "frozen" ? "yellow" : "red"}">${m.status}</span></td>
      <td>
        <div class="flex gap-2">
          <button class="btn btn-sm btn-secondary" onclick="editMember(${m.id})">${icon("edit", 14)}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteMember(${m.id})">${icon("trash", 14)}</button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");
}

function filterMembers(q) {
  const f = allMembers.filter((m) =>
    [m.name, m.email, m.planName].some((v) =>
      (v || "").toLowerCase().includes(q.toLowerCase()),
    ),
  );
  renderMembersTable(f);
}

function filterMembersByStatus(status) {
  const f = status ? allMembers.filter((m) => m.status === status) : allMembers;
  renderMembersTable(f);
}

async function addMember() {
  const name = document.getElementById("m-name").value.trim();
  const email = document.getElementById("m-email").value.trim();
  const phone = document.getElementById("m-phone").value.trim();
  const password = document.getElementById("m-password").value;
  const planId = parseInt(document.getElementById("m-plan").value);
  const emergencyContact = document.getElementById("m-emergency").value.trim();
  const healthNotes = document.getElementById("m-health").value.trim();
  if (!name || !email || !password)
    return toast("Name, email and password are required", "warning");
  try {
    await api("POST", "/members", {
      name,
      email,
      phone,
      password,
      planId,
      emergencyContact,
      healthNotes,
    });
    toast(`Member ${name} added!`, "success");
    closeModal();
    loadMembers();
  } catch (e) {}
}

async function editMember(id) {
  const m = allMembers.find((m) => m.id === id);
  if (!m) return;
  const status = prompt(
    `Change status for ${m.name}?
Current: ${m.status}
Options: active, inactive, frozen`,
    m.status,
  );
  if (status && ["active", "inactive", "frozen"].includes(status)) {
    try {
      await api("PUT", `/members/${id}`, { status });
      toast("Member updated", "success");
      loadMembers();
    } catch (e) {}
  }
}

async function deleteMember(id) {
  const m = allMembers.find((m) => m.id === id);
  if (!confirm(`Remove member ${m?.name}? This cannot be undone.`)) return;
  try {
    await api("DELETE", `/members/${id}`);
    toast("Member removed", "success");
    loadMembers();
  } catch (e) {}
}

// ============================================================
// TRAINERS
// ============================================================
async function loadTrainers() {
  try {
    const { data } = await api("GET", "/trainers");
    allTrainers = data;
    const grid = document.getElementById("trainers-grid");
    if (!data.length) {
      grid.innerHTML =
        `<div class="empty-state"><div class="empty-icon">${icon("user-check", 36)}</div>No trainers found</div>`;
      return;
    }
    grid.innerHTML = data
      .map(
        (t) => `
      <div class="card">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <div class="avatar-circle" style="width:48px;height:48px;font-size:18px;">${(t.name || "?").charAt(0)}</div>
          <div>
            <div class="font-semibold">${t.name || "N/A"}</div>
            <div class="text-xs text-muted">${t.email || ""}</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-3">
          <div class="trainer-stat" style="padding:10px;"><div style="font-size:16px;font-weight:700;color:var(--accent);">${t.experienceYears || 0}y</div><div class="label">Experience</div></div>
          <div class="trainer-stat" style="padding:10px;"><div style="font-size:16px;font-weight:700;color:var(--green);">$${t.hourlyRate || 0}</div><div class="label">Hourly</div></div>
        </div>
        <div class="mb-2"><span class="badge badge-purple">${t.speciality || "General"}</span></div>
        <div class="text-xs text-muted mb-3">${t.certification || "No certification listed"}</div>
        <p class="text-sm text-muted" style="font-style:italic;">${t.bio || ""}</p>
        ${currentUser.role === "admin" ? `<div class="flex gap-2 mt-3"><button class="btn btn-sm btn-danger w-full" onclick="deleteTrainer(${t.id})">Remove Trainer</button></div>` : ""}
      </div>
    `,
      )
      .join("");
  } catch (e) {}
}

async function addTrainer() {
  const name = document.getElementById("t-name").value.trim();
  const email = document.getElementById("t-email").value.trim();
  const phone = document.getElementById("t-phone").value.trim();
  const password = document.getElementById("t-password").value;
  const speciality = document.getElementById("t-spec").value.trim();
  const experienceYears = parseInt(document.getElementById("t-exp").value) || 0;
  const certification = document.getElementById("t-cert").value.trim();
  const hourlyRate = parseFloat(document.getElementById("t-rate").value) || 0;
  const bio = document.getElementById("t-bio").value.trim();
  if (!name || !email || !password)
    return toast("Name, email and password required", "warning");
  try {
    await api("POST", "/trainers", {
      name,
      email,
      phone,
      password,
      speciality,
      experienceYears,
      certification,
      hourlyRate,
      bio,
    });
    toast(`Trainer ${name} added!`, "success");
    closeModal();
    loadTrainers();
  } catch (e) {}
}

async function deleteTrainer(id) {
  if (!confirm("Remove this trainer?")) return;
  try {
    await api("DELETE", `/trainers/${id}`);
    toast("Trainer removed", "success");
    loadTrainers();
  } catch (e) {}
}

// ============================================================
// SESSIONS
// ============================================================
async function loadSessions() {
  try {
    const { data } = await api("GET", "/sessions");
    const tbody = document.getElementById("sessions-tbody");
    if (!data.length) {
      tbody.innerHTML =
        `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">${icon("calendar", 36)}</div>No sessions booked</div></td></tr>`;
      return;
    }
    const statusColors = {
      scheduled: "blue",
      confirmed: "green",
      completed: "purple",
      cancelled: "red",
      no_show: "red",
    };
    tbody.innerHTML = data
      .map(
        (s) => `
      <tr>
        <td class="text-muted text-sm">#${s.id}</td>
        <td class="text-sm">Member #${s.memberId}</td>
        <td class="text-sm">Trainer #${s.trainerId}</td>
        <td class="text-sm">${s.date}</td>
        <td class="text-sm">${s.startTime || ""} - ${s.endTime || ""}</td>
        <td><span class="badge badge-${statusColors[s.status] || "blue"}">${s.status}</span></td>
        <td><button class="btn btn-sm btn-danger" onclick="cancelSession(${s.id})">Cancel</button></td>
      </tr>
    `,
      )
      .join("");
  } catch (e) {}
}

async function addSession() {
  const memberId = parseInt(document.getElementById("s-member").value);
  const trainerId = parseInt(document.getElementById("s-trainer").value);
  const date = document.getElementById("s-date").value;
  const startTime = document.getElementById("s-time").value;
  const endTime = document.getElementById("s-endtime").value;
  const notes = document.getElementById("s-notes").value;
  if (!date || !startTime)
    return toast("Date and start time required", "warning");
  try {
    await api("POST", "/sessions", {
      memberId,
      trainerId,
      date,
      startTime,
      endTime,
      notes,
    });
    toast("Session booked!", "success");
    closeModal();
    loadSessions();
  } catch (e) {}
}

async function cancelSession(id) {
  if (!confirm("Cancel this session?")) return;
  try {
    await api("DELETE", `/sessions/${id}`);
    toast("Session cancelled", "info");
    loadSessions();
  } catch (e) {}
}

// ============================================================
// ATTENDANCE
// ============================================================
async function loadAttendance() {
  try {
    const { data } = await api("GET", "/attendance");
    const tbody = document.getElementById("attendance-tbody");
    const today = data.filter(
      (a) => new Date(a.checkIn).toDateString() === new Date().toDateString(),
    );
    if (!today.length) {
      tbody.innerHTML =
        `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">${icon("check-circle", 36)}</div>No check-ins today</div></td></tr>`;
      return;
    }
    tbody.innerHTML = today
      .map((a) => {
        const duration = a.checkOut
          ? Math.round((new Date(a.checkOut) - new Date(a.checkIn)) / 60000) +
            " min"
          : "Still in";
        return `<tr>
        <td class="text-sm">Member #${a.memberId}</td>
        <td class="text-sm">${new Date(a.checkIn).toLocaleTimeString()}</td>
        <td class="text-sm">${a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '<span class="badge badge-green">Active</span>'}</td>
        <td class="text-sm">${duration}</td>
        <td class="text-sm text-muted">${a.method}</td>
      </tr>`;
      })
      .join("");
  } catch (e) {}
}

async function checkIn() {
  const memberId = parseInt(document.getElementById("ci-member").value);
  const method = document.getElementById("ci-method").value;
  if (!memberId) return toast("Member ID required", "warning");
  try {
    await api("POST", "/attendance/check-in", { memberId, method });
    toast("Checked in!", "success");
    closeModal();
    loadAttendance();
  } catch (e) {}
}

// ============================================================
// PAYMENTS
// ============================================================
async function loadPayments() {
  try {
    const { data } = await api("GET", "/payments");
    allPayments = data;
    const completed = data.filter((p) => p.status === "completed");
    const total = completed.reduce((s, p) => s + (p.amount || 0), 0);
    const thisMonth = completed
      .filter((p) => {
        const d = new Date(p.paymentDate);
        return (
          d.getMonth() === new Date().getMonth() &&
          d.getFullYear() === new Date().getFullYear()
        );
      })
      .reduce((s, p) => s + (p.amount || 0), 0);
    document.getElementById("total-rev").textContent = "$" + total.toFixed(2);
    document.getElementById("month-rev").textContent =
      "$" + thisMonth.toFixed(2);
    document.getElementById("total-txn").textContent = completed.length;

    const tbody = document.getElementById("payments-tbody");
    if (!data.length) {
      tbody.innerHTML =
        `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">${icon("credit-card", 36)}</div>No payments yet</div></td></tr>`;
      return;
    }
    tbody.innerHTML = [...data]
      .reverse()
      .map(
        (p) => `
      <tr>
        <td class="text-sm font-medium text-blue">${p.receiptNumber || "—"}</td>
        <td class="text-sm">Member #${p.memberId}</td>
        <td class="text-sm text-muted">${p.planName || "—"}</td>
        <td class="font-bold text-green">$${(p.amount || 0).toFixed(2)}</td>
        <td class="text-sm text-muted">${p.paymentMethod || "cash"}</td>
        <td class="text-sm text-muted">${new Date(p.paymentDate).toLocaleDateString()}</td>
        <td><span class="badge badge-${p.status === "completed" ? "green" : p.status === "pending" ? "yellow" : "red"}">${p.status}</span></td>
      </tr>
    `,
      )
      .join("");
  } catch (e) {}
}

async function addPayment() {
  const memberId = parseInt(document.getElementById("p-member").value);
  const amount = parseFloat(document.getElementById("p-amount").value);
  const planName = document.getElementById("p-plan").value;
  const paymentMethod = document.getElementById("p-method").value;
  if (!memberId || !amount)
    return toast("Member ID and amount required", "warning");
  try {
    await api("POST", "/payments", {
      memberId,
      amount,
      planName,
      paymentMethod,
    });
    toast("Payment recorded!", "success");
    closeModal();
    loadPayments();
  } catch (e) {}
}

// ============================================================
// PLANS
// ============================================================
let allPlans = [];

async function loadPlans() {
  try {
    const { data } = await api("GET", "/plans");
    allPlans = data;
    const isAdmin = currentUser.role === "admin";
    const isMember = currentUser.role === "member";
    const addBtn = document.getElementById("add-plan-btn");
    if (addBtn) addBtn.classList.toggle("hidden", !isAdmin);
    const icons = [
      icon("award", 32),
      icon("star", 32),
      icon("trending-up", 32),
      icon("shield", 32),
    ];
    const colors = [
      "var(--blue)",
      "var(--accent)",
      "var(--purple)",
      "var(--accent3)",
    ];
    document.getElementById("plans-grid").innerHTML = data
      .map(
        (p, i) => `
      <div class="card" style="border-top:3px solid ${colors[i % 4]};">
        <div style="font-size:32px;margin-bottom:8px;">${icons[i % 4]}</div>
        <div class="font-bold text-lg mb-1">${p.name}</div>
        <div style="font-size:32px;font-weight:800;color:${colors[i % 4]};margin-bottom:4px;">$${p.price}</div>
        <div class="text-sm text-muted mb-4">${p.durationDays} days / ${p.type}</div>
        <div>${(p.features || []).map((f) => `<div class="flex items-center gap-2 text-sm mb-1"><span style="color:var(--green);">${icon("check", 14)}</span>${f}</div>`).join("")}</div>
        ${
          isAdmin
            ? `<div class="flex gap-2 mt-4">
                <button class="btn btn-secondary btn-sm" onclick="openEditPlan(${p.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deletePlan(${p.id})">Delete</button>
              </div>`
            : isMember
              ? `<button class="btn btn-primary mt-4" style="width:100%;" onclick="bookPlan(${p.id})">Book This Plan</button>`
              : ""
        }
      </div>
    `,
      )
      .join("");
  } catch (e) {}
}

function openAddPlan() {
  document.getElementById("plan-modal-title").textContent = "Add Plan";
  document.getElementById("plan-id").value = "";
  document.getElementById("plan-name").value = "";
  document.getElementById("plan-type").value = "basic";
  document.getElementById("plan-price").value = "";
  document.getElementById("plan-duration").value = "30";
  document.getElementById("plan-features").value = "";
  openModal("add-plan");
}

function openEditPlan(id) {
  const plan = allPlans.find((p) => p.id === id);
  if (!plan) return;
  document.getElementById("plan-modal-title").textContent = "Edit Plan";
  document.getElementById("plan-id").value = plan.id;
  document.getElementById("plan-name").value = plan.name;
  document.getElementById("plan-type").value = plan.type;
  document.getElementById("plan-price").value = plan.price;
  document.getElementById("plan-duration").value = plan.durationDays;
  document.getElementById("plan-features").value = (plan.features || []).join(
    "\n",
  );
  openModal("add-plan");
}

async function savePlan() {
  const id = document.getElementById("plan-id").value;
  const name = document.getElementById("plan-name").value.trim();
  const type = document.getElementById("plan-type").value;
  const price = parseFloat(document.getElementById("plan-price").value) || 0;
  const durationDays =
    parseInt(document.getElementById("plan-duration").value) || 30;
  const features = document
    .getElementById("plan-features")
    .value.split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
  if (!name) return toast("Plan name required", "warning");
  try {
    if (id) {
      await api("PUT", `/plans/${id}`, { name, type, price, durationDays, features });
      toast("Plan updated!", "success");
    } else {
      await api("POST", "/plans", { name, type, price, durationDays, features });
      toast("Plan created!", "success");
    }
    closeModal();
    loadPlans();
  } catch (e) {}
}

async function deletePlan(id) {
  if (!confirm("Remove this plan?")) return;
  try {
    await api("DELETE", `/plans/${id}`);
    toast("Plan removed", "success");
    loadPlans();
  } catch (e) {}
}

async function bookPlan(id) {
  const plan = allPlans.find((p) => p.id === id);
  if (!plan) return;
  if (!confirm(`Book the "${plan.name}" plan for $${plan.price}?`)) return;
  try {
    await api("POST", "/members/me/plan", { planId: id });
    toast(`You're now on the ${plan.name} plan!`, "success");
    navigate("my-membership");
  } catch (e) {}
}

// ============================================================
// EQUIPMENT
// ============================================================
async function loadEquipment() {
  try {
    const { data } = await api("GET", "/equipment");
    allEquipment = data;
    const tbody = document.getElementById("equipment-tbody");
    const condColors = {
      excellent: "green",
      good: "green",
      fair: "yellow",
      poor: "red",
      out_of_order: "red",
    };
    tbody.innerHTML = data
      .map(
        (e) => `
      <tr>
        <td class="font-medium text-sm">${e.name}</td>
        <td class="text-sm text-muted">${e.type || "—"}</td>
        <td class="text-sm">${e.brand || "—"}</td>
        <td class="text-sm text-center">${e.quantity}</td>
        <td><span class="badge badge-${condColors[e.conditionStatus] || "blue"}">${e.conditionStatus}</span></td>
        <td class="text-sm text-muted">${e.nextMaintenance || "—"}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteEquipment(${e.id})">${icon("trash", 14)}</button>
        </td>
      </tr>
    `,
      )
      .join("");
  } catch (e) {}
}

async function addEquipment() {
  const name = document.getElementById("eq-name").value.trim();
  const type = document.getElementById("eq-type").value.trim();
  const brand = document.getElementById("eq-brand").value.trim();
  const quantity = parseInt(document.getElementById("eq-qty").value) || 1;
  const conditionStatus = document.getElementById("eq-condition").value;
  const nextMaintenance = document.getElementById("eq-maint").value;
  if (!name) return toast("Equipment name required", "warning");
  try {
    await api("POST", "/equipment", {
      name,
      type,
      brand,
      quantity,
      conditionStatus,
      nextMaintenance,
    });
    toast("Equipment added!", "success");
    closeModal();
    loadEquipment();
  } catch (e) {}
}

async function deleteEquipment(id) {
  if (!confirm("Remove this equipment?")) return;
  try {
    await api("DELETE", `/equipment/${id}`);
    toast("Equipment removed", "success");
    loadEquipment();
  } catch (e) {}
}

// ============================================================
// MY MEMBERSHIP
// ============================================================
async function loadMyMembership() {
  try {
    const { data: members } = await api("GET", "/members");
    const mine = members.find(
      (m) => m.userId === currentUser.id || m.email === currentUser.email,
    );
    const card = document.getElementById("my-membership-card");
    if (!mine) {
      card.innerHTML =
        `<div class="empty-state"><div class="empty-icon">${icon("award", 36)}</div>No membership found. Contact admin.</div>`;
    } else {
      const daysLeft = Math.ceil(
        (new Date(mine.expiryDate) - new Date()) / 86400000,
      );
      const progress = Math.max(0, Math.min(100, (daysLeft / 30) * 100));
      card.innerHTML = `
        <div class="card-header"><span class="card-title">${icon("award", 36)} ${mine.planName}</span><span class="badge badge-${mine.status === "active" ? "green" : "red"}">${mine.status}</span></div>
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="trainer-stat" style="padding:12px;"><div class="value" style="font-size:20px;">${mine.joinDate}</div><div class="label">Join Date</div></div>
          <div class="trainer-stat" style="padding:12px;"><div class="value" style="font-size:20px;${daysLeft < 7 ? "color:var(--red)" : ""}">${daysLeft}d</div><div class="label">Days Left</div></div>
        </div>
        <div class="mb-3">
          <div class="flex justify-between text-sm mb-1"><span class="text-muted">Membership progress</span><span>${daysLeft} days remaining</span></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${progress}%;"></div></div>
        </div>
        <div class="text-sm text-muted">Expires: ${mine.expiryDate}</div>
        ${mine.emergencyContact ? `<div class="mt-3 text-sm"><span class="text-muted">Emergency Contact:</span> ${mine.emergencyContact}</div>` : ""}
      `;
    }
    const { data: plans } = await api("GET", "/plans");
    allPlans = plans;
    document.getElementById("upgrade-plans").innerHTML = plans
      .map(
        (p) => `
      <div class="flex items-center justify-between p-3 rounded mb-2" style="background:var(--bg3);border:1px solid var(--border);">
        <div>
          <div class="font-medium text-sm">${p.name}</div>
          <div class="text-xs text-muted">${p.durationDays} days</div>
        </div>
        <div class="flex items-center gap-3">
          <span class="font-bold text-accent">$${p.price}</span>
          <button class="btn btn-primary btn-sm" onclick="bookPlan(${p.id})">${mine && mine.planId === p.id ? "Renew" : "Switch"}</button>
        </div>
      </div>
    `,
      )
      .join("");
  } catch (e) {}
}

// ============================================================
// PROFILE
// ============================================================
async function loadProfile() {
  const info = document.getElementById("profile-info");
  info.innerHTML = `
    <div class="flex items-center gap-4 mb-4">
      <div class="user-avatar" style="width:64px;height:64px;font-size:28px;">${currentUser.name.charAt(0)}</div>
      <div>
        <div class="font-bold text-xl">${currentUser.name}</div>
        <div class="text-muted">${currentUser.email}</div>
        <span class="badge badge-${currentUser.role === "admin" ? "red" : currentUser.role === "trainer" ? "blue" : "green"} mt-2">${currentUser.role}</span>
      </div>
    </div>
    <div class="form-group"><label>Name</label><input class="form-control" value="${currentUser.name}" readonly/></div>
    <div class="form-group"><label>Email</label><input class="form-control" value="${currentUser.email}" readonly/></div>
    <div class="form-group"><label>Phone</label><input class="form-control" value="${currentUser.phone || "—"}" readonly/></div>
    <div class="form-group"><label>Role</label><input class="form-control" value="${currentUser.role}" readonly/></div>
  `;
}

async function changePassword() {
  const currentPassword = document.getElementById("cp-current").value;
  const newPassword = document.getElementById("cp-new").value;
  const confirm = document.getElementById("cp-confirm").value;
  if (!currentPassword || !newPassword)
    return toast("All fields required", "warning");
  if (newPassword !== confirm)
    return toast("New passwords do not match", "warning");
  if (newPassword.length < 6)
    return toast("Password must be at least 6 characters", "warning");
  try {
    await api("POST", "/auth/change-password", {
      currentPassword,
      newPassword,
    });
    toast("Password updated successfully!", "success");
    document.getElementById("cp-current").value = "";
    document.getElementById("cp-new").value = "";
    document.getElementById("cp-confirm").value = "";
  } catch (e) {}
}

// ============================================================
// MODALS
// ============================================================
function openModal(name) {
  document.getElementById("modal-overlay").classList.remove("hidden");
  document.querySelectorAll(".modal").forEach((m) => m.classList.add("hidden"));
  const m = document.getElementById(`modal-${name}`);
  if (m) m.classList.remove("hidden");
}

function closeModal(e) {
  if (e && e.target !== document.getElementById("modal-overlay")) return;
  document.getElementById("modal-overlay").classList.add("hidden");
  document.querySelectorAll(".modal").forEach((m) => m.classList.add("hidden"));
}

// ============================================================
// GLOBAL SEARCH
// ============================================================
function globalSearch(q) {
  if (!q.trim()) return;
  if (allMembers.length) filterMembers(q);
}

// ============================================================
// 3D VIRTUAL TRAINER
// ============================================================
let trainerAnim = null;
let isPlaying = false;
let speedMultiplier = 1;
let reps = 0,
  sets = 0,
  calories = 0;
let currentExercise = "squat";
let animFrame = 0;
let sessionInterval = null;

const exercises = {
  squat: {
    name: "Squat",
    muscle: ["Quadriceps", "Glutes", "Hamstrings"],
    cal: 8,
    speech: [
      "Great form! Keep your back straight!",
      "Feel the burn in your quads!",
      "Push through your heels!",
      "Chest up, core tight!",
      "You're crushing it!",
    ],
    color: "#f97316",
  },
  pushup: {
    name: "Push-Up",
    muscle: ["Chest", "Triceps", "Shoulders"],
    cal: 7,
    speech: [
      "Full range of motion!",
      "Lock out those elbows!",
      "Core tight, don't sag!",
      "Strong push!",
      "Perfect form!",
    ],
    color: "#3b82f6",
  },
  curl: {
    name: "Bicep Curl",
    muscle: ["Biceps", "Forearms"],
    cal: 5,
    speech: [
      "Slow on the way down!",
      "Feel the peak contraction!",
      "Control the weight!",
      "Squeeze at the top!",
      "Great isolation!",
    ],
    color: "#a855f7",
  },
  lunge: {
    name: "Lunge",
    muscle: ["Quadriceps", "Glutes", "Calves"],
    cal: 9,
    speech: [
      "Step wide, sink deep!",
      "Back knee nearly touches!",
      "Drive through the front heel!",
      "Balance and power!",
      "Excellent!",
    ],
    color: "#22c55e",
  },
  plank: {
    name: "Plank Hold",
    muscle: ["Core", "Abs", "Back"],
    cal: 4,
    speech: [
      "Straight line head to heels!",
      "Breathe steadily!",
      "Engage that core!",
      "Don't let those hips drop!",
      "Strong hold!",
    ],
    color: "#06b6d4",
  },
  jumpjack: {
    name: "Jumping Jacks",
    muscle: ["Full Body", "Cardio"],
    cal: 12,
    speech: [
      "Keep up the energy!",
      "Breathe in rhythm!",
      "High knees, wide arms!",
      "You're flying!",
      "Cardio king!",
    ],
    color: "#ec4899",
  },
};

function initTrainer3D() {
  const canvas = document.getElementById("trainer-canvas");
  if (!canvas) return;
  const wrap = document.getElementById("trainer-canvas-wrap");
  canvas.width = wrap.offsetWidth || 480;
  canvas.height = canvas.width * 0.9;

  const btns = document.getElementById("exercise-buttons");
  if (btns) {
    btns.innerHTML = Object.entries(exercises)
      .map(
        ([k, v]) => `
      <div class="exercise-btn ${k === currentExercise ? "active" : ""}" id="ebtn-${k}" onclick="selectExercise('${k}')">
        <div style="margin-bottom:4px;">${icon("activity", 20)}</div>
        <div>${v.name}</div>
      </div>
    `,
      )
      .join("");
  }

  updateMuscleTargets();
  drawTrainer(canvas);
}

function selectExercise(ex) {
  currentExercise = ex;
  document
    .querySelectorAll(".exercise-btn")
    .forEach((b) => b.classList.remove("active"));
  const btn = document.getElementById(`ebtn-${ex}`);
  if (btn) btn.classList.add("active");
  updateMuscleTargets();
  animFrame = 0;
  speak(exercises[ex].speech[0]);
}

function updateMuscleTargets() {
  const el = document.getElementById("muscle-targets");
  if (!el) return;
  const ex = exercises[currentExercise];
  el.innerHTML = `<div class="text-sm font-medium mb-2 flex items-center gap-1">${icon("target", 14)} Target Muscles</div><div>${(ex.muscle || []).map((m) => `<span class="tag">${m}</span>`).join("")}</div>`;
}

function speak(text) {
  const el = document.getElementById("trainer-speech");
  if (el) el.innerHTML = `${icon("monitor", 14)} "${text}"`;
}

function startSession() {
  if (isPlaying) return;
  isPlaying = true;
  speak(exercises[currentExercise].speech[Math.floor(Math.random() * 5)]);
  const canvas = document.getElementById("trainer-canvas");
  if (!canvas) return;

  function animate() {
    if (!isPlaying) return;
    animFrame += 0.04 * speedMultiplier;
    drawTrainer(canvas);
    requestAnimationFrame(animate);
  }
  animate();

  sessionInterval = setInterval(() => {
    if (!isPlaying) return;
    reps++;
    calories += exercises[currentExercise].cal / 10;
    if (reps % 10 === 0) {
      sets++;
      speak(
        exercises[currentExercise].speech[
          sets % exercises[currentExercise].speech.length
        ],
      );
    }
    document.getElementById("t-reps").textContent = reps;
    document.getElementById("t-sets").textContent = sets;
    document.getElementById("t-cal").textContent = Math.round(calories);
  }, 600 / speedMultiplier);
}

function pauseSession() {
  isPlaying = false;
  clearInterval(sessionInterval);
  speak("Good pause. Rest and breathe!");
}

function resetSession() {
  isPlaying = false;
  clearInterval(sessionInterval);
  reps = 0;
  sets = 0;
  calories = 0;
  animFrame = 0;
  document.getElementById("t-reps").textContent = "0";
  document.getElementById("t-sets").textContent = "0";
  document.getElementById("t-cal").textContent = "0";
  const canvas = document.getElementById("trainer-canvas");
  if (canvas) drawTrainer(canvas);
  speak("Ready to start fresh. Pick your exercise!");
}

function setSpeed(v) {
  speedMultiplier = parseFloat(v);
  if (isPlaying) {
    pauseSession();
    startSession();
  }
}

function drawTrainer(canvas) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width,
    H = canvas.height;
  const cx = W / 2;
  const t = animFrame;
  const ex = exercises[currentExercise];
  const accentColor = ex.color;

  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(cx, H * 0.5, 10, cx, H * 0.5, H * 0.6);
  bg.addColorStop(0, "#1a1f2e");
  bg.addColorStop(1, "#0d1117");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, H * 0.75);
    ctx.lineTo(cx + (i - cx) * 2, H);
    ctx.stroke();
  }
  for (let j = 0; j < 5; j++) {
    const y = H * 0.75 + j * 12;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const shadowY = H * 0.74;
  const grd = ctx.createRadialGradient(cx, shadowY, 5, cx, shadowY, 50);
  grd.addColorStop(0, "rgba(0,0,0,0.5)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(cx - 60, shadowY - 10, 120, 20);

  const glow = ctx.createRadialGradient(cx, H * 0.45, 10, cx, H * 0.45, 120);
  glow.addColorStop(0, accentColor + "18");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 140, H * 0.15, 280, H * 0.65);

  let pose = computePose(currentExercise, t, H);

  drawStickFigure(ctx, cx, pose, accentColor, W, H);

  if (isPlaying) {
    drawParticles(ctx, cx, pose, accentColor, t);
  }

  ctx.fillStyle = accentColor;
  ctx.font = `bold ${Math.round(W * 0.036)}px Segoe UI, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(ex.name.toUpperCase(), cx, 36);

  if (isPlaying) {
    const pulse = Math.sin(t * 4) * 0.5 + 0.5;
    ctx.strokeStyle = accentColor;
    ctx.globalAlpha = pulse * 0.5;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, 36, 40 + pulse * 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function computePose(exercise, t, H) {
  const base = H * 0.62;
  const scale = H / 500;
  const s = scale;

  switch (exercise) {
    case "squat": {
      const squat = Math.sin(t) * 0.5 + 0.5;
      const kneeAngle = squat * 0.8;
      const hipDrop = squat * 60 * s;
      return {
        headY: base - 200 * s + hipDrop,
        shoulderY: base - 160 * s + hipDrop,
        hipY: base - 90 * s + hipDrop,
        kneeRY: base - 40 * s + hipDrop * 0.3,
        kneeLY: base - 40 * s + hipDrop * 0.3,
        footRY: base,
        footLY: base,
        kneeRX: 30 * s,
        kneeLX: -30 * s,
        footRX: 32 * s,
        footLX: -32 * s,
        handRX: 20 * s,
        handLX: -20 * s,
        handRY: base - 120 * s + hipDrop,
        handLY: base - 120 * s + hipDrop,
        lean: 0,
      };
    }
    case "pushup": {
      const phase = Math.sin(t) * 0.5 + 0.5;
      const pushDrop = phase * 40 * s;
      const bodyY = H * 0.62 - 40 * s;
      return {
        headY: bodyY - 20 * s + pushDrop,
        shoulderY: bodyY + pushDrop,
        hipY: bodyY + 80 * s,
        kneeRY: bodyY + 110 * s,
        kneeLY: bodyY + 110 * s,
        footRY: bodyY + 140 * s,
        footLY: bodyY + 140 * s,
        kneeRX: 60 * s,
        kneeLX: 60 * s,
        footRX: 70 * s,
        footLX: 70 * s,
        handRX: 70 * s,
        handLX: -70 * s,
        handRY: bodyY + pushDrop + 30 * s,
        handLY: bodyY + pushDrop + 30 * s,
        lean: 0,
        horizontal: true,
      };
    }
    case "curl": {
      const curl = Math.sin(t) * 0.5 + 0.5;
      return {
        headY: base - 200 * s,
        shoulderY: base - 160 * s,
        hipY: base - 90 * s,
        kneeRY: base - 50 * s,
        kneeLY: base - 50 * s,
        footRY: base,
        footLY: base,
        kneeRX: 10 * s,
        kneeLX: -10 * s,
        footRX: 12 * s,
        footLX: -12 * s,
        handRX: 30 * s,
        handLX: -30 * s,
        handRY: base - 90 * s - curl * 80 * s,
        handLY: base - 90 * s - curl * 80 * s,
        lean: 0,
      };
    }
    case "lunge": {
      const lunge = Math.sin(t) * 0.5 + 0.5;
      const drop = lunge * 50 * s;
      return {
        headY: base - 200 * s + drop,
        shoulderY: base - 160 * s + drop,
        hipY: base - 90 * s + drop,
        kneeRY: base - 20 * s,
        kneeLY: base - 80 * s + drop,
        footRY: base,
        footLY: base - 10 * s,
        kneeRX: 20 * s,
        kneeLX: -40 * s,
        footRX: 25 * s,
        footLX: -55 * s,
        handRX: 15 * s,
        handLX: -15 * s,
        handRY: base - 120 * s + drop,
        handLY: base - 120 * s + drop,
        lean: 0.1,
      };
    }
    case "plank": {
      const breathe = Math.sin(t * 0.5) * 0.02;
      const bodyY = H * 0.6 - 50 * s;
      return {
        headY: bodyY - 10 * s,
        shoulderY: bodyY,
        hipY: bodyY + 5 * s,
        kneeRY: bodyY + 80 * s,
        kneeLY: bodyY + 80 * s,
        footRY: bodyY + 100 * s,
        footLY: bodyY + 100 * s,
        kneeRX: 50 * s,
        kneeLX: 50 * s,
        footRX: 60 * s,
        footLX: 60 * s,
        handRY: bodyY + breathe * 10,
        handLY: bodyY + breathe * 10,
        horizontal: true,
        lean: 0,
      };
    }
    case "jumpjack": {
      const phase = Math.abs(Math.sin(t));
      const armRaise = phase;
      const legSpread = phase;
      const bounce = Math.abs(Math.sin(t * 2)) * 20 * s;
      return {
        headY: base - 200 * s - bounce,
        shoulderY: base - 160 * s - bounce,
        hipY: base - 90 * s - bounce,
        kneeRY: base - 50 * s + legSpread * 10 * s - bounce * 0.5,
        kneeLY: base - 50 * s + legSpread * 10 * s - bounce * 0.5,
        footRY: base - bounce * 0.3,
        footLY: base - bounce * 0.3,
        kneeRX: 15 * s + legSpread * 30 * s,
        kneeLX: -15 * s - legSpread * 30 * s,
        footRX: 20 * s + legSpread * 40 * s,
        footLX: -20 * s - legSpread * 40 * s,
        handRX: 30 * s + armRaise * 80 * s,
        handLX: -30 * s - armRaise * 80 * s,
        handRY: base - 120 * s - bounce - armRaise * 80 * s,
        handLY: base - 120 * s - bounce - armRaise * 80 * s,
        lean: 0,
      };
    }
  }
}

function drawStickFigure(ctx, cx, pose, color, W, H) {
  const {
    headY,
    shoulderY,
    hipY,
    kneeRY,
    kneeLY,
    footRY,
    footLY,
    kneeRX,
    kneeLX,
    footRX,
    footLX,
    handRX,
    handLX,
    handRY,
    handLY,
    lean = 0,
  } = pose;
  const s = H / 500;

  function limb(x1, y1, x2, y2, glow = false) {
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
    }
    ctx.beginPath();
    ctx.moveTo(cx + x1, y1);
    ctx.lineTo(cx + x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.strokeStyle = color + "44";
  ctx.lineWidth = 10 * s;
  ctx.lineCap = "round";
  limb(0, shoulderY, 0, hipY);

  ctx.strokeStyle = "#e6edf3";
  ctx.lineWidth = 3.5 * s;
  limb(lean * 20, shoulderY, lean * 5, hipY, true);

  limb(lean * 20, shoulderY, lean * 22, headY + 10 * s);

  ctx.beginPath();
  ctx.arc(cx + lean * 22, headY, 16 * s, 0, Math.PI * 2);
  ctx.strokeStyle = "#e6edf3";
  ctx.lineWidth = 2.5 * s;
  ctx.stroke();

  const headGrad = ctx.createRadialGradient(
    cx + lean * 22 - 3,
    headY - 3,
    2,
    cx + lean * 22,
    headY,
    16 * s,
  );
  headGrad.addColorStop(0, "#3a3f4a");
  headGrad.addColorStop(1, "#1e2330");
  ctx.fillStyle = headGrad;
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx + lean * 22 - 6 * s, headY - 2 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + lean * 22 + 6 * s, headY - 2 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + lean * 22, headY + 4 * s, 6 * s, 0, Math.PI);
  ctx.stroke();

  ctx.fillStyle = "#8b5e3c";
  ctx.beginPath();
  ctx.arc(cx + lean * 22, headY - 8 * s, 12 * s, Math.PI, 0);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 3 * s;
  limb(lean * 20, shoulderY, handRX, handRY, true);
  limb(lean * 20, shoulderY, handLX, handLY, true);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx + handRX, handRY, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + handLX, handLY, 4 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#e6edf3";
  ctx.lineWidth = 3.5 * s;
  limb(lean * 5, hipY, kneeRX, kneeRY, true);
  limb(lean * 5, hipY, kneeLX, kneeLY, true);
  limb(kneeRX, kneeRY, footRX, footRY);
  limb(kneeLX, kneeLY, footLX, footLY);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx + kneeRX, kneeRY, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + kneeLX, kneeLY, 4 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#374151";
  ctx.beginPath();
  ctx.ellipse(cx + footRX, footRY, 12 * s, 5 * s, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx + footRX + 4 * s, footRY, 5 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#374151";
  ctx.beginPath();
  ctx.ellipse(cx + footLX, footLY, 12 * s, 5 * s, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(cx + footLX - 4 * s, footLY, 5 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e6edf3";
  ctx.beginPath();
  ctx.arc(cx + lean * 20, shoulderY, 5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + lean * 5, hipY, 5 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawParticles(ctx, cx, pose, color, t) {
  const count = 8;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + t * 2;
    const radius = 80 + Math.sin(t * 3 + i) * 20;
    const x = cx + Math.cos(angle) * radius;
    const y = pose.hipY - 20 + Math.sin(angle * 0.7) * 30;
    const alpha = (Math.sin(t * 2 + i) * 0.5 + 0.5) * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle =
      color +
      Math.round(alpha * 255)
        .toString(16)
        .padStart(2, "0");
    ctx.fill();
  }
}

// ============================================================
// AUTO LOGIN CHECK
// ============================================================
if (token && currentUser) {
  initApp();
} else {
  document.getElementById("auth-screen").style.display = "flex";
}

// Handle Enter key on login
document.addEventListener("keydown", (e) => {
  if (
    e.key === "Enter" &&
    document.getElementById("auth-screen").style.display !== "none"
  ) {
    const activeForm = document.querySelector(
      "#auth-screen [id^=form-]:not(.hidden)",
    );
    if (activeForm?.id === "form-login") doLogin();
    else if (activeForm?.id === "form-register") doRegister();
    else if (activeForm?.id === "form-forgot") doForgotPassword();
    else if (activeForm?.id === "form-reset") doResetPassword();
  }
});
