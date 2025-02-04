'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';



export interface LinkGithubFunctionProps {
}

const LinkGithubFunction = ({
  ...props
}: LinkGithubFunctionProps) => {
  const [linking, setLinking] = useState(false);
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  
  if (code && !linking) {
    setLinking(true);
    processLink(code)
  }

  return (
    <div/>
  );
};

export default LinkGithubFunction;

function processLink(code:string) {
  
    console.log(code);
    
    const login = localStorage.getItem("github_login");
    const address = localStorage.getItem("gno_address");
  
    if (login && address) {
      postCode(code, login, address);
    }
  
}

const postCode = async (code:string, login:string,address:string,) => {
  const url = new URL(`http://localhost:3333/ghtoken?code=${code}&login=${login}&address=${address}`);
  const res = await fetch(url.toString(), { cache: 'no-cache' });
  const data = await res.json();
  if (res.status !== 200) {
    alert(data.error);
    return
  }

  alert("Account linked successfully");
};