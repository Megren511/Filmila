const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const admin = require('../middleware/admin');
const { db } = require('../db');
const router = express.Router();

// Middleware to check if user is admin
router.use(authMiddleware, admin);

// Verify admin access
router.get('/verify', async (req, res) => {
  try {
    // The auth and admin middleware have already verified the user is an admin
    res.json({ message: 'Admin access verified', role: req.user.role });
  } catch (error) {
    console.error('Error verifying admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get admin statistics
router.get('/statistics', async (req, res) => {
  try {
    console.log('Fetching admin statistics...');
    const stats = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM films) as total_films,
        (SELECT COUNT(*) FROM films WHERE status = 'pending') as pending_films,
        (SELECT COUNT(*) FROM users WHERE role = 'filmmaker') as total_filmmakers,
        (SELECT COUNT(*) FROM users WHERE role = 'viewer') as total_viewers,
        (SELECT COALESCE(SUM(CAST(price AS DECIMAL)), 0) FROM views) as total_revenue,
        (SELECT COUNT(*) FROM views) as total_views,
        (SELECT COALESCE(AVG(CAST(rating AS DECIMAL)), 0) FROM reviews) as average_rating,
        (SELECT COUNT(*) FROM reviews) as total_reviews
    `);

    // Convert numeric strings to numbers and ensure defaults
    const result = {
      total_films: parseInt(stats.rows[0]?.total_films) || 0,
      pending_films: parseInt(stats.rows[0]?.pending_films) || 0,
      total_filmmakers: parseInt(stats.rows[0]?.total_filmmakers) || 0,
      total_viewers: parseInt(stats.rows[0]?.total_viewers) || 0,
      total_revenue: parseFloat(stats.rows[0]?.total_revenue) || 0,
      total_views: parseInt(stats.rows[0]?.total_views) || 0,
      average_rating: parseFloat(stats.rows[0]?.average_rating) || 0,
      total_reviews: parseInt(stats.rows[0]?.total_reviews) || 0
    };

    console.log('Admin statistics:', result);
    res.json(result);
  } catch (error) {
    console.error('Error getting admin statistics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending film approvals
router.get('/films/pending', async (req, res) => {
  try {
    const films = await db.query(
      `SELECT f.*, u.full_name as filmer_name,
              (SELECT COUNT(*) FROM views WHERE film_id = f.id) as view_count,
              (SELECT COUNT(*) FROM likes WHERE film_id = f.id) as like_count
       FROM films f
       JOIN users u ON f.filmer_id = u.id
       WHERE f.status = 'pending'
       ORDER BY f.created_at DESC`
    );
    res.json(films.rows);
  } catch (error) {
    console.error('Error getting pending films:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve or reject a film
router.put('/films/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await db.query(
      `UPDATE films 
       SET status = $1, 
           rejection_reason = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, reason || null, id]
    );

    res.json({ message: `Film ${status} successfully` });
  } catch (error) {
    console.error('Error updating film status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with stats
router.get('/users', async (req, res) => {
  try {
    const users = await db.query(`
      SELECT 
        u.id, u.email, u.full_name, u.role, u.status, 
        u.created_at, u.updated_at,
        COALESCE(f.film_count, 0) as film_count,
        COALESCE(v.view_count, 0) as view_count,
        COALESCE(l.like_count, 0) as like_count
      FROM users u
      LEFT JOIN (
        SELECT filmer_id, COUNT(*) as film_count 
        FROM films 
        GROUP BY filmer_id
      ) f ON u.id = f.filmer_id
      LEFT JOIN (
        SELECT viewer_id, COUNT(*) as view_count 
        FROM views 
        GROUP BY viewer_id
      ) v ON u.id = v.viewer_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as like_count 
        FROM likes 
        GROUP BY user_id
      ) l ON u.id = l.user_id
      ORDER BY u.created_at DESC
    `);

    // Convert numeric strings to numbers
    const result = users.rows.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      updated_at: user.updated_at,
      film_count: parseInt(user.film_count),
      view_count: parseInt(user.view_count),
      like_count: parseInt(user.like_count)
    }));

    res.json(result);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user status
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'inactive', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await db.query(
      `UPDATE users 
       SET status = $1, 
           status_reason = $2,
           status_updated_at = CURRENT_TIMESTAMP,
           status_updated_by = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, reason || null, req.user.id, id]
    );

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get revenue chart data
router.get('/revenue/chart', async (req, res) => {
  try {
    console.log('Fetching revenue chart data...');
    const result = await db.query(`
      SELECT 
        DATE_TRUNC('day', viewed_at) as date,
        COUNT(*) as views,
        COALESCE(SUM(CAST(price AS DECIMAL)), 0) as revenue
      FROM views
      WHERE viewed_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', viewed_at)
      ORDER BY date ASC
    `);

    // Convert numeric strings to numbers and format dates
    const data = result.rows.map(row => ({
      date: row.date,
      views: parseInt(row.views) || 0,
      revenue: parseFloat(row.revenue) || 0
    }));

    console.log('Revenue chart data:', data);
    res.json(data);
  } catch (error) {
    console.error('Error getting revenue chart data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reports
router.get('/reports', async (req, res) => {
  try {
    const reports = await db.query(`
      SELECT r.*, 
             f.title as film_title,
             u.full_name as reporter_name,
             ur.full_name as reported_user_name
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
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const result = await db.query(
      `UPDATE reports 
       SET status = $1,
           action_taken = $2,
           admin_notes = $3,
           resolved_at = CURRENT_TIMESTAMP,
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
       ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
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
