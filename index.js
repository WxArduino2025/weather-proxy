const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const cache = new NodeCache({ stdTTL: 120, checkperiod: 30 }); // Cache for 2 minutes

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Handle METAR station request
app.get('/proxy/stations/:stationCode', async (req, res) => {
  const stationCode = req.params.stationCode.toUpperCase();
  const cacheKey = `metar_${stationCode}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log(`Returning cached METAR for ${stationCode}`);
    return res.json(cachedData);
  }

  const url = `https://aviationweather.gov/api/data/metar?format=json&hoursBeforeNow=3&mostRecentForEachStation=true&ids=${stationCode}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Arduino-GIGA-Weather/1.0',
        'Accept': 'application/json'
      }
    });

    // Ensure response is an array (Arduino expects a JSON array)
    const data = Array.isArray(response.data) ? response.data : [response.data];
    cache.set(cacheKey, data); // Store in cache
    res.json(data);
  } catch (err) {
    console.error(`Error fetching METAR for ${stationCode}:`, err.message);
    res.status(err.response?.status || 500).json({
      error: `Failed to fetch METAR for ${stationCode}`,
      details: err.response?.data?.message || err.message
    });
  }
});

// Forward alert requests
app.get('/proxy/alerts*', async (req, res) => {
  const targetUrl = `https://api.weather.gov/alerts${req.url.replace('/proxy/alerts', '')}`;
  const cacheKey = `alerts_${req.url}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log(`Returning cached alerts for ${req.url}`);
    return res.json(cachedData);
  }

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Arduino-GIGA-Weather/1.0',
        'Accept': 'application/geo+json,application/json'
      }
    });

    // Simplify response to reduce payload size
    const simplifiedData = {
      features: response.data.features.map(feature => ({
        id feature.properties.id,
        event: feature.properties.event,
        sent: feature.properties.sent,
        expires: feature.properties.expires,
        geocode: feature.properties.geocode
      }))
    };

    cache.set(cacheKey, simplifiedData); // Store in cache
    res.json(simplifiedData);
  } catch (err) {
    console.error(`Error fetching alerts for ${req.url}:`, err.message);
    res.status(err.response?.status || 500).json({
      error: `Failed to fetch alerts`,
      details: err.response?.data?.message || err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server running at http${process.env.NODE_ENV === 'production' ? 's' : ''}://localhost:${PORT}`);
});
