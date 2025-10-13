import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import {
  createLeaderboardWebhook,
  deleteLeaderboardWebhook,
  listLeaderboardWebhooks,
  updateLeaderboardWebhook,
} from '@/app/actions';
import type { TLeaderboardWebhook } from '@/utils/schemas';

export const LEADERBOARD_BASE_KEY = ['leaderboard-webhooks'] as const;

export function useLeaderboardWebhooks() {
  return useQuery({
    queryKey: LEADERBOARD_BASE_KEY,
    queryFn: () => listLeaderboardWebhooks(),
  });
}

export function useCreateLeaderboardWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<TLeaderboardWebhook, 'id' | 'userId' | 'nextRunAt' | 'createdAt' | 'updatedAt'>) =>
      createLeaderboardWebhook(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEADERBOARD_BASE_KEY });
    },
  });
}

export function useUpdateLeaderboardWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TLeaderboardWebhook) => updateLeaderboardWebhook(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEADERBOARD_BASE_KEY });
    },
  });
}

export function useDeleteLeaderboardWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteLeaderboardWebhook(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEADERBOARD_BASE_KEY });
    },
  });
}

export const prefetchLeaderboardWebhooks = (qc: QueryClient) => {
  return qc.prefetchQuery({
    queryKey: LEADERBOARD_BASE_KEY,
    queryFn: () => listLeaderboardWebhooks(),
  });
};
