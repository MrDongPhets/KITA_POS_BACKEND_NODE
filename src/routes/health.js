const express = require('express');
const router = express.Router();
const { getSupabase, testDatabaseConnection } = require('../config/database');

router.get('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    let healthData = {
      status: 'checking',
      database: 'testing',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || 3001,
      response_time_ms: 0,
      auth: {
        jwt_configured: !!process.env.JWT_SECRET,
        endpoints_active: true
      },
      cors: {
        enabled: true,
        origins: [
          'http://localhost:3000',
          'http://127.0.0.1:3000'
        ]
      }
    };

    try {
      getSupabase(); // Check if initialized
      const testResult = await testDatabaseConnection();
      
      if (testResult.success) {
        healthData.status = 'healthy';
        healthData.database = 'connected';
        healthData.company_count = testResult.count || 0;
      } else {
        healthData.status = 'degraded';
        healthData.database = 'disconnected';
        healthData.error = testResult.error;
      }
    } catch {
      healthData.status = 'degraded';
      healthData.database = 'not_initialized';
    }
    
    healthData.response_time_ms = Date.now() - startTime;
    res.status(200).json(healthData);

  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;