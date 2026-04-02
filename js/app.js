// ================= CONFIG =================
const SHEET_ID = "1z8RnGZkW-EpfemhxxcaaUfUNTxJ9R9Yh5V71xqaIl00";

const SHEETS = [
  "STOCK 2026 รับ",
  "สรุปSTOCK",
  "Spare Part",
  "สินค้าเคลม ส่งซ่อม"
];

// ================= SETTINGS =================
function loadSettings() {
  const theme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);
}

// ================= FETCH SHEET =================
async function getSheetData(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

  const res = await fetch(url);
  const text = await res.text();

  // แปลง JSON (สำคัญ)
  const json = JSON.parse(text.substr(47).slice(0, -2));

  // แก้ header ว่าง
  const cols = json.table.cols.map((c, i) => c.label || `col${i}`);

  // แก้ null
  return json.table.rows.map(row => {
    let obj = {};
    row.c.forEach((cell, i) => {
      obj[cols[i]] = cell && cell.v !== null ? cell.v : "";
    });
    return obj;
  });
}

// ================= LOAD ALL SHEETS =================
let DB = {};

async function loadAllSheets() {
  const promises = SHEETS.map(name => getSheetData(name));
  const results = await Promise.all(promises);

  SHEETS.forEach((name, i) => {
    DB[name] = results[i];
  });
}

// ================= RENDER =================
function renderDashboard() {
  const content = document.getElementById("content");

  const stock = DB["STOCK 2026 รับ"] || [];

  const total = stock.length;
  const totalStock = stock.reduce((sum, i) => sum + Number(i.stock || 0), 0);

  content.innerHTML = `
    <h2>Dashboard</h2>
    <div class="container">
      <div class="card">จำนวนรายการ: ${total}</div>
      <div class="card">จำนวนรวม: ${totalStock}</div>
    </div>
  `;
}

function renderStock() {
  const content = document.getElementById("content");

  const stock = DB["STOCK 2026 รับ"] || [];

  content.innerHTML = `
    <h2>Stock</h2>
    <div class="container">
      ${stock.map(i => `
        <div class="card">
          <h3>${i.name || "-"}</h3>
          <p>Stock: ${i.stock || 0}</p>
        </div>
      `).join("")}
    </div>
  `;
}

// ================= ROUTER =================
function navigate(page) {
  if (page === "dashboard") renderDashboard();
  if (page === "stock") renderStock();
}

// ================= INIT =================
async function init() {
  loadSettings();

  await loadAllSheets();

  console.log("DB =", DB); // debug

  renderDashboard();
}

init();
