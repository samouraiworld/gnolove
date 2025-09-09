'use client';

import { Suspense, useEffect } from 'react';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { GithubLinkDescriptionDialog } from './github-link-description-dialog';
import { GithubLinkGhVerifyDialog } from './github-link-ghverify-dialog';
import { toast } from 'sonner';

import { useLinkGithub } from '@/hooks/use-link-github';

// We have to wrap the GithubLink in a Suspense because it use useSearchParams
export const GithubLink = (props: DialogPrimitive.DialogProps) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GithubLinkWithoutSuspense {...props} />
    </Suspense>
  );
};

const GithubLinkWithoutSuspense = (props: DialogPrimitive.DialogProps) => {
  const { ghUser, isShowGhVerifyDialog, showGhVerifyDialog, resolveRef, linkingState } = useLinkGithub();

  useEffect(() => {
    if (!linkingState) return;

    toast(linkingState);
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
