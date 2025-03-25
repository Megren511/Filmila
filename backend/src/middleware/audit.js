const { db } = require('../db');

const auditLog = (actionType, targetType) => async (req, res, next) => {
  // Store the original response methods
  const originalJson = res.json;
  const originalSend = res.send;

  // Override response methods to capture the response
  res.json = function(data) {
    logAction(req, actionType, targetType, data);
    return originalJson.call(this, data);
  };

  res.send = function(data) {
    logAction(req, actionType, targetType, data);
    return originalSend.call(this, data);
  };

  next();
};

async function logAction(req, actionType, targetType, newState) {
  try {
    const targetId = parseInt(req.params.id);
    if (!targetId) return;

    // Get previous state if available
    let previousState = null;
    if (targetType === 'film') {
      const result = await db.query('SELECT * FROM films WHERE id = $1', [targetId]);
      previousState = result.rows[0];
    } else if (targetType === 'user') {
      const result = await db.query('SELECT * FROM users WHERE id = $1', [targetId]);
      previousState = result.rows[0];
    }

    // Log the admin action
    await db.query(
      `INSERT INTO admin_audit_log (
        admin_id, action_type, target_type, target_id,
        previous_state, new_state, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user.id,
        actionType,
        targetType,
        targetId,
        previousState ? JSON.stringify(previousState) : null,
        newState ? JSON.stringify(newState) : null,
        req.ip
      ]
    );
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

module.exports = auditLog;
