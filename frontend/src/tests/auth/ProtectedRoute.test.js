import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import * as authHook from '../../contexts/AuthContext';

// Mock the useAuth hook
jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: jest.fn()
}));

const mockChildComponent = () => <div>Protected Content</div>;

const renderProtectedRoute = (requiredRole = null) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole={requiredRole}>
                <mockChildComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    // Clear mock before each test
    jest.clearAllMocks();
  });

  it('renders loading state when authentication is being checked', () => {
    jest.spyOn(authHook, 'useAuth').mockImplementation(() => ({
      isAuthenticated: false,
      loading: true,
      user: null
    }));

    renderProtectedRoute();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    jest.spyOn(authHook, 'useAuth').mockImplementation(() => ({
      isAuthenticated: false,
      loading: false,
      user: null
    }));

    renderProtectedRoute();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders protected content when user is authenticated with no role requirement', () => {
    jest.spyOn(authHook, 'useAuth').mockImplementation(() => ({
      isAuthenticated: true,
      loading: false,
      user: { role: 'viewer' }
    }));

    renderProtectedRoute();

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders protected content when user has required role', () => {
    jest.spyOn(authHook, 'useAuth').mockImplementation(() => ({
      isAuthenticated: true,
      loading: false,
      user: { role: 'admin' }
    }));

    renderProtectedRoute('admin');

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to home when user lacks required role', () => {
    jest.spyOn(authHook, 'useAuth').mockImplementation(() => ({
      isAuthenticated: true,
      loading: false,
      user: { role: 'viewer' }
    }));

    renderProtectedRoute('admin');

    // Should redirect to home page
    expect(window.location.pathname).toBe('/');
  });

  it('saves attempted URL when redirecting to login', () => {
    jest.spyOn(authHook, 'useAuth').mockImplementation(() => ({
      isAuthenticated: false,
      loading: false,
      user: null
    }));

    // Set initial route to /protected
    window.history.pushState({}, '', '/protected');

    renderProtectedRoute();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(window.location.state).toEqual({ from: { pathname: '/protected' } });
  });

  it('handles missing user role gracefully', () => {
    jest.spyOn(authHook, 'useAuth').mockImplementation(() => ({
      isAuthenticated: true,
      loading: false,
      user: {} // User object without role
    }));

    renderProtectedRoute('admin');

    // Should redirect to home page
    expect(window.location.pathname).toBe('/');
  });
});
