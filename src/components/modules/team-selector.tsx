'use client';

import { useState } from 'react';

import { Users2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

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

  const allSelected = selectedTeams.length === teams.length && teams.length > 0;
  const someSelected = selectedTeams.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      onSelectedTeamsChange([]);
    } else {
      onSelectedTeamsChange(teams.map((t) => t.name));
    }
  };

  const toggleOne = (name: string) => {
    if (selectedTeams.includes(name)) {
      onSelectedTeamsChange(selectedTeams.filter((x) => x !== name));
    } else {
      onSelectedTeamsChange([...selectedTeams, name]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" {...(props as React.ComponentProps<typeof Button>)}>
          <Users2 className="mr-2 h-4 w-4" />
          Teams{selectedTeams.length > 0 ? ` (${selectedTeams.length})` : ''}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search teams..." />
          <CommandList>
            <CommandEmpty>No team found.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem
                value="toggle-all"
                onSelect={() => {
                  toggleAll();
                }}
              >
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  className="mr-2"
                  aria-label="Select all"
                  // Prevent the checkbox from stealing focus styling inside command
                  onCheckedChange={() => toggleAll()}
                  onClick={(e) => e.stopPropagation()}
                />
                {allSelected ? 'Unselect all' : 'Select all'}
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Teams">
              {teams.map(({ name }) => {
                const checked = selectedTeams.includes(name);
                return (
                  <CommandItem
                    key={name}
                    value={name}
                    onSelect={() => {
                      toggleOne(name);
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      className="mr-2"
                      aria-label={`Toggle ${name}`}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() => toggleOne(name)}
                    />
                    <span className="truncate">{name}</span>
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

export default TeamSelector;
