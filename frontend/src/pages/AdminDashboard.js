import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import './AdminDashboard.css';

// Chart.js for statistics
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    total_films: 0,
    pending_films: 0,
    total_filmmakers: 0,
    total_viewers: 0,
    total_revenue: 0,
    total_views: 0,
    average_rating: 0,
    total_reviews: 0
  });
  const [pendingFilms, setPendingFilms] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading admin dashboard data...');

      // First verify admin access
      const verifyResponse = await apiService.get('/admin/verify');
      console.log('Admin verification response:', verifyResponse.data);

      // Load statistics
      const statsRes = await apiService.get('/admin/statistics');
      console.log('Statistics loaded:', statsRes.data);
      setStats(statsRes.data);

      // Load pending films
      const filmsRes = await apiService.get('/admin/films/pending');
      console.log('Pending films loaded:', filmsRes.data);
      setPendingFilms(filmsRes.data);

      // Load revenue data
      const revenueRes = await apiService.get('/admin/revenue/chart');
      console.log('Revenue data loaded:', revenueRes.data);
      setRevenueData({
        labels: revenueRes.data.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [
          {
            label: 'Revenue (USD)',
            data: revenueRes.data.map(d => d.revenue),
            borderColor: '#3498db',
            tension: 0.1
          },
          {
            label: 'Views',
            data: revenueRes.data.map(d => d.views),
            borderColor: '#2ecc71',
            tension: 0.1
          }
        ]
      });
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      setError(error.response?.data?.message || 'Failed to load admin dashboard');
      if (error.response?.status === 403) {
        console.log('Access denied, redirecting to home');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilmApproval = async (filmId, status, reason) => {
    try {
      await apiService.put(`/admin/films/${filmId}/status`, { status, reason });
      setPendingFilms(pendingFilms.filter(film => film.id !== filmId));
    } catch (error) {
      console.error('Error updating film status:', error);
      setError(error.response?.data?.message || 'Failed to update film status');
    }
  };

  const handleUserStatus = async (userId, status, reason) => {
    try {
      await apiService.put(`/admin/users/${userId}/status`, { status, reason });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      setError(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleReport = async (reportId, status, action, notes) => {
    try {
      await apiService.put(`/admin/reports/${reportId}`, { status, action, notes });
      setReports(reports.filter(report => report.id !== reportId));
    } catch (error) {
      console.error('Error handling report:', error);
      setError(error.response?.data?.message || 'Failed to handle report');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard loading-state">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard error-state">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadDashboardData}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <nav className="dashboard-nav">
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={activeTab === 'films' ? 'active' : ''}
            onClick={() => setActiveTab('films')}
          >
            Films ({pendingFilms.length})
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </nav>
      </header>

      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Films</h3>
                <p>{stats.total_films}</p>
                <small>{stats.pending_films} pending</small>
              </div>
              <div className="stat-card">
                <h3>Total Users</h3>
                <p>{stats.total_filmmakers + stats.total_viewers}</p>
                <small>{stats.total_filmmakers} filmmakers, {stats.total_viewers} viewers</small>
              </div>
              <div className="stat-card">
                <h3>Total Revenue</h3>
                <p>${stats.total_revenue.toFixed(2)}</p>
                <small>{stats.total_views} total views</small>
              </div>
              <div className="stat-card">
                <h3>Average Rating</h3>
                <p>{stats.average_rating.toFixed(1)}</p>
                <small>{stats.total_reviews} reviews</small>
              </div>
            </div>

            {revenueData && (
              <div className="chart-container">
                <h3>Revenue & Views Over Time</h3>
                <Line
                  data={revenueData}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'films' && (
          <div className="films-section">
            <h2>Pending Films</h2>
            <div className="films-grid">
              {pendingFilms.map(film => (
                <div key={film.id} className="film-card">
                  <h3>{film.title}</h3>
                  <p>By: {film.filmer_name}</p>
                  <p>Submitted: {new Date(film.created_at).toLocaleDateString()}</p>
                  <div className="approval-buttons">
                    <button
                      className="btn-approve"
                      onClick={() => handleFilmApproval(film.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleFilmApproval(film.id, 'rejected', 'Content guidelines violation')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-section">
            <h2>Platform Settings</h2>
            <form className="settings-form">
              <div className="form-group">
                <label>Platform Fee (%)</label>
                <input type="number" min="0" max="100" step="0.1" />
              </div>
              <div className="form-group">
                <label>Minimum Payout Amount ($)</label>
                <input type="number" min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label>Maximum Film Size (MB)</label>
                <input type="number" min="0" step="1" />
              </div>
              <div className="form-group">
                <label>Allowed File Types</label>
                <input type="text" placeholder="mp4,mov,avi" />
              </div>
              <button type="submit" className="btn-save">
                Save Settings
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
