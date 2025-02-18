'use client';

import { Suspense, useEffect } from 'react';

import { GithubLinkDescriptionDialog } from './github-link-description-dialog';
import { GithubLinkGhVerifyDialog } from './github-link-ghverify-dialog';
import { Dialog } from '@radix-ui/themes';

import { useToast } from '@/contexts/toast-context';
import { useLinkGithub } from '@/hooks/use-link-github';

// We have to wrap the GithubLink in a Suspense because it use useSearchParams
export const GithubLink = (props: Dialog.RootProps) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GithubLinkWithoutSuspense {...props} />
    </Suspense>
  );
};

const GithubLinkWithoutSuspense = (props: Dialog.RootProps) => {
  const { ghUser, isShowGhVerifyDialog, showGhVerifyDialog, resolveRef, linkingState } = useLinkGithub();

  const { addToast, removeToast } = useToast();

  useEffect(() => {
    if (!linkingState) return;

    const toastId = addToast({
      title: 'Linking Github account',
      message: linkingState,
      mode: 'info',
    });
    return () => {
      toastId && removeToast(toastId);
    };
  }, [linkingState]);

  return (
    <>
      <GithubLinkDescriptionDialog {...props} />

      <GithubLinkGhVerifyDialog
        onContinue={(address) => {
          resolveRef.current(address);
          showGhVerifyDialog(false);
        }}
        ghLogin={ghUser?.login}
        open={isShowGhVerifyDialog}
      />
    </>
  );
};
