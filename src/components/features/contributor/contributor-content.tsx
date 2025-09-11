'use client';

import { useState } from 'react';

import ContributorAnalytics from './contributor-analytics';
import ContributorContributions from './contributor-contributions';
import ContributorOnchain from './contributor-onchain';
import ContributorProfile from './contributor-profile';
import ContributorRecentActivities from './contributor-recent-activities';
import ContributorTopRepos from './contributor-top-repos';
import { Check, Copy, GitCommit, GitPullRequest, MessageSquare, Star } from 'lucide-react';

import useGetContributor from '@/hooks/use-get-contributor';
import useGetUserNamespaces from '@/hooks/use-get-user-namespaces';
import useGetUserPackages from '@/hooks/use-get-user-packages';
import useGetUserProposals from '@/hooks/use-get-user-proposals';

import { HttpError } from '@/utils/fetcher';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ContributorContent = ({ login }: { login: string }) => {
  const { data: contributor, isError, error, isLoading } = useGetContributor(login);
  const { data: packages } = useGetUserPackages(contributor?.wallet ?? '');
  const { data: namespaces } = useGetUserNamespaces(contributor?.wallet ?? '');
  const { data: proposals } = useGetUserProposals(contributor?.wallet ?? '');
  const [loginCopied, setLoginCopied] = useState(false);

  if (isLoading) {
    return <DialogTitle>Loading…</DialogTitle>;
  }

  if (isError) {
    if (error instanceof HttpError && error.status === 404) {
      return <DialogTitle>Contributor not found</DialogTitle>;
    }
    return (
      <div>
        <DialogTitle>Something went wrong</DialogTitle>
        <p className="text-muted-foreground text-sm">Unable to load contributor details. Please try again.</p>
      </div>
    );
  }

  if (!contributor) {
    return <DialogTitle>Contributor not found</DialogTitle>;
  }

  const handleCopy = () => {
    const profileUrl = `https://gnolove.world/@${contributor.login}`;
    navigator.clipboard.writeText(profileUrl);
    setLoginCopied(true);
  };

  const hasOnchain = Boolean((packages?.length ?? 0) || (namespaces?.length ?? 0) || (proposals?.length ?? 0));

  return (
    <div className="flex h-full min-w-0 flex-col md:overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
          <DialogTitle className="mt-2">{contributor.name || contributor.login}</DialogTitle>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              gnolove.world/@{contributor.login}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {loginCopied ? <Check size={12} /> : <Copy size={12} />}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid flex-1 min-w-0 grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Column - Profile Info */}
        <div className="min-h-0 min-w-0">
          <ContributorProfile contributor={contributor} />
        </div>

        {/* Right Column - Activity & Contributions */}
        <div className="min-h-0 min-w-0 md:col-span-2">
          <div className="flex h-full min-w-0 flex-col gap-4">
            {/* Metrics */}
            <div className="mt-4 grid grid-cols-2 gap-4 md:mt-0 md:grid-cols-4">
              <div className="rounded-md border p-3">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-2xl font-semibold">{contributor.totalCommits}</div>
                  <div className="flex items-center gap-1">
                    <GitCommit size={12} />
                    <span className="text-muted-foreground text-xs">Commits</span>
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-2xl font-semibold">{contributor.totalPullRequests}</div>
                  <div className="flex items-center gap-1">
                    <GitPullRequest size={12} />
                    <span className="text-muted-foreground text-xs">Pull Requests</span>
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-2xl font-semibold">{contributor.totalIssues}</div>
                  <div className="flex items-center gap-1">
                    <MessageSquare size={12} />
                    <span className="text-muted-foreground text-xs">Issues</span>
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-3">
                <div className="flex flex-col items-center gap-2">
                  <div className="text-2xl font-semibold">{contributor.totalStars}</div>
                  <div className="flex items-center gap-1">
                    <Star size={12} />
                    <span className="text-muted-foreground text-xs">Stars</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 min-w-0 flex-1">
              {/* Tabs for different views */}
              <Tabs
                defaultValue={hasOnchain ? 'onchain' : 'analytics'}
                className="flex h-full min-w-0 w-full sm:w-auto flex-col gap-4 items-start"
              >
                <TabsList className="min-h-10 w-full px-2 bg-transparent rounded-none sm:w-auto overflow-x-auto whitespace-nowrap sticky top-0 z-10 justify-start gap-1">
                  <TabsTrigger className="shrink-0" value="onchain" disabled={!hasOnchain}>On-chain</TabsTrigger>
                  <TabsTrigger className="shrink-0" value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger className="shrink-0" value="activity">Recent Activity</TabsTrigger>
                  <TabsTrigger className="shrink-0" value="repositories">Top Repositories</TabsTrigger>
                  <TabsTrigger className="shrink-0" value="contributions">Contributions</TabsTrigger>
                </TabsList>

                <div className="min-h-0 min-w-0 w-full">
                  <TabsContent value="onchain" className="min-h-0 w-full overflow-x-hidden">
                    <ContributorOnchain packages={packages ?? []} namespaces={namespaces ?? []} proposals={proposals ?? []} />
                  </TabsContent>
                  <TabsContent value="analytics" className="min-h-0 w-full overflow-x-hidden">
                    <ContributorAnalytics contributor={contributor} />
                  </TabsContent>
                  <TabsContent value="activity" className="min-h-0 w-full overflow-x-hidden">
                    <ContributorRecentActivities contributor={contributor} />
                  </TabsContent>

                  <TabsContent value="repositories" className="min-h-0 w-full overflow-x-hidden">
                    <ContributorTopRepos contributor={contributor} />
                  </TabsContent>

                  <TabsContent value="contributions" className="min-h-0 w-full overflow-x-hidden">
                    <ContributorContributions contributor={contributor} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributorContent;
