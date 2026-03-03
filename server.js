// server.js - SECURED VERSION
require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const { initializeDatabase } = require('./src/config/database');
const { configureCORS } = require('./src/config/cors');
const { requestLogger } = require('./src/middleware/logger');
const { errorHandler } = require('./src/middleware/errorHandler');
const routes = require('./src/routes');
const { ensureDemoData } = require('./src/services/demoDataService');
const uploadRoutes = require('./src/routes/client/upload');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(configureCORS());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use('/api/client/upload', uploadRoutes);

// ============================================
// SWAGGER API DOCUMENTATION (Development Only)
// ============================================
if (!isProduction) {
  // Swagger available at /api-docs in development
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'KitaPOS API Documentation - DEVELOPMENT',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .information-container { margin: 20px 0 }
      .swagger-ui .scheme-container { margin: 20px 0; background: #fafafa; padding: 10px; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      displayOperationId: false,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai'
      }
    }
  }));

  // Swagger JSON endpoint (development only)
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger docs enabled at /api-docs (DEVELOPMENT MODE)');
} else {
  // Block Swagger in production
  app.use('/api-docs', (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.get('/api-docs.json', (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  console.log('🔒 Swagger disabled (PRODUCTION MODE)');
}

// Root endpoint - Simple API info (no sensitive data)
app.get('/', (req, res) => {
  res.json({
    name: 'KitaPOS API',
    version: '2.2.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    documentation: isProduction ? 'Available in development mode only' : '/api-docs'
  });
});

// Add diagnostic route (only in development or with special header)
app.get('/diagnostic', (req, res) => {
  if (!isProduction || req.headers['x-diagnostic-key'] === process.env.DIAGNOSTIC_KEY) {
    const diagnostic = require('./src/routes/diagnostic');
    return diagnostic(req, res);
  }
  res.status(404).json({ error: 'Not found' });
});

// Mount all routes
app.use('/', routes);

// Error Handler
app.use(errorHandler);

// 404 Handler
app.use('*', (req, res) => {
  const response = { 
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  };
  
  // Only show available endpoints in development
  if (!isProduction) {
    response.documentation = '/api-docs';
    response.availableEndpoints = {
      documentation: 'GET /api-docs',
      health: 'GET /health',
      auth: [
        'POST /auth/login',
        'POST /auth/super-admin/login',
        'POST /auth/register-company',
        'GET /auth/verify',
        'POST /auth/logout'
      ],
      admin: [
        'GET /admin/companies',
        'GET /admin/users',
        'GET /admin/stats/users',
        'GET /admin/stats/subscriptions'
      ],
      client: [
        'GET /client/dashboard/*',
        'GET /client/products',
        'GET /client/categories',
        'GET /client/stores'
      ],
      reports: [
        'GET /reports/sales',
        'GET /reports/inventory',
        'GET /reports/financial'
      ]
    };
  }
  
  res.status(404).json(response);
});

// Initialize and Start Server
async function startServer() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║       🚀 KitaPOS Backend API Server               ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`🔍 Environment:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Port:         ${PORT}`);
  
  // Initialize Database
  const dbInitialized = await initializeDatabase();
  
  if (dbInitialized) {
    console.log('✅ Database initialized successfully');
    // Ensure demo data exists
    await ensureDemoData();
    console.log('✅ Demo data verified');
  } else {
    console.error('❌ Failed to initialize database. Server running in degraded mode.');
  }
  
  const server = app.listen(PORT, () => {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : `http://localhost:${PORT}`;
    
    console.log('');
    console.log('════════════════════════════════════════════════════');
    console.log('✅ Server is running and ready!');
    console.log('════════════════════════════════════════════════════');
    console.log(`📱 API Base:     ${baseUrl}`);
    console.log(`🔍 Health:       ${baseUrl}/health`);
    
    // Only show documentation URL in development
    if (!isProduction) {
      console.log(`📚 API Docs:     ${baseUrl}/api-docs`);
      console.log(`📄 OpenAPI:      ${baseUrl}/api-docs.json`);
      console.log('');
      console.log('📋 Quick Access Endpoints:');
      console.log('   Authentication:  POST /auth/login');
      console.log('   Super Admin:     POST /auth/super-admin/login');
      console.log('   Companies:       GET  /admin/companies');
      console.log('   Products:        GET  /client/products');
      console.log('   Sales Reports:   GET  /reports/sales');
      console.log('');
      console.log('🔐 Demo Credentials:');
      console.log('   Client:      manager@demobakery.com / password123');
      console.log('   Super Admin: admin@system.com / superadmin123');
    } else {
      console.log('🔒 API Documentation: Disabled in production');
      console.log('🔒 Demo Credentials: Hidden in production');
    }
    
    console.log('════════════════════════════════════════════════════');
  });

  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Process terminated');
    });
  });
}

startServer();

module.exports = app;