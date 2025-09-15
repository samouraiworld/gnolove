'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { TNamespace, TPackage, TProposal } from '@/utils/schemas';

import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ContributorOnchain = ({
  packages,
  namespaces,
  proposals,
}: {
  packages: TPackage[];
  namespaces: TNamespace[];
  proposals: TProposal[];
}) => {
  // Extract unique namespaces from packages for filtering
  const namespaceOptions = useMemo(() => Array.from(new Set(packages.map((pkg) => pkg.namespace))), [packages]);
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [nsSort, setNsSort] = useState<'desc' | 'asc'>('desc');
  const [prSort, setPrSort] = useState<'desc' | 'asc'>('desc');
  const [proposalQuery, setProposalQuery] = useState<string>('');

  // Prepare package data
  const packagesData = useMemo(
    () =>
      packages
        .filter((pkg) => (selectedNamespace === 'all' ? true : pkg.namespace === selectedNamespace))
        .map(({ path, namespace }) => ({
          name: path.split(`${namespace}/`)[1],
          namespace,
          path,
          url: /^https?:\/\//i.test(path ?? '') ? path : `https://${path}`,
        })),
    [packages, selectedNamespace],
  );

  const hasAny = packages.length + namespaces.length + proposals.length > 0;

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
    <div className="h-full rounded-md border">
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
        <h2 className="text-xl font-semibold">On-chain Contributions</h2>
        {hasAny ? (
          <Tabs defaultValue="packages" className="flex h-full flex-col gap-4">
            <TabsList>
              <TabsTrigger value="packages">
                <span className="inline-flex items-center gap-2">
                  <span>Packages</span>
                  <Badge variant="secondary">{packages.length}</Badge>
                </span>
              </TabsTrigger>
              <TabsTrigger value="namespaces">
                <span className="inline-flex items-center gap-2">
                  <span>Namespaces</span>
                  <Badge variant="secondary">{namespaces.length}</Badge>
                </span>
              </TabsTrigger>
              <TabsTrigger value="proposals">
                <span className="inline-flex items-center gap-2">
                  <span>Proposals</span>
                  <Badge variant="secondary">{proposals.length}</Badge>
                </span>
              </TabsTrigger>
            </TabsList>

            <div>
              <TabsContent value="packages">
                <p className="mb-2 text-sm">{packages.length} packages</p>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm">Filter by namespace:</span>
                  <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {namespaceOptions.map((ns) => (
                        <SelectItem key={ns} value={ns}>
                          {ns}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {packagesData.length ? (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {packagesData.map((pkg) => (
                      <Link
                        href={pkg.url}
                        key={pkg.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border p-3"
                      >
                        <div className="flex flex-col gap-2">
                          <span className="text-muted-foreground text-xs">/{pkg.namespace}</span>
                          <h4 className="text-lg font-semibold">{pkg.name}</h4>
                          <span className="text-sm">Explore {pkg.name}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm">No packages found.</p>
                )}
              </TabsContent>

              <TabsContent value="namespaces">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm">{namespacesSorted.length} namespaces</p>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">Sort</span>
                    <Select value={nsSort} onValueChange={(v) => setNsSort(v as 'desc' | 'asc')}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Newest</SelectItem>
                        <SelectItem value="asc">Oldest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {namespacesSorted.length ? (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {namespacesSorted.map((ns) => (
                      <div key={`${ns.namespace}-${ns.hash}`} className="rounded-md border p-3">
                        <div className="flex flex-col gap-2">
                          <span className="text-muted-foreground text-xs">Owner</span>
                          <span className="font-mono text-sm">{ns.address}</span>
                          <h4 className="text-lg font-semibold">/{ns.namespace}</h4>
                          <span className="text-muted-foreground text-xs">Block #{ns.blockHeight}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm">No namespaces found.</p>
                )}
              </TabsContent>

              <TabsContent value="proposals">
                <div className="mb-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{proposalsShown.length} proposals</p>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">Sort</span>
                      <Select value={prSort} onValueChange={(v) => setPrSort(v as 'desc' | 'asc')}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Newest</SelectItem>
                          <SelectItem value="asc">Oldest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">Filter</span>
                    <input
                      value={proposalQuery}
                      onChange={(e) => setProposalQuery(e.target.value)}
                      placeholder="Filter by path..."
                      className="flex-1 rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                {proposalsShown.length ? (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {proposalsShown.map((p) => (
                      <div key={p.id} className="rounded-md border p-3">
                        <div className="flex flex-col gap-2">
                          <span className="text-muted-foreground text-xs">Author</span>
                          <span className="font-mono text-sm">{p.address}</span>
                          <span className="text-muted-foreground text-xs">Path</span>
                          <span className="text-sm break-words">{p.path}</span>
                          <span className="text-muted-foreground text-xs">Files</span>
                          <span className="text-sm">{p.files.length}</span>
                          <span className="text-muted-foreground text-xs">Block</span>
                          <span className="text-sm">#{p.blockHeight}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm">No proposals found.</p>
                )}
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <p className="text-sm">Nothing to see here (for now :))</p>
        )}
      </div>
    </div>
  );
};

export default ContributorOnchain;
