import { Badge, Box, Card, Flex, Heading, IconButton, Text } from '@radix-ui/themes';
import { ExternalLink, GitPullRequest, MessageSquare } from 'lucide-react';
import { TContributor } from '@/util/schemas';
import Link from 'next/link';

const ContributorRecentActivities = ({ contributor }: { contributor: TContributor }) => {
  return (
    <Card style={{ height: '100%' }}>
      <Flex direction='column' gap='4' p='4' height='100%' overflowY='auto'>
        <Heading size='3'>Recent Activity</Heading>
        <Flex direction='column' gap='4'>
          {[
            ...contributor.recentIssues,
            ...contributor.recentPullRequests,
          ]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((activity) => (
              <Flex key={`${activity.type}-${activity.title}`} align='start' gap='3'>
                <Box mt='1'>
                  {activity.type === 'pull_request' && <GitPullRequest size={16} color='blue' />}
                  {activity.type === 'issue' && <MessageSquare size={16} color='orange' />}
                </Box>
                <Flex direction='column' gap='1' style={{ flex: 1 }}>
                  <Flex align='center' gap='2'>
                    <Text size='2' weight='medium'>
                      {activity.repository}
                    </Text>
                    <Badge variant='outline' size='1'>
                      {activity.type}
                    </Badge>
                  </Flex>
                  <Text size='2' color='gray'>
                    {activity.title}
                  </Text>
                  <Text size='1' color='gray'>
                    {new Date(activity.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </Flex>
                <Link href={activity.url} target='_blank' rel='noopener noreferrer'>
                  <IconButton variant='ghost' size='1'>
                    <ExternalLink size={12} />
                  </IconButton>
                </Link>
              </Flex>
            ))}
        </Flex>
      </Flex>
    </Card>
  );
};

export default ContributorRecentActivities;