'use client';

import { useMemo } from 'react';

import Image from 'next/image';
import NextLink from 'next/link';

import { Flex, Grid, Heading, Spinner, Text } from '@radix-ui/themes';

import MilestoneProgress from '@/feature/milestone-progress';
import Scoreboard from '@/feature/scoreboard';

import LayoutContainer from '@/layout/layout-container';

import IssuesTable from '@/module/issues-table';
import PrsTable from '@/module/prs-table';
import UserTable from '@/module/user-table';

import YoutubeEmbeddedVideo from '@/element/youtube-embedded-video';

import useGetContributors from '@/hook/use-get-contributors';
import useGetLastIssues from '@/hook/use-get-last-issues';
import useGetMilestone from '@/hook/use-get-milestone';
import useGetNewContributors from '@/hook/use-get-new-contributors';
import useGetRepositories from '@/hook/use-get-repositories';

import { getIds } from '@/util/array';
import { getLastMRs, TimeFilter } from '@/util/github';
import { TRepository } from '@/util/schemas';
import { getContributorsWithScore } from '@/util/score';

import REPOSITORY from '@/constant/repository';

import HeaderImage from '@/image/header.png';

export interface ScoreboardPageProps {
  timeFilter: TimeFilter;
  exclude: string[] | undefined;

  selectedRepositories: TRepository[];
}

const ScoreboardPage = ({ timeFilter, exclude, selectedRepositories }: ScoreboardPageProps) => {
  const { data: allTimeContributors, isPending: isAllTimeContributorsPending } = useGetContributors({
    timeFilter: TimeFilter.ALL_TIME,
  });
  const { data: contributors, isPending: isContributorsPending } = useGetContributors({
    timeFilter,
    exclude,
    repositories: getIds(selectedRepositories),
  });
  const { data: milestone, isPending: isMilestonePending } = useGetMilestone();
  const { data: issues, isPending: isIssuesPending } = useGetLastIssues();
  const { data: newContributors, isPending: isNewContributorsPending } = useGetNewContributors();
  const { data: repositories, isPending: isRepositoriesPending } = useGetRepositories();

  const filteredContributors = useMemo(
    () => getContributorsWithScore(contributors ?? []).filter(({ score }) => score),
    [contributors],
  );

  const lastMRs = useMemo(() => getLastMRs(allTimeContributors ?? [], 5), [allTimeContributors]);

  if (
    isAllTimeContributorsPending ||
    isContributorsPending ||
    isMilestonePending ||
    isIssuesPending ||
    isNewContributorsPending ||
    isRepositoriesPending
  )
    return (
      <Flex className="h-screen w-screen" justify="center" align="center">
        <Spinner />
      </Flex>
    );

  return (
    <LayoutContainer>
      <Image src={HeaderImage} alt="Header Image" className="rounded-3" />

      {milestone && (
        <NextLink href="/milestone">
          <MilestoneProgress milestone={milestone} />
        </NextLink>
      )}

      <Grid columns="3" rows="auto auto" gap="4">
        <Text weight="bold" size="6" mt="6" asChild>
          <NextLink
            href={`https://github.com/${REPOSITORY.owner}/${REPOSITORY.repository}/labels/help%20wanted`}
            target="_blank"
          >
            👋 Help Wanted!
          </NextLink>
        </Text>

        <Text weight="bold" size="6" mt="6">
          ✔️ Freshly Merged
        </Text>

        <Text weight="bold" size="6" mt="6">
          ⭐ New Rising gnome
        </Text>

        <IssuesTable issues={issues ?? []} showLabels="on-hover" />
        <PrsTable prs={lastMRs} />
        <UserTable users={newContributors ?? []} />
      </Grid>

      <Heading size="6" mt="6" className="text-center">
        🏅 Gnolove Scoreboard
      </Heading>

      <Scoreboard
        repositories={repositories ?? []}
        contributors={filteredContributors}
        excludeCoreTeam={!!exclude}
        selectedRepositories={selectedRepositories}
        timeFilter={timeFilter}
      />

      <Text weight="bold" size="6" mt="6">
        🎥 Latest gnoland videos
      </Text>

      <Grid columns={{ initial: '1', xs: '2', md: '3' }} rows="auto" gap="2">
        <YoutubeEmbeddedVideo
          className="overflow-hidden rounded-4"
          src="https://www.youtube.com/embed/-io_Fu7qKrs?si=EjpiUa-fffFmslZx"
        />

        <YoutubeEmbeddedVideo
          className="overflow-hidden rounded-4"
          src="https://www.youtube.com/embed/b3zRbVcJxyE?si=XFl4uW9yt5pj7eYU"
        />

        <YoutubeEmbeddedVideo
          className="overflow-hidden rounded-4"
          src="https://www.youtube.com/embed/3czMK3s30KQ?si=Uu9zTyhRNYABOEni"
        />

        <YoutubeEmbeddedVideo
          className="overflow-hidden rounded-4"
          src="https://www.youtube.com/embed/4YUOTt5bDJc?si=VLT1lD9vT4pO2Kt5"
        />

        <YoutubeEmbeddedVideo
          className="overflow-hidden rounded-4"
          src="https://www.youtube.com/embed/ZI0ZGDMbj-U?si=Eu01gxNcbY69y6QU"
        />

        <YoutubeEmbeddedVideo
          className="overflow-hidden rounded-4"
          src="https://www.youtube.com/embed/hTGeG0z09NU?si=Mx4To7XyyJF1rQm2"
        />
      </Grid>
    </LayoutContainer>
  );
};

export default ScoreboardPage;
