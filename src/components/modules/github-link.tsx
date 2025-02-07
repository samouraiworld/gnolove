'use client';

import { Button, Dialog } from '@radix-ui/themes';

import { TEnhancedUserWithStats } from '@/util/schemas';
import { useState, useEffect } from 'react';


export interface ContributionsDialogProps extends Dialog.RootProps {
  user: TEnhancedUserWithStats;
}

const LinkGithub = ({ user, children, ...props }: ContributionsDialogProps) => {
  const [address, setAddress] = useState("");
  const [wallet, setWallet] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).adena) {
      setWallet((window as any).adena);
    } 
  })
  
  return (
    <Dialog.Root {...props} >
      <Dialog.Trigger>{children}</Dialog.Trigger>

      <Dialog.Content maxWidth="800px">
        <Dialog.Title>Link {user.login ?? user.name} to your Gno Wallet </Dialog.Title>
        <Dialog.Description size="2" mb="4">
          We will use Github Oauth to ensure you are the owner of this github account
        </Dialog.Description>
        {!wallet && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ marginRight: '10px' }}>Gno Address</span>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder='g1...' style={{ minWidth: '350px' }} />
          </div>)
        }
        
        {!wallet && (
          <div className=" inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h4 className="font-bold text-red-600 mb-2" style={{ color: 'red' }}>
              Adena is not installed, please request verification yourself:
            </h4>
            <div className="relative bg-black text-green-400 p-4 rounded-lg shadow-md overflow-auto">
              <pre className="text-sm ">
                <code>{getCommand(user.login)}</code>
              </pre>
            </div>
          </div>
          </div>
          )
        }
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} >
          <Button style={{ backgroundColor: 'green' }} onClick={() => linkGithub(wallet, user, address)} disabled={!wallet && !address}>Link</Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};


async function linkGithub(wallet: any, user: TEnhancedUserWithStats, address: string) {
  if (localStorage) {
    localStorage.setItem("github_login", user.login);
    localStorage.setItem("gno_address", address);
  }
    if (wallet) {
      const connexion = await wallet.AddEstablish('Adena');

      if (connexion) {
        const account = await wallet.GetAccount()
      
      localStorage.setItem("gno_address", account.data.address);
      const res = await wallet.DoContract({
        messages: [
          {
            type: "/vm.m_call",
            value: {
              caller: account.data.address, // your Adena address
              send: "",
              pkg_path: process.env.NEXT_PUBLIC_CONTRACT_PATH, // Gnoland package path
              func: "RequestVerification", // Function name
              args: [ // Arguments
                user.login,
              ]
            }
          }
        ],
        gasFee: 1,
        gasWanted: 10000000,
      })

      if (res.status === "failure") {
        alert(res.message)
        return
      }

    }
    }
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID}&redirect_uri=${process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URL}&scope=read:user`;
  window.location.href = authUrl;
}

export default LinkGithub;

function getCommand(login: string) :string{
  return `gnokey maketx call \\
  -pkgpath "${process.env.NEXT_PUBLIC_CONTRACT_PATH}" \\
  -func RequestVerification \\
  -gas-fee 1000000ugnot -gas-wanted 2000000 \\
  -broadcast \\
  -chainid=test5 \\
  -remote="https://rpc.test5.gno.land:443" \\
  -send=20000000ugnot \\
  -args '${login}' \\
  YOUR_KEY`
}