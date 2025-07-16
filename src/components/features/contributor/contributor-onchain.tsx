'use client';

import { TPackage } from '@/utils/schemas';
import { Card, Flex, Heading, Text, Grid, Select } from '@radix-ui/themes';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const ContributorOnchain = ({ packages }: { packages: TPackage[] }) => {
  // Extract unique namespaces
  const namespaces = useMemo(
    () => Array.from(new Set(packages.map((pkg) => pkg.namespace))),
    [packages]
  );
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');

  // Prepare package data
  const packagesData = useMemo(
    () =>
      packages
        .filter((pkg) =>
          selectedNamespace === 'all' ? true : pkg.namespace === selectedNamespace
        )
        .map(({ path, namespace }) => ({
          name: path.split(`${namespace}/`)[1],
          namespace,
          path,
          url: /^https?:\/\//i.test(path ?? '') ? path : `https://${path}`,
        })),
    [packages, selectedNamespace]
  );

  return (
    <Card style={{ height: '100%' }}>
      <Flex direction='column' gap='4' height='100%' overflowY='auto'>
        <Heading size='5'>On-chain Contributions</Heading>
        {packages.length > 0 ? (
          <>
            <Heading size='3'>Packages</Heading>
            <Text size='2'>{packages.length} packages</Text>
            <Flex align='center' gap='2' mb='2'>
              <Text size='2'>Filter by namespace:</Text>
              <Select.Root
                value={selectedNamespace}
                onValueChange={setSelectedNamespace}
              >
                <Select.Trigger placeholder='All' />
                <Select.Content>
                  <Select.Item value='all'>All</Select.Item>
                  {namespaces.map((ns) => (
                    <Select.Item key={ns} value={ns}>
                      {ns}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Flex>
            <Grid columns={{ initial: '1', lg: '3' }} gap='4'>
              {packagesData.map((pkg) => (
                <Link
                  href={pkg.url}
                  key={pkg.path}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <Card>
                    <Flex direction='column' gap='2'>
                      <Text size='1'>/{pkg.namespace}</Text>
                      <Heading size='5'>{pkg.name}</Heading>
                      <Text size='2'>Explore {pkg.name}</Text>
                    </Flex>
                  </Card>
                </Link>
              ))}
            </Grid>
          </>
        ) : (
          <Text size='2'>Nothing to see here (for now :))</Text>
        )}
      </Flex>
    </Card>
  );
};

export default ContributorOnchain;