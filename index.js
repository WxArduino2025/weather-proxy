const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8080;

// Handle METAR station request
app.get('/proxy/stations/:stationCode', async (req, res) => {
  const stationCode = req.params.stationCode.toUpperCase();
  const url = `https://api.weather.gov/stations/${stationCode}/observations/latest`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Arduino-GIGA-Weather/1.0',
        'Accept': 'application/geo+json,application/json'
      }
    });
    res.json(response.data);
  } catch (err) {
    console.error(`Error fetching METAR for ${stationCode}:`, err.message);
    res.status(500).json({ error: `Failed to fetch METAR for ${stationCode}` });
  }
});

// Forward alert requests
app.use('/proxy/alerts', async (req, res) => {
  const targetUrl = `https://api.weather.gov/alerts${req.url}`;
  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Arduino-GIGA-Weather/1.0',
        'Accept': 'application/geo+json,application/json'
      }
    });
    res.json(response.data);
  } catch (err) {
    console.error("Error fetching alert:", err.message);
    res.status(500).json({ error: "Failed to fetch alert" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server running at http://localhost:${PORT}`);
});
