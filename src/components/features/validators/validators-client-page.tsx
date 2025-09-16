'use client';

import { useState, useMemo } from 'react';

import { ActivityLogIcon, CheckCircledIcon, LayersIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Card, Flex, Heading, Text, Box, TextField, Grid } from '@radix-ui/themes';

import Copyable from '@/elements/copyable';
import Loader from '@/elements/loader';

import useGetBlockHeight from '@/hooks/use-get-blockHeight';
import useGetValidatorsMetrics from '@/hooks/use-get-validators-metrics';

import { TValidatorMetric } from '@/utils/schemas';

import StatCard from '../govdao/stat-card';

const ValidatorCardItem = ({ validator }: { validator: TValidatorMetric }) => {
  const participationRate = validator.gnoland_validator_participation_rate ?? 0;

  const participationBgColor = participationRate < 90 ? '#ffa2a2' : participationRate < 100 ? '#fdf5a1' : '#a4ffbf';

  return (
    <Card className="mb-3 md:hidden" style={{ backgroundColor: participationBgColor }}>
      <Flex direction="column" gap="2">
        <Flex align="center" justify="between">
          <Text size="4" className="font-semibold">
            {validator.moniker}
          </Text>
        </Flex>
        <Box className="grid grid-cols-[auto_1fr] items-center gap-2">
          <Text size="2" color="gray">
            Address:
          </Text>
          <Copyable>{validator.validator_address}</Copyable>
        </Box>
        <Flex justify="between" gap="4" mt="2">
          <Flex gap="4">
            <Text size="2">
              Missed: <span className="font-mono">{validator.gnoland_missed_blocks}</span>
            </Text>
            <Text size="2">
              Consecutive: <span className="font-mono">{validator.gnoland_consecutive_missed_blocks}</span>
            </Text>
          </Flex>
          <Text size="3" className={'font-semibold'}>
            Participation: {participationRate}%
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
};

const ValidatorGridItem = ({ validator }: { validator: TValidatorMetric }) => {
  const participationRate = validator.gnoland_validator_participation_rate ?? 0;

  const participationBgColor = participationRate < 90 ? '#ffa2a2' : participationRate < 100 ? '#fdf5a1' : '#a4ffbf';

  return (
    <Box
      key={validator.validator_address}
      className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr] items-center border-b border-gray-3 py-3 transition-colors duration-150"
      style={{ backgroundColor: participationBgColor }}
    >
      <Text size={{ initial: '2', md: '4' }} className="font-semibold">
        {validator.moniker}
      </Text>
      <Copyable>{validator.validator_address}</Copyable>
      <Text size={{ initial: '2', md: '6' }} className="text-right">
        {validator.gnoland_missed_blocks}
      </Text>
      <Text size={{ initial: '2', md: '6' }} className="text-right">
        {validator.gnoland_consecutive_missed_blocks}
      </Text>
      <Text size={{ initial: '2', md: '6' }} className={'font-semibold text-right'}>
        {participationRate}%
      </Text>
    </Box>
  );
};

const ValidatorsClientPage = () => {
  const { data: metrics, isLoading } = useGetValidatorsMetrics();
  const { data: blockHeight } = useGetBlockHeight();
  const [query, setQuery] = useState('');

  const avgParticipationRate = useMemo(() => {
    if (!metrics?.validators) return 0;
    const total = metrics.validators.reduce(
      (acc: number, validator: TValidatorMetric) => acc + (validator.gnoland_validator_participation_rate ?? 0),
      0,
    );
    return total / metrics.validators.length;
  }, [metrics?.validators]);

  const [sortKey, setSortKey] = useState<'missed' | 'consecutive' | 'participation' | null>('participation');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredValidators = useMemo(() => {
    if (!metrics?.validators) return [];
    const q = query.toLowerCase();
    let result = metrics.validators.filter(
      (validator: TValidatorMetric) =>
        validator.moniker?.toLowerCase().includes(q) || validator.validator_address?.toLowerCase().includes(q),
    );
    if (sortKey) {
      result = [...result].sort((a, b) => {
        let aValue, bValue;
        if (sortKey === 'missed') {
          aValue = a.gnoland_missed_blocks;
          bValue = b.gnoland_missed_blocks;
        } else if (sortKey === 'consecutive') {
          aValue = a.gnoland_consecutive_missed_blocks;
          bValue = b.gnoland_consecutive_missed_blocks;
        } else if (sortKey === 'participation') {
          aValue = a.gnoland_validator_participation_rate;
          bValue = b.gnoland_validator_participation_rate;
        }
        aValue = aValue ?? 0;
        bValue = bValue ?? 0;
        if (sortOrder === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }
    return result;
  }, [metrics?.validators, query, sortKey, sortOrder]);

  if (isLoading) {
    return (
      <Flex align="center" justify="center" className="min-h-screen">
        <Loader />
      </Flex>
    );
  }

  if (!metrics) {
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
        <StatCard icon={<LayersIcon />} title="Block height" value={blockHeight?.last_stored || 0} hint="" />
        <StatCard icon={<CheckCircledIcon />} title="Active validators" value={metrics.validators.length} hint="" />
        <StatCard
          icon={<ActivityLogIcon />}
          title="Avg participation rate"
          value={avgParticipationRate + ' %'}
          hint=""
        />
      </Grid>

      <Box my="4">
        <TextField.Root
          placeholder="Search validators..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-[220px]"
        >
          <TextField.Slot>
            <MagnifyingGlassIcon />
          </TextField.Slot>
        </TextField.Root>
      </Box>

      <Card className="shadow-lg rounded-2xl hidden p-4 sm:block">
        <Box className="font-semibold mb-2 grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-2 border-b border-gray-3 pb-2">
          <Text size={{ initial: '2', md: '4' }}>Moniker</Text>
          <Text size={{ initial: '2', md: '4' }}>Address</Text>
          <Text
            size={{ initial: '2', md: '4' }}
            className="cursor-pointer select-none text-right"
            onClick={() => {
              setSortKey('missed');
              setSortOrder(sortKey === 'missed' && sortOrder === 'desc' ? 'asc' : 'desc');
            }}
          >
            Missed Blocks{sortKey === 'missed' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
          </Text>
          <Text
            size={{ initial: '2', md: '4' }}
            className="cursor-pointer select-none text-right"
            onClick={() => {
              setSortKey('consecutive');
              setSortOrder(sortKey === 'consecutive' && sortOrder === 'desc' ? 'asc' : 'desc');
            }}
          >
            Consecutive Missed{sortKey === 'consecutive' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
          </Text>
          <Text
            size={{ initial: '2', md: '4' }}
            className="cursor-pointer select-none text-right"
            onClick={() => {
              setSortKey('participation');
              setSortOrder(sortKey === 'participation' && sortOrder === 'desc' ? 'asc' : 'desc');
            }}
          >
            Participation Rate{sortKey === 'participation' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
          </Text>
        </Box>
        {/* Responsive design: grid on desktop, cards on mobile */}
        <Box className="hidden sm:block">
          {filteredValidators.map((validator: TValidatorMetric) => (
            <ValidatorGridItem key={validator.validator_address} validator={validator} />
          ))}
        </Box>
      </Card>

      <Box className="sm:hidden">
        {filteredValidators.map((validator: TValidatorMetric) => (
          <ValidatorCardItem key={validator.validator_address} validator={validator} />
        ))}
      </Box>
    </Box>
  );
};

export default ValidatorsClientPage;
