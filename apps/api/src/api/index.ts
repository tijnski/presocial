// PreSocial API Server
// Main entry point for the PreSocial backend

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import socialRoutes from './routes/social';
import { rateLimit } from './middleware/rateLimit';
import { getCacheStats } from '../services/cache';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', secureHeaders());

// CORS configuration for PreSuite domains
app.use('*', cors({
  origin: [
    'https://presearch.com',
    'https://www.presearch.com',
    'https://presuite.eu',
    'https://predrive.eu',
    'https://premail.site',
    'https://preoffice.site',
    // Development
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400,
  credentials: true,
}));

// Rate limiting
app.use('/api/*', rateLimit());

// Mount routes
app.route('/api/social', socialRoutes);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    service: 'PreSocial API',
    version: '0.1.0',
    description: 'Community insights for Presearch - powered by Lemmy',
    documentation: 'https://github.com/tijnski/presocial',
    endpoints: {
      search: 'GET /api/social/search?q=<query>',
      post: 'GET /api/social/post/:id',
      communities: 'GET /api/social/communities',
      trending: 'GET /api/social/trending',
      health: 'GET /api/social/health',
    },
  });
});

// System health endpoint
app.get('/health', async (c) => {
  const cacheStats = await getCacheStats();

  return c.json({
    status: 'healthy',
    service: 'presocial',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cache: cacheStats,
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('[PreSocial] Unhandled error:', err);

  return c.json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  }, 500);
});

// Server startup
const port = parseInt(process.env.PORT || '3002');

console.log(`
  ____           ____             _       _
 |  _ \\ _ __ ___/ ___|  ___   ___(_) __ _| |
 | |_) | '__/ _ \\___ \\ / _ \\ / __| |/ _\` | |
 |  __/| | |  __/___) | (_) | (__| | (_| | |
 |_|   |_|  \\___|____/ \\___/ \\___|_|\\__,_|_|

  Community insights for Presearch - v0.1.0

  Server starting on port ${port}...
  Lemmy instance: ${process.env.LEMMY_INSTANCE_URL || 'https://lemmy.world'}
`);

export default {
  port,
  fetch: app.fetch,
};
