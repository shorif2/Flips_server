const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const DATA_FILE = path.join(__dirname, "../data/spreadsheet.json");

// READ data
router.get("/", (req, res) => {
  fs.readFile(DATA_FILE, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Unable to read data" });
    res.json(JSON.parse(data));
  });
});

// CREATE/UPDATE data
router.post("/", (req, res) => {
  fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2), (err) => {
    if (err) return res.status(500).json({ error: "Unable to save data" });
    res.json({ message: "Data saved successfully!" });
  });
});

module.exports = router;
