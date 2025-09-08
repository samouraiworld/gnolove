import React from 'react';
import Markdown, { Options } from 'react-markdown';

import { cn } from '@/utils/style';

const RadixMarkdown = ({ components, ...props }: Readonly<Options>) => {
  return (
    <Markdown
      {...props}
      components={{
        h1: (p) => <h1 className="text-3xl font-bold" {...p} />,
        h2: (p) => <h2 className="text-2xl font-semibold" {...p} />,
        h3: (p) => <h3 className="text-xl font-semibold" {...p} />,
        h4: (p) => <h4 className="text-lg font-semibold" {...p} />,
        h5: (p) => <h5 className="text-base font-semibold" {...p} />,
        h6: (p) => <h6 className="text-sm font-semibold" {...p} />,

        p: ({ color: _color, ...props }) => <p className="leading-7" {...props}>{props.children}</p>,

        ul: ({ className, ...props }) => <ul className={cn('list-inside list-disc', className)} {...props} />,
        ol: ({ className, ...props }) => <ul className={cn('list-inside list-decimal', className)} {...props} />,

        ...components,
      }}
    />
  );
};

export default RadixMarkdown;
