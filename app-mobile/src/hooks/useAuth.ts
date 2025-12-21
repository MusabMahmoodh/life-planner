import { useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, LoginRequest, RegisterRequest } from '../services/apiClient';
import { useAuth as useAuthContext } from '../providers/AuthProvider';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

/**
 * Hook for user login
 */
export const useLogin = () => {
  const { login: authLogin } = useAuthContext();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await apiClient.login(data);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data!;
    },
    onSuccess: async (data) => {
      // Use AuthProvider's login to update global state
      await authLogin(data.access_token, data.user);
    },
  });
};

/**
 * Hook for user registration
 */
export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await apiClient.register(data);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data!;
    },
  });
};

/**
 * Hook for user logout
 */
export const useLogout = () => {
  const { logout: authLogout } = useAuthContext();

  return useMutation({
    mutationFn: async () => {
      // Use AuthProvider's logout
      await authLogout();
    },
  });
};

/**
 * Utility function to check if user is authenticated
 */
export const checkAuth = async (): Promise<{
  isAuthenticated: boolean;
  token: string | null;
  user: any | null;
}> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const userStr = await AsyncStorage.getItem(USER_KEY);

    if (token && userStr) {
      const user = JSON.parse(userStr);

      // Set token in API client
      apiClient.setToken(token);

      return {
        isAuthenticated: true,
        token,
        user,
      };
    }

    return {
      isAuthenticated: false,
      token: null,
      user: null,
    };
  } catch (error) {
    console.error('Error checking auth:', error);
    return {
      isAuthenticated: false,
      token: null,
      user: null,
    };
  }
};
