'use client';

import { useMemo, useState } from 'react';

import NextLink from 'next/link';

import { TransactionBuilder, BroadcastType, MsgCallMessage } from '@adena-wallet/sdk';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Badge, Box, Card, Flex, Grid, Heading, SegmentedControl, Text, TextField, Button } from '@radix-ui/themes';

import StatCard from '@/features/govdao/stat-card';

import Loader from '@/elements/loader';
import RadixMarkdown from '@/elements/radix-markdown';

import { useAdena } from '@/contexts/adena-context';
import { useToast } from '@/contexts/toast-context';

import useGetGovdaoMembers from '@/hooks/use-get-govdao-members';
import useGetProposals from '@/hooks/use-get-proposals';

import { aggregateVotes, capitalize, getProposalTitle, getStatusColor, percent } from '@/utils/govdao';
import { TProposal } from '@/utils/schemas';

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
    <TextField.Root
      placeholder="Search proposals..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="max-w-[420px]"
    >
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

const ProposalCard = ({ proposal, isGovDaoMember }: { proposal: TProposal; isGovDaoMember: boolean }) => {
  const totals = aggregateVotes(proposal.votes);
  const forPct = percent(totals.for, totals.total);
  const againstPct = percent(totals.against, totals.total);
  const abstainPct = percent(totals.abstain, totals.total);
  const { addToast } = useToast();
  const { adena, address } = useAdena();

  const status = (proposal.status || 'active').toLowerCase();
  const statusColor: any = getStatusColor(status);

  const vote = async (vote: string) => {
    if (!adena) return;
    try {
      const transactionRequest = {
        tx: TransactionBuilder.create()
          .messages({
            type: '/vm.m_call',
            value: {
              caller: address,
              pkg_path: proposal.path,
              func: 'MustVoteOnProposalSimple',
              args: [proposal.id, vote],
            },
          } as MsgCallMessage)
          .build(),
        broadcastType: BroadcastType.SYNC,
      };

      await adena.signTransaction(transactionRequest);
    } catch (err) {
      addToast({ title: 'Error', message: String((err as any)?.message ?? err), mode: 'negative' });
    }
  };

  return (
    <Grid rows={{ initial: '1', md: '2' }} gap="3">
      <NextLink href={`/govdao/proposal/${proposal.id}`}>
        <Card className="h-[380px]">
          <Flex direction="column" gap="2" className="h-full">
            <Flex align="center" justify="between">
              <Badge color={statusColor} variant="soft">
                {capitalize(status)}
              </Badge>
              <Text color="gray" size="2">
                ID: {proposal.id}
              </Text>
            </Flex>
            <Heading size="4">{getProposalTitle(proposal)}</Heading>
            {proposal.description && (
              <Box className="min-h-0 flex-1 overflow-auto">
                <RadixMarkdown>{proposal.description}</RadixMarkdown>
              </Box>
            )}
            <Text mb="2" color="gray" className="shrink-0 truncate" title={`Proposal path: ${proposal.path}`}>
              Proposal path: {proposal.path}
            </Text>
            <Box className="relative h-2 w-full shrink-0 overflow-hidden rounded-full bg-red-6">
              <Box className="absolute left-0 top-0 h-full bg-green-9" width={`${forPct}%`} />
            </Box>
            <Flex mt="2" justify="between" className="shrink-0">
              <Text color="green" size="2">
                For {forPct}%
              </Text>
              <Text color="gray" size="2">
                Abstain {abstainPct}%
              </Text>
              <Text color="red" size="2">
                Against {againstPct}%
              </Text>
            </Flex>
          </Flex>
        </Card>
      </NextLink>
      {adena && isGovDaoMember && proposal.status === 'created' && (
        <Grid columns={{ initial: '1', md: '3' }} gap="3">
          <Button mt="2" mb="4" color="green" onClick={() => vote('YES')}>
            For
          </Button>
          <Button mt="2" mb="4" color="gray" onClick={() => vote('ABSTAIN')}>
            Abstain
          </Button>
          <Button mt="2" mb="4" color="red" onClick={() => vote('NO')}>
            Against
          </Button>
        </Grid>
      )}
    </Grid>
  );
};

const GovdaoPage = () => {
  const { data, isPending } = useGetProposals();
  const { data: members, isPending: membersIsPending } = useGetGovdaoMembers();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const { address } = useAdena();

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
    const colorFor = (s: string): any =>
      s === 'executed' ? 'green' : s === 'rejected' ? 'red' : s === 'created' ? 'violet' : 'gray';
    const entries = Object.entries(counts).map(([key, count]) => ({ key, count, color: colorFor(key) }));
    const total = list.length;
    return [{ key: 'all', count: total, color: 'gray' }, ...entries];
  }, [data]);

  const filtered = useMemo(() => {
    const list = (data ?? []) as TProposal[];
    return list
      .filter((p) => {
        const matchesQuery = [p.id, p.path, p.address, p.title, p.description].some((field) =>
          field?.toLowerCase().includes(query.toLowerCase()),
        );
        const matchesStatus = status === 'all' ? true : (p.status || '').toLowerCase() === status;
        return matchesQuery && matchesStatus;
      })
      .reverse();
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

  const isGovDaoMember = useMemo(() => {
    if (!members) return false;
    return members.some((m) => m.address === address);
  }, [members, address]);

  return (
    <Box>
      <Flex align="center" justify="between" mt="4" mb="3">
        <Box>
          <Heading size="7">Governance DAO</Heading>
          <Text color="gray">Track proposals, votes, and governance activities across GNO protocols</Text>
        </Box>
      </Flex>
      {address && (
        <>
          <Box my="4">
            <Text>
              {isGovDaoMember ? '✅ You are a GovDAO member' : '❌ You are not a GovDAO member, only members can vote'}
            </Text>
          </Box>
        </>
      )}
      <Grid columns={{ initial: '1', md: '4' }} gap="3">
        <StatCard title="Active Proposals" value={metrics.activeCount} hint="Status: created" />
        <StatCard title="Unique Voters" value={metrics.uniqueVoters} hint="Distinct addresses voted" />
        <StatCard title="Avg Votes / Proposal" value={metrics.avgVotes} hint="Across all proposals" />
        <StatCard title="Proposals Passed" value={metrics.executedCount} hint="All time executed" />
      </Grid>

      <Box my="4">
        <Filters
          query={query}
          setQuery={setQuery}
          status={status}
          setStatus={setStatus}
          statuses={statuses}
          legend={legend}
        />
      </Box>

      {isPending || membersIsPending ? (
        <Loader />
      ) : (
        <Grid columns={{ initial: '1', md: '2' }} gap="3">
          {filtered.map((p) => (
            <ProposalCard key={p.id} proposal={p} isGovDaoMember={isGovDaoMember} />
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default GovdaoPage;
