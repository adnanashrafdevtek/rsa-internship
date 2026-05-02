const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.LANGFLOW_PROXY_PORT || 4001;
const TARGET = process.env.REACT_APP_LANGFLOW_BASE_URL || 'http://localhost:7860';
const API_KEY = process.env.LANGFLOW_API_KEY || process.env.REACT_APP_LANGFLOW_API_KEY || '';

app.use(
  '/langflow',
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    secure: false,
    pathRewrite: {
      '^/langflow': '',
    },
    onProxyReq: (proxyReq, req, res) => {
      if (API_KEY) {
        proxyReq.setHeader('x-api-key', API_KEY);
      }
      // forward original authorization header if present
      const auth = req.headers['authorization'];
      if (auth) proxyReq.setHeader('authorization', auth);
    },
    onProxyRes: (proxyRes, req, res) => {
      // ensure browser can receive responses during development
      proxyRes.headers['Access-Control-Allow-Origin'] = req.headers.origin || '*';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Authorization,Content-Type,x-api-key';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
    },
  })
);

app.get('/health', (req, res) => res.json({ ok: true, target: TARGET }));

app.listen(PORT, () => {
  console.log(`Langflow proxy listening on http://localhost:${PORT} -> ${TARGET}`);
});
