import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Health check endpoints for container and readiness probes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Serve static assets from project root
app.use(express.static(__dirname));

// Route handlers
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.htm', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).send('Internal Server Error');
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  console.log(`Ready on http://localhost:${PORT}`);
  console.log(`Local: http://localhost:${PORT}/`);
});

server.on('error', (err) => {
  console.error('[Server Listen Error]:', err);
});

// Graceful termination handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
