'use client';

import { useMemo, useState } from 'react';

import MilestoneListItem from './milestone-list-item';
import { CheckCircledIcon, CircleIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import { Grid, Flex, Text, Badge, Box, Card, Separator, IconButton } from '@radix-ui/themes';

import { TIssue } from '@/util/schemas';

import { cmpCreatedAt } from '@/utils/github';

interface MilestoneListProps {
  issues: TIssue[];
  milestones?: Array<{
    id: string;
    title: string;
    number: number;
    state: 'open' | 'closed';
    dueOn?: string;
    description?: string;
  }>;
}

const MilestoneList = ({ issues }: MilestoneListProps) => {
  const [openColumnCollapsed, setOpenColumnCollapsed] = useState(false);
  const [closedColumnCollapsed, setClosedColumnCollapsed] = useState(false);

  const { openIssues, closedIssues } = useMemo(
    () => ({
      openIssues: issues.filter((issue) => issue.state.toLowerCase() === 'open').sort(cmpCreatedAt),
      closedIssues: issues.filter((issue) => issue.state.toLowerCase() === 'closed').sort(cmpCreatedAt),
    }),
    [issues],
  );

  const KanbanColumn = ({
    title,
    issues,
    badgeColor,
    count,
    icon,
    isCollapsed,
    onToggleCollapse,
  }: {
    title: string;
    issues: TIssue[];
    badgeColor: 'green' | 'gray';
    count: number;
    icon: React.ReactNode;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
  }) => (
    <Card size="1" variant="ghost" style={{ height: 'fit-content' }}>
      <Flex align="center" justify="between" mb="4" p="3">
        <Flex align="center" gap="2">
          {icon}
          <Text size="4" weight="bold">
            {title}
          </Text>
          <Badge size="2" color={badgeColor} variant="soft">
            {count}
          </Badge>
        </Flex>
        <IconButton variant="ghost" size="2" onClick={onToggleCollapse} style={{ cursor: 'pointer' }}>
          {isCollapsed ? <ChevronDownIcon width="16" height="16" /> : <ChevronUpIcon width="16" height="16" />}
        </IconButton>
      </Flex>

      {!isCollapsed && (
        <>
          <Separator size="4" mb="4" />

          <Box px="3" pb="3">
            <Flex direction="column" gap="3">
              {issues.length > 0 ? (
                issues.map((issue) => <MilestoneListItem key={issue.id} issue={issue} />)
              ) : (
                <Box p="8">
                  <Text size="3" color="gray">
                    {`No ${title.toLowerCase()}`}
                  </Text>
                </Box>
              )}
            </Flex>
          </Box>
        </>
      )}
    </Card>
  );

  return (
    <Box mt="6">
      <Card size="2" variant="surface" mb="6">
        <Flex direction={{ initial: 'column', sm: 'row' }} align="center" justify="between" p="4">
          <Text size="4" weight="medium">
            Milestone progress
          </Text>
          <Flex align="center" gap="4">
            <Flex align="center" gap="2">
              <CircleIcon color="green" />
              <Text size="3">{openIssues.length} open</Text>
            </Flex>
            <Flex align="center" gap="2">
              <CheckCircledIcon color="gray" />
              <Text size="3">{closedIssues.length} closed</Text>
            </Flex>
            <Separator orientation="vertical" size="2" className="hidden sm:block" />
            <Text size="3" weight="bold">
              Total: {issues.length}
            </Text>
          </Flex>
        </Flex>
      </Card>

      <Grid columns={{ initial: '1', lg: '2' }} gap="6">
        <KanbanColumn
          title="Open Issues"
          issues={openIssues}
          badgeColor="green"
          count={openIssues.length}
          icon={<CircleIcon color="green" width="18" height="18" />}
          isCollapsed={openColumnCollapsed}
          onToggleCollapse={() => setOpenColumnCollapsed(!openColumnCollapsed)}
        />
        <KanbanColumn
          title="Closed Issues"
          issues={closedIssues}
          badgeColor="gray"
          count={closedIssues.length}
          icon={<CheckCircledIcon color="gray" width="18" height="18" />}
          isCollapsed={closedColumnCollapsed}
          onToggleCollapse={() => setClosedColumnCollapsed(!closedColumnCollapsed)}
        />
      </Grid>
    </Box>
  );
};

export default MilestoneList;
