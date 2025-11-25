'use client';

import { Container, Flex, Heading, Text, Card, Grid, Badge, Button, Section } from '@radix-ui/themes';
import YoutubeEmbeddedVideo from '@/elements/youtube-embedded-video';
import Link from 'next/link';
import { useEffect, useMemo, useRef } from 'react';
import { TUTORIAL_VIDEOS_YOUTUBE_PLAYLIST_ID } from '@/features/tutorials/constants';
import Loader from '@/elements/loader';
import useYoutubePlaylistVideos from '@/hooks/use-youtube-playlist-videos';

const Tutorials = () => {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isPending,
  } = useYoutubePlaylistVideos({ playlistId: TUTORIAL_VIDEOS_YOUTUBE_PLAYLIST_ID, maxResults: 6 });

  const videos = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const totalResults = data?.pages[0]?.pageInfo?.totalResults ?? videos.length;

  useEffect(() => {
    if (!hasNextPage) return;

    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            fetchNextPage();
          }
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  return (
    <Container size='4'>
      <Section>
        <Flex direction='column' align='center' mb='8'>
          <Heading size='8' align='center' color='red' className='font-mono'>
            TUTORIALS & GUIDES
          </Heading>
        </Flex>

        <Card mb='6' className='bg-white border border-gray-200'>
          <Flex align='center' justify='between' p='4' wrap='wrap' gap='4'>
            <Flex align='center' gap='4'>
              <Badge size='2' color='green'>
                📚 Learning Hub
              </Badge>
              <Text size='2' color='gray'>
                {totalResults || '—'} video(s) available
              </Text>
            </Flex>
            <Link href='https://www.youtube.com/playlist?list=PLJZrQikyfMc-kBojXgAojOz4UQPuq4DiY' target='_blank' rel='noopener noreferrer'>
              <Button size='2' color='red' variant='solid'>
                Subscribe to Updates
              </Button>
            </Link>
          </Flex>
        </Card>

        {isError && (
          <Flex align='center' justify='center' mt='6'>
            <Text color='red'>Failed to load videos.</Text>
          </Flex>
        )}

        {isPending && (
          <Flex align='center' justify='center' mt='6'>
            <Loader width={24} height={24} />
          </Flex>
        )}

        {!isPending && videos.length === 0 && !isError && (
          <Flex align='center' justify='center' mt='6'>
            <Text color='gray'>No videos available right now.</Text>
          </Flex>
        )}

        <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap='6'>
          {videos.map((video) => (
            <Card key={video.snippet.resourceId.videoId}>
              <Flex direction='column' gap='2'>
                <YoutubeEmbeddedVideo
                  className="overflow-hidden rounded-4"
                  loading="lazy"
                  id={video.snippet.resourceId.videoId}
                />
                <Text size='3'>{video.snippet.title}</Text>
              </Flex>
            </Card>
          ))}
        </Grid>

        {isFetchingNextPage && (
          <Flex align='center' justify='center' mt='6'>
            <Loader width={24} height={24} />
          </Flex>
        )}

        {hasNextPage && <div ref={loadMoreRef} className="h-1 w-full" />}
      </Section>
    </Container>
  );
};

export default Tutorials;