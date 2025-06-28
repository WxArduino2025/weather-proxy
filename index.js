const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;

// METAR endpoint
app.get("/metar", async (req, res) => {
  let upstreamUrl = "https://aviationweather.gov/api/data/metar";

  // Rebuild query string
  const originalQuery = req.url.split("?")[1];
  if (originalQuery) {
    upstreamUrl += "?" + originalQuery + "&format=json";
  } else {
    upstreamUrl += "?format=json";
  }

  console.log(`🔗 Fetching METAR from: ${upstreamUrl}`);

  try {
    const response = await fetch(upstreamUrl);
    const data = await response.text();
    console.log(`✅ Upstream response: ${data}`);

    res.set("Content-Type", "application/json");
    res.set("Transfer-Encoding", "identity");
    res.send(data);
  } catch (error) {
    console.error("❌ Error fetching METAR:", error);
    res.status(500).json({ error: "Error fetching METAR data" });
  }
});

// ALERTS endpoint
app.get("/alerts", async (req, res) => {
  const originalQuery = req.url.split("?")[1];
  let upstreamUrl = "https://api.weather.gov/alerts";
  if (originalQuery) {
    upstreamUrl += "?" + originalQuery;
  }

  console.log(`🔗 Fetching alerts from: ${upstreamUrl}`);

  try {
    const response = await fetch(upstreamUrl);
    const data = await response.text();
    console.log(`✅ Upstream response: ${data}`);

    res.set("Content-Type", "application/geo+json");
    res.set("Transfer-Encoding", "identity");
    res.send(data);
  } catch (error) {
    console.error("❌ Error fetching alerts:", error);
    res.status(500).json({ error: "Error fetching alert data" });
  }
});

// Start server
app.listen(PORT, () => console.log(`✅ Proxy listening on port ${PORT}`));
