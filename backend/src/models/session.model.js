const BaseModel = require('./base.model');

class Session extends BaseModel {
  static tableName = 'sessions';

  static async findActiveByUserId(userId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1 AND is_active = true
      ORDER BY last_activity DESC
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  static async updateActivity(sessionId) {
    const query = `
      UPDATE ${this.tableName}
      SET last_activity = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.db.query(query, [sessionId]);
    return result.rows[0];
  }

  static async deactivate(sessionId) {
    const query = `
      UPDATE ${this.tableName}
      SET is_active = false,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.db.query(query, [sessionId]);
    return result.rows[0];
  }

  static async cleanupOldSessions(daysOld = 30) {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE last_activity < NOW() - INTERVAL '${daysOld} days'
      RETURNING *
    `;
    const result = await this.db.query(query);
    return result.rows;
  }
}

module.exports = Session;
