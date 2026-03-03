function errorHandler(error, req, res, next) {
  console.error('Unhandled error:', error.message);
  
  if (error.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS policy violation',
      code: 'CORS_ERROR'
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    code: 'UNHANDLED_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { details: error.message })
  });
}

module.exports = { errorHandler };