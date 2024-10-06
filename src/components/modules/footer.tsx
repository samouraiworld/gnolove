import NextLink from 'next/link';

import { DiscordLogoIcon, GitHubLogoIcon, TwitterLogoIcon } from '@radix-ui/react-icons';
import { Flex, FlexProps, IconButton, Link, Separator, Text } from '@radix-ui/themes';

import { cn } from '@/util/style';

const Footer = ({ className, ...props }: FlexProps) => {
  return (
    <Flex direction="column" align="center" gap="1" className={cn(className)} {...props}>
      <Flex direction="column" align="center" gap="2">
        <Text size="2" className="text-accent-10">
          Join the Gno.land Ecosystem!
        </Text>

        <Flex gap="4">
          <NextLink href="https://x.com/_gnoland" target="_blank">
            <IconButton variant="ghost" size="2">
              <TwitterLogoIcon />
            </IconButton>
          </NextLink>

          <NextLink href="https://github.com/gnolang" target="_blank">
            <IconButton variant="ghost" size="2">
              <GitHubLogoIcon />
            </IconButton>
          </NextLink>

          <NextLink href="discord.gg/YFtMjWwUN7" target="_blank">
            <IconButton variant="ghost" size="2">
              <DiscordLogoIcon />
            </IconButton>
          </NextLink>
        </Flex>
      </Flex>

      <Separator my="2" size="4" />

      <Text mb="2" size="2" className="italic">
        Gnolove.world is cooked with ❤️ by{' '}
        <Link asChild>
          <NextLink href="https://www.samourai.world" target="_blank">
            www.samourai.world
          </NextLink>
        </Link>
      </Text>
    </Flex>
  );
};

export default Footer;
