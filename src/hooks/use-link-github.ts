'use client';

import { useState, useEffect, useRef } from 'react';

import { useSearchParams } from 'next/navigation';

type GhUser = {
  github_user: any;
  github_token: string;
};

export const useLinkGithub = () => {
<<<<<<< Updated upstream
=======
  const { adena, isLoading } = useAdena();

  const [isShowGhVerifyDialog, showGhVerifyDialog] = useState(false);
  const resolveRef = useRef<any>();
  const rejectRef = useRef<any>();

>>>>>>> Stashed changes
  const [address, setAddress] = useState('');
  const [wallet, setWallet] = useState<any>(null);
  const [ghUser, setGhUser] = useState<any>();
  const [linkingState, setLinkingState] = useState('');

  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWallet((window as any).adena);
    }
  }, []);

<<<<<<< Updated upstream
  useEffect(() => {
    const processedCode = localStorage.getItem('processedCode');
    if (!code || isLinking || !wallet) return;
=======
    if (!code || isLinking || isLoading) return;
>>>>>>> Stashed changes
    if (processedCode === code) {
      console.warn('Already processed code');
      return;
    }

    setIsLinking(true);
    linkGithubAccount(code, wallet);
  }, [code, isLinking, wallet]);

  const getAdenaAddress = async (wallet: any) => {
    const connexion = await wallet.AddEstablish('Adena');
    if (connexion.status === 'failure') throw Error(connexion.message);

    const account = await wallet.GetAccount();
    if (account.status === 'failure') throw Error(account.message);

    setAddress(account.data.address);
    return account.data.address;
  };

  const requestVerification = async (wallet: any, userAddress: string, ghUser: any) => {
<<<<<<< Updated upstream
=======
    const shouldUpdateGnoProfile = localStorage.getItem('shouldUpdateGnoProfile') === 'true';

    const messages = [
      {
        type: '/vm.m_call',
        value: {
          caller: userAddress,
          send: '',
          pkg_path: process.env.NEXT_PUBLIC_GHVERIFY_REALM_PATH,
          func: 'RequestVerification',
          args: [ghUser.login],
        },
      },
    ];

    const displayName = ghUser.name || ghUser.login;

    if (shouldUpdateGnoProfile && displayName) {
      messages.push({
        type: '/vm.m_call',
        value: {
          caller: userAddress,
          send: '',
          pkg_path: process.env.NEXT_PUBLIC_PROFILE_REALM_PATH,
          func: 'SetStringField',
          args: ['DisplayName', displayName],
        },
      });
    }

    if (shouldUpdateGnoProfile && ghUser.avatar_url) {
      messages.push({
        type: '/vm.m_call',
        value: {
          caller: userAddress,
          send: '',
          pkg_path: process.env.NEXT_PUBLIC_PROFILE_REALM_PATH,
          func: 'SetStringField',
          args: ['Avatar', ghUser.avatar_url],
        },
      });
    }

    if (shouldUpdateGnoProfile && ghUser.bio) {
      messages.push({
        type: '/vm.m_call',
        value: {
          caller: userAddress,
          send: '',
          pkg_path: process.env.NEXT_PUBLIC_PROFILE_REALM_PATH,
          func: 'SetStringField',
          args: ['Bio', ghUser.bio],
        },
      });
    }

>>>>>>> Stashed changes
    const res = await wallet.DoContract({
      messages: [
        {
          type: '/vm.m_call',
          value: {
            caller: userAddress,
            send: '',
            pkg_path: process.env.NEXT_PUBLIC_GHVERIFY_REALM_PATH,
            func: 'RequestVerification',
            args: [ghUser.login],
          },
        },
        {
          type: '/vm.m_call',
          value: {
            caller: userAddress,
            send: '',
            pkg_path: process.env.NEXT_PUBLIC_PROFILE_REALM_PATH,
            func: 'SetStringField',
            args: ['DisplayName', ghUser.name],
          },
        },
        {
          type: '/vm.m_call',
          value: {
            caller: userAddress,
            send: '',
            pkg_path: process.env.NEXT_PUBLIC_PROFILE_REALM_PATH,
            func: 'SetStringField',
            args: ['Avatar', ghUser.avatar_url],
          },
        },
      ],
      gasFee: 1,
      gasWanted: 10000000,
    });

    if (res.status === 'failure') {
      throw Error(res.message);
    }
  };

  const verifyGithubAccount = async (ghToken: string, ghLogin: string, userAddress: string) => {
    const url = new URL(
      `/verifyGithubAccount?token=${ghToken}&login=${ghLogin}&address=${userAddress}`,
      process.env.NEXT_PUBLIC_API_URL,
    );
    const res = await fetch(url.toString(), { cache: 'no-cache' });
    const data = await res.json();

    if (res.status !== 200) {
      throw Error(data.error);
    }

    return data;
  };

  const requestVerificationViaGnokey = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current = reject;
      showGhVerifyDialog(true);
    });
  };

  const linkGithubAccount = async (code: string, adena: any) => {
    try {
      localStorage.setItem('processedCode', code);

      // 1. Get github user and token by exchanging github code for a token
      setLinkingState('Getting github user and token');
      const ghData: GhUser = await getGithubUserAndToken(code);
<<<<<<< Updated upstream
  
      // 2. Get the Adena account address
      setLinkingState('Getting Adena account address');
      const userAddress = await getAdenaAddress(wallet);
  
      // 3. Once we get the user, address we make the request RequestVerification
      setLinkingState('Requesting verification');
      await requestVerification(wallet, userAddress, ghData.github_user);
  
=======

      let userAddress: string;
      if (!adena) {
        // 2a: If has not adena, we show the verification request dialog and stop the process here
        // and continue with the verification request dialog
        setLinkingState('Requesting verification via gnokey');
        userAddress = await requestVerificationViaGnokey();
      } else {
        // 2b. If has Adena: Get the Adena account address
        setLinkingState('Getting Adena account address');
        userAddress = await getAdenaAddress(adena);

        // 3b. Once we get the user, address we make the request RequestVerification
        setLinkingState('Requesting verification');
        await requestVerification(adena, userAddress, ghData.github_user);
      }

>>>>>>> Stashed changes
      // 4. Once we get the verification request, we verify with the back the github login and address are correct
      setLinkingState('Verifying github account');
      await verifyGithubAccount(ghData.github_token, ghData.github_user.login, userAddress);

      setLinkingState(`Your github account: ${ghData.github_user.login} has been linked to your Adena account`);
    } catch (error) {
      alert(`Error: ${JSON.stringify(error)}`);
    }
  };

  const getGithubUserAndToken = async (code: string) => {
    const url = new URL(`/getGithubUserAndTokenByCode?code=${code}`, process.env.NEXT_PUBLIC_API_URL);
    const res = await fetch(url.toString(), { cache: 'no-cache' });
    const data = await res.json();

    if (!data) throw Error('Failed to get github user and token');

    if (res.status !== 200) {
      throw Error(data.error);
    }

    setGhUser(data.github_user);
    return data;
  };

<<<<<<< Updated upstream
  return { address, setAddress, wallet, ghUser, linkingState };
=======
  return {
    address,
    setAddress,
    adena,
    ghUser,
    linkingState,
    isShowGhVerifyDialog,
    showGhVerifyDialog,
    resolveRef,
    rejectRef,
  };
>>>>>>> Stashed changes
};
