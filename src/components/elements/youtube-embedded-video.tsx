'use client';

import { ComponentProps, useMemo, useState } from 'react';
import Image from 'next/image';

import { cn } from '@/utils/style';
import Loader from '@/elements/loader';

export interface YoutubeEmbeddedVideoProps extends ComponentProps<'iframe'> {
  id: string;
}

const YoutubeEmbeddedVideo = ({ className, src, loading = 'lazy', title, id, ...props }: YoutubeEmbeddedVideoProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const thumbnail = useMemo(() => {
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  }, [id]);

  return (
    <div className={cn('relative aspect-video w-full overflow-hidden', className)}>
      {!isLoaded && (
        <div className="absolute inset-0">
          {thumbnail && (
            <Image
              alt={title ? `${title} thumbnail` : 'YouTube video thumbnail'}
              src={thumbnail}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover scale-105 blur-sm transition-all duration-500"
              priority={false}
            />
          )}
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 grid place-items-center">
            <Loader />
          </div>
        </div>
      )}

      <iframe
        className={cn(
          'absolute inset-0 h-full w-full transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        title={title ?? 'YouTube video player'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        src={src || `https://www.youtube.com/embed/${id}`}
        loading={loading as any}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
};

export default YoutubeEmbeddedVideo;
