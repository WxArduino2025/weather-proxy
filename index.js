const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/metar", async (req, res) => {
  // Build the upstream URL safely
  let upstreamUrl = "https://aviationweather.gov/api/data/metar";

  const originalQuery = req.url.split("?")[1];
  if (originalQuery) {
    upstreamUrl += "?" + originalQuery + "&format=json";
  } else {
    upstreamUrl += "?format=json";
  }

  try {
    const response = await fetch(upstreamUrl);
    const data = await response.text();
    res.set("Content-Type", "application/json");
    res.set("Transfer-Encoding", "identity");
    res.send(data);
  } catch (error) {
    console.error("Error fetching METAR:", error);
    res.status(500).json({ error: "Error fetching METAR data" });
  }
});

app.get("/alerts", async (req, res) => {
  let upstreamUrl = "https://api.weather.gov/alerts";
  const originalQuery = req.url.split("?")[1];
  if (originalQuery) {
    upstreamUrl += "?" + originalQuery;
  }

  try {
    const response = await fetch(upstreamUrl);
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
