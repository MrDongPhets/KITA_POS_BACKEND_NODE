module.exports = {
  JWT_EXPIRY: '7d',
  BCRYPT_ROUNDS: 12,
  DEMO_CREDENTIALS: {
    SUPER_ADMIN: {
      email: 'admin@system.com',
      password: 'superadmin123'
    },
    BUSINESS_USER: {
      email: 'manager@demobakery.com',
      password: 'password123'
    }
  },
  API_VERSION: '2.2.0',
  MAX_REQUEST_SIZE: '10mb'
};