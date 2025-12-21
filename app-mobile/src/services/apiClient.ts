/**
 * API Client Service
 * Centralized service for making HTTP requests to the backend API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '40000');

// Global auth error handler - will be set by AuthProvider
let authErrorHandler: (() => void) | null = null;

export const setAuthErrorHandler = (handler: () => void) => {
  authErrorHandler = handler;
};

const handleAuthError = async (status: number) => {
  if (status === 401 || status === 403) {
    // Clear stored credentials
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');

    // Trigger logout via AuthProvider
    if (authErrorHandler) {
      authErrorHandler();
    }
  }
};

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
  };
}

interface Goal {
  id: string;
  user_id: string;
  coach_name: string;
  goal_description: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

interface CreateGoalRequest {
  coach_name: string;
  goal_description: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  message: string;
  stage?: string;
  plan_ready?: boolean;
  flag?: string;
  plan_data?: Plan;
}

interface GoalDetail {
  id: string;
  user_id: string;
  coach_name: string;
  goal_description: string;
  status: 'active' | 'completed' | 'archived' | 'pending_acceptance';
  created_at: string;
  updated_at: string;
  plan?: Plan;
  current_step?: number;
  has_plan?: boolean;
}

interface ChatHistory {
  messages: Message[];
  welcome_message: string;
  goal: Goal;
}

interface Step {
  id: number;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
}

interface Plan {
  goal: string;
  total_steps: number;
  current_step: number;
  steps: Step[];
  modification_note?: string;
}

interface TweakPlanRequest {
  tweak_message: string;
}

/**
 * Helper function to add timeout to fetch requests
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Helper function to handle API responses
 */
const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const status = response.status;

  // Handle authentication errors
  if (status === 401 || status === 403) {
    await handleAuthError(status);
  }

  try {
    const data = await response.json();

    if (response.ok) {
      return { data, status };
    } else {
      return {
        error: data.detail || data.message || 'An error occurred',
        status,
      };
    }
  } catch (error) {
    return {
      error: 'Failed to parse response',
      status,
    };
  }
};

/**
 * API Client Class
 */
class ApiClient {
  private token: string | null = null;

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token;
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get default headers
   */
  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // ==================== Auth APIs ====================

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/register`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify(data),
      });

      return handleResponse<AuthResponse>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/login`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify(data),
      });

      const result = await handleResponse<AuthResponse>(response);

      // Automatically set token if login is successful
      if (result.data?.access_token) {
        this.setToken(result.data.access_token);
      }

      return result;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  /**
   * Logout user (clear token)
   */
  logout() {
    this.token = null;
  }

  // ==================== Goals APIs ====================

  /**
   * Get all goals for the authenticated user
   */
  async getGoals(): Promise<ApiResponse<Goal[]>> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/goals`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return handleResponse<Goal[]>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  /**
   * Create a new goal
   */
  async createGoal(data: CreateGoalRequest): Promise<ApiResponse<Goal>> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/goals`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      return handleResponse<Goal>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  /**
   * Get goal details with associated plan
   */
  async getGoalDetails(goalId: string): Promise<ApiResponse<GoalDetail>> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/goals/${goalId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return handleResponse<GoalDetail>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  /**
   * Mark a goal as complete
   */
  async completeGoal(goalId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/goal/${goalId}/complete`, {
        method: 'PUT',
        headers: this.getHeaders(),
      });

      return handleResponse<{ message: string }>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  // ==================== Chat APIs ====================

  /**
   * Load chat history for a specific goal
   */
  async getChatHistory(goalId: string): Promise<ApiResponse<ChatHistory>> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/goal/${goalId}/chat`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return handleResponse<ChatHistory>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  /**
   * Send a chat message for a specific goal
   */
  async sendMessage(goalId: string, message: string): Promise<ApiResponse<ChatResponse>> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/goal/${goalId}/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ message }),
      });

      return handleResponse<ChatResponse>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  // ==================== Plan APIs ====================

  /**
   * Accept the plan for a specific goal
   */
  async acceptPlan(goalId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/goal/${goalId}/accept`, {
        method: 'PUT',
        headers: this.getHeaders(),
      });

      return handleResponse<any>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  /**
   * Tweak/modify the plan for a specific goal
   */
  async tweakPlan(goalId: string, data: TweakPlanRequest): Promise<ApiResponse<Plan>> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/goal/${goalId}/tweak`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      return handleResponse<Plan>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  /**
   * Toggle step completion
   */
  async toggleStepCompletion(
    goalId: string,
    stepId: number,
    completed: boolean
  ): Promise<ApiResponse<any>> {
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/goal/${goalId}/step/${stepId}/completion`,
        {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ step_id: stepId, completed }),
        }
      );

      return handleResponse<any>(response);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for use in other files
export type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Goal,
  CreateGoalRequest,
  Message,
  ChatResponse,
  Step,
  Plan,
  TweakPlanRequest,
  GoalDetail,
  ChatHistory,
};
