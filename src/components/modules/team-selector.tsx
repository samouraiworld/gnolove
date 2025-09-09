'use client';

import { useEffect, useRef, useState } from 'react';

import { Users2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const TeamSelector = ({
  teams,
  selectedTeams,
  onSelectedTeamsChange,
  ...props
}: {
  teams: { name: string }[];
  selectedTeams: string[];
  onSelectedTeamsChange: (selected: string[]) => void;
} & React.ComponentProps<typeof Button>) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleSelectAllToggle = () => {
    if (selectedTeams.length === teams.length) {
      onSelectedTeamsChange([]);
    } else {
      onSelectedTeamsChange(teams.map((team) => team.name));
    }
  };

  return (
    <div className="relative inline-block">
      <Button
        variant="secondary"
        onClick={() => setOpen((v) => !v)}
        {...(props as React.ComponentProps<typeof Button>)}
      >
        <Users2 className="mr-2 h-4 w-4" /> Teams
      </Button>
      {open && (
        <div
          ref={popoverRef}
          className="bg-popover text-popover-foreground absolute z-50 mt-2 w-64 rounded-md border p-3 shadow-md"
        >
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={selectedTeams.length === teams.length} onChange={handleSelectAllToggle} />
            Select/Unselect All
          </label>
          <Separator className="my-2" />
          <div className="flex max-h-60 flex-col gap-2 overflow-auto text-sm">
            {teams.map(({ name }) => (
              <label key={name} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedTeams.includes(name)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    onSelectedTeamsChange(checked ? [...selectedTeams, name] : selectedTeams.filter((x) => x !== name));
                  }}
                />
                {name}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSelector;
