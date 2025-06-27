const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const cache = new NodeCache({ stdTTL: 120, checkperiod: 30 }); // Cache responses for 2 min

// Middleware
app.use(cors());
app.use(express.json());

// Root route for health check
app.get('/', (req, res) => res.send('Weather Proxy Server Running'));

// METAR endpoint (single station)
app.get('/metar', async (req, res) => {
  const { ids } = req.query;
  if (!ids) {
    return res.status(400).json({ error: "Missing 'ids' query parameter (station code)" });
  }

  const stationCode = ids.toUpperCase();
  const cacheKey = `metar_${stationCode}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log(`Returning cached METAR for ${stationCode}`);
    return res.json(cachedData);
  }

  const url = `https://aviationweather.gov/api/data/metar?format=json&hoursBeforeNow=3&mostRecentForEachStation=true&ids=${stationCode}`;

  try {
    console.log(`Fetching METAR: ${url}`);
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Arduino-GIGA-Weather/1.0', 'Accept': 'application/json' }
    });
    const data = Array.isArray(response.data) ? response.data : [response.data];
    cache.set(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.error(`Error fetching METAR for ${stationCode}:`, err.message);
    res.status(err.response?.status || 500).json({
      error: 'Failed to fetch METAR',
      details: err.response?.data?.message || err.message
    });
  }
});

// Alerts endpoint
app.get('/alerts', async (req, res) => {
  const query = req.originalUrl.replace('/alerts', '');
  const targetUrl = `https://api.weather.gov/alerts${query}`;
  const cacheKey = `alerts_${query}`;

  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`Returning cached alerts for ${query}`);
    return res.json(cachedData);
  }

  try {
    console.log(`Fetching Alerts: ${targetUrl}`);
    const response = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Arduino-GIGA-Weather/1.0', 'Accept': 'application/geo+json,application/json' }
    });
    const simplified = {
      features: response.data.features.map(feature => ({
        id: feature.properties.id,
        event: feature.properties.event,
        sent: feature.properties.sent,
        expires: feature.properties.expires,
        geocode: feature.properties.geocode,
        messageType: feature.properties.messageType,
        status: feature.properties.status
      }))
    };
    cache.set(cacheKey, simplified);
    res.json(simplified);
  } catch (err) {
    console.error(`Error fetching alerts:`, err.message);
    res.status(err.response?.status || 500).json({
      error: 'Failed to fetch alerts',
      details: err.response?.data?.message || err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Weather proxy server running on port ${PORT}`);
});
