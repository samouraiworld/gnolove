'use client';

import { useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch, Users } from 'lucide-react';

import Loader from '@/elements/loader';
import ContributorTable from '@/modules/contributor-table';

import useGetContributors from '@/hooks/use-get-contributors';
import useSelectedRepositories from '@/hooks/use-selected-repositories';
import useTimeFilter from '@/hooks/use-time-filter';

export default function Contributors() {
  const selectedRepositories = useSelectedRepositories();
  const timeFilter = useTimeFilter();

  const { data: contributors, isPending } = useGetContributors({
    timeFilter,
    repositories: selectedRepositories,
  });

  // Simple client-side search by login or name
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const list = contributors ?? [];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((c) => (c.name || '').toLowerCase().includes(q) || c.login.toLowerCase().includes(q));
  }, [contributors, query]);

  const totals = useMemo(() => {
    const list = filtered;
    const totalContributors = list.length;
    const totalPRs = list.reduce((acc, c) => acc + (c.TotalPrs || 0), 0);
    const totalCommits = list.reduce((acc, c) => acc + (c.TotalCommits || 0), 0);
    return { totalContributors, totalPRs, totalCommits };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contributors</h1>
          <p className="text-muted-foreground">Discover contributors across selected repositories</p>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contributors..."
            className="w-64 pl-3 pr-3 h-9 rounded-md border bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contributors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalContributors}</div>
            <p className="text-xs text-muted-foreground">Across selected repositories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PRs</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalPRs}</div>
            <p className="text-xs text-muted-foreground">Merged and opened PRs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalCommits}</div>
            <p className="text-xs text-muted-foreground">Commit activity</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {isPending ? (
            <div className="p-6">
              <Loader />
            </div>
          ) : (
            <ContributorTable contributors={filtered} sort showRank />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
