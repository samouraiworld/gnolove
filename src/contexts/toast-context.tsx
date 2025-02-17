'use client';

import { createContext, ReactNode, useContext, useState } from 'react';

import { IToast } from '@/type/radix-ui';

interface IContext {
  toasts: IToast[];
  addToast: (toast: IToast) => number | undefined;
  removeToast: (id: number) => void;
}

const defaultContext = {
  toasts: [],
  addToast: () => 0,
  removeToast: () => null,
} satisfies IContext;

export const ToastContext = createContext<IContext>(defaultContext);

export const useToast = () => useContext(ToastContext);

export interface ToastProviderProps {
  children: ReactNode;
}

const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<IToast[]>(defaultContext.toasts);

  const addToast = (_toast: IToast) => {
    const toast = 'id' in _toast ? _toast : { ..._toast, id: Date.now() };
    setToasts((prev) => [...prev, toast]);
    return toast.id;
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return <ToastContext.Provider value={{ toasts, addToast, removeToast }}>{children}</ToastContext.Provider>;
};

export default ToastProvider;
