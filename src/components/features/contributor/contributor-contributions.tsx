import { Card, Flex, Heading, Text } from '@radix-ui/themes';
import { TContributor } from '@/utils/schemas';

const ContributorContributions = ({ contributor }: { contributor: TContributor }) => {
  return (
    <Card style={{ height: '100%' }}>
      <Flex direction='column' gap='4' p='4' height='100%' overflowY='auto'>
        <Heading size='3'>Contribution Overview</Heading>
        <Flex direction='column' gap='2' width='50%'>
          <Flex justify='between'>
            <Text size='2'>Repositories</Text>
            <Text size='2' weight='medium'>
              {contributor.totalRepos}
            </Text>
          </Flex>
          <Flex justify='between'>
            <Text size='2'>Followers</Text>
            <Text size='2' weight='medium'>
              {contributor.followers}
            </Text>
          </Flex>
          <Flex justify='between'>
            <Text size='2'>Following</Text>
            <Text size='2' weight='medium'>
              {contributor.following}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
};

export default ContributorContributions;