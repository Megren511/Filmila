import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (err) {
        setError('Failed to load profile');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  if (error) return <div className="error">{error}</div>;
  if (!user) return <div>Loading...</div>;

  return (
    <div className="container">
      <h2>Welcome, {user.full_name}!</h2>
      <div>
        <h3>Your Profile</h3>
        <p>Email: {user.email}</p>
      </div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Dashboard;
