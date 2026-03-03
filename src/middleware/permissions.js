// Permission checking middleware
function checkPermission(requiredRole) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    // Super admin has all permissions
    if (user.userType === 'super_admin') {
      return next();
    }

    // Manager role hierarchy
    const roleHierarchy = {
      manager: 3,
      supervisor: 2,
      staff: 1
    };

    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel >= requiredRoleLevel) {
      return next();
    }

    return res.status(403).json({
      error: 'Insufficient permissions',
      required: requiredRole,
      current: user.role
    });
  };
}

// Check if user is manager
function isManager(req, res, next) {
  return checkPermission('manager')(req, res, next);
}

// Check if user is supervisor or above
function isSupervisor(req, res, next) {
  return checkPermission('supervisor')(req, res, next);
}

// Check store access
function checkStoreAccess(req, res, next) {
  const user = req.user;
  const storeId = req.params.store_id || req.body.store_id || req.query.store_id;

  if (!storeId) {
    return res.status(400).json({
      error: 'Store ID is required'
    });
  }

  // Super admin can access all stores
  if (user.userType === 'super_admin') {
    return next();
  }

  // Check if user's store matches
  if (user.store_id !== storeId) {
    return res.status(403).json({
      error: 'Access denied to this store'
    });
  }

  next();
}

module.exports = {
  checkPermission,
  isManager,
  isSupervisor,
  checkStoreAccess
};