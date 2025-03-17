const BaseModel = require('./base.model');

class RefreshToken extends BaseModel {
  static tableName = 'refresh_tokens';

  static async findByToken(token) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP
    `;
    const result = await this.db.query(query, [token]);
    return result.rows[0];
  }

  static async findValidByUserId(userId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  static async invalidateAllForUser(userId) {
    const query = `
      UPDATE ${this.tableName}
      SET expires_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  static async cleanupExpired() {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE expires_at <= CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await this.db.query(query);
    return result.rows;
  }
}

module.exports = RefreshToken;
