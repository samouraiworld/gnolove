import { ComponentProps } from 'react';

import { cn } from '@/utils/style';

export interface YoutubeEmbeddedVideoProps extends ComponentProps<'iframe'> {}

const YoutubeEmbeddedVideo = ({ className, ...props }: YoutubeEmbeddedVideoProps) => {
  return (
    <iframe
      className={cn('aspect-video h-auto w-full', className)}
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      {...props}
    ></iframe>
  );
};

export default YoutubeEmbeddedVideo;
