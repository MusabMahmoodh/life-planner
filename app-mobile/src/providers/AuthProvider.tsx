import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, setAuthErrorHandler } from '../services/apiClient';
import { useQueryClient } from '@tanstack/react-query';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();

    // Set up automatic logout handler for 401/403 errors
    setAuthErrorHandler(() => {
      logout();
    });
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);

        // Set token in API client
        apiClient.setToken(storedToken);

        setToken(storedToken);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, newUser: User) => {
    try {
      // Store token and user data
      await AsyncStorage.setItem(TOKEN_KEY, newToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));

      // Set token in API client
      apiClient.setToken(newToken);

      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear storage
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);

      // Clear token from API client
      apiClient.logout();

      // Clear React Query cache
      queryClient.clear();

      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
