// src/utils/permissionsHelper.js
// Helper functions for permission checking

const ROLE_HIERARCHY = {
  manager: 3,
  supervisor: 2,
  staff: 1
};

const PERMISSION_REQUIREMENTS = {
  // POS Operations
  process_sale: 1,              // staff and above
  open_cash_drawer: 1,          // staff and above
  view_products: 1,             // staff and above
  search_products: 1,           // staff and above
  scan_barcode: 1,              // staff and above
  print_receipt: 1,             // staff and above
  
  // Restricted POS Operations
  void_transaction: 2,          // supervisor and above
  apply_discount: 2,            // supervisor and above
  process_refund: 3,            // manager only
  price_override: 3,            // manager only
  
  // Reports & Analytics
  view_reports: 2,              // supervisor and above
  view_staff_performance: 2,    // supervisor and above
  export_reports: 3,            // manager only
  
  // Inventory Management
  view_inventory: 1,            // staff and above
  adjust_inventory: 3,          // manager only
  manage_products: 3,           // manager only
  
  // Staff Management
  view_staff: 2,                // supervisor and above
  manage_staff: 3,              // manager only
  
  // End of Day
  end_of_day: 2                 // supervisor and above
};

/**
 * Check if a role has permission for an action
 * @param {string} role - The role to check (staff, supervisor, manager)
 * @param {string} action - The action to check permission for
 * @returns {boolean} - True if role has permission
 */
function hasPermission(role, action) {
  const roleLevel = ROLE_HIERARCHY[role] || 0;
  const requiredLevel = PERMISSION_REQUIREMENTS[action] || 3;
  
  return roleLevel >= requiredLevel;
}

/**
 * Get all permissions for a role
 * @param {string} role - The role to get permissions for
 * @returns {object} - Object with all permissions and their boolean values
 */
function getRolePermissions(role) {
  const roleLevel = ROLE_HIERARCHY[role] || 0;
  const permissions = {};
  
  for (const [action, requiredLevel] of Object.entries(PERMISSION_REQUIREMENTS)) {
    permissions[action] = roleLevel >= requiredLevel;
  }
  
  return permissions;
}

/**
 * Check if an action requires manager override
 * @param {string} userRole - Current user's role
 * @param {string} action - Action being attempted
 * @returns {boolean} - True if manager override is needed
 */
function requiresManagerOverride(userRole, action) {
  return !hasPermission(userRole, action);
}

/**
 * Get minimum role required for an action
 * @param {string} action - The action to check
 * @returns {string} - Minimum role required (staff, supervisor, manager)
 */
function getMinimumRole(action) {
  const requiredLevel = PERMISSION_REQUIREMENTS[action] || 3;
  
  for (const [role, level] of Object.entries(ROLE_HIERARCHY)) {
    if (level >= requiredLevel) {
      return role;
    }
  }
  
  return 'manager';
}

/**
 * Check if a role can authorize an override for another role
 * @param {string} authorizingRole - Role of person authorizing
 * @param {string} action - Action being authorized
 * @returns {boolean} - True if can authorize
 */
function canAuthorizeOverride(authorizingRole, action) {
  return hasPermission(authorizingRole, action);
}

module.exports = {
  ROLE_HIERARCHY,
  PERMISSION_REQUIREMENTS,
  hasPermission,
  getRolePermissions,
  requiresManagerOverride,
  getMinimumRole,
  canAuthorizeOverride
};