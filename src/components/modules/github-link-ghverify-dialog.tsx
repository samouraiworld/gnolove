'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export interface GithubLinkGhVerifyDialogProps extends React.ComponentProps<typeof Dialog> {
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
    <Dialog open={open} {...props}>
      <DialogContent className="max-w-[550px]">
        <DialogTitle>Request Verification</DialogTitle>
        <DialogDescription className="mb-4">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span>Your Gno Address</span>
            <Input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="g1..."
              className="min-w-[350px]"
            />
          </div>

          <div className="bg-opacity-50 inset-0 flex items-center justify-center bg-gray-800">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
              <h4 className="mb-2 font-bold text-red-600">
                Adena is not installed, please request verification yourself:
              </h4>
              <div className="relative overflow-auto rounded-lg bg-black p-4 text-green-400 shadow-md">
                <pre className="text-sm">
                  <code>{generateCommand(ghLogin)}</code>
                </pre>
              </div>
            </div>
          </div>
        </DialogDescription>

        <div className="flex flex-col items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Once you have executed the tx, click the button below to continue.
          </p>
          <Button onClick={() => onContinue(address)} className="mt-4 bg-green-600 hover:bg-green-700">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
