// Role-Based Access Control (RBAC) System

// Define permissions for each role
export const ROLES = {
    STAFF: 'Staff',
    MANAGER: 'Manager',
    ADMIN: 'Admin'
};

// Define all available permissions
export const PERMISSIONS = {
    // Dashboard
    VIEW_DASHBOARD: 'view_dashboard',

    // Patient Management
    CREATE_PATIENT: 'create_patient',
    EDIT_PATIENT: 'edit_patient',
    DELETE_PATIENT: 'delete_patient',
    VIEW_PATIENT: 'view_patient',

    // Orders & Phlebotomy
    CREATE_ORDER: 'create_order',
    EDIT_ORDER: 'edit_order',
    DELETE_ORDER: 'delete_order',
    VIEW_ORDER: 'view_order',
    COLLECT_SAMPLE: 'collect_sample',

    // Reports
    VIEW_OWN_REPORTS: 'view_own_reports',
    VIEW_ALL_REPORTS: 'view_all_reports',
    GENERATE_REPORT: 'generate_report',
    EDIT_REPORT: 'edit_report',

    // Inventory
    VIEW_INVENTORY: 'view_inventory',
    MANAGE_INVENTORY: 'manage_inventory',

    // Finance
    VIEW_FINANCE: 'view_finance',
    MANAGE_FINANCE: 'manage_finance',
    PROCESS_PAYMENT: 'process_payment',

    // Admin
    ACCESS_ADMIN: 'access_admin',
    MANAGE_USERS: 'manage_users',
    MANAGE_SETTINGS: 'manage_settings',
    VIEW_LOGS: 'view_logs',
    MANAGE_PRICING: 'manage_pricing'
};

// Role-Permission mapping
const rolePermissions = {
    [ROLES.STAFF]: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.CREATE_PATIENT,
        PERMISSIONS.VIEW_PATIENT,
        PERMISSIONS.CREATE_ORDER,
        PERMISSIONS.VIEW_ORDER,
        PERMISSIONS.COLLECT_SAMPLE,
        PERMISSIONS.VIEW_OWN_REPORTS,
        PERMISSIONS.PROCESS_PAYMENT
    ],

    [ROLES.MANAGER]: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.CREATE_PATIENT,
        PERMISSIONS.EDIT_PATIENT,
        PERMISSIONS.VIEW_PATIENT,
        PERMISSIONS.CREATE_ORDER,
        PERMISSIONS.EDIT_ORDER,
        PERMISSIONS.VIEW_ORDER,
        PERMISSIONS.COLLECT_SAMPLE,
        PERMISSIONS.VIEW_ALL_REPORTS,
        PERMISSIONS.GENERATE_REPORT,
        PERMISSIONS.VIEW_INVENTORY,
        PERMISSIONS.VIEW_FINANCE,
        PERMISSIONS.PROCESS_PAYMENT
    ],

    [ROLES.ADMIN]: [
        // Admin has all permissions
        ...Object.values(PERMISSIONS)
    ]
};

// Page-Role mapping (which roles can access which pages)
export const PAGE_PERMISSIONS = {
    '/': [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN], // Dashboard
    '/register': [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN], // Patient Registration
    '/phlebotomy': [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN], // Phlebotomy/Orders
    '/billing-history': [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN], // Billing History
    '/samples': [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN], // Sample Management
    '/accession': [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN], // Accession
    '/reports': [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN], // Reports
    '/home-collection': [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN], // Home Collection
    '/inventory': [ROLES.MANAGER, ROLES.ADMIN], // Inventory - Manager+ only
    '/finance': [ROLES.MANAGER, ROLES.ADMIN], // Finance - Manager+ only
    '/admin': [ROLES.ADMIN], // Admin Console - Admin only

    // Print routes - all authenticated users
    '/print/invoice': [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN],
    '/print/labels': [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN],
    '/print/patient-card': [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN],
    '/print/report': [ROLES.STAFF, ROLES.MANAGER, ROLES.ADMIN]
};

/**
 * Check if a user has a specific permission
 * @param {string} userRole - User's role (Staff, Manager, Admin)
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (userRole, permission) => {
    if (!userRole || !permission) return false;
    const permissions = rolePermissions[userRole] || [];
    return permissions.includes(permission);
};

/**
 * Check if a user can access a specific page
 * @param {string} userRole - User's role
 * @param {string} path - Page path
 * @returns {boolean}
 */
export const canAccessPage = (userRole, path) => {
    if (!userRole) return false;

    // Find matching route (handle dynamic routes)
    const allowedRoles = PAGE_PERMISSIONS[path] || [];
    return allowedRoles.includes(userRole);
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {Array<string>}
 */
export const getRolePermissions = (role) => {
    return rolePermissions[role] || [];
};

/**
 * Check if user has any of the specified permissions
 * @param {string} userRole - User's role
 * @param {Array<string>} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAnyPermission = (userRole, permissions) => {
    return permissions.some(permission => hasPermission(userRole, permission));
};

/**
 * Check if user has all of the specified permissions
 * @param {string} userRole - User's role
 * @param {Array<string>} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAllPermissions = (userRole, permissions) => {
    return permissions.every(permission => hasPermission(userRole, permission));
};

/**
 * Get user session from localStorage
 * @returns {Object|null}
 */
export const getUserSession = () => {
    try {
        const session = localStorage.getItem('lis_auth');
        return session ? JSON.parse(session) : null;
    } catch (error) {
        console.error('Error reading user session:', error);
        return null;
    }
};

/**
 * Get current user's role
 * @returns {string|null}
 */
export const getCurrentUserRole = () => {
    const session = getUserSession();
    return session?.role || null;
};

/**
 * Check if current user has permission
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const currentUserCan = (permission) => {
    const role = getCurrentUserRole();
    return hasPermission(role, permission);
};

/**
 * Check if current user can access page
 * @param {string} path - Page path
 * @returns {boolean}
 */
export const currentUserCanAccessPage = (path) => {
    const role = getCurrentUserRole();
    return canAccessPage(role, path);
};

export default {
    ROLES,
    PERMISSIONS,
    PAGE_PERMISSIONS,
    hasPermission,
    canAccessPage,
    getRolePermissions,
    hasAnyPermission,
    hasAllPermissions,
    getUserSession,
    getCurrentUserRole,
    currentUserCan,
    currentUserCanAccessPage
};
