import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMonitoringWebhook,
  deleteMonitoringWebhook,
  getReportHour,
  listMonitoringWebhooks,
  updateMonitoringWebhook,
  updateReportHour,
} from '@/app/actions';
import type { TMonitoringWebhook, TMonitoringWebhookKind, TReportHour } from '@/utils/schemas';

export const MONITORING_BASE_KEY = ['monitoring-webhooks'] as const;
export const monitoringKey = (kind: TMonitoringWebhookKind) => [...MONITORING_BASE_KEY, kind] as const;

export function useMonitoringWebhooks(kind: TMonitoringWebhookKind) {
  return useQuery({
    queryKey: monitoringKey(kind),
    queryFn: () => listMonitoringWebhooks(kind),
    enabled: Boolean(kind),
  });
}

export function useCreateMonitoringWebhook(kind: TMonitoringWebhookKind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<TMonitoringWebhook, 'ID' | 'UserID'>) => createMonitoringWebhook(kind, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: monitoringKey(kind) });
    },
  });
}

export function useUpdateMonitoringWebhook(kind: TMonitoringWebhookKind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<TMonitoringWebhook, 'UserID'>) => updateMonitoringWebhook(kind, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: monitoringKey(kind) });
    },
  });
}

export function useDeleteMonitoringWebhook(kind: TMonitoringWebhookKind) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteMonitoringWebhook(kind, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: monitoringKey(kind) });
    },
  });
}

export function useGetReportHour() {
  return useQuery({
    queryKey: ['report-hour'],
    queryFn: () => getReportHour(),
  });
}

export function useUpdateReportHour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<TReportHour, 'UserID'>) => updateReportHour(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['report-hour'] });
    },
  });
}