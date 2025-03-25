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
           updated_at = NOW()
       WHERE id = $3`,
      [status, reason || null, id]
    );

    res.json({ message: 'Film status updated successfully' });
  } catch (error) {
    console.error('Error updating film status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await db.query(
      `SELECT id, username, email, role, status, created_at, last_login_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(users.rows);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user status (active/suspended)
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await db.query(
      'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const [users, films, revenue] = await Promise.all([
      db.query('SELECT COUNT(*) FROM users'),
      db.query('SELECT COUNT(*) FROM films'),
      db.query('SELECT SUM(amount) FROM transactions')
    ]);

    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalFilms: parseInt(films.rows[0].count),
      totalRevenue: parseFloat(revenue.rows[0].sum || 0)
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reported content
router.get('/reports', async (req, res) => {
  try {
    const reports = await db.query(
      `SELECT r.*, f.title as film_title, u.username as reporter_name
       FROM reports r
       JOIN films f ON r.film_id = f.id
       JOIN users u ON r.reporter_id = u.id
       ORDER BY r.created_at DESC`
    );
    res.json(reports.rows);
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Handle reported content
router.put('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, action } = req.body;

    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await db.query(
      `UPDATE reports 
       SET status = $1, 
           resolution_action = $2,
           resolved_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      [status, action, id]
    );

    res.json({ message: 'Report handled successfully' });
  } catch (error) {
    console.error('Error handling report:', error);
    res.status(500).json({ message: 'Server error' });
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
