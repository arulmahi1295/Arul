import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
// Lazy Loading for Performance
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const PatientRegistration = React.lazy(() => import('./pages/PatientRegistration'));
const Phlebotomy = React.lazy(() => import('./pages/Phlebotomy'));
const Samples = React.lazy(() => import('./pages/Samples'));
const Accession = React.lazy(() => import('./pages/Accession')); // New
const Reports = React.lazy(() => import('./pages/Reports'));
const Finance = React.lazy(() => import('./pages/Finance'));
const Admin = React.lazy(() => import('./pages/Admin'));
const HomeCollection = React.lazy(() => import('./pages/HomeCollection'));

// Print Components (Keep normally loaded or lazy? Lazy is fine)
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const auth = localStorage.getItem('lis_auth');
    if (auth) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('lis_auth');
    setIsAuthenticated(false);
  };

  if (loading) return null; // Or a spinner

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
          } />

          {/* Protected Routes */}
          <Route path="/" element={
            isAuthenticated ? <Layout onLogout={handleLogout} /> : <Navigate to="/login" replace />
          }>
            <Route index element={<Dashboard />} />
            <Route path="register" element={<PatientRegistration />} />
            <Route path="phlebotomy" element={<Phlebotomy />} />
            <Route path="/samples" element={<Samples />} />
            <Route path="/accession" element={<Accession />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="home-collection" element={<HomeCollection />} />
          </Route>

          {/* Print Routes (Ideally protected too, but can be open for ease of window.open) */}
          {/* Let's protect them to ensure consistent state/context access if needed */}
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
