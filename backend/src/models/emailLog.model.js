const BaseModel = require('./base.model');

class EmailLog extends BaseModel {
  static tableName = 'email_logs';

  static async findByRecipient(email) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE recipient = $1
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query, [email]);
    return result.rows;
  }

  static async findByStatus(status) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE status = $1
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query, [status]);
    return result.rows;
  }

  static async findByMessageId(messageId) {
    const query = `
      SELECT * FROM ${this.tableName}
      WHERE message_id = $1
      LIMIT 1
    `;
    const result = await this.db.query(query, [messageId]);
    return result.rows[0];
  }

  static async logEmail(data) {
    const {
      recipient,
      subject,
      messageId,
      status,
      error = null,
      metadata = {}
    } = data;

    const query = `
      INSERT INTO ${this.tableName}
      (recipient, subject, message_id, status, error_message, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      recipient,
      subject,
      messageId,
      status,
      error,
      JSON.stringify(metadata)
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  static async getEmailStats(startDate, endDate) {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        DATE_TRUNC('day', created_at) as date
      FROM ${this.tableName}
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY status, DATE_TRUNC('day', created_at)
      ORDER BY date DESC
    `;
    
    const result = await this.db.query(query, [startDate, endDate]);
    return result.rows;
  }
}

module.exports = EmailLog;
