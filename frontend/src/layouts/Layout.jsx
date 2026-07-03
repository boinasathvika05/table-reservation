import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Calendar, BarChart2, Shield, Settings, TableProperties, Clock } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ marginBottom: '2.5rem' }}>
          <Link to="/" className="nav-brand">
            <Shield size={24} />
            <span>TableMaster</span>
          </Link>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {user ? `${user.role.toUpperCase()} PORTAL` : 'GUEST'}
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1 }}>
          {user && user.role === 'customer' && (
            <>
              <Link to="/dashboard" className={`nav-link btn btn-secondary ${isActive('/dashboard') ? 'active' : ''}`} style={{ justifyContent: 'flex-start', border: 'none' }}>
                <Calendar size={18} />
                <span>My Reservations</span>
              </Link>
            </>
          )}

          {user && user.role === 'admin' && (
            <>
              <Link to="/admin" className={`nav-link btn btn-secondary ${isActive('/admin') ? 'active' : ''}`} style={{ justifyContent: 'flex-start', border: 'none' }}>
                <BarChart2 size={18} />
                <span>Overview</span>
              </Link>
              <Link to="/admin/tables" className={`nav-link btn btn-secondary ${isActive('/admin/tables') ? 'active' : ''}`} style={{ justifyContent: 'flex-start', border: 'none' }}>
                <TableProperties size={18} />
                <span>Tables Manager</span>
              </Link>
              <Link to="/admin/settings" className={`nav-link btn btn-secondary ${isActive('/admin/settings') ? 'active' : ''}`} style={{ justifyContent: 'flex-start', border: 'none' }}>
                <Settings size={18} />
                <span>Configuration</span>
              </Link>
            </>
          )}
        </nav>

        {user && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <div style={{ marginBottom: '1rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
            </div>
            <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Page Area */}
      <main className="main-content">
        <header className="navbar" style={{ background: 'transparent', border: 'none', padding: '0 0 2rem 0', height: 'auto' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
              {isActive('/admin') && 'Operational Analytics'}
              {isActive('/admin/tables') && 'Restaurant Floor Tables'}
              {isActive('/admin/settings') && 'Operational Limits'}
              {isActive('/dashboard') && 'Seating Reservations'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              {isActive('/admin') && "Real-time summary of today's covers, occupancies, and booking details."}
              {isActive('/admin/tables') && 'Provision and status new tables or adjust floor configs.'}
              {isActive('/admin/settings') && 'Fine-tune time limits, buffer times, spends, and capacities.'}
              {isActive('/dashboard') && 'Review current bookings, request table assignments, or view history.'}
            </p>
          </div>
        </header>

        <div className="animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
