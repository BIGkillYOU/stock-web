// ================= CONFIG =================
const SHEET_ID = "1z8RnGZkW-EpfemhxxcaaUfUNTxJ9R9Yh5V71xqaIl00";

const SHEETS = [
  "STOCK 2026 รับ",
  "สรุปSTOCK",
  "Spare Part",
  "สินค้าเคลม ส่งซ่อม"
];

// ================= THEME =================
function toggleTheme() {
  const t = localStorage.getItem("theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem("theme", t);
}

// ================= FETCH (แก้ col0) =================
async function getSheetData(name) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(name)}`;

  const res = await fetch(url);
  const text = await res.text();

  const json = JSON.parse(text.substr(47).slice(0, -2));

  // เอาเฉพาะคอลัมน์ที่มีชื่อ
  const validCols = json.table.cols
    .map((c, i) => ({ name: c.label, index: i }))
    .filter(c => c.name && c.name.trim() !== "");

  return json.table.rows.map(r => {
    let obj = {};
    validCols.forEach(col => {
      const cell = r.c[col.index];
      obj[col.name] = cell && cell.v !== null ? cell.v : "";
    });
    return obj;
  });
}

// ================= LOAD =================
let DB = {};

async function loadAll() {
  const results = await Promise.all(SHEETS.map(s => getSheetData(s)));
  SHEETS.forEach((s, i) => DB[s] = results[i]);
  console.log("DB:", DB);
}

// ================= MAP DATA (แก้ undefined) =================
function mapData(row) {
  return {
    name:
      row["ชื่อสินค้า"] ||
      row["รายการ"] ||
      row["name"] ||
      "-",

    stock:
      Number(row["จำนวน"] || row["stock"] || 0),

    price:
      Number(row["ราคา"] || row["price"] || 0),

    brand:
      row["แบรนด์"] ||
      row["brand"] ||
      "Unknown",

    supplier:
      row["Supplier"] ||
      row["ผู้ขาย"] ||
      "-"
  };
}

// ================= ROUTER =================
function navigate(page) {
  if (page === "dashboard") renderDashboard();
  if (page === "stock") renderStock();
}

// ================= DASHBOARD =================
function renderDashboard() {
  const stock = (DB["STOCK 2026 รับ"] || []).map(mapData);

  const totalItems = stock.length;
  const totalStock = stock.reduce((s,i)=>s+i.stock,0);
  const totalPrice = stock.reduce((s,i)=>s+(i.price*i.stock),0);

  const low = stock.filter(i=>i.stock>0 && i.stock<=10).length;
  const out = stock.filter(i=>i.stock===0).length;

  const brandMap = {};
  stock.forEach(i=>{
    brandMap[i.brand] = (brandMap[i.brand]||0)+1;
  });

  const suppliers = [...new Set(stock.map(i=>i.supplier))];

  document.getElementById("content").innerHTML = `
    <h2>Dashboard</h2>

    <div class="container">
      <div class="card">Items: ${totalItems}</div>
      <div class="card">Stock: ${totalStock}</div>
      <div class="card">Value: ${totalPrice}</div>
      <div class="card">Low: ${low}</div>
      <div class="card">Out: ${out}</div>
    </div>

    <h3>Brand</h3>
    <div class="container">
      ${Object.entries(brandMap).map(([b,c])=>`<div class="card">${b}: ${c}</div>`).join("")}
    </div>

    <h3>Supplier</h3>
    <div class="container">
      ${suppliers.map(s=>`<div class="card">${s}</div>`).join("")}
    </div>

    <canvas id="chart"></canvas>
  `;

  renderChart(stock);
}

// ================= CHART =================
function renderChart(data) {
  new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
      labels: data.map(i=>i.name),
      datasets: [{
        label: "Stock",
        data: data.map(i=>i.stock)
      }]
    }
  });
}

// ================= STOCK =================
function renderStock() {
  const stock = (DB["STOCK 2026 รับ"] || []).map(mapData);

  document.getElementById("content").innerHTML = `
    <div class="container">
      ${stock.map(i=>`
        <div class="card">
          <h3>${i.name}</h3>
          <p>Stock: ${i.stock}</p>
          <p>Price: ${i.price}</p>
        </div>
      `).join("")}
    </div>
  `;
}

// ================= TABLE =================
function renderTable(name) {
  const data = DB[name] || [];

  if (!data.length) {
    document.getElementById("content").innerHTML = "No data";
    return;
  }

  // filter ไม่เอา col
  const headers = Object.keys(data[0]).filter(h => h && !h.startsWith("col"));

  document.getElementById("content").innerHTML = `
    <h2>${name}</h2>
    <table>
      <tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr>
      ${data.map(r=>`
        <tr>${headers.map(h=>`<td>${r[h] || ""}</td>`).join("")}</tr>
      `).join("")}
    </table>
  `;
}

// ================= INIT =================
async function init() {
  document.documentElement.setAttribute("data-theme", localStorage.getItem("theme") || "dark");

  await loadAll();

  renderDashboard();
}

init();
