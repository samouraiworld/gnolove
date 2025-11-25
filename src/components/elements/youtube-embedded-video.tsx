'use client';

import { ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';

import { cn } from '@/utils/style';
import Loader from '@/elements/loader';
import { Button } from '@radix-ui/themes';
import { PlayIcon } from '@radix-ui/react-icons';

export interface YoutubeEmbeddedVideoProps extends ComponentProps<'iframe'> {
  id: string;
}

const YoutubeEmbeddedVideo = ({ className, src, loading = 'lazy', title, id, ...props }: YoutubeEmbeddedVideoProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isIframeVisible, setIsIframeVisible] = useState(false);
  const [shouldShowThumbnail, setShouldShowThumbnail] = useState(false);

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldShowThumbnail(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, []);

  const thumbnail = useMemo(() => {
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  }, [id]);

  const iframeSrc = useMemo(() => src || (id ? `https://www.youtube.com/embed/${id}` : undefined), [id, src]);

  const handleActivate = () => {
    if (!iframeSrc) return;
    setIsIframeVisible(true);
  };

  return (
    <div ref={containerRef} className={cn('relative aspect-video w-full overflow-hidden', className)}>
      {!isIframeVisible && (
        <Button
          onClick={handleActivate}
          className="flex h-full w-full items-center justify-center overflow-hidden"
          aria-label={title ? `Play ${title}` : 'Play video'}
          variant="ghost"
        >
          {shouldShowThumbnail && thumbnail && (
            <Image
              alt={title ? `${title} thumbnail` : 'YouTube video thumbnail'}
              src={thumbnail}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              loading="lazy"
            />
          )}
          <div className="absolute flex items-center justify-center bg-whiteA-12 dark:bg-blackA-12 p-2 rounded-full">
            <PlayIcon className="stroke-red-12 size-6" />
          </div>
        </Button>
      )}

      {isIframeVisible && iframeSrc && (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 grid place-items-center bg-black/40">
              <Loader />
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
            src={iframeSrc}
            loading={loading as any}
            onLoad={() => setIsLoaded(true)}
            {...props}
          />
        </>
      )}
    </div>
  );
};

export default YoutubeEmbeddedVideo;
