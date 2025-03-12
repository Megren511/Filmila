const request = require('supertest');
const app = require('../app');
const { pool } = require('../db/config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    // Clear users table before each test
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM refresh_tokens');
    await pool.query('DELETE FROM sessions');
  });

  describe('POST /api/auth/register', () => {
    const validUser = {
      email: 'test@filmila.com',
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
      role: 'viewer'
    };

    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Registration successful. Please check your email to verify your account.');
      expect(res.body.user).toHaveProperty('email', validUser.email.toLowerCase());
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should not register a user with existing email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(validUser);

      // Second registration with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error', 'Email already registered');
    });

    it('should validate password requirements', async () => {
      const weakPassword = { ...validUser, password: 'weak' };
      const res = await request(app)
        .post('/api/auth/register')
        .send(weakPassword);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Password must');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a verified user before each login test
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Test123!@#', salt);
      await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['test@filmila.com', passwordHash, 'Test', 'User', 'viewer', true]
      );
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@filmila.com',
          password: 'Test123!@#'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('email', 'test@filmila.com');
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@filmila.com',
          password: 'wrong'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should not login unverified user', async () => {
      // Create unverified user
      await pool.query(
        `UPDATE users SET email_verified = false WHERE email = $1`,
        ['test@filmila.com']
      );

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@filmila.com',
          password: 'Test123!@#'
        });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error', 'Please verify your email before logging in');
    });
  });

  describe('GET /api/auth/verify-email/:token', () => {
    let verificationToken;

    beforeEach(async () => {
      verificationToken = jwt.sign(
        { email: 'test@filmila.com' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Create unverified user with verification token
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Test123!@#', salt);
      await pool.query(
        `INSERT INTO users (email, password_hash, verification_token, email_verified)
         VALUES ($1, $2, $3, $4)`,
        ['test@filmila.com', passwordHash, verificationToken, false]
      );
    });

    it('should verify email with valid token', async () => {
      const res = await request(app)
        .get(`/api/auth/verify-email/${verificationToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Email verified successfully');

      // Check database
      const result = await pool.query(
        'SELECT email_verified FROM users WHERE email = $1',
        ['test@filmila.com']
      );
      expect(result.rows[0].email_verified).toBe(true);
    });

    it('should reject invalid verification token', async () => {
      const res = await request(app)
        .get('/api/auth/verify-email/invalid-token');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      // Create user
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Test123!@#', salt);
      await pool.query(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)`,
        ['test@filmila.com', passwordHash]
      );
    });

    it('should send reset email for existing user', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@filmila.com' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');

      // Check database for reset token
      const result = await pool.query(
        'SELECT reset_password_token FROM users WHERE email = $1',
        ['test@filmila.com']
      );
      expect(result.rows[0].reset_password_token).toBeTruthy();
    });

    it('should not reveal if email exists', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@filmila.com' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/auth/reset-password/:token', () => {
    let resetToken;

    beforeEach(async () => {
      resetToken = jwt.sign(
        { userId: 1 },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Create user with reset token
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Test123!@#', salt);
      await pool.query(
        `INSERT INTO users (email, password_hash, reset_password_token, reset_password_expires)
         VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour')`,
        ['test@filmila.com', passwordHash, resetToken]
      );
    });

    it('should reset password with valid token', async () => {
      const res = await request(app)
        .post(`/api/auth/reset-password/${resetToken}`)
        .send({ password: 'NewTest123!@#' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Password reset successful');

      // Verify new password works
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@filmila.com',
          password: 'NewTest123!@#'
        });
      expect(loginRes.status).toBe(200);
    });

    it('should reject invalid reset token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password/invalid-token')
        .send({ password: 'NewTest123!@#' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken;

    beforeEach(async () => {
      // Create user and refresh token
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Test123!@#', salt);
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id`,
        ['test@filmila.com', passwordHash]
      );

      refreshToken = jwt.sign(
        { userId: userResult.rows[0].id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [userResult.rows[0].id, refreshToken]
      );
    });

    it('should issue new access token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken;
    let refreshToken;
    let userId;

    beforeEach(async () => {
      // Create user and tokens
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Test123!@#', salt);
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id`,
        ['test@filmila.com', passwordHash]
      );
      userId = userResult.rows[0].id;

      accessToken = jwt.sign(
        { userId, role: 'viewer' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      refreshToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [userId, refreshToken]
      );
    });

    it('should successfully logout user', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Logged out successfully');

      // Verify refresh token is removed
      const tokenResult = await pool.query(
        'SELECT * FROM refresh_tokens WHERE token = $1',
        [refreshToken]
      );
      expect(tokenResult.rows).toHaveLength(0);
    });
  });
});

afterAll(async () => {
  await pool.end();
});
