import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMonitoringWebhook,
  deleteMonitoringWebhook,
  listMonitoringWebhooks,
  updateMonitoringWebhook,
} from '@/app/actions';
import type { TMonitoringWebhook, TMonitoringWebhookKind } from '@/utils/schemas';

export const MONITORING_BASE_KEY = ['monitoring-webhooks'] as const;
export const monitoringKey = (kind: TMonitoringWebhookKind, userId?: string) => [...MONITORING_BASE_KEY, kind, userId] as const;

export function useMonitoringWebhooks(kind: TMonitoringWebhookKind, userId?: string) {
  return useQuery({
    queryKey: monitoringKey(kind, userId),
    queryFn: () => listMonitoringWebhooks(kind, userId!),
    enabled: Boolean(kind && userId),
  });
}

export function useCreateMonitoringWebhook(kind: TMonitoringWebhookKind, userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<TMonitoringWebhook, 'ID'>) => createMonitoringWebhook(kind, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: monitoringKey(kind, userId) });
    },
  });
}

export function useUpdateMonitoringWebhook(kind: TMonitoringWebhookKind, userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TMonitoringWebhook) => updateMonitoringWebhook(kind, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: monitoringKey(kind, userId) });
    },
  });
}

export function useDeleteMonitoringWebhook(kind: TMonitoringWebhookKind, userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteMonitoringWebhook(kind, id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: monitoringKey(kind, userId) });
    },
  });
}
