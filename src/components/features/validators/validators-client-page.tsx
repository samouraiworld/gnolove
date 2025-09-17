'use client';

import { useState, useMemo } from 'react';

import {
  ActivityLogIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  ExclamationTriangleIcon,
  LayersIcon,
  MagnifyingGlassIcon,
} from '@radix-ui/react-icons';
import { Card, Flex, Heading, Text, Box, TextField, Grid, Select, Separator } from '@radix-ui/themes';
import { format, subWeeks, subMonths, subYears, isAfter } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip as NativeRechartTooltip, ResponsiveContainer } from 'recharts';

import Copyable from '@/elements/copyable';
import Loader from '@/elements/loader';
import RechartTooltip from '@/elements/rechart-tooltip';

import useGetBlockHeight from '@/hooks/use-get-blockHeight';
import useGetValidators from '@/hooks/use-get-validators';
import useGetValidatorsLastIncident from '@/hooks/use-get-validators-incident';

import { TValidatorParticipation } from '@/utils/schemas';
import { EValidatorPeriod } from '@/utils/validators';

import StatCard from '../govdao/stat-card';

export type ValidatorIncidentLevel = 'CRITICAL' | 'WARNING' | 'RESOLVED';

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

  let StatusIcon = CheckCircledIcon;
  let iconColor = '#34d399';
  if (participationRate < 90) {
    StatusIcon = CrossCircledIcon;
    iconColor = '#f87171';
  } else if (participationRate < 100) {
    StatusIcon = ExclamationTriangleIcon;
    iconColor = '#facc15';
  }

  return (
    <Card className="mb-3">
      <Flex direction="column" gap="2">
        <Flex align="center" justify="between">
          <Flex align="center" gap="2">
            <StatusIcon width={20} height={20} color={iconColor} />
            <Text size="4" className="font-semibold">
              {validator.Moniker}
            </Text>
          </Flex>
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

const getPeriodStart = (period: EValidatorPeriod) => {
  const now = new Date();
  switch (period) {
    case EValidatorPeriod.WEEK:
      return subWeeks(now, 1);
    case EValidatorPeriod.MONTH:
      return subMonths(now, 1);
    case EValidatorPeriod.YEAR:
      return subYears(now, 1);
    default:
      return subWeeks(now, 1);
  }
};

const getLevelColor = (level: string) => {
  if (level === 'CRITICAL') return '#f87171';
  if (level === 'WARNING') return '#facc15';
  return '#34d399';
};

const renderEntries = (payload: any[], _label?: string | number) => {
  if (!payload || !payload[0]) return null;

  const p = payload[0].payload.incidents as ValidatorLastIncident[];
  if (!Array.isArray(p)) return null;
  return (
    <Flex direction="column" gap="1">
      {p.map((incident, idx) => (
        <Box key={idx} p="1">
          <Flex gap="1">
            <Text size="1">Level: </Text>
            <Text size="1" weight="bold" style={{ color: getLevelColor(incident.Level) }}>
              {incident.Level}
            </Text>
          </Flex>
          <Flex gap="1">
            <Text size="1">Moniker: </Text>
            <Text size="1" weight="bold">
              {incident.Moniker}
            </Text>
          </Flex>
          <Flex gap="1">
            <Text size="1">Msg: </Text>
            <Text size="1" weight="bold">
              {incident.Msg}
            </Text>
          </Flex>
          <Flex gap="1">
            <Text size="1">From height: </Text>
            <Text size="1" weight="bold">
              {incident.StartHeight}
            </Text>
          </Flex>
          <Flex gap="1">
            <Text size="1">To height: </Text>
            <Text size="1" weight="bold">
              {incident.EndHeight}
            </Text>
          </Flex>
          {idx !== p.length - 1 && <Separator size="4" mt="2" />}
        </Box>
      ))}
    </Flex>
  );
};

const ValidatorsClientPage = () => {
  const [period, setPeriod] = useState<EValidatorPeriod>(EValidatorPeriod.MONTH);
  const { data: validators, isLoading } = useGetValidators(period);
  const { data: blockHeight } = useGetBlockHeight();
  const { data: lastIncidents } = useGetValidatorsLastIncident();
  const [query, setQuery] = useState('');

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

  const avgParticipationRate = useMemo(() => {
    if (!validators) return 0;
    const total = validators.reduce(
      (acc: number, validator: TValidatorParticipation) => acc + (validator.ParticipationRate ?? 0),
      0,
    );
    return total / validators.length;
  }, [validators]);

  const periodStart = getPeriodStart(period);
  // Group incidents by date and stack by level
  const filteredIncidents = useMemo(() => {
    if (!lastIncidents) return [];
    const filtered = lastIncidents.filter(
      (incident) => incident && isAfter(new Date(incident.SentAt ?? ''), periodStart),
    );
    const grouped: Record<
      string,
      { date: string; CRITICAL: number; WARNING: number; RESOLVED: number; incidents: ValidatorLastIncident[] }
    > = {};
    filtered.forEach((incident) => {
      if (!incident) return;
      const date = format(new Date(incident.SentAt ?? ''), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = { date, CRITICAL: 0, WARNING: 0, RESOLVED: 0, incidents: [] };
      }
      grouped[date][incident.Level as 'CRITICAL' | 'WARNING' | 'RESOLVED']++;
      grouped[date].incidents.push({
        ...incident,
        Level: incident.Level as ValidatorIncidentLevel,
      });
    });

    return Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [lastIncidents, periodStart]);

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

      <Flex justify="between" align="center" my="4" gap="3">
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

        {filteredIncidents.length > 0 ? (
          <Box className="align-start w-1/2">
            <Heading size="1">Validators events</Heading>
            <ResponsiveContainer width="100%" minWidth={0} height={24}>
              <BarChart
                data={filteredIncidents}
                layout="horizontal"
                barCategoryGap={0}
                barGap={0}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <YAxis type="number" hide />
                <XAxis dataKey="date" type="category" hide axisLine={false} tickLine={false} />
                <NativeRechartTooltip
                  wrapperStyle={{ zIndex: 9999 }}
                  content={<RechartTooltip renderEntries={renderEntries} />}
                />
                <Bar
                  dataKey="CRITICAL"
                  stackId="a"
                  name="Critical"
                  barSize={4}
                  radius={2}
                  fill={getLevelColor('CRITICAL')}
                  stroke="none"
                />
                <Bar
                  dataKey="WARNING"
                  stackId="a"
                  name="Warning"
                  barSize={4}
                  radius={2}
                  fill={getLevelColor('WARNING')}
                  stroke="none"
                />
                <Bar
                  dataKey="RESOLVED"
                  stackId="a"
                  name="Resolved"
                  barSize={4}
                  radius={2}
                  fill={getLevelColor('RESOLVED')}
                  stroke="none"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : null}

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
