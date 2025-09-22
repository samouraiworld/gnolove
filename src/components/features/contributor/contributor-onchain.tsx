'use client';

import Copyable from '@/elements/copyable';
import { TNamespace, TPackage, TProposal } from '@/utils/schemas';
import { Card, Flex, Heading, Text, Grid, Select, Tabs, Box, Badge } from '@radix-ui/themes';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const ContributorOnchain = ({ packages, namespaces, proposals }: { packages: TPackage[]; namespaces: TNamespace[]; proposals: TProposal[] }) => {
  // Extract unique namespaces from packages for filtering
  const namespaceOptions = useMemo(
    () => Array.from(new Set(packages.map((pkg) => pkg.namespace))),
    [packages]
  );
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [nsSort, setNsSort] = useState<'desc' | 'asc'>('desc');
  const [prSort, setPrSort] = useState<'desc' | 'asc'>('desc');
  const [proposalQuery, setProposalQuery] = useState<string>('');

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

  const hasAny = (packages.length + namespaces.length + proposals.length) > 0;

  // Sorted helpers
  const namespacesSorted = useMemo(() => {
    const arr = [...namespaces];
    arr.sort((a, b) => (nsSort === 'desc' ? b.blockHeight - a.blockHeight : a.blockHeight - b.blockHeight));
    return arr;
  }, [namespaces, nsSort]);
  const proposalsSorted = useMemo(() => {
    const arr = [...proposals];
    arr.sort((a, b) => (prSort === 'desc' ? b.blockHeight - a.blockHeight : a.blockHeight - b.blockHeight));
    return arr;
  }, [proposals, prSort]);
  const proposalsShown = useMemo(() => {
    const q = proposalQuery.trim().toLowerCase();
    if (!q) return proposalsSorted;
    return proposalsSorted.filter((p) => p.path.toLowerCase().includes(q));
  }, [proposalsSorted, proposalQuery]);

  return (
    <Card style={{ height: '100%' }}>
      <Flex direction='column' gap='4' height='100%' overflowY='auto'>
        <Heading size='5'>On-chain Contributions</Heading>
        {hasAny ? (
          <Tabs.Root defaultValue='packages' style={{ display: 'flex', flexDirection: 'column', gap: '4', height: '100%' }}>
            <Tabs.List>
              <Tabs.Trigger value='packages'>
                <Flex align='center' gap='2'>
                  <span>Packages</span>
                  <Badge variant='soft'>{packages.length}</Badge>
                </Flex>
              </Tabs.Trigger>
              <Tabs.Trigger value='namespaces'>
                <Flex align='center' gap='2'>
                  <span>Namespaces</span>
                  <Badge variant='soft'>{namespaces.length}</Badge>
                </Flex>
              </Tabs.Trigger>
              <Tabs.Trigger value='proposals'>
                <Flex align='center' gap='2'>
                  <span>Proposals</span>
                  <Badge variant='soft'>{proposals.length}</Badge>
                </Flex>
              </Tabs.Trigger>
            </Tabs.List>

            <Box>
              <Tabs.Content value='packages'>
                <Text size='2' mb='2'>{packages.length} packages</Text>
                <Flex align='center' gap='2' mb='2'>
                  <Text size='2'>Filter by namespace:</Text>
                  <Select.Root
                    value={selectedNamespace}
                    onValueChange={setSelectedNamespace}
                  >
                    <Select.Trigger placeholder='All' />
                    <Select.Content>
                      <Select.Item value='all'>All</Select.Item>
                      {namespaceOptions.map((ns) => (
                        <Select.Item key={ns} value={ns}>
                          {ns}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Flex>
                {packagesData.length ? (
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
                ) : (
                  <Text size='2'>No packages found.</Text>
                )}
              </Tabs.Content>

              <Tabs.Content value='namespaces'>
                <Flex align='center' justify='between' mb='2'>
                  <Text size='2'>{namespacesSorted.length} namespaces</Text>
                  <Flex align='center' gap='2'>
                    <Text size='2' color='gray'>Sort</Text>
                    <Select.Root value={nsSort} onValueChange={(v) => setNsSort(v as 'desc' | 'asc')}>
                      <Select.Trigger />
                      <Select.Content>
                        <Select.Item value='desc'>Newest</Select.Item>
                        <Select.Item value='asc'>Oldest</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Flex>
                </Flex>
                {namespacesSorted.length ? (
                  <Grid columns={{ initial: '1', lg: '3' }} gap='4'>
                    {namespacesSorted.map((ns) => (
                      <Card key={`${ns.namespace}-${ns.hash}`}>
                        <Flex direction='column' gap='2'>
                          <Text size='1' color='gray'>Owner</Text>
                          <Copyable>{ns.address}</Copyable>
                          <Heading size='5'>/{ns.namespace}</Heading>
                          <Text size='1' color='gray'>Block #{ns.blockHeight}</Text>
                        </Flex>
                      </Card>
                    ))}
                  </Grid>
                ) : (
                  <Text size='2'>No namespaces found.</Text>
                )}
              </Tabs.Content>

              <Tabs.Content value='proposals'>
                <Flex direction='column' gap='2' mb='2'>
                  <Flex align='center' justify='between'>
                    <Text size='2'>{proposalsShown.length} proposals</Text>
                    <Flex align='center' gap='2'>
                      <Text size='2' color='gray'>Sort</Text>
                      <Select.Root value={prSort} onValueChange={(v) => setPrSort(v as 'desc' | 'asc')}>
                        <Select.Trigger />
                        <Select.Content>
                          <Select.Item value='desc'>Newest</Select.Item>
                          <Select.Item value='asc'>Oldest</Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </Flex>
                  </Flex>
                  <Flex align='center' gap='2'>
                    <Text size='2' color='gray'>Filter</Text>
                    <input
                      value={proposalQuery}
                      onChange={(e) => setProposalQuery(e.target.value)}
                      placeholder='Filter by path...'
                      style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--gray-a6)', borderRadius: 6 }}
                    />
                  </Flex>
                </Flex>
                {proposalsShown.length ? (
                  <Grid columns={{ initial: '1', lg: '2' }} gap='4'>
                    {proposalsShown.map((p) => (
                      <Card key={p.id}>
                        <Flex direction='column' gap='2'>
                          <Text size='1' color='gray'>Author</Text>
                          <Copyable>{p.address}</Copyable>
                          <Text size='1' color='gray'>Path</Text>
                          <Text size='2' style={{ wordBreak: 'break-word' }}>{p.path}</Text>
                          <Text size='1' color='gray'>Files</Text>
                          <Text size='2'>{p.files.length}</Text>
                          <Text size='1' color='gray'>Block</Text>
                          <Text size='2'>#{p.blockHeight}</Text>
                        </Flex>
                      </Card>
                    ))}
                  </Grid>
                ) : (
                  <Text size='2'>No proposals found.</Text>
                )}
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        ) : (
          <Text size='2'>Nothing to see here (for now :))</Text>
        )}
      </Flex>
    </Card>
  );
};

export default ContributorOnchain;