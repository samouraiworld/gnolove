import { Card, Flex, Heading, Text, Badge, IconButton } from '@radix-ui/themes';
import { TContributor } from '@/util/schemas';
import { Star, ExternalLink } from 'lucide-react';
import Link from 'next/link';

const ContributorTopRepos = ({ contributor }: { contributor: TContributor }) => {
  return (
    <Card>
      <Flex direction='column' gap='4' p='4'>
        <Heading size='3'>Top Repositories</Heading>
        <Flex direction='column' gap='4'>
          {contributor.topRepositories.map((repo) => (
            <Flex key={repo.url} align='start' justify='between'>
              <Flex direction='column' gap='1'>
                <Flex align='center' gap='2'>
                  <Text size='2' weight='medium'>
                    {repo.nameWithOwner}
                  </Text>
                  <Badge variant='outline' size='1'>
                    {repo.primaryLanguage}
                  </Badge>
                </Flex>
                <Text size='1' color='gray'>
                  {repo.description}
                </Text>
                <Flex align='center' gap='1'>
                  <Star size={12} />
                  <Text size='1' color='gray'>
                    {repo.stargazerCount}
                  </Text>
                </Flex>
              </Flex>
              <Link href={repo.url} target='_blank' rel='noopener noreferrer'>
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

export default ContributorTopRepos;