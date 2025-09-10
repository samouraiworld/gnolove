'use client';

import { Badge, Box, Card, Flex, Grid, Heading, Separator, Text } from '@radix-ui/themes';
import useGetProposal from '@/hooks/use-get-proposal';
import { aggregateVotes, capitalize, getProgressColorClass, getProposalTitle, getStatusColor, percent } from '@/utils/govdao';
import RadixMarkdown from '@/elements/radix-markdown';
import CodeBlock from '@/elements/code-block';
import { guessLanguageFromFilename } from '@/utils/govdao';

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <Flex justify="between" align="center">
    <Text color="gray">{label}</Text>
    <Text>{value}</Text>
  </Flex>
);

const ProposalDetail = ({ id }: { id: string }) => {
  const { data: proposal } = useGetProposal(id);

  if (!proposal) return null;

  const totals = aggregateVotes(proposal.votes);
  const forPct = percent(totals.for, totals.total);
  const againstPct = percent(totals.against, totals.total);
  const abstainPct = percent(totals.abstain, totals.total);

  const status = (proposal.status || 'active').toLowerCase();
  const statusColor: any = getStatusColor(status);
  const progressColor = getProgressColorClass(forPct, againstPct);

  return (
    <Grid columns={{ initial: '1', md: '2' }} gap="4" pt="8">
      <Card>
        <Flex direction="column" gap="3">
          <Flex align="center" justify="between">
            <Badge color={statusColor} variant="soft">
              {capitalize(status)}
            </Badge>
            <Text color="gray" size="2">ID: {proposal.id}</Text>
          </Flex>
          <Heading size="6">{getProposalTitle(proposal)}</Heading>
          <Text>Proposal path: {proposal.path}</Text>
          <Separator my="2" />
          <Text mb="2" color="gray">Voting Progress</Text>
          <Box className="h-2 w-full rounded-full bg-red-6 relative overflow-hidden">
            <Box className={`absolute left-0 top-0 h-full ${progressColor}`} style={{ width: `${forPct}%` }} />
          </Box>
          <Flex mt="2" justify="between">
            <Text color="green" size="2">For {forPct}%</Text>
            <Text color="red" size="2">Against {againstPct}%</Text>
            <Text color="gray" size="2">Abstain {abstainPct}%</Text>
          </Flex>
        </Flex>
      </Card>

      <Card>
        <Flex direction="column" gap="3">
          <Heading size="4">Proposal Details</Heading>
          <DetailRow label="Proposer" value={proposal.address} />
          <DetailRow label="Block Height" value={String(proposal.blockHeight)} />
          <DetailRow label="Execution Height" value={proposal.executionHeight ? String(proposal.executionHeight) : '-'} />
          <DetailRow label="Files" value={String(proposal.files?.length ?? 0)} />
          <DetailRow label="Votes" value={String(totals.total)} />
          <Separator my="2" />
          <Heading size="3">Vote Breakdown</Heading>
          <DetailRow label="For" value={`${totals.for} (${forPct}%)`} />
          <DetailRow label="Against" value={`${totals.against} (${againstPct}%)`} />
          <DetailRow label="Abstain" value={`${totals.abstain} (${abstainPct}%)`} />
        </Flex>
      </Card>
      <Card className="col-span-full">
        <Flex direction="column" gap="3">
          <Heading size="4">Files</Heading>
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
      </Card>
    </Grid>
  );
};

export default ProposalDetail;
