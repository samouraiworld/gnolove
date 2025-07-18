'use client';

import { useEffect, useRef } from 'react';

import * as Toast from '@radix-ui/react-toast';
import { Text, Theme } from '@radix-ui/themes';

import { useToast } from '@/contexts/toast-context';

import { cn } from '@/utils/style';

const Toaster = () => {
  const { toasts } = useToast();

  return (
    <Theme className="pointer-events-none fixed inset-0 z-[100] bg-transparent">
      <Toast.Provider swipeDirection="right">
        {toasts.map((toast) => (
          <SingleToast {...toast} key={toast.id} />
        ))}

        <Toast.Viewport className="max-w-screen fixed right-0 top-0 !z-50 m-0 flex w-96 list-none flex-col gap-3 p-8 outline-none" />
      </Toast.Provider>
    </Theme>
  );
};

interface ISingleToastProps {
  id?: number;
  open?: boolean;
  title: string;
  message: string;
  mode?: string;
  timer?: number;
  infinite?: boolean;
}

const SingleToast = ({
  id,
  title = '',
  message = '',
  timer = 5000,
  mode = 'info',
  infinite = false,
}: ISingleToastProps) => {
  const { removeToast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | undefined>();

  const handleRemoveToast = () => {
    if (id) removeToast(id);
    timerRef.current && clearTimeout(timerRef.current);
  };

  const setTimer = () => {
    timerRef.current = setTimeout(() => {
      handleRemoveToast();
      clearTimeout(timerRef.current);
    }, timer + 1000);
  };

  useEffect(() => {
    !infinite && setTimer();
  }, []);

  const titleColor = mode === 'negative' ? 'red' : mode === 'positive' ? 'green' : 'blue';

  return (
    <Toast.Root
      className="rt-ToastRoot pointer-events-auto flex flex-col items-start gap-x-4 rounded-4 bg-whiteA-12 p-5 shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] [grid-template-areas:_'title_action'_'description_action']"
      duration={Infinity}
    >
      <Toast.Title className={cn('text-3 font-medium')}>
        <Text color={titleColor}>{title}</Text>
      </Toast.Title>
      <Toast.Description className="text-2 text-grayA-11">{message}</Toast.Description>
    </Toast.Root>
  );
};

export default Toaster;
