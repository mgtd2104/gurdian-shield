import fs from 'fs';
import path from 'path';

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  fs.writeFileSync('error.log', `Uncaught Exception: ${err.message}\n${err.stack}\n`, { flag: 'a' });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  fs.writeFileSync('error.log', `Unhandled Rejection: ${reason}\n`, { flag: 'a' });
});

import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import scannerRoutes from './routes/scanner.js';
import passwordRoutes from './routes/password.js';
import passwordManagerRoutes from './routes/passwordManager.js';
import chatRoutes from './routes/chat.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  abortOnLimit: true,
  limitHandler: (req, res) => {
    res.status(413).json({ success: false, error: 'File exceeds the 50MB limit' });
  },
  useTempFiles: true,
  tempFileDir: path.join(process.cwd(), 'temp'),
  createParentPath: true
}));

// Store io instance for use in routes
app.set('io', io);

// Routes
app.use('/api/scanner', scannerRoutes);
app.use('/api/password', passwordRoutes);
app.use('/api/password-manager', passwordManagerRoutes);
app.use('/api/chat', chatRoutes);

app.use((err, req, res, next) => {
  const statusFromError = typeof err?.statusCode === 'number'
    ? err.statusCode
    : (typeof err?.status === 'number' ? err.status : undefined);
  const isTooLarge = statusFromError === 413 || String(err?.message || '').toLowerCase().includes('file size limit') || err?.code === 'LIMIT_FILE_SIZE';
  const status = isTooLarge ? 413 : (statusFromError || 500);
  const message = isTooLarge ? 'File exceeds the 50MB limit' : (err?.message || 'Internal server error');
  if (res.headersSent) return next(err);
  res.status(status).json({ success: false, error: message });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Socket.io events for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Keep alive check
  setInterval(() => {
    // console.log('Heartbeat');
  }, 10000);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
