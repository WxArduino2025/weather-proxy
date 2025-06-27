// index.js

const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// 🟢 Disable the default "X-Forwarded-Proto" HTTPS redirect behavior
app.enable('trust proxy');
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] === 'https') {
    // Allow HTTPS (browsers)
    return next();
  }
  // Otherwise, just continue without forcing redirects
  return next();
});

// Log incoming requests (for debugging)
app.use((req, res, next) => {
  console.log(`Incoming: ${req.method} ${req.url}`);
  next();
});

// Simple root check
app.get('/', (req, res) => {
  res.send('✅ Weather Proxy Server Running');
});

// METAR endpoint
app.get('/metar', async (req, res) => {
  const { ids } = req.query;

  if (!ids) {
    return res.status(400).json({ error: 'Missing ids parameter' });
  }

  const apiURL = `https://aviationweather.gov/api/data/metar?format=json&hoursBeforeNow=3&mostRecentForEachStation=true&ids=${ids}`;

  try {
    const response = await fetch(apiURL);
    if (!response.ok) {
      return res.status(response.status).json({ error: `METAR API error: ${response.statusText}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching METAR:', error);
    res.status(500).json({ error: 'Server error fetching METAR' });
  }
});

// Alerts endpoint
app.get('/alerts', async (req, res) => {
  const queryString = new URLSearchParams(req.query).toString();
  const apiURL = `https://api.weather.gov/alerts?${queryString}`;

  try {
    const response = await fetch(apiURL);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Alerts API error: ${response.statusText}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching Alerts:', error);
    res.status(500).json({ error: 'Server error fetching Alerts' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Weather Proxy Server listening on port ${PORT}`);
});
