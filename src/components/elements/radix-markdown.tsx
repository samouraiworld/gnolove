import { ComponentProps } from 'react';

import { Heading, HeadingProps, Text } from '@radix-ui/themes';
import Markdown, { Options } from 'react-markdown';

import { cn } from '@/utils/style';

const getHeadingComponent = (
  headingProps: HeadingProps,
  { color: _color, ...props }: ComponentProps<NoUndefined<HeadingProps['as']>>,
) => {
  return (
    <Heading {...headingProps} {...props}>
      {props.children}
    </Heading>
  );
};

const RadixMarkdown = ({ components, ...props }: Readonly<Options>) => {
  return (
    <Markdown
      {...props}
      components={{
        h1: getHeadingComponent.bind(null, { as: 'h1', size: '8' }),
        h2: getHeadingComponent.bind(null, { as: 'h2', size: '7' }),
        h3: getHeadingComponent.bind(null, { as: 'h3', size: '6' }),
        h4: getHeadingComponent.bind(null, { as: 'h4', size: '5' }),
        h5: getHeadingComponent.bind(null, { as: 'h5', size: '4' }),
        h6: getHeadingComponent.bind(null, { as: 'h6', size: '3' }),

        p: ({ color: _color, ...props }) => <Text {...props}>{props.children}</Text>,

        ul: ({ className, ...props }) => <ul className={cn('list-inside list-disc', className)} {...props} />,
        ol: ({ className, ...props }) => <ul className={cn('list-inside list-decimal', className)} {...props} />,

        ...components,
      }}
    />
  );
};

export default RadixMarkdown;
