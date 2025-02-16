'use client';

import { redirect } from "next/navigation";

type RedirectPageProps = {
  searchParams: {
    code: string;
    target: string;
  };
};

const RedirectPage = (props: RedirectPageProps) => {
  const {
    searchParams: { code, target },
  } = props;

  return redirect(`${target}?code=${code}`);
};

export default RedirectPage;
