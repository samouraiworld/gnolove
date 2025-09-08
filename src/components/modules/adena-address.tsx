'use client';

import React from 'react';

import { useAdena } from '@/contexts/adena-context';
import Loader from '@/elements/loader';

export const AdenaAddress = () => {
  const { adena, isLoading } = useAdena();

  if (isLoading) return <Loader />;
  if (!adena)
    return (
      <span className="text-sm text-yellow-500">Adena not installed</span>
    );

  return <span className="text-green-600">Adena installed</span>;
};
