'use client';

import { useMemo, useState } from 'react';
import NextLink from 'next/link';
import { Badge, Box, Card, Flex, Grid, Heading, SegmentedControl, Text, TextField } from '@radix-ui/themes';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

import useGetProposals from '@/hooks/use-get-proposals';
import { TProposal } from '@/utils/schemas';
import Loader from '@/elements/loader';
import StatCard from '@/features/govdao/stat-card';
import { aggregateVotes, capitalize, getProposalTitle, getStatusColor, percent } from '@/utils/govdao';

// Title extraction moved to utils/govdao

// Filters bar
const Filters = ({
  query,
  setQuery,
  status,
  setStatus,
  statuses,
  legend,
}: {
  query: string;
  setQuery: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  statuses: string[];
  legend: Array<{ key: string; count: number; color: any }>;
}) => (
  <Flex align="center" justify="between" wrap="wrap">
    <TextField.Root placeholder="Search proposals..." value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-[420px]">
      <TextField.Slot>
        <MagnifyingGlassIcon />
      </TextField.Slot>
    </TextField.Root>
    <SegmentedControl.Root className="mt-2 sm:mt-0" value={status} onValueChange={setStatus}>
      {statuses.map((s) => (
        <SegmentedControl.Item key={s} value={s}>
          {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)} ({legend.find((l) => l.key === s)?.count})
        </SegmentedControl.Item>
      ))}
    </SegmentedControl.Root>
  </Flex>
);


const ProposalCard = ({ proposal }: { proposal: TProposal }) => {
  const totals = aggregateVotes(proposal.votes);
  const forPct = percent(totals.for, totals.total);
  const againstPct = percent(totals.against, totals.total);
  const abstainPct = percent(totals.abstain, totals.total);

  const status = (proposal.status || 'active').toLowerCase();
  const statusColor: any = getStatusColor(status);

  return (
    <Card>
      <Flex direction="column" gap="2">
        <Flex align="center" justify="between">
          <Badge color={statusColor} variant="soft">
            {capitalize(status)}
          </Badge>
          <Text color="gray" size="2">ID: {proposal.id}</Text>
        </Flex>
        <Heading size="4" asChild>
          <NextLink href={`/govdao/proposal/${proposal.id}`}>{getProposalTitle(proposal)}</NextLink>
        </Heading>
        <Text mb="2" color="gray">Proposal path: {proposal.path}</Text>
        <Box className="h-2 w-full rounded-full bg-red-6 relative overflow-hidden">
          <Box className='absolute left-0 top-0 h-full bg-green-9' width={`${forPct}%`} />
        </Box>
        <Flex mt="2" justify="between">
          <Text color="green" size="2">For {forPct}%</Text>
          <Text color="gray" size="2">Abstain {abstainPct}%</Text>
          <Text color="red" size="2">Against {againstPct}%</Text>
        </Flex>
      </Flex>
    </Card>
  );
};

const GovdaoPage = () => {
  const { data, isPending } = useGetProposals();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const statuses = useMemo(() => {
    const list = (data ?? []) as TProposal[];
    const unique = Array.from(new Set(list.map((p) => (p.status || 'unknown').toLowerCase())));
    return ['all', ...unique];
  }, [data]);

  const legend = useMemo(() => {
    const list = (data ?? []) as TProposal[];
    const counts = list.reduce<Record<string, number>>((acc, p) => {
      const s = (p.status || 'unknown').toLowerCase();
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const colorFor = (s: string): any => (s === 'executed' ? 'green' : s === 'rejected' ? 'red' : s === 'created' ? 'violet' : 'gray');
    const entries = Object.entries(counts).map(([key, count]) => ({ key, count, color: colorFor(key) }));
    const total = list.length;
    return [{ key: 'all', count: total, color: 'gray' }, ...entries];
  }, [data]);

  const filtered = useMemo(() => {
    const list = (data ?? []) as TProposal[];
    return list.filter((p) => {
      const matchesQuery = [p.id, p.path, p.address].some((field) => field?.toLowerCase().includes(query.toLowerCase()));
      const matchesStatus = status === 'all' ? true : (p.status || '').toLowerCase() === status;
      return matchesQuery && matchesStatus;
    });
  }, [data, query, status]);

  const metrics = useMemo(() => {
    const list = (data ?? []) as TProposal[];
    const executedCount = list.filter((p) => (p.status || '').toLowerCase() === 'executed').length;
    const activeCount = list.filter((p) => (p.status || '').toLowerCase() === 'created').length;
    const uniqueVoters = new Set<string>();
    let totalVotes = 0;
    list.forEach((p) => {
      (p.votes || []).forEach((v) => {
        if (v.address) uniqueVoters.add(v.address);
        totalVotes += 1;
      });
    });
    const avgVotes = list.length > 0 ? Math.round(totalVotes / list.length) : 0;
    return { executedCount, activeCount, uniqueVoters: uniqueVoters.size, avgVotes };
  }, [data]);

  return (
    <Box>
      <Flex align="center" justify="between" mt="4" mb="3">
        <Box>
          <Heading size="7">Governance DAO</Heading>
          <Text color="gray">Track proposals, votes, and governance activities across GNO protocols</Text>
        </Box>
      </Flex>

      <Grid columns={{ initial: '1', md: '4' }} gap="3">
        <StatCard title="Active Proposals" value={metrics.activeCount} hint="Status: created" />
        <StatCard title="Unique Voters" value={metrics.uniqueVoters} hint="Distinct addresses voted" />
        <StatCard title="Avg Votes / Proposal" value={metrics.avgVotes} hint="Across all proposals" />
        <StatCard title="Proposals Passed" value={metrics.executedCount} hint="All time executed" />
      </Grid>

      <Box my="4">
        <Filters query={query} setQuery={setQuery} status={status} setStatus={setStatus} statuses={statuses} legend={legend} />
      </Box>

      {isPending ? (
        <Loader />
      ) : (
        <Grid columns={{ initial: '1', md: '2' }} gap="3">
          {filtered.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default GovdaoPage;
