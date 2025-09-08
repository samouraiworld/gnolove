'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type Repository = {
  id: string;
  name: string;
  owner: string;
};

type Props = {
  repositories: Repository[];
  selectedRepositories: string[];
  onSelectedRepositoriesChange: (selected: string[]) => void;
};

const RepositoriesSelector = ({
  repositories,
  selectedRepositories,
  onSelectedRepositoriesChange,
  ...props
}: Props & React.ComponentProps<typeof Button>) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleSelectAllToggle = () => {
    if (selectedRepositories.length === repositories.length) {
      onSelectedRepositoriesChange([]);
    } else {
      onSelectedRepositoriesChange(repositories.map((repo) => repo.id));
    }
  };

  return (
    <div className="relative inline-block">
      <Button variant="secondary" onClick={() => setOpen((v) => !v)} {...(props as React.ComponentProps<typeof Button>)}>
        <SlidersHorizontal className="mr-2 h-4 w-4" /> Repositories
      </Button>
      {open && (
        <div ref={popoverRef} className="absolute z-50 mt-2 w-64 rounded-md border bg-popover p-3 text-popover-foreground shadow-md">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedRepositories.length === repositories.length}
              onChange={handleSelectAllToggle}
            />
            Select/Unselect All
          </label>
          <Separator className="my-2" />
          <div className="flex max-h-60 flex-col gap-2 overflow-auto text-sm">
            {repositories.map(({ id, name, owner }) => (
              <label key={id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedRepositories.includes(id)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onSelectedRepositoriesChange(
                      checked ? [...selectedRepositories, id] : selectedRepositories.filter((x) => x !== id)
                    );
                  }}
                />
                {owner}/{name}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RepositoriesSelector;
