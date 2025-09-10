'use client';

import { useMemo } from 'react';

import ContributorTable from '@/modules/contributor-table';

import Loader from '@/elements/loader';

import useGetContributors from '@/hooks/use-get-contributors';
import useSelectedRepositories from '@/hooks/use-selected-repositories';
import useTimeFilter from '@/hooks/use-time-filter';

import { Button } from '@/components/ui/button';
import PreservingLink from '@/components/elements/preserving-link';

const Scoreboard = ({ ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const selectedRepositories = useSelectedRepositories();
  const timeFilter = useTimeFilter();
  const { data: contributors, isPending } = useGetContributors({
    timeFilter,
    repositories: selectedRepositories,
  });

  const filteredContributors = useMemo(() => (contributors ?? []).filter(({ score }) => score), [contributors]);
  const top5 = useMemo(() => filteredContributors.slice().sort((a, b) => b.score - a.score).slice(0, 5), [filteredContributors]);

  return (
    <div className="flex flex-col" {...props}>
      {isPending ? (
        <div className="my-9 flex items-center justify-center">
          <Loader />
        </div>
      ) : filteredContributors.length ? (
        <>
          <ContributorTable contributors={top5} sort showRank />
          <Button className='mt-2' variant="outline" asChild>
            <PreservingLink href="/contributors">View all contributors</PreservingLink>
          </Button>
        </>
      ) : (
        <div className="my-9 flex items-center justify-center">
          <span className="text-muted-foreground italic">No gnomes contributed during this time — maybe they’re on a break?</span>
        </div>
      )}
    </div>
  );
};

export default Scoreboard;
