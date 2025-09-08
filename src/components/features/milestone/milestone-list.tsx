'use client';

import { memo, useCallback, useMemo, useState, useTransition } from 'react';

import MilestoneListItem from '@/components/features/milestone/milestone-list-item';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
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
    badgeColor: _badgeColor,
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
      <div className="h-fit rounded-md border">
        <div className="flex items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-lg font-bold">{title}</span>
            <Badge variant="secondary" className="text-xs">{count}</Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={handleToggle} disabled={isPending}>
            {isPending ? (
              <Loader width={16} height={16} />
            ) : isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {!isCollapsed && (
          <>
            <Separator className="mb-4" />
            <div className="px-3 pb-3">
              {issues.length > 0 ? (
                <ResponsiveCarousel id={`scroller-${title.replace(/\s+/g, '-').toLowerCase()}`} items={issues.map((issue) => (
                  <div key={issue.id} className="sm:snap-start sm:min-w-[280px] sm:w-[clamp(280px,33vw,420px)]">
                    <MilestoneListItem issue={issue} />
                  </div>
                ))} />
              ) : (
                <div className="p-8">
                  <span className="text-base text-muted-foreground">{`No ${title.toLowerCase()}`}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
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
    <div className="mt-6">
      <div className="mb-6 rounded-md border p-4">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <span className="text-xl font-medium">Milestone progress</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-green-600" />
              <span className="text-base">{openIssues.length} open</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-base">{closedIssues.length} closed</span>
            </div>
            <Separator orientation="vertical" className="hidden h-6 sm:block" />
            <span className="text-base font-bold">Total: {issues.length}</span>
          </div>
        </div>
      </div>

      {/* Stacked sections; rows scroll horizontally on sm+ */}
      <div className="grid grid-cols-1 gap-6">
        <KanbanColumn
          title="Open Issues"
          issues={openIssues}
          badgeColor="green"
          count={openIssues.length}
          icon={<Circle className="h-[18px] w-[18px] text-green-600" />}
          isCollapsed={openColumnCollapsed}
          onToggleCollapse={() => setOpenColumnCollapsed(!openColumnCollapsed)}
        />
        <KanbanColumn
          title="Closed Issues"
          issues={closedIssues}
          badgeColor="gray"
          count={closedIssues.length}
          icon={<CheckCircle2 className="h-[18px] w-[18px] text-muted-foreground" />}
          isCollapsed={closedColumnCollapsed}
          onToggleCollapse={() => setClosedColumnCollapsed(!closedColumnCollapsed)}
        />
      </div>
    </div>
  );
};

export default MilestoneList;
