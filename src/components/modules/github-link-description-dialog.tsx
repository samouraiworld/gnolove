'use client';

import { useEffect, useState } from 'react';

import { useAdena } from '@/contexts/adena-context';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

export const GithubLinkDescriptionDialog = (props: React.ComponentProps<typeof Dialog>) => {
  const { adena } = useAdena();
  const [shouldUpdateGnoProfile, setShouldUpdateGnoProfile] = useState<boolean | 'indeterminate'>();

  const redirectToGithubOauth = () => {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_REDIRECT_PROXY}/redirect?target=${window.location.origin}&scope=read:user`;
    window.location.href = authUrl;
  };

  useEffect(() => {
    if (shouldUpdateGnoProfile === undefined) return;
    const val = shouldUpdateGnoProfile ? 'true' : 'false';
    localStorage.setItem('shouldUpdateGnoProfile', val);
  }, [shouldUpdateGnoProfile]);

  useEffect(() => {
    const val = localStorage.getItem('shouldUpdateGnoProfile');
    setShouldUpdateGnoProfile(val === 'true');
  }, []);

  return (
    <Dialog {...props}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>

      <DialogContent className="max-w-[800px]">
        <DialogTitle>Link your Github account to your Gno Wallet</DialogTitle>
        <DialogDescription className="text-muted-foreground mb-4 text-sm">
          <p>Here is the process we will follow to link your Github account to your Gno Wallet:</p>
          <ul className="list-disc pl-6">
            <li>Use Github OAuth to ensure you are the owner of this Github account</li>
            <li>Make the verification request to realm ghverify</li>
            <li>Optional: Update your Gno profile (only available if Adena is installed)</li>
            <li>Verify and link if the Github account and address are correct</li>
          </ul>
        </DialogDescription>

        <div className="flex flex-col items-center justify-center gap-2">
          {adena && (
            <label className="flex items-center justify-between gap-2">
              <Switch checked={!!shouldUpdateGnoProfile} onCheckedChange={setShouldUpdateGnoProfile as any} />
              <span className="text-sm">Update my Gno profile with Github info</span>
            </label>
          )}

          <Button onClick={redirectToGithubOauth} className="bg-green-600 hover:bg-green-700">
            Start the process
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
