'use client';

import { useState, useEffect, useCallback } from 'react';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut } from '@/components/ui/command';
import { useMedGateStore } from '@/lib/medgate-store';
import { NAV_ITEMS } from '@/lib/medgate-constants';
import { Search } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const setActiveSection = useMedGateStore((s) => s.setActiveSection);

  const handleSelect = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    setOpen(false);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [setActiveSection]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="glass-card glow-cyan border-border/50">
      <CommandInput placeholder="Search sections..." className="glass-input border-0" />
      <CommandList>
        <CommandEmpty>No sections found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.id}
              value={item.label}
              onSelect={() => handleSelect(item.id)}
              className="data-[selected=true]:bg-cyan-500/10 data-[selected=true]:text-cyan-300"
            >
              <Search className="mr-2 h-4 w-4 text-cyan-400" />
              <span>{item.label}</span>
              <CommandShortcut className="glass-card text-[10px] px-1.5 py-0.5 rounded border border-border/50 font-mono text-muted-foreground ml-auto">
                {item.id}
              </CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}