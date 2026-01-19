import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TestProvider } from './contexts/TestContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy Loading for Performance
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const PatientRegistration = React.lazy(() => import('./pages/PatientRegistration'));
const Phlebotomy = React.lazy(() => import('./pages/Phlebotomy'));
const BillingHistory = React.lazy(() => import('./pages/BillingHistory'));
const Samples = React.lazy(() => import('./pages/Samples'));
const Accession = React.lazy(() => import('./pages/Accession'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Finance = React.lazy(() => import('./pages/Finance'));
const Admin = React.lazy(() => import('./pages/Admin'));
const HomeCollection = React.lazy(() => import('./pages/HomeCollection'));
const Inventory = React.lazy(() => import('./pages/Inventory'));

// Print Components
const PrintInvoice = React.lazy(() => import('./components/PrintInvoice'));
const PrintLabel = React.lazy(() => import('./components/PrintLabel'));
const PrintPatientCard = React.lazy(() => import('./components/PrintPatientCard'));
const PrintReport = React.lazy(() => import('./components/PrintReport'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const authString = localStorage.getItem('lis_auth');
    if (authString) {
      try {
        const auth = JSON.parse(authString);
        setIsAuthenticated(true);
        setUserRole(auth.role || 'Staff'); // Default to Staff if role missing
      } catch (e) {
        console.error("Auth Parsing Error", e);
        localStorage.removeItem('lis_auth');
      }
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
    }
    setLoading(false);
  }, []);

  const handleLogin = (sessionData) => {
    setIsAuthenticated(true);
    setUserRole(sessionData.role);
  };

  const handleLogout = () => {
    localStorage.removeItem('lis_auth');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (loading) return null;

  return (
    <TestProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
            } />

            {/* Protected Routes with Layout */}
            <Route path="/" element={
              isAuthenticated ? <Layout onLogout={handleLogout} userRole={userRole} /> : <Navigate to="/login" replace />
            }>
              {/* Dashboard - All roles */}
              <Route index element={
                <ProtectedRoute path="/">
                  <Dashboard />
                </ProtectedRoute>
              } />

              {/* Patient Registration - All roles */}
              <Route path="register" element={
                <ProtectedRoute path="/register">
                  <PatientRegistration />
                </ProtectedRoute>
              } />

              {/* Phlebotomy - All roles */}
              <Route path="phlebotomy" element={
                <ProtectedRoute path="/phlebotomy">
                  <Phlebotomy />
                </ProtectedRoute>
              } />

              {/* Billing History - All roles */}
              <Route path="billing-history" element={
                <ProtectedRoute path="/billing-history">
                  <BillingHistory />
                </ProtectedRoute>
              } />

              {/* Samples - All roles */}
              <Route path="/samples" element={
                <ProtectedRoute path="/samples">
                  <Samples />
                </ProtectedRoute>
              } />

              {/* Accession - All roles */}
              <Route path="/accession" element={
                <ProtectedRoute path="/accession">
                  <Accession />
                </ProtectedRoute>
              } />

              {/* Reports - All roles */}
              <Route path="/reports" element={
                <ProtectedRoute path="/reports">
                  <Reports />
                </ProtectedRoute>
              } />

              {/* Home Collection - All roles */}
              <Route path="home-collection" element={
                <ProtectedRoute path="/home-collection">
                  <HomeCollection />
                </ProtectedRoute>
              } />

              {/* Finance - Manager and Admin only */}
              <Route path="/finance" element={
                <ProtectedRoute path="/finance">
                  <Finance />
                </ProtectedRoute>
              } />

              {/* Inventory - Manager and Admin only */}
              <Route path="/inventory" element={
                <ProtectedRoute path="/inventory">
                  <Inventory />
                </ProtectedRoute>
              } />
            </Route>

            {/* Admin Console - Admin only (outside Layout) */}
            <Route path="/admin" element={
              <ProtectedRoute path="/admin">
                <Admin />
              </ProtectedRoute>
            } />

            {/* Print Routes - All authenticated users */}
            <Route path="/print/invoice" element={
              isAuthenticated ? (
                <ProtectedRoute path="/print/invoice">
                  <PrintInvoice />
                </ProtectedRoute>
              ) : <Navigate to="/login" />
            } />

            <Route path="/print/labels" element={
              isAuthenticated ? (
                <ProtectedRoute path="/print/labels">
                  <PrintLabel />
                </ProtectedRoute>
              ) : <Navigate to="/login" />
            } />

            <Route path="/print/patient-card" element={
              isAuthenticated ? (
                <ProtectedRoute path="/print/patient-card">
                  <PrintPatientCard />
                </ProtectedRoute>
              ) : <Navigate to="/login" />
            } />

            <Route path="/print/report" element={
              isAuthenticated ? (
                <ProtectedRoute path="/print/report">
                  <PrintReport />
                </ProtectedRoute>
              ) : <Navigate to="/login" />
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TestProvider>
  );
}

export default App;
