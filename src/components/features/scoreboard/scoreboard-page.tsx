'use client';

import { Suspense, useMemo } from 'react';

import Image from 'next/image';
import NextLink from 'next/link';

import MilestoneProgress from '@/features/milestone-progress';
import Scoreboard from '@/features/scoreboard/scoreboard';

import LayoutContainer from '@/layouts/layout-container';

import IssuesTable from '@/modules/issues-table';
import PrsTable from '@/modules/prs-table';
import UserTable from '@/modules/user-table';

import Loader from '@/elements/loader';
import YoutubeEmbeddedVideo from '@/elements/youtube-embedded-video';

import { useOffline } from '@/contexts/offline-context';

import useGetContributors from '@/hooks/use-get-contributors';
import useGetLastIssues from '@/hooks/use-get-last-issues';
import useGetMilestone from '@/hooks/use-get-milestone';
import useGetNewContributors from '@/hooks/use-get-new-contributors';
import useSelectedRepositories from '@/hooks/use-selected-repositories';

import { getLastMRs, TimeFilter } from '@/utils/github';
import { TYoutubeVideoPlaylist } from '@/utils/schemas';
import { cn } from '@/utils/style';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GitPullRequest, Star, Users } from 'lucide-react';

const ScoreboardPage = ({ videos }: { videos: TYoutubeVideoPlaylist }) => {
  const selectedRepositories = useSelectedRepositories();
  const { data: contributors, isPending: isContributorsPending } = useGetContributors({
    timeFilter: TimeFilter.MONTHLY,
    repositories: selectedRepositories,
  });

  const { data: milestone } = useGetMilestone();
  const { data: issues, isPending: isIssuesPending } = useGetLastIssues();
  const { data: newContributors, isPending: isNewContributorsPending } = useGetNewContributors();

  const lastMRs = useMemo(() => getLastMRs(contributors ?? [], 5), [contributors]);

  const { isOffline } = useOffline();

  return (
    <LayoutContainer>
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gnolove</h1>
        <p className="text-muted-foreground">Overview of contributions across GNO-related repositories</p>
      </div>
      <div className="mt-4">
        <video
          className="h-full min-h-[200px] w-full rounded-md object-cover motion-reduce:hidden"
          autoPlay
          loop
          muted
          playsInline
          poster="/images/header.png"
        >
          <source src="/videos/gnolove_drone-on-the-desk-video.mp4" type="video/mp4" />
        </video>
        <Image
          alt="Gnolove"
          src="/images/header.png"
          className="hidden h-full min-h-[200px] w-full rounded-md object-cover motion-reduce:block"
          priority
          width={1920}
          height={1000}
        />
      </div>

      {milestone && (
        <NextLink className={cn('my-6 block', { 'pointer-events-none': isOffline })} href="/milestone">
          <MilestoneProgress milestone={milestone} />
        </NextLink>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 my-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Help Wanted!</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isIssuesPending ? <Loader /> : <IssuesTable issues={issues ?? []} showLabels="on-hover" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Freshly Merged</CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isContributorsPending ? <Loader /> : <PrsTable prs={lastMRs} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Rising Gnomes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isNewContributorsPending ? <Loader /> : <UserTable users={newContributors ?? []} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top contributors this month</CardTitle>
            <CardDescription>Most active contributors this month (5 / {contributors?.length})</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Loader />}>
              <Scoreboard />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {videos && videos.length > 0 && (
        <>
          <h3 className="mt-6 text-xl font-bold">🎥 Latest gnoland videos</h3>
          <div className="xs:grid-cols-2 grid grid-cols-1 gap-2 md:grid-cols-3">
            {videos.map((video: { snippet: { resourceId: { videoId: string } } }) => (
              <YoutubeEmbeddedVideo
                key={video.snippet.resourceId.videoId}
                className="overflow-hidden rounded-md"
                src={`https://www.youtube.com/embed/${video.snippet.resourceId.videoId}`}
              />
            ))}
          </div>
        </>
      )}
    </LayoutContainer>
  );
};

export default ScoreboardPage;
