import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import RegisterForm from '../../components/auth/RegisterForm';
import authService from '../../services/auth.service';

jest.mock('../../services/auth.service');

const renderRegisterForm = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('RegisterForm', () => {
  const validUser = {
    email: 'test@filmila.com',
    password: 'Test123!@#',
    confirmPassword: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User',
    role: 'viewer'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders registration form with all fields', () => {
    renderRegisterForm();

    expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/last name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('handles successful registration', async () => {
    authService.register.mockResolvedValueOnce({
      message: 'Registration successful. Please check your email to verify your account.'
    });

    renderRegisterForm();

    // Fill in form
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: validUser.firstName }
    });
    fireEvent.change(screen.getByPlaceholderText(/last name/i), {
      target: { value: validUser.lastName }
    });
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: validUser.email }
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: validUser.password }
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: validUser.confirmPassword }
    });
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: validUser.role }
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        email: validUser.email,
        password: validUser.password,
        firstName: validUser.firstName,
        lastName: validUser.lastName,
        role: validUser.role
      });
    });
  });

  it('validates password requirements', async () => {
    renderRegisterForm();

    // Fill in form with weak password
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: validUser.firstName }
    });
    fireEvent.change(screen.getByPlaceholderText(/last name/i), {
      target: { value: validUser.lastName }
    });
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: validUser.email }
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: 'weak' }
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'weak' }
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation match', async () => {
    renderRegisterForm();

    // Fill in form with mismatched passwords
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: validUser.firstName }
    });
    fireEvent.change(screen.getByPlaceholderText(/last name/i), {
      target: { value: validUser.lastName }
    });
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: validUser.email }
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: validUser.password }
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'different' }
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('handles registration failure', async () => {
    const errorMessage = 'Email already registered';
    authService.register.mockRejectedValueOnce(new Error(errorMessage));

    renderRegisterForm();

    // Fill in form
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: validUser.firstName }
    });
    fireEvent.change(screen.getByPlaceholderText(/last name/i), {
      target: { value: validUser.lastName }
    });
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: validUser.email }
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: validUser.password }
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: validUser.confirmPassword }
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('disables submit button during registration attempt', async () => {
    authService.register.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    renderRegisterForm();

    const submitButton = screen.getByRole('button', { name: /create account/i });

    // Fill in form
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: validUser.firstName }
    });
    fireEvent.change(screen.getByPlaceholderText(/last name/i), {
      target: { value: validUser.lastName }
    });
    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: validUser.email }
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: validUser.password }
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: validUser.confirmPassword }
    });

    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('requires all fields', async () => {
    renderRegisterForm();

    const submitButton = screen.getByRole('button', { name: /create account/i });

    fireEvent.click(submitButton);

    expect(screen.getByPlaceholderText(/first name/i)).toBeInvalid();
    expect(screen.getByPlaceholderText(/last name/i)).toBeInvalid();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInvalid();
    expect(screen.getByPlaceholderText(/^password$/i)).toBeInvalid();
    expect(screen.getByPlaceholderText(/confirm password/i)).toBeInvalid();
  });

  it('navigates to login page', () => {
    renderRegisterForm();

    fireEvent.click(screen.getByText(/sign in/i));

    expect(window.location.pathname).toBe('/login');
  });
});
