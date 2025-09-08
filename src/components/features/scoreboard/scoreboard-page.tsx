'use client';

import { useMemo } from 'react';

import NextLink from 'next/link';

import MilestoneProgress from '@/features/milestone-progress';

import LayoutContainer from '@/layouts/layout-container';

import IssuesTable from '@/modules/issues-table';
import PrsTable from '@/modules/prs-table';
import UserTable from '@/modules/user-table';

import YoutubeEmbeddedVideo from '@/elements/youtube-embedded-video';

import useGetContributors from '@/hooks/use-get-contributors';
import useGetLastIssues from '@/hooks/use-get-last-issues';
import useGetMilestone from '@/hooks/use-get-milestone';
import useGetNewContributors from '@/hooks/use-get-new-contributors';

import { getLastMRs, TimeFilter } from '@/utils/github';

import REPOSITORY from '@/constants/repository';

import Scoreboard from '@/features/scoreboard/scoreboard';
import { useOffline } from '@/contexts/offline-context';
import { cn } from '@/utils/style';
import Loader from '@/elements/loader';
import { TYoutubeVideoPlaylist } from '@/utils/schemas';
import Image from 'next/image';

const ScoreboardPage = ({ videos }: { videos: TYoutubeVideoPlaylist }) => {
  const { data: allTimeContributors, isPending: isAllTimePending } = useGetContributors({
    timeFilter: TimeFilter.ALL_TIME,
  });

  const { data: milestone } = useGetMilestone();
  const { data: issues, isPending: isIssuesPending } = useGetLastIssues();
  const { data: newContributors, isPending: isNewContributorsPending } = useGetNewContributors();

  const lastMRs = useMemo(() => getLastMRs(allTimeContributors ?? [], 5), [allTimeContributors]);

  const { isOffline } = useOffline();

  return (
    <LayoutContainer>
      <div className="mt-4">
        <video
          className="motion-reduce:hidden h-full min-h-[200px] w-full rounded-md object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster='/images/header.png'
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
        <NextLink className={cn(isOffline && 'pointer-events-none')} href="/milestone">
          <MilestoneProgress milestone={milestone} />
        </NextLink>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-4">
          <h2 className="mt-6 text-2xl font-bold">
            <NextLink
              href={`https://github.com/${REPOSITORY.owner}/${REPOSITORY.repository}/labels/help%20wanted`}
              target="_blank"
            >
              👋 Help Wanted!
            </NextLink>
          </h2>
          {isIssuesPending ? <Loader /> : <IssuesTable issues={issues ?? []} showLabels="on-hover" />}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="mt-6 text-2xl font-bold">✔️ Freshly Merged</h2>
          {isAllTimePending ? <Loader /> : <PrsTable prs={lastMRs} />}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="mt-6 text-2xl font-bold">⭐ New Rising gnome</h2>
          {isNewContributorsPending ? <Loader /> : <UserTable users={newContributors ?? []} />}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center">
        <h2 className="text-2xl font-bold text-center">🏅 Gnolove Scoreboard</h2>
      </div>

      <Scoreboard />

      {videos && videos.length > 0 && (
        <>
          <h3 className="mt-6 text-xl font-bold">🎥 Latest gnoland videos</h3>
          <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 md:grid-cols-3">
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
