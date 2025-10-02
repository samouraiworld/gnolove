'use client';

import { memo, useCallback, useMemo, useState, useTransition } from 'react';

import MilestoneListItem from '@/components/features/milestone/milestone-list-item';
import { CheckCircledIcon, CircleIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import { Grid, Flex, Text, Badge, Box, Card, Separator, IconButton } from '@radix-ui/themes';
import ResponsiveCarousel from '../../modules/responsive-carousel';

import { TIssue } from '@/utils/schemas';

import { cmpCreatedAt } from '@/utils/github';
import Loader from '@/elements/loader';

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

const KanbanColumn = memo(
  ({
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
  }) => {
    const [isPending, startTransition] = useTransition();

    const handleToggle = useCallback(() => {
      startTransition(() => {
        onToggleCollapse();
      });
    }, [onToggleCollapse]);

    return (
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
          <IconButton variant="ghost" size="2" onClick={handleToggle} disabled={isPending}>
            {isPending ? (
              <Loader width={16} height={16} />
            ) : isCollapsed ? (
              <ChevronDownIcon width="16" height="16" />
            ) : (
              <ChevronUpIcon width="16" height="16" />
            )}
          </IconButton>
        </Flex>

        {!isCollapsed && (
          <>
            <Separator size="4" mb="4" />
            <Box px="3" pb="3">
              <ResponsiveCarousel id={`scroller-${title.replace(/\s+/g, '-').toLowerCase()}`} itemsPerScroll={2}>
                <Flex direction={{ initial: 'column', sm: 'row' }} gap="3" wrap={{ initial: 'nowrap', sm: 'nowrap' }}>
                  {issues.length > 0 ? (
                    issues.map((issue) => (
                      <Box key={issue.id} className="sm:snap-start sm:min-w-[280px] sm:w-[clamp(280px,33vw,420px)]">
                        <MilestoneListItem issue={issue} />
                      </Box>
                    ))
                  ) : (
                    <Box p="8">
                      <Text size="3" color="gray">{`No ${title.toLowerCase()}`}</Text>
                    </Box>
                  )}
                </Flex>
              </ResponsiveCarousel>
            </Box>
          </>
        )}
      </Card>
    );
  },
);

KanbanColumn.displayName = 'KanbanColumn';

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

  return (
    <Box>
      <Card size="2" variant="surface" my="6">
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

      {/* Stacked sections; rows scroll horizontally on sm+ */}
      <Grid columns="1" gap="6">
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
