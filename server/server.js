const http = require('http');
const app = require('./app');
const { initSocket } = require('./services/socketService');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 CRM Server running on http://localhost:${PORT}`);
  console.log(`📱 WhatsApp Webhook: http://localhost:${PORT}/webhook/whatsapp`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
