const db = require('../config/database');

class BaseModel {
  static db = db;
  
  static async findById(id) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE id = $1
    `;
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }

  static async findOne(conditions) {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE ${whereClause}
      LIMIT 1
    `;
    
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  static async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    const columns = keys.join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  static async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length + 1}
      RETURNING *
    `;
    
    const result = await this.db.query(query, [...values, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = {
  User: require('./user.model'),
  Session: require('./session.model'),
  RefreshToken: require('./refreshToken.model'),
  EmailLog: require('./emailLog.model')
};
