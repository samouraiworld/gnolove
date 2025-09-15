import React from 'react';

import Markdown, { Options } from 'react-markdown';

import { cn } from '@/utils/style';

const RadixMarkdown = ({ components, ...props }: Readonly<Options>) => {
  return (
    <Markdown
      {...props}
      components={{
        h1: ({ node: _node, className, ...rest }) => (
          <h1 className={cn('text-3xl font-bold', className)} {...rest} />
        ),
        h2: ({ node: _node, className, ...rest }) => (
          <h2 className={cn('text-2xl font-semibold', className)} {...rest} />
        ),
        h3: ({ node: _node, className, ...rest }) => (
          <h3 className={cn('text-xl font-semibold', className)} {...rest} />
        ),
        h4: ({ node: _node, className, ...rest }) => (
          <h4 className={cn('text-lg font-semibold', className)} {...rest} />
        ),
        h5: ({ node: _node, className, ...rest }) => (
          <h5 className={cn('text-base font-semibold', className)} {...rest} />
        ),
        h6: ({ node: _node, className, ...rest }) => (
          <h6 className={cn('text-sm font-semibold', className)} {...rest} />
        ),

        p: ({ node: _node, className, children, ...rest }) => (
          <p className={cn('leading-7', className)} {...rest}>
            {children}
          </p>
        ),

        ul: ({ className, ...props }) => <ul className={cn('list-inside list-disc', className)} {...props} />,
        ol: ({ className, node: _node, ...rest }) => (
          <ol className={cn('list-inside list-decimal', className)} {...rest} />
        ),

        ...components,
      }}
    />
  );
};

export default RadixMarkdown;
