import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, CreateGoalRequest } from '../services/apiClient';

// Query keys
export const goalsKeys = {
  all: ['goals'] as const,
  detail: (id: string) => ['goals', id] as const,
  plan: (id: string) => ['goals', id, 'plan'] as const,
};

/**
 * Hook to fetch all goals
 */
export const useGoals = () => {
  return useQuery({
    queryKey: goalsKeys.all,
    queryFn: async () => {
      const response = await apiClient.getGoals();

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data!;
    },
  });
};

/**
 * Hook to create a new goal
 */
export const useCreateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGoalRequest) => {
      const response = await apiClient.createGoal(data);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data!;
    },
    onSuccess: () => {
      // Invalidate goals list to refetch
      queryClient.invalidateQueries({ queryKey: goalsKeys.all });
    },
  });
};

/**
 * Hook to complete a goal
 */
export const useCompleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      const response = await apiClient.completeGoal(goalId);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data!;
    },
    onSuccess: () => {
      // Invalidate goals list to refetch
      queryClient.invalidateQueries({ queryKey: goalsKeys.all });
    },
  });
};

/**
 * Hook to get goal details with plan
 */
export const useGoalDetails = (goalId: string, enabled = true) => {
  return useQuery({
    queryKey: goalsKeys.detail(goalId),
    queryFn: async () => {
      const response = await apiClient.getGoalDetails(goalId);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data!;
    },
    enabled: !!goalId && enabled, // Only fetch if goalId is provided and enabled
  });
};

/**
 * Hook to accept a plan
 */
export const useAcceptPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      const response = await apiClient.acceptPlan(goalId);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data!;
    },
    onSuccess: (_, goalId) => {
      // Invalidate goal details to refetch plan
      queryClient.invalidateQueries({ queryKey: goalsKeys.detail(goalId) });
      queryClient.invalidateQueries({ queryKey: goalsKeys.all });
    },
  });
};

/**
 * Hook to tweak/modify a plan
 */
export const useTweakPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, message }: { goalId: string; message: string }) => {
      const response = await apiClient.tweakPlan(goalId, { tweak_message: message });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data!;
    },
    onSuccess: (_, { goalId }) => {
      // Invalidate goal details to refetch plan
      queryClient.invalidateQueries({ queryKey: goalsKeys.detail(goalId) });
      queryClient.invalidateQueries({ queryKey: goalsKeys.all });
    },
  });
};

/**
 * Hook to toggle step completion
 */
export const useToggleStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      goalId,
      stepId,
      completed
    }: {
      goalId: string;
      stepId: number;
      completed: boolean;
    }) => {
      const response = await apiClient.toggleStepCompletion(goalId, stepId, completed);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data!;
    },
    onSuccess: (_, { goalId }) => {
      // Invalidate goal details to refetch plan
      queryClient.invalidateQueries({ queryKey: goalsKeys.detail(goalId) });
      queryClient.invalidateQueries({ queryKey: goalsKeys.all });
    },
  });
};
