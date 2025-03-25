import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import './FilmmakerDashboard.css';

function FilmmakerDashboard() {
  const [films, setFilms] = useState([]);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalEarnings: 0,
    activeSubscribers: 0
  });

  useEffect(() => {
    loadFilmmakerData();
  }, []);

  const loadFilmmakerData = async () => {
    try {
      const [filmsResponse, statsResponse] = await Promise.all([
        apiService.get('/films/my-films'),
        apiService.get('/filmmaker/stats')
      ]);
      setFilms(filmsResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading filmmaker data:', error);
    }
  };

  return (
    <div className="filmmaker-dashboard">
      <header className="dashboard-header">
        <h1>Filmmaker Dashboard</h1>
        <Link to="/upload-film" className="btn-primary">Upload New Film</Link>
      </header>

      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Views</h3>
          <p className="stat-value">{stats.totalViews}</p>
        </div>
        <div className="stat-card">
          <h3>Total Earnings</h3>
          <p className="stat-value">${stats.totalEarnings.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>Active Subscribers</h3>
          <p className="stat-value">{stats.activeSubscribers}</p>
        </div>
      </div>

      <section className="my-films">
        <h2>My Films</h2>
        <div className="films-grid">
          {films.map(film => (
            <div key={film.id} className="film-card">
              <div className="film-thumbnail">
                <img src={film.thumbnailUrl} alt={film.title} />
              </div>
              <div className="film-info">
                <h3>{film.title}</h3>
                <p>{film.description}</p>
                <div className="film-stats">
                  <span>{film.views} views</span>
                  <span>${film.earnings} earned</span>
                </div>
                <div className="film-actions">
                  <Link to={`/edit-film/${film.id}`} className="btn-secondary">Edit</Link>
                  <Link to={`/film-analytics/${film.id}`} className="btn-secondary">Analytics</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/manage-subscriptions" className="action-card">
            <h3>Manage Subscriptions</h3>
            <p>Set up and manage your subscription plans</p>
          </Link>
          <Link to="/earnings" className="action-card">
            <h3>View Earnings</h3>
            <p>Track your revenue and payment history</p>
          </Link>
          <Link to="/analytics" className="action-card">
            <h3>Analytics</h3>
            <p>View detailed performance metrics</p>
          </Link>
          <Link to="/profile-settings" className="action-card">
            <h3>Profile Settings</h3>
            <p>Update your filmmaker profile</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default FilmmakerDashboard;
