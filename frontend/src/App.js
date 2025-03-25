import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import FilmmakerDashboard from './pages/FilmmakerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UploadFilm from './pages/UploadFilm';
import './App.css';

function App() {
  const { user } = useAuth();

  const PrivateRoute = ({ children, requiredRole }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }

    if (requiredRole && user.role !== requiredRole) {
      return <Navigate to="/" />;
    }

    return children;
  };

  return (
    <Router>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Filmmaker Routes */}
            <Route
              path="/filmmaker-dashboard"
              element={
                <PrivateRoute requiredRole="filmmaker">
                  <FilmmakerDashboard />
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

            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminDashboard />
                </PrivateRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
