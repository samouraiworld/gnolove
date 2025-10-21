import { useQuery, useQueryClient } from '@tanstack/react-query';

import type {
  TValidatorsParticipation,
  TValidatorUptime,
  TValidatorTxContrib,
  TValidatorMissingBlock,
} from '@/utils/schemas';
import { EValidatorPeriod } from '@/utils/validators';

interface TCombinedValidator {
  addr: string;
  moniker: string;
  participationRate: number;
  uptime?: number | null;
  txContrib?: number | null;
  lastUpDate?: string | null;
  lastDownDate: string | null;
  missingBlock: number | null;
}

export const useGetCombinedValidators = (period: EValidatorPeriod = EValidatorPeriod.MONTH) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<TCombinedValidator[]>({
    queryKey: ['validators-combined', period],
    queryFn: async () => {
      const [validators, uptime, txContrib, missingBlock] = await Promise.all([
        queryClient.ensureQueryData<TValidatorsParticipation>({ queryKey: ['validators', period] }),
        queryClient.ensureQueryData<TValidatorUptime[]>({ queryKey: ['uptime'] }),
        queryClient.ensureQueryData<TValidatorTxContrib[]>({ queryKey: ['tx-contrib', period] }),
        queryClient.ensureQueryData<TValidatorMissingBlock[]>({ queryKey: ['missing-block', period] }),
      ]);

      return validators.map((v) => {
        const up = uptime.find((u) => u.addr === v.addr);
        const tx = txContrib.find((t) => t.addr === v.addr);
        const missing = missingBlock.find((m) => m.addr === v.addr);

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
      });
    },
  });

  return { data, isLoading };
};
