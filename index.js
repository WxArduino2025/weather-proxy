/**
 * index.js
 * Node.js proxy server for weather.gov
 */

const express = require("express");
const fetch = require("node-fetch");
const app = express();

// Root route
app.get("/", (req, res) => {
  res.send("Weather proxy server is running.");
});

// METAR endpoint
app.get("/metar", async (req, res) => {
  const ids = req.query.ids;
  if (!ids) {
    return res.status(400).send({ error: "Missing 'ids' parameter" });
  }
  const url = `https://api.weather.gov/stations/${ids}/observations/latest`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ArduinoProxy/1.0"
      }
    });
    if (!response.ok) {
      return res.status(response.status).send({ error: "Upstream error" });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Alerts endpoint
app.get("/alerts", async (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  const url = `https://api.weather.gov/alerts?${queryString}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ArduinoProxy/1.0"
      }
    });
    if (!response.ok) {
      return res.status(response.status).send({ error: "Upstream error" });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Listen on the default port Render provides
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
