import { Flex, Spinner } from '@radix-ui/themes';

const LoadingPage = () => {
  return (
    <Flex align="center" justify="center" height="100vh" width="100vw">
      <Spinner />
    </Flex>
  );
};

export default LoadingPage;