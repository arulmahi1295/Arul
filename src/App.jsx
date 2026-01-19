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
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 fixed inset-0 z-50 overflow-hidden">
    {/* Background Mesh for Loader */}
    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(at_50%_50%,rgba(99,102,241,0.15)_0,transparent_50%)]"></div>

    <div className="relative flex flex-col items-center animate-in fade-in zoom-in duration-500">
      <div className="relative mb-8">
        {/* Outer Ring */}
        <div className="h-20 w-20 rounded-full border-4 border-slate-100/50"></div>
        {/* Spinning Gradient Ring */}
        <div className="absolute inset-0 h-20 w-20 rounded-full border-4 border-t-indigo-600 border-r-violet-500 border-b-transparent border-l-transparent animate-spin"></div>
        {/* Inner Pulse */}
        <div className="absolute inset-0 m-auto h-12 w-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full animate-pulse-soft shadow-lg shadow-indigo-500/30"></div>
      </div>

      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-violet-700 to-emerald-600 tracking-tight mb-2">
        GreenHealth
      </h2>
      <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">Ultra Legend Pro</p>
      <div className="h-1 w-24 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 w-1/2 animate-[shimmer_1.5s_infinite_linear] rounded-full"></div>
      </div>
    </div>
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
