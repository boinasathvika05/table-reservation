import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Shield, User, Mail, Lock, UserCheck } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // Default to customer
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const validatePassword = (pw) => {
    if (pw.length < 6) return 'Password must be at least 6 characters long';
    if (!/\d/.test(pw)) return 'Password must contain at least one number';
    if (!/[A-Z]/.test(pw)) return 'Password must contain at least one uppercase letter';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!name || !email || !password) {
      showToast('All fields are required', 'error');
      return;
    }

    const pwError = validatePassword(password);
    if (pwError) {
      showToast(pwError, 'error');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, role);
      showToast('Registration successful! Please sign in.', 'success');
      navigate('/login');
    } catch (err) {
      showToast(err.message || 'Registration failed. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-color)', marginBottom: '1rem' }}>
            <Shield size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Join TableMaster and book instant tables</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Must have $\ge$ 6 characters, 1 uppercase, and 1 number.
            </p>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Account Role</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1, padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', backgroundColor: role === 'customer' ? 'rgba(245, 158, 11, 0.05)' : 'transparent', borderColor: role === 'customer' ? 'var(--accent-color)' : 'var(--border-color)' }}>
                <input
                  type="radio"
                  name="role"
                  value="customer"
                  checked={role === 'customer'}
                  onChange={() => setRole('customer')}
                  style={{ accentColor: 'var(--accent-color)' }}
                />
                <span style={{ fontSize: '0.9rem' }}>Customer</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flex: 1, padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', backgroundColor: role === 'admin' ? 'rgba(245, 158, 11, 0.05)' : 'transparent', borderColor: role === 'admin' ? 'var(--accent-color)' : 'var(--border-color)' }}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={() => setRole('admin')}
                  style={{ accentColor: 'var(--accent-color)' }}
                />
                <span style={{ fontSize: '0.9rem' }}>Administrator</span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: '16px', height: '16px' }} /> : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
