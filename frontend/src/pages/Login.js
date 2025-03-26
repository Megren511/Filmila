import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      console.log('Attempting login with:', { email });
      const user = await login(email, password);
      console.log('Login successful, redirecting user with role:', user.role);
      
      // Navigate based on user role
      switch (user.role) {
        case 'admin':
          console.log('Redirecting admin to dashboard');
          navigate('/admin-dashboard');
          break;
        case 'filmmaker':
          console.log('Redirecting filmmaker to dashboard');
          navigate('/filmmaker-dashboard');
          break;
        case 'viewer':
          console.log('Redirecting viewer to dashboard');
          navigate('/viewer-dashboard');
          break;
        default:
          console.log('Unknown role, redirecting to home');
          navigate('/');
      }
    } catch (err) {
      console.error('Login error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });
      setError(err.response?.data?.message || 'Failed to log in. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="links">
          <Link to="/register">Create Account</Link>
          <span className="divider">|</span>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
