'use client';

import React from 'react';

import Loader from '@/elements/loader';

import { useAdena } from '@/contexts/adena-context';

export const AdenaAddress = () => {
  const { adena, isLoading } = useAdena();

  if (isLoading) return <Loader />;
  if (!adena) return <span className="text-sm text-yellow-500">Adena not installed</span>;

  return <span className="text-green-600">Adena installed</span>;
};
