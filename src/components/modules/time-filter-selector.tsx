'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Check, ChevronsUpDown, CalendarClock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { TIME_FILTER_PARAM_KEY } from '@/constants/search-params';
import { TimeFilter, isTimeFilter } from '@/utils/github';

const PARAM_KEY = TIME_FILTER_PARAM_KEY;

const options: { key: TimeFilter; label: string }[] = [
  { key: TimeFilter.WEEKLY, label: 'Past week' },
  { key: TimeFilter.MONTHLY, label: 'Past month' },
  { key: TimeFilter.YEARLY, label: 'Past year' },
  { key: TimeFilter.ALL_TIME, label: 'All time' },
];

const TimeFilterSelector = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selected = useMemo<TimeFilter>(() => {
    const raw = searchParams.get(PARAM_KEY);
    return raw && isTimeFilter(raw) ? (raw as TimeFilter) : TimeFilter.MONTHLY;
  }, [searchParams]);

  const label = useMemo(() => options.find((o) => o.key === selected)?.label || 'All time', [selected]);

  const setSelected = (value: TimeFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === TimeFilter.ALL_TIME) params.delete(PARAM_KEY);
    else params.set(PARAM_KEY, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          aria-label="Select time filter"
          title={label}
          className="w-auto max-w-full justify-center sm:w-[180px] sm:justify-between"
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarClock className="h-4 w-4" />
            <span className="inline truncate">{label}</span>
          </span>
          <ChevronsUpDown className="ml-2 hidden h-4 w-4 opacity-50 sm:inline" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup heading="Date range">
              {options.map(({ key, label }) => (
                <CommandItem key={key} value={key} onSelect={() => setSelected(key)}>
                  <Check className={`mr-2 h-4 w-4 ${selected === key ? 'opacity-100' : 'opacity-0'}`} />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default TimeFilterSelector;
