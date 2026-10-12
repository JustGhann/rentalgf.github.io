// Token hanya disimpan selama tab admin terbuka. Akses data tetap dilindungi RLS Supabase.
const config = window.TEMANKENCAN_SUPABASE;
const loginForm = document.querySelector("[data-admin-login]");
const loginPanel = document.querySelector("[data-login-panel]");
const dashboard = document.querySelector("[data-admin-dashboard]");
const loginFeedback = document.querySelector("[data-login-feedback]");
const dashboardFeedback = document.querySelector("[data-dashboard-feedback]");
const orderList = document.querySelector("[data-order-list]");
const loginButton = loginForm.querySelector('[type="submit"]');
const sessionKey = "temankencan-admin-access-token";

const packageNames = {
  ngopi: "Ngopi & ngobrol",
  jalan: "Jalan seharian",
  acara: "Teman acara",
  staycation: "Teman staycation — Rp2.000.000/malam"
};

function showMessage(element, message, type) {
  element.textContent = message;
  element.className = `admin-feedback ${type ? `admin-feedback-${type}` : ""}`;
}

function configured() {
  return config
    && /^https:\/\/[^/]+\.supabase\.co\/?$/.test(config.url)
    && config.anonKey
    && !config.anonKey.includes("YOUR_");
}

async function readError(response) {
  let description = "";
  try {
    const payload = await response.json();
    description = payload.msg || payload.message || payload.error_description || "";
  } catch {
    description = "";
  }
  return description || `Permintaan gagal (HTTP ${response.status}).`;
}

async function loadOrders(accessToken) {
  showMessage(dashboardFeedback, "Memuat pesanan...", "");
  orderList.replaceChildren();

  const response = await fetch(
    `${config.url.replace(/\/$/, "")}/rest/v1/orders?select=id,created_at,customer_name,email,package,notes&order=created_at.desc`,
    {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem(sessionKey);
    }
    throw new Error(await readError(response));
  }

  const orders = await response.json();
  const count = document.querySelector("[data-order-count]");
  count.textContent = String(orders.length).padStart(2, "0");

  if (orders.length === 0) {
    showMessage(dashboardFeedback, "Belum ada pesanan baru.", "");
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const order of orders) {
    const card = document.createElement("article");
    card.className = "admin-order-card";

    const header = document.createElement("div");
    header.className = "admin-order-header";

    const name = document.createElement("h2");
    name.textContent = order.customer_name;
    const date = document.createElement("time");
    date.dateTime = order.created_at;
    date.textContent = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(order.created_at));
    header.append(name, date);

    const email = document.createElement("a");
    email.className = "admin-order-email";
    email.href = `mailto:${encodeURIComponent(order.email)}`;
    email.textContent = order.email;

    const packageName = document.createElement("p");
    packageName.className = "admin-order-package";
    packageName.textContent = packageNames[order.package] || "Paket tidak dikenal";

    card.append(header, email, packageName);
    if (order.notes) {
      const notes = document.createElement("p");
      notes.className = "admin-order-notes";
      notes.textContent = order.notes;
      card.append(notes);
    }
    fragment.append(card);
  }
  orderList.append(fragment);
  showMessage(dashboardFeedback, "", "");
}

function showDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
}

function showLogin() {
  dashboard.hidden = true;
  loginPanel.hidden = false;
}

async function signIn(email, password) {
  const response = await fetch(
    `${config.url.replace(/\/$/, "")}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    }
  );

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const session = await response.json();
  if (!session.access_token) {
    throw new Error("Supabase tidak mengembalikan sesi login.");
  }
  sessionStorage.setItem(sessionKey, session.access_token);
  return session.access_token;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage(loginFeedback, "", "");
  loginButton.disabled = true;

  const formData = new FormData(loginForm);
  try {
    const accessToken = await signIn(formData.get("email").trim(), formData.get("password"));
    showDashboard();
    await loadOrders(accessToken);
  } catch (error) {
    console.error("Login atau pemuatan pesanan gagal:", error);
    showLogin();
    showMessage(loginFeedback, "Tidak dapat masuk atau memuat pesanan. Periksa akun admin dan kebijakan Supabase.", "error");
  } finally {
    loginButton.disabled = false;
  }
});

document.querySelector("[data-refresh-orders]").addEventListener("click", async () => {
  const accessToken = sessionStorage.getItem(sessionKey);
  if (!accessToken) {
    showLogin();
    return;
  }
  try {
    await loadOrders(accessToken);
  } catch (error) {
    console.error("Gagal memuat ulang pesanan:", error);
    showMessage(dashboardFeedback, "Pesanan gagal dimuat. Coba masuk kembali.", "error");
    showLogin();
  }
});

document.querySelector("[data-admin-logout]").addEventListener("click", () => {
  sessionStorage.removeItem(sessionKey);
  loginForm.reset();
  showLogin();
});

if (!configured()) {
  loginButton.disabled = true;
  showMessage(loginFeedback, "Konfigurasi Supabase belum diisi. Lengkapi supabase-config.js terlebih dahulu.", "error");
} else {
  const savedToken = sessionStorage.getItem(sessionKey);
  if (savedToken) {
    showDashboard();
    loadOrders(savedToken).catch((error) => {
      console.error("Sesi admin tidak dapat digunakan:", error);
      showMessage(loginFeedback, "Sesi berakhir. Silakan masuk kembali.", "error");
      showLogin();
    });
  }
}
