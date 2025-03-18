import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  if (!token) {
    return <Navigate to="/login" />;
  }

  // Check if user is trying to access the correct dashboard
  const currentPath = window.location.pathname;
  const isFilmmakerPath = currentPath.includes('filmmaker');
  const isFilmmaker = userType === 'filmmaker';

  if (isFilmmakerPath !== isFilmmaker) {
    return <Navigate to={isFilmmaker ? '/filmmaker-dashboard' : '/viewer-dashboard'} />;
  }

  return children;
}

export default PrivateRoute;
