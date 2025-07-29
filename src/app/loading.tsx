import { Flex } from '@radix-ui/themes';
import Loader from '@/elements/loader';

const LoadingPage = () => {
  return (
    <Flex align="center" justify="center" height="100vh" width="100vw" direction="column" gap="4">
      <Loader />
    </Flex>
  );
};

export default LoadingPage;
