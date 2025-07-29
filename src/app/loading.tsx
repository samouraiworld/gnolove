'use client';

import Image from 'next/image';

import { Flex } from '@radix-ui/themes';

import '@/styles/loading.css';

import MinecraftHeart from '@/images/minecraft-heart.png';

const LoadingPage = () => {
  return (
    <Flex align="center" justify="center" height="100vh" width="100vw" direction="column" gap="4">
      <div className="heart-animation">
        <Image src={MinecraftHeart} alt="Loading Heart" width={36} height={36} />
      </div>
    </Flex>
  );
};

export default LoadingPage;
