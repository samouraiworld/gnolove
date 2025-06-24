import { Container, Flex, Heading, Text, Card, Grid, Badge, Button, Section } from '@radix-ui/themes';
import YoutubeEmbeddedVideo from '@/element/youtube-embedded-video';
import { TUTORIAL_VIDEOS } from '@/components/features/tutorials/constants';
import Link from 'next/link';

const Tutorials = () => {
  return (
    <Container size='4' py='6'>
      <Section>
        <Flex direction='column' align='center' mb='8'>
          <Heading size='8' align='center' color='red' className='font-mono'>
            GNOLOVE
          </Heading>
          <Text size='4' align='center' color='red' className='font-mono mt-1'>
            TUTORIALS & GUIDES
          </Text>
        </Flex>

        <Card mb='6' className='bg-white border border-gray-200'>
          <Flex align='center' justify='between' p='4' wrap='wrap' gap='4'>
            <Flex align='center' gap='4'>
              <Badge size='2' color='green'>
                📚 Learning Hub
              </Badge>
              <Text size='2' color='gray'>
                {TUTORIAL_VIDEOS.length} video(s) available
              </Text>
            </Flex>
            <Link href='https://www.youtube.com/playlist?list=PLJZrQikyfMc-kBojXgAojOz4UQPuq4DiY' target='_blank' rel='noopener noreferrer'>
              <Button size='2' color='red' variant='solid'>
                Subscribe to Updates
              </Button>
            </Link>
          </Flex>
        </Card>

        <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap='6'>
          {TUTORIAL_VIDEOS.map(({ src, title }) => (
            <Card key={src}>
              <Flex direction='column' gap='2'>
                <YoutubeEmbeddedVideo className="overflow-hidden rounded-4" src={src} />
                <Text size='3'>{title}</Text>
              </Flex>
            </Card>
          ))}
        </Grid>
      </Section>
    </Container>
  );
};

export default Tutorials;