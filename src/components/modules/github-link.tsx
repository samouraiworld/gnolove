'use client';

import { Button, Dialog } from '@radix-ui/themes';
import { useLinkGithub } from '@/hooks/use-link-github';
import { useToast } from '@/contexts/toast-context';
import { useEffect } from 'react';

export const GithubLink = (props: Dialog.RootProps) => {
  const { address, setAddress, wallet, ghUser, linkingState } = useLinkGithub();
  const { addToast, removeToast } = useToast();

  useEffect(() => {
    if (!linkingState) return;
    const toastId = addToast({
      title: 'Linking Github account',
      message: linkingState,
      mode: 'info',
    });
    return () => toastId && removeToast(toastId);
  }, [linkingState]);

  const generateCommand = (login: string) => {
    return `gnokey maketx call \\
    -pkgpath "${process.env.NEXT_PUBLIC_GHVERIFY_REALM_PATH}" \\
    -func RequestVerification \\
    -gas-fee 1000000ugnot -gas-wanted 2000000 \\
    -broadcast \\
    -chainid=test5 \\
    -remote="https://rpc.test5.gno.land:443" \\
    -send=20000000ugnot \\
    -args '${login}' \\
    YOUR_KEY`;
  };

  const redirectToGithubOauth = () => {
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URL}&scope=read:user`;
    window.location.href = authUrl;
  };

  return (
    <Dialog.Root {...props}>
      <Dialog.Trigger>{props.children}</Dialog.Trigger>

      <Dialog.Content maxWidth="800px">
        <Dialog.Title>Link your Github account to your Gno Wallet </Dialog.Title>
        <Dialog.Description size="2" mb="4">
          We will use Github Oauth to ensure you are the owner of this github account
        </Dialog.Description>

        {!wallet && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ marginRight: '10px' }}>Gno Address</span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="g1..."
              style={{ minWidth: '350px' }}
            />
          </div>
        )}

        {!wallet && (
          <div className="bg-gray-800 inset-0 flex items-center justify-center bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
              <h4 className="text-red-600 mb-2 font-bold" style={{ color: 'red' }}>
                Adena is not installed, please request verification yourself:
              </h4>
              <div className="bg-black text-green-400 rounded-lg shadow-md relative overflow-auto p-4">
                <pre className="text-sm">
                  <code>{generateCommand(ghUser?.login)}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Button style={{ backgroundColor: 'green' }} onClick={redirectToGithubOauth} disabled={!wallet && !address}>
            Link
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};
