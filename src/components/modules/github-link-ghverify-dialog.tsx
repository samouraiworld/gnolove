'use client';

import { useState } from 'react';

import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';

export interface GithubLinkGhVerifyDialogProps extends Dialog.RootProps {
  open?: boolean;
  ghLogin: string;
  onContinue: (address: string) => void;
}

export const GithubLinkGhVerifyDialog = ({
  ghLogin,
  onContinue,
  open = false,
  ...props
}: GithubLinkGhVerifyDialogProps) => {
  const [address, setAddress] = useState('');

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

  return (
    <Dialog.Root open={open} {...props}>
      <Dialog.Content maxWidth="550px">
        <Dialog.Title>Request Verification</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ marginRight: '10px' }}>Your Gno Address</span>
            <TextField.Root
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="g1..."
              style={{ minWidth: '350px' }}
            />
          </div>

          <div className="bg-gray-800 inset-0 flex items-center justify-center bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
              <h4 className="text-red-600 mb-2 font-bold" style={{ color: 'red' }}>
                Adena is not installed, please request verification yourself:
              </h4>
              <div className="bg-black text-green-400 rounded-lg shadow-md relative overflow-auto p-4">
                <pre className="text-sm">
                  <code>{generateCommand(ghLogin)}</code>
                </pre>
              </div>
            </div>
          </div>
        </Dialog.Description>

        <Flex justify="center" align="center" direction="column">
          <Text size="2">Once you have executed the tx, click the button below to continue.</Text>
          <Button color="green" onClick={() => onContinue(address)} mt="4">
            Continue
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
