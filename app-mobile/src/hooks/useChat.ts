import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { goalsKeys } from './useGoals';

// Query keys
export const chatKeys = {
  history: (goalId: string) => ['chat', goalId, 'history'] as const,
};

/**
 * Hook to load chat history
 */
export const useChatHistory = (goalId: string, enabled = true) => {
  return useQuery({
    queryKey: chatKeys.history(goalId),
    queryFn: async () => {
      const response = await apiClient.getChatHistory(goalId);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data!;
    },
    enabled: !!goalId && enabled, // Only fetch if goalId is provided and enabled
  });
};

/**
 * Hook to send a chat message
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, message }: { goalId: string; message: string }) => {
      const response = await apiClient.sendMessage(goalId, message);

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data!;
    },
    onSuccess: (_, { goalId }) => {
      // Invalidate goal details in case plan was updated during chat
      queryClient.invalidateQueries({ queryKey: goalsKeys.detail(goalId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.history(goalId) });
    },
  });
};
