import { Card, Flex, Heading, Grid, Text } from '@radix-ui/themes';
import { TContributor } from '@/util/schemas';

const ContributorContributions = ({ contributor }: { contributor: TContributor }) => {
  return (
    <Card>
      <Flex direction='column' gap='4' p='4'>
        <Heading size='3'>Contribution Overview</Heading>
        <Grid columns='2' gap='4'>
          <Flex direction='column' gap='2'>
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
        </Grid>
      </Flex>
    </Card>
  );
};

export default ContributorContributions;