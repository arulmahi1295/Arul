import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';

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

// RBAC Guard Component
const ProtectedRoute = ({ isAllowed, redirectPath = '/', children }) => {
  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }
  return children ? children : <Outlet />;
};

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
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
          } />

          {/* Protected Routes */}
          <Route path="/" element={
            isAuthenticated ? <Layout onLogout={handleLogout} userRole={userRole} /> : <Navigate to="/login" replace />
          }>
            <Route index element={<Dashboard />} />
            <Route path="register" element={<PatientRegistration />} />
            <Route path="phlebotomy" element={<Phlebotomy />} />
            <Route path="billing-history" element={<BillingHistory />} />
            <Route path="/samples" element={<Samples />} />
            <Route path="/accession" element={<Accession />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="home-collection" element={<HomeCollection />} />

            {/* Restricted Routes - Only Admin */}
            <Route path="/finance" element={
              <ProtectedRoute isAllowed={userRole === 'Admin'} redirectPath="/">
                <Finance />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute isAllowed={userRole === 'Admin'} redirectPath="/">
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute isAllowed={userRole === 'Admin'} redirectPath="/">
                <Inventory />
              </ProtectedRoute>
            } />
          </Route>

          {/* Print Routes */}
          <Route path="/print/invoice" element={isAuthenticated ? <PrintInvoice /> : <Navigate to="/login" />} />
          <Route path="/print/labels" element={isAuthenticated ? <PrintLabel /> : <Navigate to="/login" />} />
          <Route path="/print/patient-card" element={isAuthenticated ? <PrintPatientCard /> : <Navigate to="/login" />} />
          <Route path="/print/report" element={isAuthenticated ? <PrintReport /> : <Navigate to="/login" />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
