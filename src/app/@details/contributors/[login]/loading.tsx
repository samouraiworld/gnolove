'use client';

import { Dialog, Spinner } from '@radix-ui/themes';

const LoadingContributor = () => {
  return (
    <Dialog.Root open>
      <Dialog.Content height='88vh' maxWidth='1000px' style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Dialog.Title>Loading...</Dialog.Title>
        <Spinner size="3" />
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default LoadingContributor;