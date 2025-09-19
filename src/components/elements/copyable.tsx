import React, { ReactNode, useState } from 'react';

import { CheckIcon, CopyIcon } from '@radix-ui/react-icons';

import { cn } from '@/utils/style';

interface CopyableProps {
  children: ReactNode;
  className?: HTMLSpanElement['className'];
}

const Copyable: React.FC<CopyableProps> = ({ children, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const textToCopy = React.Children.toArray(children).join('');
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 600);
  };

  return (
    <span
      className={cn(`inline-flex min-w-0 flex-1 cursor-pointer select-none items-center font-mono ${className ?? ''}`)}
      onClick={handleCopy}
      title={children?.toString() ?? ''}
    >
      <span className="min-w-0 overflow-hidden truncate whitespace-nowrap">{children}</span>
      <span className="ml-1">{copied ? <CheckIcon color="green" /> : <CopyIcon color="gray" />}</span>
    </span>
  );
};

export default Copyable;
