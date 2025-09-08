'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import YoutubeEmbeddedVideo from '@/elements/youtube-embedded-video';
import Link from 'next/link';
import { TYoutubeVideoPlaylist } from '@/utils/schemas';

const Tutorials = ({ videos }: { videos: TYoutubeVideoPlaylist }) => {
  return (
    <div className='mx-auto max-w-6xl py-6'>
      <section>
        <div className='mb-8 flex flex-col items-center'>
          <h1 className='font-mono text-center text-4xl font-bold text-red-600'>
            TUTORIALS & GUIDES
          </h1>
        </div>

        <div className='mb-6 rounded-md border bg-white'>
          <div className='flex flex-wrap items-center justify-between gap-4 p-4'>
            <div className='flex items-center gap-4'>
              <Badge className='h-6 px-2 text-sm'>📚 Learning Hub</Badge>
              <span className='text-sm text-muted-foreground'>
                {videos?.length} video(s) available
              </span>
            </div>
            <Link href='https://www.youtube.com/playlist?list=PLJZrQikyfMc-kBojXgAojOz4UQPuq4DiY' target='_blank' rel='noopener noreferrer'>
              <Button className='bg-red-600 hover:bg-red-700'>
                Subscribe to Updates
              </Button>
            </Link>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {videos?.map((video: { snippet: { resourceId: { videoId: string }; title: string } }) => (
            <div key={video.snippet.resourceId.videoId} className='rounded-md border p-2'>
              <div className='flex flex-col gap-2'>
                <YoutubeEmbeddedVideo
                  className="overflow-hidden rounded-md"
                  loading="lazy"
                  src={`https://www.youtube.com/embed/${video.snippet.resourceId.videoId}`}
                />
                <span className='text-sm'>{video.snippet.title}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Tutorials;