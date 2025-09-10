'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Check, ChevronsUpDown, SlidersHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import useGetRepositories from '@/hooks/use-get-repositories';
import { REPOSITORIES_PARAM_KEY } from '@/constants/search-params';

const PARAM_KEY = REPOSITORIES_PARAM_KEY;
// Must mirror server default in server/handler/stats.go:getRepositoriesWithRequest
const DEFAULT_REPOSITORIES = ['gnolang/gno'];

const RepositoriesSelector = () => {
  const { data: repositories } = useGetRepositories();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedIds = useMemo(() => {
    const raw = searchParams.get(PARAM_KEY);
    if (!raw) return [] as string[];
    return raw.split(',').filter(Boolean);
  }, [searchParams]);

  const setSelectedIds = (ids: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (ids.length === 0) {
      params.delete(PARAM_KEY);
    } else {
      params.set(PARAM_KEY, ids.join(','));
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const allIds = useMemo(() => repositories?.map((r) => r.id) || [], [repositories]);
  const allSelected = selectedIds.length > 0 && selectedIds.length === allIds.length;
  // When no selection is provided, server defaults to DEFAULT_REPOSITORIES
  const defaultIds = useMemo(
    () => repositories?.filter((r) => DEFAULT_REPOSITORIES.includes(`${r.owner}/${r.name}`)).map((r) => r.id) || [],
    [repositories],
  );
  const useDefaults = selectedIds.length === 0;
  const effectiveSelectedIds = useDefaults ? defaultIds : selectedIds;

  const toggleAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(allIds);
  };

  const toggleOne = (id: string) => {
    const base = useDefaults ? defaultIds : selectedIds;
    const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
    setSelectedIds(next);
    setOpen(false);
  };

  const label = useMemo(() => {
    if (selectedIds.length === 0) {
      if (defaultIds.length === 0) return 'All repositories';
      if (defaultIds.length === 1) {
        const repo = repositories?.find((r) => r.id === defaultIds[0]);
        return repo ? `${repo.owner}/${repo.name}` : '1 repository';
      }
      // Multiple defaults
      const names = repositories
        ?.filter((r) => defaultIds.includes(r.id))
        .map((r) => `${r.owner}/${r.name}`);
      return names && names.length > 0 ? names.join(', ') : 'All repositories';
    }
    if (selectedIds.length === 1) {
      const repo = repositories?.find((r) => r.id === selectedIds[0]);
      return repo ? `${repo.owner}/${repo.name}` : '1 repository';
    }
    return `${selectedIds.map((id) => id).join(', ')}`;
  }, [selectedIds, repositories, defaultIds]);

  if (!repositories?.length) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          aria-label="Select repositories"
          title={label}
          className="w-auto max-w-full justify-center sm:w-[260px] sm:justify-between relative"
        >
          <span className="flex items-center gap-2 truncate">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden truncate sm:inline">{label}</span>
          </span>
          <ChevronsUpDown className="ml-2 hidden h-4 w-4 opacity-50 sm:inline" />
          {/* Mobile-only badge showing number of selected repositories */}
          {selectedIds.length > 0 && (
            <span className="absolute -right-1 -top-1 block sm:hidden">
              <Badge className="h-5 min-w-5 px-1 text-[10px] leading-none flex items-center justify-center">
                {selectedIds.length}
              </Badge>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput placeholder="Search repositories..." />
          <CommandList>
            <CommandEmpty>No repositories found.</CommandEmpty>
            <CommandGroup heading="Selection">
              <CommandItem value="__toggle_all__" onSelect={toggleAll}>
                <Check className={`mr-2 h-4 w-4 ${allSelected ? 'opacity-100' : 'opacity-0'}`} />
                {allSelected ? 'Unselect all' : 'Select all'}
              </CommandItem>
              <CommandItem value="__clear__" onSelect={() => setSelectedIds([])}>
                Clear selection
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Repositories">
              {repositories?.map((repo) => {
                const checked = effectiveSelectedIds.includes(repo.id);
                return (
                  <CommandItem
                    key={repo.id}
                    value={`${repo.owner}/${repo.name}`}
                    onSelect={() => toggleOne(repo.id)}
                  >
                    <Check className={`mr-2 h-4 w-4 ${checked ? 'opacity-100' : 'opacity-0'}`} />
                    {repo.owner}/{repo.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default RepositoriesSelector;
