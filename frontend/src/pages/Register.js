import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import '../styles/Auth.css';

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email: initialEmail } = location.state || {};

  const [step, setStep] = useState(1); // Step 1: User Type, Step 2: Registration
  const [formData, setFormData] = useState({
    email: initialEmail || '',
    password: '',
    name: '',
    userType: ''
  });

  const [error, setError] = useState('');

  const handleUserTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, userType: type }));
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${config.apiUrl}/auth/register`, {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.userType
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userType', formData.userType);
        
        // Redirect based on user type
        if (formData.userType === 'filmmaker') {
          navigate('/filmmaker-dashboard');
        } else {
          navigate('/viewer-dashboard');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  if (step === 1) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h2>Choose Your Role</h2>
          <p>How would you like to use Filmila?</p>
          
          <div className="user-type-selection">
            <button 
              className="user-type-btn filmmaker"
              onClick={() => handleUserTypeSelect('filmmaker')}
            >
              <h3>Filmmaker</h3>
              <p>Share your films with the world</p>
            </button>
            
            <button 
              className="user-type-btn viewer"
              onClick={() => handleUserTypeSelect('viewer')}
            >
              <h3>Viewer</h3>
              <p>Discover and watch amazing films</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              readOnly={!!initialEmail}
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

          <button type="submit" className="auth-button">
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
