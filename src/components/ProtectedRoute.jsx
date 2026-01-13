import React from 'react';
import { Navigate } from 'react-router-dom';
import { canAccessPage, getUserSession } from '../utils/permissions';
import { logSystem } from '../utils/activityLogger';

/**
 * Protected Route Component
 * Checks if user has permission to access the route
 * Redirects to dashboard with error message if unauthorized
 */
const ProtectedRoute = ({ children, path }) => {
    const session = getUserSession();

    // Check if user is logged in
    if (!session || !session.role) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has permission to access this page
    const hasAccess = canAccessPage(session.role, path);

    if (!hasAccess) {
        // Log unauthorized access attempt
        logSystem.accessDenied(path, session.role);

        // Redirect to dashboard with error message
        return <Navigate to="/" state={{ accessDenied: true, attemptedPath: path }} replace />;
    }

    // User has access, render the protected content
    return children;
};

export default ProtectedRoute;
