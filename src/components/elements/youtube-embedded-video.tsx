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
  const [isIframeVisible, setIsIframeVisible] = useState(false);

  const thumbnail = useMemo(() => {
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
  }, [id]);

  const iframeSrc = useMemo(() => src || (id ? `https://www.youtube.com/embed/${id}` : undefined), [id, src]);

  const handleActivate = () => {
    if (!iframeSrc) return;
    setIsIframeVisible(true);
  };

  return (
    <div className={cn('relative aspect-video w-full overflow-hidden', className)}>
      {!isIframeVisible && (
        <button
          type="button"
          onClick={handleActivate}
          className="absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden bg-black/30 text-white transition hover:bg-black/40"
          aria-label={title ? `Play ${title}` : 'Play video'}
        >
          {thumbnail && (
            <Image
              alt={title ? `${title} thumbnail` : 'YouTube video thumbnail'}
              src={thumbnail}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="-z-10 object-cover"
              loading="lazy"
            />
          )}
          <span className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold">
            ▶ Play
          </span>
        </button>
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
