const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;

// METAR endpoint that returns JSON
app.get("/metar", async (req, res) => {
  try {
    const ids = req.query.ids;
    if (!ids) {
      return res.status(400).json({ error: "Missing 'ids' query parameter" });
    }

    // Build URL for aviationweather.gov JSON API
    const url = `https://aviationweather.gov/api/data/metar?format=json&hoursBeforeNow=3&mostRecentForEachStation=true&ids=${ids}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(502).json({ error: "Upstream fetch failed." });
    }

    const json = await response.json();
    res.json(json);
  } catch (err) {
    console.error("Error fetching METAR JSON:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Alerts endpoint (unchanged)
app.get("/alerts", async (req, res) => {
  const query = req.url.replace("/alerts", "");
  const url = `https://api.weather.gov/alerts${query}`;
  const response = await fetch(url);
  const data = await response.text();
  res.set("Content-Type", "application/json");
  res.send(data);
});

app.listen(PORT, () => console.log(`✅ Proxy listening on port ${PORT}`));
