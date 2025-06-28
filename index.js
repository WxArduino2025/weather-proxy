const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// CORS headers to allow any origin
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

// Root route
app.get('/', (req, res) => {
  res.send('Weather Proxy Server is running.');
});

// METAR endpoint: /metar?ids=KSTL
app.get('/metar', async (req, res) => {
  const station = req.query.ids;
  if (!station) {
    return res.status(400).json({ error: 'Missing ?ids=STATION parameter' });
  }

  try {
    const nwsResponse = await fetch(`https://api.weather.gov/stations/${station}/observations/latest`);
    if (!nwsResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch METAR from NWS' });
    }
    const json = await nwsResponse.json();
    res.json(json);
  } catch (error) {
    console.error('Error fetching METAR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Warning endpoint example: /alerts?status=actual&message_type=alert&area=MO&event=Severe%20Thunderstorm%20Warning
app.get('/alerts', async (req, res) => {
  const queryString = req.originalUrl.split('?')[1];
  const url = `https://api.weather.gov/alerts?${queryString}`;
  try {
    const nwsResponse = await fetch(url);
    if (!nwsResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch alerts from NWS' });
    }
    const json = await nwsResponse.json();
    res.json(json);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
