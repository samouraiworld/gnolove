'use client';

import useGetContributor from '@/hooks/use-get-contributor';
import { Badge, Box, Button, Card, Dialog, Flex, Grid, Heading, IconButton, Tabs, Text } from '@radix-ui/themes';
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
    return <Dialog.Title>Loading…</Dialog.Title>;
  }

  if (isError) {
    if (error instanceof HttpError && error.status === 404) {
      return <Dialog.Title>Contributor not found</Dialog.Title>;
    }
    return (
      <Box>
        <Dialog.Title>Something went wrong</Dialog.Title>
        <Text size='2' color='gray'>
          Unable to load contributor details. Please try again.
        </Text>
      </Box>
    );
  }

  if (!contributor) {
    return <Dialog.Title>Contributor not found</Dialog.Title>;
  }

  const handleCopy = () => {
    const profileUrl = `https://gnolove.world/@${contributor.login}`;
    navigator.clipboard.writeText(profileUrl);
    setLoginCopied(true);
  };

  return (
    <Flex direction='column' height='100%' overflow={{ md: 'hidden' }}>
      <Flex
        justify='between'
        align='center'
        mb='4'
      >
        <Flex direction={{ initial: 'column', md: 'row' }} align={{ initial: 'start', md: 'center' }} gap='2'>
          <Dialog.Title mb='0'>{contributor.name || contributor.login}</Dialog.Title>
          <Flex gap='1' align='center'>
            <Badge color='gray' variant='soft' size='1'>
              gnolove.world/@{contributor.login}
            </Badge>
            <Button variant='outline' size='1' onClick={handleCopy}>
              {loginCopied ? (<Check size={12} />) : (<Copy size={12} />)}
            </Button>
          </Flex>
        </Flex>
        <Dialog.Close>
          <IconButton disabled={isOffline} variant='outline' color='gray' size='1'>
            <X width={16} height={16} />
          </IconButton>
        </Dialog.Close>
      </Flex>

      <Grid
        columns={{ initial: '1', md: '3' }}
        gap={{ initial: '0', md: '6' }}
        minHeight={{ md: '0' }}
        style={{ flex: 1 }}
      >
        {/* Left Column - Profile Info */}
        <Box minHeight={{ md: '0' }}>
          <ContributorProfile contributor={contributor} />
        </Box>

        {/* Right Column - Activity & Contributions */}
        <Box gridColumn='span 2' minHeight={{ md: '0' }}>
          <Flex direction='column' gap='4' height='100%'>
            {/* Metrics */}
            <Grid columns={{ initial: '2', md: '4' }} mt={{ initial: '4', md: '0' }} gap='4'>
              <Card>
                <Flex direction='column' align='center' gap='2' p='3'>
                  <Heading size='6'>{contributor.totalCommits}</Heading>
                  <Flex align='center' gap='1'>
                    <GitCommit size={12} />
                    <Text size='1' color='gray'>
                      Commits
                    </Text>
                  </Flex>
                </Flex>
              </Card>

              <Card>
                <Flex direction='column' align='center' gap='2' p='3'>
                  <Heading size='6'>{contributor.totalPullRequests}</Heading>
                  <Flex align='center' gap='1'>
                    <GitPullRequest size={12} />
                    <Text size='1' color='gray'>
                      Pull Requests
                    </Text>
                  </Flex>
                </Flex>
              </Card>

              <Card>
                <Flex direction='column' align='center' gap='2' p='3'>
                  <Heading size='6'>{contributor.totalIssues}</Heading>
                  <Flex align='center' gap='1'>
                    <MessageSquare size={12} />
                    <Text size='1' color='gray'>
                      Issues
                    </Text>
                  </Flex>
                </Flex>
              </Card>

              <Card>
                <Flex direction='column' align='center' gap='2' p='3'>
                  <Heading size='6'>{contributor.totalStars}</Heading>
                  <Flex align='center' gap='1'>
                    <Star size={12} />
                    <Text size='1' color='gray'>
                      Stars
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            </Grid>

            <Box minHeight='0' style={{ flex: 1 }}>
              {/* Tabs for different views */}
              <Tabs.Root defaultValue={(packages?.length || namespaces?.length || proposals?.length) ? 'onchain' : 'analytics'} style={{ display: 'flex', flexDirection: 'column', gap: '4', height: '100%' }}>
                <Tabs.List style={{ minHeight: '40px' }}>
                  {(packages?.length || namespaces?.length || proposals?.length) ? (
                    <Tabs.Trigger value='onchain'>GNO Chain</Tabs.Trigger>
                  ) : null}
                  <Tabs.Trigger value='analytics'>Analytics</Tabs.Trigger>
                  <Tabs.Trigger value='activity'>Recent Activity</Tabs.Trigger>
                  <Tabs.Trigger value='repositories'>Top Repositories</Tabs.Trigger>
                  <Tabs.Trigger value='contributions'>Contributions</Tabs.Trigger>
                </Tabs.List>

                <Box minHeight={{ md: '0' }}>
                  {(packages?.length || namespaces?.length || proposals?.length) ? (
                    <Tabs.Content value='onchain' style={{ height: '100%'}}>
                      <ContributorOnchain packages={packages ?? []} namespaces={namespaces ?? []} proposals={proposals ?? []} />
                    </Tabs.Content>
                  ) : null}
                  <Tabs.Content value='analytics' style={{ height: '100%'}}>
                    <ContributorAnalytics contributor={contributor} />
                  </Tabs.Content>
                  <Tabs.Content value='activity' style={{ height: '100%'}}>
                    <ContributorRecentActivities contributor={contributor} />
                  </Tabs.Content>

                  <Tabs.Content value='repositories' style={{ height: '100%'}}>
                    <ContributorTopRepos contributor={contributor} />
                  </Tabs.Content>

                  <Tabs.Content value='contributions' style={{ height: '100%'}}>
                    <ContributorContributions contributor={contributor} />
                  </Tabs.Content>
                </Box>
              </Tabs.Root>
            </Box>
          </Flex>
        </Box>
      </Grid>
    </Flex>
  );
};

export default ContributorContent;