const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'NO_TOKEN'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      let errorCode = 'INVALID_TOKEN';
      let errorMessage = 'Invalid or expired token';

      if (err.name === 'TokenExpiredError') {
        errorCode = 'TOKEN_EXPIRED';
        errorMessage = 'Token has expired';
      } else if (err.name === 'JsonWebTokenError') {
        errorCode = 'TOKEN_MALFORMED';
        errorMessage = 'Token is malformed';
      }

      return res.status(403).json({ 
        error: errorMessage,
        code: errorCode
      });
    }
    
    req.user = user;
    next();
  });
}

function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.userType !== 'super_admin') {
    return res.status(403).json({
      error: 'Super admin access required',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }
  next();
}

function requireClient(req, res, next) {
  if (!req.user || req.user.userType !== 'client') {
    return res.status(403).json({
      error: 'Client access required',
      code: 'CLIENT_REQUIRED'
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireSuperAdmin,
  requireClient
};