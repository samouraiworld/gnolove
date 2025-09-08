import Image, { ImageProps } from 'next/image';

import { Flex } from '@radix-ui/themes';

import MinecraftHeart from '@/images/minecraft-heart.png';

const Loader = (props?: Omit<ImageProps, 'src' | 'alt'>) => {
  return (
    <Flex className="animate-heart-pulse">
      <Image
        alt="Loading Heart"
        height={28}
        src={MinecraftHeart}
        width={28}
        {...props}
      />
    </Flex>
  );
};

export default Loader;