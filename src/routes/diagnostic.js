// src/routes/diagnostic.js - Add this file to help diagnose the issue
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', (req, res) => {
  const diagnosticInfo = {
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 3001,
      VERCEL: process.env.VERCEL || false,
      VERCEL_URL: process.env.VERCEL_URL || 'not set',
    },
    routes: {
      auth: {
        available: false,
        endpoints: []
      },
      admin: {
        available: false,
        endpoints: []
      },
      health: {
        available: false
      }
    },
    files: {
      controllers: {},
      routes: {},
      middleware: {}
    },
    database: {
      supabase_configured: !!process.env.SUPABASE_URL,
      jwt_configured: !!process.env.JWT_SECRET
    }
  };

  // Check if route files exist
  try {
    // Check auth routes
    const authPath = path.join(__dirname, 'auth');
    if (fs.existsSync(authPath)) {
      diagnosticInfo.routes.auth.available = true;
      const authFiles = fs.readdirSync(authPath);
      diagnosticInfo.files.routes.auth = authFiles;
    }

    // Check admin routes
    const adminPath = path.join(__dirname, 'admin');
    if (fs.existsSync(adminPath)) {
      diagnosticInfo.routes.admin.available = true;
      const adminFiles = fs.readdirSync(adminPath);
      diagnosticInfo.files.routes.admin = adminFiles;
    }

    // Check controllers
    const controllersPath = path.join(__dirname, '../controllers');
    if (fs.existsSync(controllersPath)) {
      const authControllersPath = path.join(controllersPath, 'auth');
      const adminControllersPath = path.join(controllersPath, 'admin');
      
      if (fs.existsSync(authControllersPath)) {
        diagnosticInfo.files.controllers.auth = fs.readdirSync(authControllersPath);
      }
      if (fs.existsSync(adminControllersPath)) {
        diagnosticInfo.files.controllers.admin = fs.readdirSync(adminControllersPath);
      }
    }

    // Check middleware
    const middlewarePath = path.join(__dirname, '../middleware');
    if (fs.existsSync(middlewarePath)) {
      diagnosticInfo.files.middleware = fs.readdirSync(middlewarePath);
    }
  } catch (error) {
    diagnosticInfo.fileSystemError = error.message;
  }

  // List all registered routes
  try {
    const app = req.app;
    const routes = [];
    
    app._router.stack.forEach(middleware => {
      if (middleware.route) {
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach(handler => {
          if (handler.route) {
            const path = middleware.regexp.source.includes('auth') ? '/auth' : 
                       middleware.regexp.source.includes('admin') ? '/admin' : 
                       middleware.regexp.source.includes('health') ? '/health' : '';
            routes.push({
              path: path + handler.route.path,
              methods: Object.keys(handler.route.methods)
            });
          }
        });
      }
    });
    
    diagnosticInfo.registeredRoutes = routes;
  } catch (error) {
    diagnosticInfo.routeListError = error.message;
  }

  res.json(diagnosticInfo);
});

module.exports = router;