'use client';

import { useEffect, useMemo, useState } from 'react';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

import { Check, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import ContributorTable from '@/modules/contributor-table';

import Loader from '@/elements/loader';

import useGetContributors from '@/hooks/use-get-contributors';
import useGetRepositories from '@/hooks/use-get-repositories';

import { getTimeFilterFromSearchParam, TimeFilter } from '@/utils/github';

import RepositoriesSelector from '@/components/modules/repositories-selector';

const TIMEFILTER_MAP = {
  [TimeFilter.ALL_TIME]: 'All time',
  [TimeFilter.YEARLY]: 'Yearly',
  [TimeFilter.MONTHLY]: 'Monthly',
  [TimeFilter.WEEKLY]: 'Weekly',
};

const fallbackMessages = [
  'Be the first to contribute during this period!',
  'This gnome team is still warming up... ',
  'No activity yet — check back soon!',
  'No gnomes contributed during this time — maybe they’re on a break? ',
];

const Scoreboard = ({ ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState('');

  const searchParams = useSearchParams();

  const initialTimeFilter = getTimeFilterFromSearchParam(searchParams.get('f'), TimeFilter.MONTHLY);
  const initialExclude = !!searchParams.get('e');
  const initialRepoIds = searchParams.get('r')?.split(',') ?? ['gnolang/gno'];

  const [timeFilter, setTimeFilter] = useState<TimeFilter>(initialTimeFilter);
  const [exclude, setExclude] = useState<boolean>(initialExclude);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>(initialRepoIds);

  const { data: repositories = [] } = useGetRepositories();
  const { data: contributors, isPending } = useGetContributors({
    timeFilter,
    exclude,
    repositories: selectedRepositories,
  });

  const filteredContributors = useMemo(() => (contributors ?? []).filter(({ score }) => score), [contributors]);

  const buildSearchParams = () => {
    const params = new URLSearchParams();
    params.set('f', timeFilter);
    if (exclude) params.set('e', '1');
    if (selectedRepositories.length) params.set('r', selectedRepositories.join(','));
    return params;
  };

  useEffect(() => {
    const urlParams = buildSearchParams().toString();
    const currentParams = searchParams.toString();
    if (urlParams === currentParams) return;

    router.replace(`?${urlParams}`);
  }, [timeFilter, exclude, selectedRepositories, router, searchParams, buildSearchParams]);

  useEffect(() => {
    setFallbackMessage(fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]);
  }, []);

  const handleCopyUrl = () => {
    const url = `${window.location.origin}/?${buildSearchParams().toString()}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col" {...props}>
      <Tabs value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)} className="mb-4">
        <TabsList className="justify-center">
          {Object.values(TimeFilter).map((value) => (
            <TabsTrigger value={value} key={value}>
              {TIMEFILTER_MAP[value]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor="excludeCoreTeam" className="my-2 flex flex-1 items-center gap-2">
          <Switch checked={exclude} onCheckedChange={setExclude} id="excludeCoreTeam" />
          <span className="flex items-center gap-2">
            Hide the <Badge>Core team</Badge>
          </span>
        </label>

        <Button onClick={handleCopyUrl} variant="secondary" className="mb-2 inline-flex items-center gap-2">
          {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
          Share this board
        </Button>

        <div className="mb-2 flex flex-1 items-center justify-end">
          <RepositoriesSelector
            repositories={repositories}
            selectedRepositories={selectedRepositories}
            onSelectedRepositoriesChange={setSelectedRepositories}
          />
        </div>
      </div>

      {isPending ? (
        <div className="my-9 flex items-center justify-center">
          <Loader />
        </div>
      ) : filteredContributors.length ? (
        <ContributorTable contributors={filteredContributors} sort showRank />
      ) : (
        <div className="my-9 flex items-center justify-center">
          <span className="italic text-muted-foreground">{fallbackMessage}</span>
        </div>
      )}
    </div>
  );
};

export default Scoreboard;
