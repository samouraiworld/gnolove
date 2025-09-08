'use client';

import useGetContributor from '@/hooks/use-get-contributor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy, GitCommit, GitPullRequest, MessageSquare, Star, X } from 'lucide-react';
import ContributorProfile from './contributor-profile';
import ContributorRecentActivities from './contributor-recent-activities';
import ContributorTopRepos from './contributor-top-repos';
import ContributorContributions from './contributor-contributions';
import { useState } from 'react';
import ContributorAnalytics from './contributor-analytics';
import { useOffline } from '@/contexts/offline-context';
import ContributorOnchain from './contributor-onchain';
import useGetUserPackages from '@/hooks/use-get-user-packages';
import useGetUserNamespaces from '@/hooks/use-get-user-namespaces';
import useGetUserProposals from '@/hooks/use-get-user-proposals';
import { HttpError } from '@/utils/fetcher';

const ContributorContent = ({ login }: { login: string }) => {
  const { data: contributor, isError, error, isLoading } = useGetContributor(login);
  const { data: packages } = useGetUserPackages(contributor?.wallet ?? '');
  const { data: namespaces } = useGetUserNamespaces(contributor?.wallet ?? '');
  const { data: proposals } = useGetUserProposals(contributor?.wallet ?? '');
  const [loginCopied, setLoginCopied] = useState(false);
  const { isOffline } = useOffline();
  
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
        <p className='text-sm text-muted-foreground'>
          Unable to load contributor details. Please try again.
        </p>
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

  return (
    <div className='flex h-full flex-col md:overflow-hidden'>
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex flex-col items-start gap-2 md:flex-row md:items-center'>
          <DialogTitle className='m-0'>{contributor.name || contributor.login}</DialogTitle>
          <div className='flex items-center gap-1'>
            <Badge variant='secondary' className='text-xs'>
              gnolove.world/@{contributor.login}
            </Badge>
            <Button variant='outline' size='sm' onClick={handleCopy}>
              {loginCopied ? (<Check size={12} />) : (<Copy size={12} />)}
            </Button>
          </div>
        </div>
        <DialogClose asChild>
          <Button disabled={isOffline} variant='outline' size='icon'>
            <X width={16} height={16} />
          </Button>
        </DialogClose>
      </div>

      <div className='grid flex-1 grid-cols-1 gap-6 md:grid-cols-3'>
        {/* Left Column - Profile Info */}
        <div className='min-h-0'>
          <ContributorProfile contributor={contributor} />
        </div>

        {/* Right Column - Activity & Contributions */}
        <div className='min-h-0 md:col-span-2'>
          <div className='flex h-full flex-col gap-4'>
            {/* Metrics */}
            <div className='mt-4 grid grid-cols-2 gap-4 md:mt-0 md:grid-cols-4'>
              <div className='rounded-md border p-3'>
                <div className='flex flex-col items-center gap-2'>
                  <div className='text-2xl font-semibold'>{contributor.totalCommits}</div>
                  <div className='flex items-center gap-1'>
                    <GitCommit size={12} />
                    <span className='text-xs text-muted-foreground'>Commits</span>
                  </div>
                </div>
              </div>

              <div className='rounded-md border p-3'>
                <div className='flex flex-col items-center gap-2'>
                  <div className='text-2xl font-semibold'>{contributor.totalPullRequests}</div>
                  <div className='flex items-center gap-1'>
                    <GitPullRequest size={12} />
                    <span className='text-xs text-muted-foreground'>Pull Requests</span>
                  </div>
                </div>
              </div>

              <div className='rounded-md border p-3'>
                <div className='flex flex-col items-center gap-2'>
                  <div className='text-2xl font-semibold'>{contributor.totalIssues}</div>
                  <div className='flex items-center gap-1'>
                    <MessageSquare size={12} />
                    <span className='text-xs text-muted-foreground'>Issues</span>
                  </div>
                </div>
              </div>

              <div className='rounded-md border p-3'>
                <div className='flex flex-col items-center gap-2'>
                  <div className='text-2xl font-semibold'>{contributor.totalStars}</div>
                  <div className='flex items-center gap-1'>
                    <Star size={12} />
                    <span className='text-xs text-muted-foreground'>Stars</span>
                  </div>
                </div>
              </div>
            </div>

            <div className='min-h-0 flex-1'>
              {/* Tabs for different views */}
              <Tabs defaultValue={(packages?.length || namespaces?.length || proposals?.length) ? 'onchain' : 'analytics'} className='flex h-full flex-col gap-4'>
                <TabsList className='min-h-10'>
                  {(packages?.length || namespaces?.length || proposals?.length) ? (
                    <TabsTrigger value='onchain'>GNO Chain</TabsTrigger>
                  ) : null}
                  <TabsTrigger value='analytics'>Analytics</TabsTrigger>
                  <TabsTrigger value='activity'>Recent Activity</TabsTrigger>
                  <TabsTrigger value='repositories'>Top Repositories</TabsTrigger>
                  <TabsTrigger value='contributions'>Contributions</TabsTrigger>
                </TabsList>

                <div className='min-h-0'>
                  {(packages?.length || namespaces?.length || proposals?.length) ? (
                    <TabsContent value='onchain' className='h-full'>
                      <ContributorOnchain packages={packages ?? []} namespaces={namespaces ?? []} proposals={proposals ?? []} />
                    </TabsContent>
                  ) : null}
                  <TabsContent value='analytics' className='h-full'>
                    <ContributorAnalytics contributor={contributor} />
                  </TabsContent>
                  <TabsContent value='activity' className='h-full'>
                    <ContributorRecentActivities contributor={contributor} />
                  </TabsContent>

                  <TabsContent value='repositories' className='h-full'>
                    <ContributorTopRepos contributor={contributor} />
                  </TabsContent>

                  <TabsContent value='contributions' className='h-full'>
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