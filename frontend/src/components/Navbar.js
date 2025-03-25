import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return null;

    switch (user.role) {
      case 'admin':
        return '/admin';
      case 'filmmaker':
        return '/filmmaker-dashboard';
      default:
        return '/viewer-dashboard';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Filmila</Link>
      </div>
      <div className="navbar-links">
        {user ? (
          <>
            <Link to={getDashboardLink()} className="nav-link">
              {user.role === 'admin' ? 'Admin Dashboard' :
               user.role === 'filmmaker' ? 'Filmmaker Dashboard' :
               'Viewer Dashboard'}
            </Link>
            {user.role === 'filmmaker' && (
              <Link to="/upload-film" className="nav-link">Upload Film</Link>
            )}
            <button onClick={handleLogout} className="nav-link logout-btn">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
