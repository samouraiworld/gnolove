'use client';

import { redirect, RedirectType } from 'next/navigation';

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

  // FIXME: if using `${target}?code=${code}` we will have
  // Error: Strings must use singlequote. quotes.
  return redirect(target + '?code=' + code, RedirectType.replace);
};

export default RedirectPage;
