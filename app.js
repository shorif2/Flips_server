const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const app = express();
const spreadsheetApiRoutes = require("./routes/spreadsheetApi");
const dataRoutes = require("./routes/dataRoutes");

// Middleware
app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.static(path.join(__dirname, "public")));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/ui-spreadsheet", spreadsheetApiRoutes);
app.use("/api", dataRoutes);
app.get("/", (req, res) => {
  res.render("index");
});

// Start HTTP server
app.listen(3000, () => {
  console.log("✅ Server running at http://localhost:3000");
});
