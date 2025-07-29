import Image from 'next/image';

import { Flex } from '@radix-ui/themes';

import MinecraftHeart from '@/images/minecraft-heart.png';

const LoadingPage = () => {
  return (
    <Flex align="center" justify="center" height="100vh" width="100vw" direction="column" gap="4">
      <div className="animate-heartPulse">
        <Image src={MinecraftHeart} alt="Loading Heart" width={28} height={28} />
      </div>
    </Flex>
  );
};

export default LoadingPage;
