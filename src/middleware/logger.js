function requestLogger(req, res, next) {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    const logBody = { ...req.body };
    if (logBody.password) logBody.password = '***';
    console.log('   Body:', JSON.stringify(logBody));
  }
  
  next();
}

module.exports = { requestLogger };