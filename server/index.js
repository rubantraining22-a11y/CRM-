import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import './config/env.js';
import morgan from 'morgan';
import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';


const app = express();
const server = http.createServer(app);

// Socket.io for Real-time WhatsApp sync
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/campaigns', campaignRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    version: '4.2.0',
    service: 'WhatsApp CRM Pro Server',
    timestamp: new Date().toISOString(),
  });
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 [WhatsApp CRM Server] Running on http://localhost:${PORT}`);
  });
};

startServer();
