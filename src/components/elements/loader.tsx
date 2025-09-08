import Image, { ImageProps } from 'next/image';

import React from 'react';

import MinecraftHeart from '@/images/minecraft-heart.png';

const Loader = (props?: Omit<ImageProps, 'src' | 'alt'>) => {
  return (
    <div className="animate-heart-pulse">
      <Image
        alt="Loading Heart"
        height={28}
        src={MinecraftHeart}
        width={28}
        {...props}
      />
    </div>
  );
};

export default Loader;