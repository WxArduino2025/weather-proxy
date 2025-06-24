const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();
const PORT = process.env.PORT || 8080;

// METAR endpoint
app.use('/proxy/stations/:stationCode', (req, res, next) => {
  const stationCode = req.params.stationCode.toUpperCase();
  const targetUrl = `https://api.weather.gov/stations/${stationCode}/observations/latest`;

  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: (path, req) => '', // no rewrite needed, direct fetch
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('User-Agent', 'Arduino-GIGA-Weather/1.0');
      proxyReq.setHeader('Accept', 'application/geo+json,application/json');
    },
  })(req, res, next);
});

// Warning alerts
app.use('/proxy/alerts', createProxyMiddleware({
  target: 'https://api.weather.gov/',
  changeOrigin: true,
  pathRewrite: {
    '^/proxy/alerts': '/alerts'
  },
  onProxyReq: (proxyReq) => {
    proxyReq.setHeader('User-Agent', 'Arduino-GIGA-Weather/1.0');
    proxyReq.setHeader('Accept', 'application/geo+json,application/json');
  },
}));

app.listen(PORT, () => {
  console.log(`✅ Proxy server running at http://localhost:${PORT}`);
});
