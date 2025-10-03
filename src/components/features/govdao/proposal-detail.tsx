'use client';

import { Badge, BadgeProps, Box, Card, Flex, Grid, Heading, Separator, Tabs, Text } from '@radix-ui/themes';
import useGetProposal from '@/hooks/use-get-proposal';
import { aggregateVotes, capitalize, getProposalTitle, getStatusColor, percent } from '@/utils/govdao';
import RadixMarkdown from '@/elements/radix-markdown';
import CodeBlock from '@/elements/code-block';
import { guessLanguageFromFilename } from '@/utils/govdao';
import Copyable from '@/elements/copyable';
import { useMemo } from 'react';
import useGetGovdaoMembers from '@/hooks/use-get-govdao-members';

const DetailRow = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
  <Flex justify="between" wrap="wrap" align="center">
    <Text color="gray">{label}</Text>
    {typeof value === 'string' ? <Text>{value}</Text> : value}
  </Flex>
);

const ProposalDetail = ({ id }: { id: string }) => {
  const { data: proposal } = useGetProposal(id);
  const { data: members } = useGetGovdaoMembers();

  if (!proposal) return null;

  const votedAddresses = useMemo(() => {
    return new Set((proposal?.votes ?? []).map((v) => v.address.toLowerCase()));
  }, [proposal.votes]);

  const nonVoters = useMemo(() => {
    return (members ?? []).filter((m) => !votedAddresses.has(m.address.toLowerCase()));
  }, [members, votedAddresses]);

  const totals = aggregateVotes(proposal.votes);
  const forPct = percent(totals.for, totals.total);
  const againstPct = percent(totals.against, totals.total);
  const abstainPct = percent(totals.abstain, totals.total);

  const status = (proposal.status || 'active').toLowerCase();
  const statusColor: BadgeProps['color'] = getStatusColor(status);

  return (
    <Flex direction="column" gap="4" pt="6">
      <Flex align={{ initial: 'start', md: 'center' }} direction={{ initial: 'column', md: 'row' }} justify="between">
        <Flex align={{ initial: 'start', md: 'center' }} gap="3" direction={{ initial: 'column', md: 'row' }}>
          <Badge color={statusColor} variant="soft">{capitalize(status)}</Badge>
          <Heading size="6">{getProposalTitle(proposal)}</Heading>
        </Flex>
        <Text color="gray" size="2" mt={{ initial: '2', md: '0' }}>ID: {proposal.id}</Text>
      </Flex>
      {proposal.description && (
        <RadixMarkdown>{proposal.description}</RadixMarkdown>
      )}
      <Text color="gray">{proposal.path}</Text>

      <Grid columns={{ initial: '1', md: '3' }} gap="4">
        {/* Left: Voting Area with Tabs */}
        <Card className="col-span-full md:col-span-2">
          <Tabs.Root defaultValue="breakdown">
            <Tabs.List>
              <Tabs.Trigger value="breakdown">Breakdown</Tabs.Trigger>
              <Tabs.Trigger value="votes">Votes</Tabs.Trigger>
              <Tabs.Trigger value="files">Files</Tabs.Trigger>
            </Tabs.List>

            <Box pt="3">
              <Tabs.Content value="breakdown">
                <Flex direction="column" gap="3">
                  <Text mb="1" color="gray">Voting Progress</Text>
                  <Box className="h-2 w-full rounded-full bg-gray-6 relative overflow-hidden">
                    <Box className='absolute left-0 top-0 h-full bg-green-9' style={{ width: `${forPct}%` }} />
                  </Box>
                  <Flex justify="between">
                    <Text color="green" size="2">For {forPct}% ({totals.for})</Text>
                    <Text color="gray" size="2">Abstain {abstainPct}% ({totals.abstain})</Text>
                    <Text color="red" size="2">Against {againstPct}% ({totals.against})</Text>
                  </Flex>
                </Flex>
              </Tabs.Content>

              <Tabs.Content value="votes">
                <Flex direction="column" gap="3">
                  {proposal.votes.length > 0 ? (
                    <Flex direction="column" gap="2">
                      {[...proposal.votes]
                        .sort((a, b) => b.blockHeight - a.blockHeight)
                        .map((v) => {
                          const color: BadgeProps['color'] = v.vote === 'YES' ? 'green' : v.vote === 'NO' ? 'red' : 'gray';
                          return (
                            <Card key={`${v.proposalID}-${v.address}-${v.hash}`} className="p-2">
                              <Flex align="center" justify="between">
                                <Flex direction="column">
                                  <Copyable className="font-bold">{v.address}</Copyable>
                                </Flex>
                                <Badge color={color} variant="soft">{v.vote}</Badge>
                              </Flex>
                            </Card>
                          );
                        })}
                    </Flex>
                  ) : (
                    <Text color="gray">No votes yet.</Text>
                  )}

                  {nonVoters && nonVoters.length > 0 && (
                    <>
                      <Separator my="2" />
                      <Heading size="3">Did not vote ({nonVoters?.length ?? 0})</Heading>
                      <Flex direction="column" gap="2">
                        {nonVoters.map((m) => (
                          <Card key={`nonvoter-${m.address}`} className="p-2">
                            <Flex align="center" justify="between">
                              <Copyable className="font-bold">{m.address}</Copyable>
                              <Text color="gray" size="2">{m.tier}</Text>
                            </Flex>
                          </Card>
                        ))}
                      </Flex>
                    </>
                  )}
                </Flex>
              </Tabs.Content>

              <Tabs.Content value="files">
                <Flex direction="column" gap="3">
                  {(proposal.files || []).map((f) => (
                    <Box key={f.id}>
                      <Heading size="3" mb="2">{f.name}</Heading>
                      {(() => {
                        const lang = guessLanguageFromFilename(f.name);
                        if (lang === 'markdown') {
                          return (
                            <Box className="rounded-md overflow-hidden bg-[#0b0b0c] text-white p-4">
                              <RadixMarkdown>{f.body}</RadixMarkdown>
                            </Box>
                          );
                        }
                        return <CodeBlock value={f.body} language={lang} />;
                      })()}
                    </Box>
                  ))}
                  {(!proposal.files || proposal.files.length === 0) && (
                    <Text color="gray">No files attached to this proposal.</Text>
                  )}
                </Flex>
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        </Card>

        {/* Right: Details */}
        <Card className="col-span-full md:col-span-1">
          <Flex direction="column" gap="3">
            <Heading size="4">Details</Heading>
            <DetailRow label="Proposer" value={<Copyable className="pl-5">{proposal.address}</Copyable>} />
            <DetailRow label="Block Height" value={String(proposal.blockHeight)} />
            <DetailRow label="Execution Height" value={proposal.executionHeight ? String(proposal.executionHeight) : '-'} />
            <DetailRow label="Files" value={String(proposal.files?.length ?? 0)} />
            <DetailRow label="Votes" value={String(totals.total)} />
            <Separator my="2" />
            <DetailRow label="Status" value={capitalize(status)} />
          </Flex>
        </Card>
      </Grid>
    </Flex>
  );
};

export default ProposalDetail;
