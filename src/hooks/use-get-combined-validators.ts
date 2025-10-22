import { useQuery, useQueryClient } from '@tanstack/react-query';

import { EValidatorPeriod } from '@/utils/validators';

import { getValidators, getValidatorUptime, getValidatorTxContrib, getValidatorMissingBlock } from '@/app/actions';

export interface TCombinedValidator {
  addr: string;
  moniker: string;
  participationRate: number;
  uptime: number | null;
  txContrib: number | null;
  lastUpDate: string | null;
  lastDownDate: string | null;
  missingBlock: number | null;
}

export const useGetCombinedValidators = (period: EValidatorPeriod = EValidatorPeriod.MONTH) => {
  const queryClient = useQueryClient();

  const query = useQuery<TCombinedValidator[]>({
    queryKey: ['validators-combined', period],
    queryFn: async () => {
      const getOrFetch = async <T>(key: unknown[], fn: () => Promise<T>): Promise<T> => {
        const cached = queryClient.getQueryData<T>(key);
        if (cached) return cached;
        return queryClient.fetchQuery({ queryKey: key, queryFn: fn });
      };

      const [validators, uptime, txContrib, missingBlock] = await Promise.all([
        getOrFetch(['validators', period], () => getValidators(period)),
        getOrFetch(['uptime'], getValidatorUptime),
        getOrFetch(['tx-contrib', period], () => getValidatorTxContrib(period)),
        getOrFetch(['missing-block', period], () => getValidatorMissingBlock(period)),
      ]);

      return validators
        .map((v) => {
          if (!v) return null;

          const up = uptime?.find((u) => u?.addr === v.addr);
          const tx = txContrib?.find((t) => t?.addr === v.addr);
          const missing = missingBlock?.find((m) => m?.addr === v.addr);

          return {
            addr: v.addr,
            moniker: v.moniker,
            participationRate: v.participationRate,
            uptime: up?.uptime ?? null,
            txContrib: tx?.txContrib ?? null,
            lastUpDate: up?.lastUpDate ?? null,
            lastDownDate: up?.lastDownDate ?? null,
            missingBlock: missing?.missingBlock ?? null,
          };
        })
        .filter((v): v is NonNullable<TCombinedValidator> => v !== null);
    },
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data,
    isLoading: query.isPending,
  };
};
