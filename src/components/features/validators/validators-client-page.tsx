'use client';

import { useState, useMemo } from 'react';

import { ActivityLogIcon, CheckCircledIcon, LayersIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Card, Flex, Heading, Text, Box, TextField, Grid, Select } from '@radix-ui/themes';

import Copyable from '@/elements/copyable';
import Loader from '@/elements/loader';

import useGetBlockHeight from '@/hooks/use-get-blockHeight';
import useGetValidators from '@/hooks/use-get-validators';

import { TValidatorParticipation } from '@/utils/schemas';
import { EValidatorPeriod } from '@/utils/validators';

import StatCard from '../govdao/stat-card';

export type ValidatorIncidentLevel = 'CRITICAL' | 'WARNING' | 'INFO';

export type ValidatorLastIncident = {
  Moniker: string;
  Addr: string;
  Level: ValidatorIncidentLevel;
  StartHeight: number;
  EndHeight: number;
  Msg: string;
  SentAt: string;
};

const ValidatorCardItem = ({ validator }: { validator: TValidatorParticipation }) => {
  const participationRate = validator.ParticipationRate ?? 0;

  const participationBgColor = participationRate < 90 ? '#ffa2a2' : participationRate < 100 ? '#fdf5a1' : '#a4ffbf';

  return (
    <Card className="mb-3" style={{ backgroundColor: participationBgColor }}>
      <Flex direction="column" gap="2">
        <Flex align="center" justify="between">
          <Text size="4" className="font-semibold">
            {validator.Moniker}
          </Text>
        </Flex>
        <Box className="grid grid-cols-[auto_1fr] items-center gap-2">
          <Text size="2" color="gray">
            Address:
          </Text>
          <Copyable>{validator.Addr}</Copyable>
        </Box>
        <Flex justify="between" gap="4" mt="2">
          <Text size="3" className={'font-semibold'}>
            Participation: {participationRate}%
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
};

const ValidatorsClientPage = () => {
  const [period, setPeriod] = useState<EValidatorPeriod>(EValidatorPeriod.MONTH);
  const { data: validators, isLoading } = useGetValidators(period);
  const { data: blockHeight } = useGetBlockHeight();

  const [query, setQuery] = useState('');

  const avgParticipationRate = useMemo(() => {
    if (!validators) return 0;
    const total = validators.reduce(
      (acc: number, validator: TValidatorParticipation) => acc + (validator.ParticipationRate ?? 0),
      0,
    );
    return total / validators.length;
  }, [validators]);

  if (isLoading) {
    return (
      <Flex align="center" justify="center" className="min-h-screen">
        <Loader />
      </Flex>
    );
  }

  if (!validators) {
    return (
      <Flex align="center" justify="center" className="min-h-screen">
        <Text>No metrics available</Text>
      </Flex>
    );
  }

  return (
    <Box my="4">
      <Flex justify="between" mb="3" gap="3">
        <Box>
          <Heading size="7">Validator Monitoring</Heading>
          <Text color="gray">Monitor the performance and health of validators in the network</Text>
        </Box>
      </Flex>

      <Grid columns={{ initial: '1', md: '3' }} gap="3">
        <StatCard icon={<LayersIcon />} title="Block height" value={blockHeight?.last_stored || 0} />
        <StatCard icon={<CheckCircledIcon />} title="Active validators" value={validators?.length} />
        <StatCard icon={<ActivityLogIcon />} title="Avg participation rate" value={avgParticipationRate + ' %'} />
      </Grid>

      <Flex justify="between" my="4">
        <TextField.Root
          placeholder="Search validators..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-[300px]"
        >
          <TextField.Slot>
            <MagnifyingGlassIcon />
          </TextField.Slot>
        </TextField.Root>

        <Select.Root value={period} onValueChange={(v) => setPeriod(v as EValidatorPeriod)}>
          <Select.Trigger variant="soft" />
          <Select.Content>
            <Select.Item value={EValidatorPeriod.YEAR}>Past Year</Select.Item>
            <Select.Item value={EValidatorPeriod.MONTH}>Past Month</Select.Item>
            <Select.Item value={EValidatorPeriod.WEEK}>Past Week</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      <Grid columns={{ initial: '1', md: '2' }} gap="3">
        {validators.map((validator: TValidatorParticipation) => (
          <ValidatorCardItem key={validator.Addr} validator={validator} />
        ))}
      </Grid>
    </Box>
  );
};

export default ValidatorsClientPage;
