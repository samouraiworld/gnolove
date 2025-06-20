'use client';

import { TIssue } from '@/util/schemas';
import { useMemo } from 'react';
import { cmpCreatedAt } from '@/utils/github';
import { Grid } from '@radix-ui/themes';
import MilestoneListItem from './milestone-list-item';

const MilestoneList = ({ issues }: { issues: TIssue[] }) => {
  const sortedIssues = useMemo(() => issues.sort(cmpCreatedAt), [issues]);

  return (
    <Grid columns={{ initial: '1', md: '2' }} gap='4' mt='6'>
      {sortedIssues.map((issue) => (
        <MilestoneListItem key={issue.id} issue={issue} />
      ))}
    </Grid>
  );
};

export default MilestoneList;