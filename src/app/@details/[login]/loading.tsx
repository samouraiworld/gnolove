'use client';

import Loader from '@/elements/loader';
import { DialogTitle } from '@/components/ui/dialog';

const Loading = () => {
  return (
    <div className='flex items-center gap-2'>
      <DialogTitle className='m-0'>Loading...</DialogTitle>
      <Loader width={24} height={24} />
    </div>
  );
};

export default Loading;
