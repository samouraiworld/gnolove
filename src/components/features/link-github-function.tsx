'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useLinkGithub () {
  const [linking, setLinking] = useState(false);
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    if (code && !linking) {
      setLinking(true);
      processLink(code)
    }
  },[code, linking]);
};


function processLink(code:string) {
    const login = localStorage.getItem("github_login");
    const address = localStorage.getItem("gno_address");
    
    if (login && address) {
      postCode(code, login, address);
    }
  
}

const postCode = async (code:string, login:string,address:string,) => {
  const url = new URL(`/ghtoken?code=${code}&login=${login}&address=${address}`, process.env.NEXT_PUBLIC_API_URL);
  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();
  if (res.status !== 200) {
    alert(data.error);
    return
  }

  alert("Account linked successfully");
};