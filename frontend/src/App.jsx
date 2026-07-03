import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from './hooks/useAuth';

// Layouts & Pages
import Layout from './layouts/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TablesManager from './pages/TablesManager';
import SettingsManager from './pages/SettingsManager';

// Private Route Guard Component
const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if role matches route authorization limits
  if (roles && !roles.includes(user.role)) {
    // If user is admin trying to access customer routes or vice versa, redirect to appropriate main dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />} />

        {/* Customer Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute roles={['customer']}>
              <Layout>
                <CustomerDashboard />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Admin Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <PrivateRoute roles={['admin']}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/tables"
          element={
            <PrivateRoute roles={['admin']}>
              <Layout>
                <TablesManager />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <PrivateRoute roles={['admin']}>
              <Layout>
                <SettingsManager />
              </Layout>
            </PrivateRoute>
          }
        />

        {/* Fallback routing */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
