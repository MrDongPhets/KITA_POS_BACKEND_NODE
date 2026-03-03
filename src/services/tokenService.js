const jwt = require('jsonwebtoken');
const { JWT_EXPIRY } = require('../config/constants');

function generateToken(user, userType = 'client') {
  const payload = {
    id: user.id,
    email: user.email,
    userType: userType
  };

  if (userType === 'super_admin') {
    payload.permissions = user.permissions || {};
  } else if (userType === 'staff') { 
    payload.role = user.role;
    payload.company_id = user.company_id;
    payload.store_id = user.store_id;
  } else {
    payload.role = user.role;
    payload.company_id = user.company_id;
    payload.store_id = user.store_id;
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  generateToken,
  verifyToken
};