import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import FilmmakerDashboard from './pages/FilmmakerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ViewerDashboard from './pages/ViewerDashboard';
import UploadFilm from './pages/UploadFilm';
import './App.css';

// Move PrivateRoute and AuthRoute inside a separate component
function AppRoutes() {
  const { user } = useAuth();

  const PrivateRoute = ({ children, requiredRole }) => {
    console.log('PrivateRoute - Current user:', user);
    console.log('PrivateRoute - Required role:', requiredRole);

    if (!user) {
      console.log('PrivateRoute - No user, redirecting to login');
      return <Navigate to="/login" replace />;
    }

    if (requiredRole && user.role !== requiredRole) {
      console.log(`PrivateRoute - User role ${user.role} doesn't match required role ${requiredRole}`);
      // Redirect to appropriate dashboard based on role
      switch (user.role) {
        case 'admin':
          return <Navigate to="/admin-dashboard" replace />;
        case 'filmmaker':
          return <Navigate to="/filmmaker-dashboard" replace />;
        case 'viewer':
          return <Navigate to="/viewer-dashboard" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }

    return children;
  };

  // Redirect to appropriate dashboard if user is logged in
  const AuthRoute = ({ children }) => {
    if (user) {
      switch (user.role) {
        case 'admin':
          return <Navigate to="/admin-dashboard" replace />;
        case 'filmmaker':
          return <Navigate to="/filmmaker-dashboard" replace />;
        case 'viewer':
          return <Navigate to="/viewer-dashboard" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }

    return children;
  };

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              <AuthRoute>
                <Login />
              </AuthRoute>
            }
          />
          <Route
            path="/register"
            element={
              <AuthRoute>
                <Register />
              </AuthRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected Routes */}
          <Route
            path="/admin-dashboard"
            element={
              <PrivateRoute requiredRole="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/filmmaker-dashboard"
            element={
              <PrivateRoute requiredRole="filmmaker">
                <FilmmakerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/viewer-dashboard"
            element={
              <PrivateRoute requiredRole="viewer">
                <ViewerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/upload-film"
            element={
              <PrivateRoute requiredRole="filmmaker">
                <UploadFilm />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
