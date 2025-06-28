const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// 🟢 METAR proxy endpoint
app.get("/metar", async (req, res) => {
  const query = req.url.replace("/metar", "");
  const url = `https://aviationweather.gov/api/data/metar${query}&format=json`;
  try {
    const response = await fetch(url);
    const data = await response.text();
    res.set("Content-Type", "application/json");
    res.set("Transfer-Encoding", "identity"); // Disable chunked encoding
    res.send(data);
  } catch (error) {
    console.error("Error fetching METAR:", error);
    res.status(500).json({ error: "Error fetching METAR data" });
  }
});

// 🟢 Alerts proxy endpoint
app.get("/alerts", async (req, res) => {
  const query = req.url.replace("/alerts", "");
  const url = `https://api.weather.gov/alerts${query}`;
  try {
    const response = await fetch(url);
    const data = await response.text();
    res.set("Content-Type", "application/json");
    res.set("Transfer-Encoding", "identity");
    res.send(data);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Error fetching alert data" });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy listening on port ${PORT}`);
});
