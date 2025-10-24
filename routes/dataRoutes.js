// routes/spreadsheet.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const DATA_FILE = path.join(__dirname, "../data/spreadsheet.json");

// Helper: load + save
function loadData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ===============================
// 🔹 READ ALL
// ===============================
router.get("/all-data", (req, res) => {
  const data = loadData();
  if (!data.length) return res.status(404).json({ error: "No data available" });

  const headers = data[0]; // First row as headers
  const rows = data.slice(1).filter((r) => r[0]); // Skip empty rows

  // Map each row to an object
  const result = rows.map((row) => {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] || null; // If cell is empty, set null
    });
    return obj;
  });

  res.json(result);
});

// 🔹 Search
// ===============================
router.get("/search/:columnName", (req, res) => {
  const { columnName } = req.params;
  const { value } = req.query;

  const data = loadData();
  if (!data.length) return res.status(404).json({ error: "No data available" });

  const headers = data[0];
  const columnIndex = headers.indexOf(columnName);

  if (columnIndex === -1) {
    return res
      .status(400)
      .json({ error: `No column named '${columnName}' found` });
  }

  // Filter rows if value is provided, else return all rows
  const filteredRows = value
    ? data
        .slice(1)
        .filter(
          (row) =>
            row[columnIndex] &&
            row[columnIndex].toLowerCase().includes(value.toLowerCase())
        )
    : data.slice(1);

  if (!filteredRows.length) {
    return res.json({ message: "No match found" });
  }

  // Map rows to objects
  const mappedResults = filteredRows.map((row) => {
    let obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] || null;
    });
    return obj;
  });

  res.json(mappedResults[0]);
});

// update status by email
router.post("/update-status", (req, res) => {
  const { email, status } = req.body;

  if (!email || !status) {
    return res
      .status(400)
      .json({ error: "Both 'email' and 'status' are required" });
  }

  let data = loadData();
  if (!data.length) {
    return res.status(404).json({ error: "No data available" });
  }

  const headers = data[0];
  const emailIndex = headers.indexOf("email");
  const statusIndex = headers.indexOf("status");

  if (emailIndex === -1 || statusIndex === -1) {
    return res
      .status(400)
      .json({ error: "Required columns 'email' or 'status' not found" });
  }

  // Find the row with matching email
  let updated = false;
  data = data.map((row, i) => {
    if (i > 0 && row[emailIndex] && row[emailIndex] === email) {
      row[statusIndex] = status; // update status
      updated = true;
    }
    return row;
  });

  if (!updated) {
    return res.status(404).json({ error: `No row found with email ${email}` });
  }
  saveData(data);
  res.json({ message: "Status updated successfully", email, status });
});

module.exports = router;
