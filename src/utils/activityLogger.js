// Activity Logging System
import { storage } from '../data/storage';
import { getUserSession } from './permissions';

// Log severity levels
export const SEVERITY = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    CRITICAL: 'CRITICAL'
};

// Action types for categorization
export const ACTION_TYPES = {
    // Authentication
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    SESSION_EXPIRED: 'SESSION_EXPIRED',

    // Patient Management
    PATIENT_CREATED: 'PATIENT_CREATED',
    PATIENT_UPDATED: 'PATIENT_UPDATED',
    PATIENT_DELETED: 'PATIENT_DELETED',
    PATIENT_VIEWED: 'PATIENT_VIEWED',

    // Orders & Phlebotomy
    ORDER_CREATED: 'ORDER_CREATED',
    ORDER_UPDATED: 'ORDER_UPDATED',
    ORDER_DELETED: 'ORDER_DELETED',
    SAMPLE_COLLECTED: 'SAMPLE_COLLECTED',

    // Reports
    REPORT_GENERATED: 'REPORT_GENERATED',
    REPORT_VIEWED: 'REPORT_VIEWED',
    REPORT_PRINTED: 'REPORT_PRINTED',
    REPORT_DOWNLOADED: 'REPORT_DOWNLOADED',
    REPORT_SENT: 'REPORT_SENT',

    // Payments
    PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
    PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',

    // Inventory
    INVENTORY_UPDATED: 'INVENTORY_UPDATED',
    INVENTORY_ALERT: 'INVENTORY_ALERT',

    // Admin Actions
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    USER_DELETED: 'USER_DELETED',
    USER_LOCKED: 'USER_LOCKED',
    USER_UNLOCKED: 'USER_UNLOCKED',
    SETTINGS_CHANGED: 'SETTINGS_CHANGED',
    PRICING_UPDATED: 'PRICING_UPDATED',

    // System
    SYSTEM_ERROR: 'SYSTEM_ERROR',
    ACCESS_DENIED: 'ACCESS_DENIED',
    DATA_EXPORT: 'DATA_EXPORT',
    DATA_IMPORT: 'DATA_IMPORT'
};

// Module categories
export const MODULES = {
    AUTH: 'AUTHENTICATION',
    PATIENT: 'PATIENT_MANAGEMENT',
    PHLEBOTOMY: 'PHLEBOTOMY',
    REPORTS: 'REPORTS',
    FINANCE: 'FINANCE',
    INVENTORY: 'INVENTORY',
    ADMIN: 'ADMIN',
    SYSTEM: 'SYSTEM'
};

/**
 * Generate a unique log ID
 * @returns {string}
 */
const generateLogId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `LOG-${timestamp}-${random}`;
};

/**
 * Log an activity
 * @param {string} action - Action type from ACTION_TYPES
 * @param {string} details - Detailed description of the action
 * @param {string} module - Module from MODULES
 * @param {string} severity - Severity level from SEVERITY (default: INFO)
 * @param {Object} metadata - Additional metadata (optional)
 * @returns {Promise<void>}
 */
export const logActivity = async (
    action,
    details,
    module = MODULES.SYSTEM,
    severity = SEVERITY.INFO,
    metadata = {}
) => {
    try {
        const session = getUserSession();

        const logEntry = {
            id: generateLogId(),
            timestamp: new Date().toISOString(),
            userId: session?.id || 'SYSTEM',
            username: session?.user || 'System',
            userRole: session?.role || 'System',
            action,
            details,
            module,
            severity,
            metadata,
            // Additional context
            userAgent: navigator.userAgent,
            url: window.location.pathname
        };

        // Save to storage
        await storage.saveActivityLog(logEntry);

        // Console log for development
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${severity}] ${action}:`, details, metadata);
        }

        return logEntry;
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't throw - logging failures shouldn't break the app
    }
};

/**
 * Log authentication events
 */
export const logAuth = {
    loginSuccess: (username, userId) =>
        logActivity(
            ACTION_TYPES.LOGIN_SUCCESS,
            `User ${username} logged in successfully`,
            MODULES.AUTH,
            SEVERITY.INFO,
            { username, userId }
        ),

    loginFailed: (username, reason = 'Invalid credentials') =>
        logActivity(
            ACTION_TYPES.LOGIN_FAILED,
            `Failed login attempt for ${username}: ${reason}`,
            MODULES.AUTH,
            SEVERITY.WARNING,
            { username, reason }
        ),

    logout: (username) =>
        logActivity(
            ACTION_TYPES.LOGOUT,
            `User ${username} logged out`,
            MODULES.AUTH,
            SEVERITY.INFO,
            { username }
        ),

    sessionExpired: (username) =>
        logActivity(
            ACTION_TYPES.SESSION_EXPIRED,
            `Session expired for ${username}`,
            MODULES.AUTH,
            SEVERITY.INFO,
            { username }
        )
};

/**
 * Log patient management events
 */
export const logPatient = {
    created: (patientId, patientName) =>
        logActivity(
            ACTION_TYPES.PATIENT_CREATED,
            `Created patient: ${patientName} (${patientId})`,
            MODULES.PATIENT,
            SEVERITY.INFO,
            { patientId, patientName }
        ),

    updated: (patientId, patientName, changes) =>
        logActivity(
            ACTION_TYPES.PATIENT_UPDATED,
            `Updated patient: ${patientName} (${patientId})`,
            MODULES.PATIENT,
            SEVERITY.INFO,
            { patientId, patientName, changes }
        ),

    deleted: (patientId, patientName) =>
        logActivity(
            ACTION_TYPES.PATIENT_DELETED,
            `Deleted patient: ${patientName} (${patientId})`,
            MODULES.PATIENT,
            SEVERITY.WARNING,
            { patientId, patientName }
        )
};

/**
 * Log order/phlebotomy events
 */
export const logOrder = {
    created: (orderId, patientName, tests) =>
        logActivity(
            ACTION_TYPES.ORDER_CREATED,
            `Created order ${orderId} for ${patientName} (${tests.length} tests)`,
            MODULES.PHLEBOTOMY,
            SEVERITY.INFO,
            { orderId, patientName, testCount: tests.length }
        ),

    updated: (orderId, changes) =>
        logActivity(
            ACTION_TYPES.ORDER_UPDATED,
            `Updated order ${orderId}`,
            MODULES.PHLEBOTOMY,
            SEVERITY.INFO,
            { orderId, changes }
        ),

    sampleCollected: (orderId, patientName) =>
        logActivity(
            ACTION_TYPES.SAMPLE_COLLECTED,
            `Sample collected for order ${orderId} (${patientName})`,
            MODULES.PHLEBOTOMY,
            SEVERITY.INFO,
            { orderId, patientName }
        )
};

/**
 * Log report events
 */
export const logReport = {
    generated: (reportId, patientName) =>
        logActivity(
            ACTION_TYPES.REPORT_GENERATED,
            `Generated report ${reportId} for ${patientName}`,
            MODULES.REPORTS,
            SEVERITY.INFO,
            { reportId, patientName }
        ),

    viewed: (reportId, patientName) =>
        logActivity(
            ACTION_TYPES.REPORT_VIEWED,
            `Viewed report ${reportId} for ${patientName}`,
            MODULES.REPORTS,
            SEVERITY.INFO,
            { reportId, patientName }
        ),

    printed: (reportId, patientName) =>
        logActivity(
            ACTION_TYPES.REPORT_PRINTED,
            `Printed report ${reportId} for ${patientName}`,
            MODULES.REPORTS,
            SEVERITY.INFO,
            { reportId, patientName }
        ),

    downloaded: (reportId, patientName) =>
        logActivity(
            ACTION_TYPES.REPORT_DOWNLOADED,
            `Downloaded report ${reportId} for ${patientName}`,
            MODULES.REPORTS,
            SEVERITY.INFO,
            { reportId, patientName }
        )
};

/**
 * Log payment events
 */
export const logPayment = {
    received: (orderId, amount, mode) =>
        logActivity(
            ACTION_TYPES.PAYMENT_RECEIVED,
            `Payment received: ₹${amount} for order ${orderId} (${mode})`,
            MODULES.FINANCE,
            SEVERITY.INFO,
            { orderId, amount, mode }
        ),

    refunded: (orderId, amount, reason) =>
        logActivity(
            ACTION_TYPES.PAYMENT_REFUNDED,
            `Refund processed: ₹${amount} for order ${orderId} - ${reason}`,
            MODULES.FINANCE,
            SEVERITY.WARNING,
            { orderId, amount, reason }
        )
};

/**
 * Log admin events
 */
export const logAdmin = {
    userCreated: (username, role) =>
        logActivity(
            ACTION_TYPES.USER_CREATED,
            `Created user: ${username} (${role})`,
            MODULES.ADMIN,
            SEVERITY.INFO,
            { username, role }
        ),

    userUpdated: (username, changes) =>
        logActivity(
            ACTION_TYPES.USER_UPDATED,
            `Updated user: ${username}`,
            MODULES.ADMIN,
            SEVERITY.INFO,
            { username, changes }
        ),

    userDeleted: (username) =>
        logActivity(
            ACTION_TYPES.USER_DELETED,
            `Deleted user: ${username}`,
            MODULES.ADMIN,
            SEVERITY.WARNING,
            { username }
        ),

    settingsChanged: (setting, oldValue, newValue) =>
        logActivity(
            ACTION_TYPES.SETTINGS_CHANGED,
            `Changed setting: ${setting}`,
            MODULES.ADMIN,
            SEVERITY.INFO,
            { setting, oldValue, newValue }
        ),

    pricingUpdated: (testName, oldPrice, newPrice) =>
        logActivity(
            ACTION_TYPES.PRICING_UPDATED,
            `Updated pricing for ${testName}: ₹${oldPrice} → ₹${newPrice}`,
            MODULES.ADMIN,
            SEVERITY.INFO,
            { testName, oldPrice, newPrice }
        )
};

/**
 * Log system events
 */
export const logSystem = {
    error: (errorMessage, errorStack) =>
        logActivity(
            ACTION_TYPES.SYSTEM_ERROR,
            `System error: ${errorMessage}`,
            MODULES.SYSTEM,
            SEVERITY.ERROR,
            { errorMessage, errorStack }
        ),

    accessDenied: (attemptedPage, userRole) =>
        logActivity(
            ACTION_TYPES.ACCESS_DENIED,
            `Access denied to ${attemptedPage} for role ${userRole}`,
            MODULES.SYSTEM,
            SEVERITY.WARNING,
            { attemptedPage, userRole }
        ),

    dataExport: (dataType, recordCount) =>
        logActivity(
            ACTION_TYPES.DATA_EXPORT,
            `Exported ${recordCount} ${dataType} records`,
            MODULES.SYSTEM,
            SEVERITY.INFO,
            { dataType, recordCount }
        )
};

export default {
    logActivity,
    logAuth,
    logPatient,
    logOrder,
    logReport,
    logPayment,
    logAdmin,
    logSystem,
    SEVERITY,
    ACTION_TYPES,
    MODULES
};
