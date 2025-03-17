const BaseModel = require('./base.model');

class User extends BaseModel {
  static tableName = 'users';

  static async findByEmail(email) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE email = $1
    `;
    const result = await this.db.query(query, [email]);
    return result.rows[0];
  }

  static async verifyEmail(userId) {
    const query = `
      UPDATE ${this.tableName}
      SET email_verified = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows[0];
  }

  static async updatePassword(userId, passwordHash) {
    const query = `
      UPDATE ${this.tableName}
      SET password_hash = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await this.db.query(query, [passwordHash, userId]);
    return result.rows[0];
  }
}

module.exports = User;
