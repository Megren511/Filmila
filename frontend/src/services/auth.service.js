import axios from 'axios';
import { API_BASE_URL } from '../config';

class AuthService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true
    });

    // Auto refresh token before expiry
    this.refreshTokenTimeout = null;
    this.setupTokenRefresh();
  }

  // Register new user
  async register(userData) {
    try {
      const response = await this.api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await this.api.post('/auth/login', {
        ...credentials,
        deviceName: this.getDeviceName()
      });

      if (response.data.token) {
        this.setToken(response.data.token);
        this.setUser(response.data.user);
        this.setSession(response.data.session);
        this.setupTokenRefresh(response.data.session.expiresIn);
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Logout from current device
  async logout() {
    try {
      await this.api.post('/auth/logout');
      this.clearAuth();
    } catch (error) {
      // Clear local auth even if server request fails
      this.clearAuth();
      throw this.handleError(error);
    }
  }

  // Logout from all devices
  async logoutAll() {
    try {
      await this.api.post('/auth/logout-all');
      this.clearAuth();
    } catch (error) {
      // Clear local auth even if server request fails
      this.clearAuth();
      throw this.handleError(error);
    }
  }

  // Get active sessions
  async getSessions() {
    try {
      const response = await this.api.get('/auth/sessions');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Terminate specific session
  async terminateSession(sessionId) {
    try {
      const response = await this.api.delete(`/auth/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Refresh auth token
  async refreshToken() {
    try {
      const response = await this.api.post('/auth/refresh-token');
      
      if (response.data.token) {
        this.setToken(response.data.token);
        this.setSession(response.data.session);
        this.setupTokenRefresh(response.data.session.expiresIn);
      }

      return response.data;
    } catch (error) {
      this.clearAuth();
      throw this.handleError(error);
    }
  }

  // Setup automatic token refresh
  setupTokenRefresh(expiresIn = null) {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }

    if (!expiresIn) {
      const session = this.getSession();
      if (!session) return;
      expiresIn = session.expiresIn;
    }

    // Refresh 1 minute before expiry
    const refreshTime = (expiresIn * 1000) - 60000;
    if (refreshTime <= 0) return;

    this.refreshTokenTimeout = setTimeout(
      () => this.refreshToken(),
      refreshTime
    );
  }

  // Get current user
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Request password reset
  async forgotPassword(email) {
    try {
      const response = await this.api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      const response = await this.api.post(`/auth/reset-password/${token}`, {
        password: newPassword
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Verify email with token
  async verifyEmail(token) {
    try {
      const response = await this.api.get(`/auth/verify-email/${token}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get auth token
  getToken() {
    return localStorage.getItem('token');
  }

  // Set auth token
  setToken(token) {
    localStorage.setItem('token', token);
  }

  // Set user data
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Get session data
  getSession() {
    const session = localStorage.getItem('session');
    return session ? JSON.parse(session) : null;
  }

  // Set session data
  setSession(session) {
    localStorage.setItem('session', JSON.stringify(session));
  }

  // Clear auth data
  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  // Get device name for session tracking
  getDeviceName() {
    return window.navigator.userAgent;
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
      // Server responded with error
      return new Error(error.response.data.message || 'An error occurred');
    }
    if (error.request) {
      // Request made but no response
      return new Error('No response from server');
    }
    // Request setup error
    return new Error('Failed to make request');
  }
}

// Create singleton instance
const authService = new AuthService();

// Add auth header interceptor
authService.api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default authService;
