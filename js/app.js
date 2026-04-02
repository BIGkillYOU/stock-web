// ================= CONFIG =================
const SHEET_ID = "1z8RnGZkW-EpfemhxxcaaUfUNTxJ9R9Yh5V71xqaIl00";

// ================= LANGUAGE =================
const LANG = {
  th: { dashboard: "แดชบอร์ด", stock: "สินค้า" },
  en: { dashboard: "Dashboard", stock: "Stock" }
};

// ================= SETTINGS =================
function loadSettings() {
  const theme = localStorage.getItem("theme") || "dark";
  const lang = localStorage.getItem("lang") || "th";

  setTheme(theme);
  applyLanguage(lang);
}

function toggleTheme() {
  const current = localStorage.getItem("theme") === "dark" ? "light" : "dark";
  setTheme(current);
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

function toggleLang() {
  const current = localStorage.getItem("lang") === "th" ? "en" : "th";
  setLanguage(current);
}

function setLanguage(lang) {
  localStorage.setItem("lang", lang);
  applyLanguage(lang);
}

function applyLanguage(lang) {
  document.querySelectorAll("[data-lang]").forEach(el => {
    const key = el.getAttribute("data-lang");
    el.innerText = LANG[lang][key];
  });
}

// ================= FETCH SHEETS =================
async function getSheetNames() {
  const url = `https://spreadsheets.google.com/feeds/worksheets/${SHEET_ID}/public/full?alt=json`;
  const res = await fetch(url);
  const json = await res.json();
  return json.feed.entry.map(s => s.title.$t);
}

async function getSheetData(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
  const res = await fetch(url);
  const text = await res.text();

  const json = JSON.parse(text.substr(47).slice(0, -2));
  const cols = json.table.cols.map(c => c.label);

  return json.table.rows.map(row => {
    let obj = {};
    row.c.forEach((cell, i) => {
      obj[cols[i]] = cell ? cell.v : "";
    });
    return obj;
  });
}

// ================= LOAD ALL =================
let DB = {};

async function loadAllSheets() {
  const names = await getSheetNames();

  const promises = names.map(n => getSheetData(n));
  const results = await Promise.all(promises);

  names.forEach((name, i) => {
    DB[name] = results[i];
  });

  localStorage.setItem("db_cache", JSON.stringify(DB));
}

// ================= CACHE =================
async function initData() {
  if (localStorage.getItem("db_cache")) {
    DB = JSON.parse(localStorage.getItem("db_cache"));
  } else {
    await loadAllSheets();
  }
}

// ================= ROUTER =================
function navigate(page) {
  location.hash = page;
  renderPage(page);
}

window.addEventListener("hashchange", () => {
  renderPage(location.hash.replace("#", ""));
});

// ================= RENDER =================
function renderPage(page) {
  if (!page) page = "dashboard";

  if (page === "dashboard") renderDashboard();
  if (page === "stock") renderStock();
}

// ================= DASHBOARD =================
function renderDashboard() {
  const content = document.getElementById("content");

  const stock = Object.values(DB)[0] || [];

  const total = stock.length;
  const totalStock = stock.reduce((s, i) => s + Number(i.stock || 0), 0);

  content.innerHTML = `
    <div class="container">
      <div class="card">Total Items: ${total}</div>
      <div class="card">Total Stock: ${totalStock}</div>
    </div>
  `;
}

// ================= STOCK =================
function renderStock() {
  const content = document.getElementById("content");

  const stock = Object.values(DB)[0] || [];

  content.innerHTML = `<div class="container">
    ${stock.map(i => `
      <div class="card">
        <h3>${i.name || "-"}</h3>
        <p>Stock: ${i.stock || 0}</p>
      </div>
    `).join("")}
  </div>`;
}

// ================= INIT =================
async function init() {
  loadSettings();
  await initData();
  renderPage("dashboard");
}

init();
