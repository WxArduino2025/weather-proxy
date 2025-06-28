const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/metar", async (req, res) => {
  const query = req.url.replace("/metar", "");
  const url = `https://aviationweather.gov/api/data/metar${query}`;
  const response = await fetch(url);
  const data = await response.text();
  res.set("Content-Type", "application/json");
  res.send(data);
});

app.get("/alerts", async (req, res) => {
  const query = req.url.replace("/alerts", "");
  const url = `https://api.weather.gov/alerts${query}`;
  const response = await fetch(url);
  const data = await response.text();
  res.set("Content-Type", "application/json");
  res.send(data);
});

app.listen(PORT, () => console.log(`Proxy listening on port ${PORT}`));
