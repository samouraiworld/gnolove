import { Box, Flex, Card, Avatar, Text, Heading, Separator, IconButton } from '@radix-ui/themes';
import { TContributor } from '@/utils/schemas';
import { Calendar, Copy, Github, Globe, MapPin, Twitter } from 'lucide-react';

const ContributorProfile = ({ contributor }: { contributor: TContributor }) => {
  const websiteUrl = /^https?:\/\//i.test(contributor.websiteUrl ?? '')
    ? contributor.websiteUrl
    : `https://${contributor.websiteUrl}`;

  return (
    <Box height='100%' overflow='auto'>
      <Flex direction='column' gap='4'>
        <Card>
          <Flex direction='column' align='center' gap='4' p='6'>
            <Avatar
              size='8'
              src={contributor.avatarUrl}
              fallback={contributor.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            />

            <Flex direction='column' align='center' gap='2'>
              <Heading size='5' align='center'>{contributor.name}</Heading>
              <Text size='2' color='gray'>
                @{contributor.login}
              </Text>
              <Text size='2' align='center'>
                {contributor.bio}
              </Text>
            </Flex>

            {contributor.location && (
              <Flex align='center' gap='2'>
                <MapPin size={16} />
                <Text size='2' color='gray'>
                  {contributor.location}
                </Text>
              </Flex>
            )}

            {contributor.joinDate && (
              <Flex align='center' gap='2'>
                <Calendar size={16} />
                <Text size='2' color='gray'>
                  Joined{' '}
                  {new Date(contributor.joinDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </Flex>
            )}

            <Flex gap='2'>
              <IconButton variant='outline' size='2' asChild>
                <a
                  href={contributor.url}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <Github size={16} />
                </a>
              </IconButton>
              {contributor.twitterUsername && (
                <IconButton variant='outline' size='2' asChild>
                  <a
                    href={`https://x.com/${contributor.twitterUsername}`}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <Twitter size={16} />
                  </a>
                </IconButton>
              )}
              {contributor.websiteUrl && (
                <IconButton variant='outline' size='2' asChild>
                  <a href={websiteUrl} target='_blank' rel='noopener noreferrer'>
                    <Globe size={16} />
                  </a>
                </IconButton>
              )}
            </Flex>
          </Flex>
        </Card>

        {/* On-Chain Profile */}
        {contributor.wallet && (
          <Card>
            <Flex direction='column' gap='3' p='4'>
              <Heading size='3'>On-Chain Profile</Heading>
              <Box>
                <Text size='1' color='gray' mb='1'>
                  Wallet Address
                </Text>
                <Flex align='center' gap='2'>
                  <Box
                    p='4'
                    overflow='hidden'
                    style={{
                      backgroundColor: 'var(--gray-3)',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      flex: 1,
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {contributor.wallet}
                  </Box>
                  <IconButton variant='ghost' size='1' onClick={() => navigator.clipboard.writeText(contributor.wallet)}>
                    <Copy size={12} />
                  </IconButton>
                </Flex>
              </Box>

              <Separator size='4' />

              {contributor.gnoBalance && (
                <Flex direction='column' gap='2'>
                  <Flex justify='between'>
                    <Text size='1' color='gray'>
                      GNO Balance
                    </Text>
                    <Text size='1' style={{ fontFamily: 'monospace' }}>
                      {contributor.gnoBalance}
                    </Text>
                  </Flex>
                </Flex>
              )}
            </Flex>
          </Card>
        )}
      </Flex>
    </Box>
  );
};

export default ContributorProfile;
