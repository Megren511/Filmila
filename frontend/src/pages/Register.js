import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import '../styles/Auth.css';

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email: initialEmail, userType } = location.state || {};

  const [formData, setFormData] = useState({
    email: initialEmail || '',
    password: '',
    confirmPassword: '',
    name: '',
    userType: userType || 'viewer'
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post(`${config.apiUrl}/auth/register`, {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        userType: formData.userType
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userType', formData.userType);
        navigate(formData.userType === 'filmmaker' ? '/filmmaker-dashboard' : '/viewer-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error when user types
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create Your Account</h2>
        <p>Join Filmila as a {formData.userType}</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              required
              className="form-input"
            />
          </div>
          
          <button type="submit" className="auth-button">
            Create Account
          </button>
        </form>
        
        <div className="auth-links">
          <p className="auth-link">
            Already have an account?{' '}
            <Link to="/login" className="link-text">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
