'use client';

import { useCallback, useMemo, useState } from 'react';
import { Box, Flex, IconButton, Text } from '@radix-ui/themes';
import { CheckIcon, CopyIcon } from '@radix-ui/react-icons';
import { useTheme } from 'next-themes';
import { cn } from '@/utils/style';

type CodeBlockProps = {
  value: string;
  language?: string;
  height?: number;
};

const CodeBlock = ({ value, language = '', height = 360 }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const lines = useMemo(() => value.split(/\r?\n/), [value]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error('Copy failed', err);
    }
  }, [value]);

  return (
    <Box className='rounded-md border border-gray-6 overflow-hidden'>
      <Flex align='center' justify='between' className='bg-black text-gray-3 px-3 py-2'>
        <Text size='2' className='font-mono opacity-80'>
          {language ? language.toUpperCase() : 'PLAINTEXT'}
        </Text>
        <IconButton variant='soft' color={copied ? 'green' : 'gray'} onClick={onCopy} title='Copy'>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </IconButton>
      </Flex>
      <Box className='bg-[#0b0b0c] text-white overflow-auto' maxHeight={`${height}px`}>
        <Flex>
          <Box className='select-none text-gray-6 bg-[#0f0f10] px-3 py-2 text-right' minWidth={'48px'}>
            {lines.map((_, i) => (
              <div key={i} className='leading-6 tabular-nums'>{i + 1}</div>
            ))}
          </Box>
          <Box className='px-3 py-2'>
            <pre className={cn('m-0 leading-6 whitespace-pre font-mono text-[13px]', {'text-whiteA-12': theme === 'dark', 'text-gray-3': theme === 'light' })}>
              <code>{value}</code>
            </pre>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default CodeBlock;
