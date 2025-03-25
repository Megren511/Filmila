const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { db } = require('../db');
const router = express.Router();

// Middleware to check if user is admin
router.use(auth, admin);

// Get pending film approvals
router.get('/films/pending', async (req, res) => {
  try {
    const films = await db.query(
      `SELECT f.*, u.username as filmer_name
       FROM films f
       JOIN users u ON f.filmer_id = u.id
       WHERE f.status = 'pending'
       ORDER BY f.created_at DESC`
    );
    res.json(films.rows);
  } catch (error) {
    console.error('Error fetching pending films:', error);
    res.status(500).json({ message: 'Failed to fetch pending films' });
  }
});

// Approve or reject a film
router.put('/films/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  try {
    const result = await db.query(
      `UPDATE films 
       SET status = $1, 
           review_notes = $2,
           reviewed_at = NOW(),
           reviewed_by = $3
       WHERE id = $4
       RETURNING *`,
      [status, reason, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Film not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating film status:', error);
    res.status(500).json({ message: 'Failed to update film status' });
  }
});

// Get platform statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM films) as total_films,
        (SELECT COUNT(*) FROM films WHERE status = 'pending') as pending_films,
        (SELECT COUNT(*) FROM users WHERE role = 'filmmaker') as total_filmmakers,
        (SELECT COUNT(*) FROM users WHERE role = 'viewer') as total_viewers,
        (SELECT COUNT(*) FROM views) as total_views,
        (SELECT COALESCE(SUM(price), 0) FROM views) as total_revenue,
        (SELECT COUNT(*) FROM reviews) as total_reviews,
        (SELECT COALESCE(AVG(rating), 0) FROM reviews) as average_rating
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Get revenue data for charts
router.get('/revenue/chart', async (req, res) => {
  try {
    const revenueData = await db.query(`
      SELECT 
        DATE_TRUNC('day', viewed_at) as date,
        COUNT(*) as views,
        SUM(price) as revenue
      FROM views
      WHERE viewed_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', viewed_at)
      ORDER BY date ASC
    `);

    res.json(revenueData.rows);
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ message: 'Failed to fetch revenue data' });
  }
});

// Get all users with filters
router.get('/users', async (req, res) => {
  const { role, status, search } = req.query;
  try {
    let query = `
      SELECT 
        id, username, email, role, status, 
        created_at, last_login_at,
        (SELECT COUNT(*) FROM films WHERE filmer_id = users.id) as films_count,
        (SELECT COUNT(*) FROM views WHERE viewer_id = users.id) as views_count
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      params.push(role);
      query += ` AND role = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (username ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    query += ' ORDER BY created_at DESC';

    const users = await db.query(query, params);
    res.json(users.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Update user status
router.put('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  try {
    const result = await db.query(
      `UPDATE users 
       SET status = $1, 
           status_reason = $2,
           status_updated_at = NOW(),
           status_updated_by = $3
       WHERE id = $4
       RETURNING *`,
      [status, reason, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// Get reported content
router.get('/reports', async (req, res) => {
  try {
    const reports = await db.query(`
      SELECT r.*, 
             f.title as film_title,
             u.username as reporter_name,
             ur.username as reported_user_name
      FROM reports r
      LEFT JOIN films f ON r.film_id = f.id
      LEFT JOIN users u ON r.reporter_id = u.id
      LEFT JOIN users ur ON r.reported_user_id = ur.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
    `);

    res.json(reports.rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

// Handle report
router.put('/reports/:id', async (req, res) => {
  const { id } = req.params;
  const { status, action, notes } = req.body;

  try {
    const result = await db.query(
      `UPDATE reports 
       SET status = $1,
           action_taken = $2,
           admin_notes = $3,
           resolved_at = NOW(),
           resolved_by = $4
       WHERE id = $5
       RETURNING *`,
      [status, action, notes, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Failed to update report' });
  }
});

// Update platform settings
router.put('/settings', async (req, res) => {
  const { settings } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO platform_settings (
         key, value, updated_by, updated_at
       ) VALUES ($1, $2, $3, NOW())
       ON CONFLICT (key) 
       DO UPDATE SET 
         value = EXCLUDED.value,
         updated_by = EXCLUDED.updated_by,
         updated_at = EXCLUDED.updated_at
       RETURNING *`,
      [settings.key, settings.value, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

module.exports = router;
