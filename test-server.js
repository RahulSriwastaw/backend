// Minimal test server to verify Railway can connect
import express from 'express';

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('Test server is running!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server is healthy' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server running on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

