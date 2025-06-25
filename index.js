const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const cache = new NodeCache({ stdTTL: 120, checkperiod: 30 }); // Cache for 2 minutes

// Middleware
app.use(cors());
app.use(express.json());

// Root route for health check
app.get('/', (req, res) => res.send('Weather Proxy Server Running'));

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
    console.log(`Fetching METAR from: ${url}`);
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Arduino-GIGA-Weather/1.0', 'Accept': 'application/json' }
    });
    const data = Array.isArray(response.data) ? response.data : [response.data];
    console.log(`METAR response for ${stationCode}:`, JSON.stringify(data, null, 2));
    cache.set(cacheKey, data);
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
  console.log(`Request URL: ${req.url}`);
  console.log(`Query params: ${JSON.stringify(req.query, null, 2)}`);
  console.log(`Fetching alerts from: ${targetUrl}`);
  const cacheKey = `alerts_${req.url}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    console.log(`Returning cached alerts for ${req.url}`);
    return res.json(cachedData);
  }

  try {
    const response = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Arduino-GIGA-Weather/1.0', 'Accept': 'application/geo+json,application/json' }
    });
    console.log(`NWS response status: ${response.status}, headers:`, JSON.stringify(response.headers, null, 2));
    console.log('Raw NWS response:', JSON.stringify({
      features: response.data.features,
      title: response.data.title,
      updated: response.data.updated
    }, null, 2));
    const simplifiedData = {
      features: response.data.features.map(feature => ({
        id: feature.properties.id,
        event: feature.properties.event,
        sent: feature.properties.sent,
        expires: feature.properties.expires,
        geocode: feature.properties.geocode
      }))
    };
    console.log('Simplified response:', JSON.stringify(simplifiedData, null, 2));
    cache.set(cacheKey, simplifiedData);
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
