import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set base URL for all axios requests
    console.log('Setting axios base URL:', config.apiUrl);
    axios.defaults.baseURL = config.apiUrl;
    
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('Restoring auth state from localStorage:', userData);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Making login request to:', `${config.apiUrl}/auth/login`);
      console.log('Request payload:', { email, password });
      
      const response = await axios.post('/auth/login', { email, password });
      console.log('Raw login response:', response);
      console.log('Login response data:', response.data);
      
      if (!response.data) {
        console.error('No data in response');
        throw new Error('Invalid response from server: no data');
      }
      
      const { token, user } = response.data;
      console.log('Extracted token and user:', { token: token ? 'present' : 'missing', user });
      
      if (!token) {
        console.error('No token in response');
        throw new Error('Invalid response from server: missing token');
      }
      
      if (!user) {
        console.error('No user data in response');
        throw new Error('Invalid response from server: missing user data');
      }
      
      if (!user.role) {
        console.error('No role in user data:', user);
        throw new Error('Invalid user data: missing role');
      }
      
      console.log('Login successful, storing data...');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return user;
    } catch (error) {
      console.error('Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: axios.defaults.baseURL
      });
      
      // Throw a more informative error
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 403) {
        throw new Error('Account is not active');
      } else if (!error.response) {
        throw new Error('Unable to connect to server. Please try again later.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'An error occurred during login');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return user;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    register,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
