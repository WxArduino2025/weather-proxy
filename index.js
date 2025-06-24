const express = require("express");
const fetch = require("node-fetch");
const app = express();

const API_BASE = "https://api.weather.gov";

// ✅ Optional root route so "/" returns a useful message
app.get("/", (req, res) => {
  res.send("✅ Weather Proxy is running. Use /proxy/[path] to fetch from api.weather.gov.");
});

// Proxy route to forward all /proxy/* requests to api.weather.gov
app.get("/proxy/*", async (req, res) => {
  try {
    const targetPath = req.params[0]; // gets the part after /proxy/
    const query = req.originalUrl.split("/proxy/")[1];

    const response = await fetch(`${API_BASE}/${query}`, {
      headers: {
        "User-Agent": "ArduinoGIGA-WeatherProxy"
      }
    });

    const data = await response.text();
    res.set("Content-Type", "application/json");
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: "Proxy fetch failed", detail: error.toString() });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Proxy server running on port ${PORT}`);
});
