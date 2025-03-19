import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserType from './pages/UserType';
import FilmmakerDashboard from './pages/FilmmakerDashboard';
import ViewerDashboard from './pages/ViewerDashboard';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user-type" element={<UserType />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/filmmaker-dashboard"
          element={
            <PrivateRoute>
              <FilmmakerDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/viewer-dashboard"
          element={
            <PrivateRoute>
              <ViewerDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
