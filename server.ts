import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { connectDB } from './src/backend/config/db';
import authRoutes from './src/backend/routes/authRoutes';
import explainRoutes from './src/backend/routes/explainRoutes';
import { errorHandler } from './src/backend/middleware/errorHandler';

// Initialize configuration
dotenv.config();

const app = express();
const PORT = 3000;

// Connect to Database gracefully
connectDB();

// Disable Express fingerprinting header for security
app.disable('x-powered-by');

// Register custom security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Middlewares
app.use(express.json({ limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MVC Routes
app.use('/api/auth', authRoutes);
app.use('/api', explainRoutes); // This mounts /api/analyze, /api/history

// Error Handling Middleware
app.use(errorHandler as any);

// Vite middleware configuration for development vs production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ AI Code Explainer Server running on port ${PORT}`);
  });
}

startServer();
