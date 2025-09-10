'use client';

import NextLink, { LinkProps } from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { forwardRef, useMemo } from 'react';

import { REPOSITORIES_PARAM_KEY, TIME_FILTER_PARAM_KEY } from '@/constants/search-params';

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

type PreservingLinkProps = AnchorProps & LinkProps & {
  // When true, do not carry any params
  disableCarry?: boolean;
  // Explicit keys to carry; defaults to ['r','f']
  carryKeys?: string[];
};

function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:');
}

function mergeParamsIntoHref(href: string, carry: URLSearchParams, keysToCarry: string[]): string {
  if (!href || isExternalHref(href) || href.startsWith('#')) return href;

  const [pathAndQuery, hash = ''] = href.split('#');
  const [path, queryString = ''] = pathAndQuery.split('?');

  const nextParams = new URLSearchParams(queryString);

  for (const key of keysToCarry) {
    if (carry.has(key) && !nextParams.has(key)) {
      nextParams.set(key, carry.get(key) as string);
    }
  }

  const qs = nextParams.toString();
  const hashPart = hash ? `#${hash}` : '';
  return qs ? `${path}?${qs}${hashPart}` : `${path}${hashPart}`;
}

const PreservingLink = forwardRef<HTMLAnchorElement, PreservingLinkProps>(function PreservingLink(
  { href, disableCarry = false, carryKeys, ...props },
  ref
) {
  const searchParams = useSearchParams();

  const computedHref = useMemo(() => {
    if (typeof href !== 'string') return href; // For UrlObject, leave as-is to avoid surprises
    if (disableCarry) return href;

    const keys = carryKeys ?? [REPOSITORIES_PARAM_KEY, TIME_FILTER_PARAM_KEY];
    return mergeParamsIntoHref(href, new URLSearchParams(searchParams.toString()), keys);
  }, [href, disableCarry, carryKeys, searchParams]);

  return <NextLink ref={ref} href={computedHref as any} {...props} />;
});

export default PreservingLink;
