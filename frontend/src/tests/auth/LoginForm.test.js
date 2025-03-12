import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import LoginForm from '../../components/auth/LoginForm';
import authService from '../../services/auth.service';

// Mock the auth service
jest.mock('../../services/auth.service');

const renderLoginForm = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginForm', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders login form with all fields', () => {
    renderLoginForm();

    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockUser = {
      id: 1,
      email: 'test@filmila.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'viewer'
    };

    authService.login.mockResolvedValueOnce({
      user: mockUser,
      token: 'fake-token'
    });

    renderLoginForm();

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'test@filmila.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'Test123!@#' }
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@filmila.com',
        password: 'Test123!@#'
      });
    });
  });

  it('displays error message on login failure', async () => {
    authService.login.mockRejectedValueOnce(new Error('Invalid credentials'));

    renderLoginForm();

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'test@filmila.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpassword' }
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('navigates to forgot password page', () => {
    renderLoginForm();

    fireEvent.click(screen.getByText(/forgot your password/i));

    expect(window.location.pathname).toBe('/forgot-password');
  });

  it('navigates to register page', () => {
    renderLoginForm();

    fireEvent.click(screen.getByText(/create a new account/i));

    expect(window.location.pathname).toBe('/register');
  });

  it('disables submit button during login attempt', async () => {
    authService.login.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderLoginForm();

    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'test@filmila.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'Test123!@#' }
    });

    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('requires email and password fields', async () => {
    renderLoginForm();

    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.click(submitButton);

    expect(screen.getByPlaceholderText(/email address/i)).toBeInvalid();
    expect(screen.getByPlaceholderText(/password/i)).toBeInvalid();
  });
});
