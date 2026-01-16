// PreSocial API Server
// Main entry point for the PreSocial backend

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';

import socialRoutes from './routes/social';
import { rateLimit } from './middleware/rateLimit';
import { getCacheStats } from '../services/cache';
import { lemmyService } from '../services/lemmy';
import { isLocalAuthEnabled } from './middleware/auth';
import { initStorage, getStorageStats } from '../services/storage';

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

/**
 * Verify Lemmy instance is accessible before starting server
 */
async function checkLemmyHealth(): Promise<{ healthy: boolean; instance?: string; version?: string; error?: string }> {
  try {
    const instanceInfo = await lemmyService.getInstanceInfo();
    if (instanceInfo) {
      return {
        healthy: true,
        instance: instanceInfo.name,
        version: instanceInfo.version,
      };
    }
    return { healthy: false, error: 'Could not get instance info' };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Start the server with health checks
 */
async function startServer() {
  console.log(`
  ____           ____             _       _
 |  _ \\ _ __ ___/ ___|  ___   ___(_) __ _| |
 | |_) | '__/ _ \\___ \\ / _ \\ / __| |/ _\` | |
 |  __/| | |  __/___) | (_) | (__| | (_| | |
 |_|   |_|  \\___|____/ \\___/ \\___|_|\\__,_|_|

  Community insights for Presearch - v0.1.0

  Performing startup checks...
  `);

  // Initialize persistent storage
  initStorage();
  const storageStats = getStorageStats();
  console.log(`  ✓ Storage initialized (${storageStats.users} users, ${storageStats.totalVotes} votes, ${storageStats.totalBookmarks} bookmarks)`);

  // Check configuration
  const lemmmyUrl = process.env.LEMMY_INSTANCE_URL || 'https://lemmy.world';
  console.log(`  Lemmy instance: ${lemmmyUrl}`);
  console.log(`  JWT verification: ${isLocalAuthEnabled() ? 'local (JWT_SECRET configured)' : 'remote (fallback to PreSuite API)'}`);

  // Check Lemmy health
  console.log(`\n  Checking Lemmy instance health...`);
  const lemmyHealth = await checkLemmyHealth();

  if (lemmyHealth.healthy) {
    console.log(`  ✓ Lemmy connected: ${lemmyHealth.instance} (v${lemmyHealth.version})`);
  } else {
    console.warn(`  ⚠ Lemmy connection failed: ${lemmyHealth.error}`);
    console.warn(`  Server will start but some features may be unavailable`);
  }

  // Start HTTP server
  console.log(`\n  Starting server on port ${port}...`);

  const { serve } = await import('@hono/node-server');

  serve({
    fetch: app.fetch,
    port,
  }, (info) => {
    console.log(`  ✓ Server listening on http://localhost:${info.port}\n`);
  });
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Also export for Bun compatibility
export default {
  port,
  fetch: app.fetch,
};
