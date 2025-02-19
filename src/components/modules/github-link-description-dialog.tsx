'use client';

import { useEffect, useState } from 'react';

import { Button, Checkbox, Dialog, Flex, Text } from '@radix-ui/themes';

import { useAdena } from '@/contexts/adena-context';

export const GithubLinkDescriptionDialog = (props: Dialog.RootProps) => {
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
    <Dialog.Root {...props}>
      <Dialog.Trigger>{props.children}</Dialog.Trigger>

      <Dialog.Content maxWidth="800px">
        <Dialog.Title>Link your Github account to your Gno Wallet </Dialog.Title>
        <Dialog.Description size="2" mb="4">
          <Text>Here are the process we will follow to link your Github account to your Gno Wallet</Text>

          <ul>
            <li>1. Use Github Oauth to ensure you are the owner of this github account</li>
            <li>2. Make the Verification Request to realm ghverify</li>
            <li>3. Optional: Update your Gno profile (only available if Adena is installed)</li>
            <li>4. Verify and link if the github account and address are correct</li>
          </ul>
        </Dialog.Description>

        <Flex justify="center" align="center" direction="column" gap="2">
          {adena && (
            <Flex direction="row" align="center" justify="between" gap="2">
              <Checkbox checked={shouldUpdateGnoProfile} onCheckedChange={setShouldUpdateGnoProfile} />
              <Text>Update my Gno profile with Github info</Text>
            </Flex>
          )}

          <Button color="green" onClick={redirectToGithubOauth}>
            Start the process
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
