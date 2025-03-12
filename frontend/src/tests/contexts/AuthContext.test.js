import React from 'react';
import { render, act, renderHook } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import authService from '../../services/auth.service';

jest.mock('../../services/auth.service');

const mockUser = {
  id: 1,
  email: 'test@filmila.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'viewer'
};

const mockToken = 'fake-access-token';
const mockRefreshToken = 'fake-refresh-token';

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear all mocks and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('provides initial authentication state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('loads user from localStorage on mount', async () => {
    // Set up localStorage with user data
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', mockToken);
    localStorage.setItem('refreshToken', mockRefreshToken);

    authService.validateToken.mockResolvedValueOnce(true);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for loading to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  it('handles login successfully', async () => {
    authService.login.mockResolvedValueOnce({
      user: mockUser,
      accessToken: mockToken,
      refreshToken: mockRefreshToken
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({
        email: 'test@filmila.com',
        password: 'Test123!@#'
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    expect(localStorage.getItem('token')).toBe(mockToken);
    expect(localStorage.getItem('refreshToken')).toBe(mockRefreshToken);
  });

  it('handles login failure', async () => {
    const errorMessage = 'Invalid credentials';
    authService.login.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useAuth(), { wrapper });

    try {
      await act(async () => {
        await result.current.login({
          email: 'test@filmila.com',
          password: 'wrongpassword'
        });
      });
    } catch (error) {
      expect(error.message).toBe(errorMessage);
    }

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('handles registration successfully', async () => {
    const registrationData = {
      email: 'test@filmila.com',
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
      role: 'viewer'
    };

    authService.register.mockResolvedValueOnce({
      message: 'Registration successful'
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register(registrationData);
    });

    expect(authService.register).toHaveBeenCalledWith(registrationData);
  });

  it('handles logout', async () => {
    // Set up initial authenticated state
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', mockToken);
    localStorage.setItem('refreshToken', mockRefreshToken);

    authService.logout.mockResolvedValueOnce();

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('handles token refresh', async () => {
    const newToken = 'new-access-token';
    authService.refreshToken.mockResolvedValueOnce({
      accessToken: newToken
    });

    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', mockToken);
    localStorage.setItem('refreshToken', mockRefreshToken);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.refreshAccessToken();
    });

    expect(localStorage.getItem('token')).toBe(newToken);
    expect(authService.refreshToken).toHaveBeenCalledWith(mockRefreshToken);
  });

  it('provides role-based authorization helpers', () => {
    localStorage.setItem('user', JSON.stringify({ ...mockUser, role: 'admin' }));
    localStorage.setItem('token', mockToken);

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isFilmmaker).toBe(false);

    // Change user role to filmmaker
    act(() => {
      localStorage.setItem('user', JSON.stringify({ ...mockUser, role: 'filmmaker' }));
      result.current.setUser({ ...mockUser, role: 'filmmaker' });
    });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isFilmmaker).toBe(true);
  });

  it('handles expired tokens', async () => {
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'expired-token');
    localStorage.setItem('refreshToken', mockRefreshToken);

    authService.validateToken.mockResolvedValueOnce(false);
    authService.refreshToken.mockRejectedValueOnce(new Error('Refresh token expired'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
