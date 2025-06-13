'use client';

import {
  X,
  Copy,
  GitCommit,
  GitPullRequest,
  MessageSquare,
  Star,
} from 'lucide-react';
import {
  Dialog,
  Flex,
  Box,
  Card,
  Text,
  Heading,
  Button,
  IconButton,
  Badge,
  Tabs,
  Grid,
} from '@radix-ui/themes';
import useGetContributor from '@/hooks/use-get-contributor';
import { useRouter } from 'next/navigation';
import ContributorProfile from './contributor-profile';
import ContributorRecentActivities from './contributor-recent-activities';
import ContributorTopRepos from './contributor-top-repos';
import ContributorContributions from './contributor-contributions';

const ContributorModal = ({ login }: { login: string }) => {
  const { data: contributor } = useGetContributor(login);
  const router = useRouter();

  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  if (!contributor) return (
    <Dialog.Root open={true} onOpenChange={handleClose}>
      <Dialog.Content>
        <Dialog.Title>Contributor not found</Dialog.Title>
      </Dialog.Content>
    </Dialog.Root>
  );

  const profileUrl = `https://gnolove.world/contributors/${contributor.login}`;

  return (
    <Dialog.Root open={true} onOpenChange={handleClose}>
      <Dialog.Content height='88vh' maxWidth='1000px' style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box>
          <Flex justify='between' align='center' mb='4'>
            <Flex align='center' gap='2'>
              <Dialog.Title mb='0'>{contributor.name ?? contributor.login}</Dialog.Title>
              <Badge color='gray' variant='soft' size='1'>
                gnolove.world/contributors/{contributor.login}
              </Badge>
              <Button variant='outline' size='1' onClick={() => navigator.clipboard.writeText(profileUrl)}>
                <Copy size={12} />
              </Button>
            </Flex>
            <Dialog.Close>
              <IconButton variant='ghost' color='gray'>
                <X size={16} />
              </IconButton>
            </Dialog.Close>
          </Flex>

          <Grid columns={{ initial: '1', md: '3' }} gap='6'>
            {/* Left Column - Profile Info */}
            <ContributorProfile contributor={contributor} />

            {/* Right Column - Activity & Contributions */}
            <Box style={{ gridColumn: 'span 2' }}>
              <Flex direction='column' gap='4'>
                {/* Metrics */}
                <Grid columns='4' gap='4'>
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

                {/* Tabs for different views */}
                <Tabs.Root defaultValue='activity'>
                  <Tabs.List>
                    <Tabs.Trigger value='activity'>Recent Activity</Tabs.Trigger>
                    <Tabs.Trigger value='repositories'>Top Repositories</Tabs.Trigger>
                    <Tabs.Trigger value='contributions'>Contributions</Tabs.Trigger>
                  </Tabs.List>

                  <Box pt='4'>
                    <Tabs.Content value='activity'>
                      <ContributorRecentActivities contributor={contributor} />
                    </Tabs.Content>

                    <Tabs.Content value='repositories'>
                      <ContributorTopRepos contributor={contributor} />
                    </Tabs.Content>

                    <Tabs.Content value='contributions'>
                      <ContributorContributions contributor={contributor} />
                    </Tabs.Content>
                  </Box>
                </Tabs.Root>
              </Flex>
            </Box>
          </Grid>
        </Box>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default ContributorModal;