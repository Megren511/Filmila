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
  const [stats, setStats] = useState(null);
  const [pendingFilms, setPendingFilms] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, filmsRes, revenueRes] = await Promise.all([
        apiService.get('/admin/statistics'),
        apiService.get('/admin/films/pending'),
        apiService.get('/admin/revenue/chart')
      ]);

      setStats(statsRes.data);
      setPendingFilms(filmsRes.data);
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
      console.error('Error loading dashboard data:', error);
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
    }
  };

  const handleReport = async (reportId, status, action, notes) => {
    try {
      await apiService.put(`/admin/reports/${reportId}`, { status, action, notes });
      setReports(reports.filter(report => report.id !== reportId));
    } catch (error) {
      console.error('Error handling report:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
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
                <p>{stats.average_rating.toFixed(1)}/5.0</p>
                <small>{stats.total_reviews} reviews</small>
              </div>
            </div>

            <div className="chart-container">
              <h2>Revenue & Views (Last 30 Days)</h2>
              {revenueData && <Line data={revenueData} />}
            </div>
          </div>
        )}

        {activeTab === 'films' && (
          <div className="films-section">
            <h2>Pending Film Approvals</h2>
            <div className="films-grid">
              {pendingFilms.map(film => (
                <div key={film.id} className="film-card">
                  <img src={film.poster_url} alt={film.title} />
                  <div className="film-info">
                    <h3>{film.title}</h3>
                    <p>{film.description}</p>
                    <div className="film-meta">
                      <span>By: {film.filmer_name}</span>
                      <span>Genre: {film.genre}</span>
                      <span>Price: ${film.price}</span>
                    </div>
                    <div className="film-actions">
                      <button
                        className="btn-approve"
                        onClick={() => handleFilmApproval(film.id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) handleFilmApproval(film.id, 'rejected', reason);
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="users-filters">
              <input
                type="text"
                placeholder="Search users..."
                onChange={(e) => {
                  // Implement user search
                }}
              />
              <select onChange={(e) => {
                // Implement role filter
              }}>
                <option value="">All Roles</option>
                <option value="filmmaker">Filmmakers</option>
                <option value="viewer">Viewers</option>
              </select>
            </div>

            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.status}</td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className={user.status === 'active' ? 'btn-suspend' : 'btn-activate'}
                        onClick={() => {
                          const newStatus = user.status === 'active' ? 'suspended' : 'active';
                          const reason = newStatus === 'suspended' ? prompt('Enter suspension reason:') : '';
                          handleUserStatus(user.id, newStatus, reason);
                        }}
                      >
                        {user.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            <h2>Reported Content</h2>
            <div className="reports-grid">
              {reports.map(report => (
                <div key={report.id} className="report-card">
                  <div className="report-header">
                    <span className="report-type">{report.type}</span>
                    <span className="report-date">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="report-content">
                    <p><strong>Reporter:</strong> {report.reporter_name}</p>
                    <p><strong>Reported:</strong> {report.reported_user_name}</p>
                    {report.film_title && (
                      <p><strong>Film:</strong> {report.film_title}</p>
                    )}
                    <p><strong>Reason:</strong> {report.reason}</p>
                  </div>
                  <div className="report-actions">
                    <button
                      className="btn-resolve"
                      onClick={() => {
                        const action = prompt('Enter action taken:');
                        if (action) {
                          handleReport(report.id, 'resolved', action, '');
                        }
                      }}
                    >
                      Resolve
                    </button>
                    <button
                      className="btn-dismiss"
                      onClick={() => handleReport(report.id, 'dismissed', 'No action needed', '')}
                    >
                      Dismiss
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
