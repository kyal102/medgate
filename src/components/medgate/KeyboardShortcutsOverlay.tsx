'use client';

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Keyboard, Command, X } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['⌘', 'K'], description: 'Open command palette', section: 'General' },
  { keys: ['?'], description: 'Show keyboard shortcuts', section: 'General' },
  { keys: ['Esc'], description: 'Close dialog / overlay', section: 'General' },
  { keys: ['⌘', 'Enter'], description: 'Run verification', section: 'Actions' },
  { keys: ['⌘', 'B'], description: 'Run benchmark suite', section: 'Actions' },
  { keys: ['⌘', 'D'], description: 'Duplicate last claim', section: 'Actions' },
  { keys: ['↑', '↓'], description: 'Navigate history', section: 'Navigation' },
  { keys: ['←', '→'], description: 'Step through evidence', section: 'Navigation' },
  { keys: ['Space'], description: 'Play/pause replay', section: 'Replay' },
  { keys: ['R'], description: 'Reset replay', section: 'Replay' },
  { keys: ['1', '-', '9'], description: 'Jump to section 1-9', section: 'Navigation' },
  { keys: ['T'], description: 'Toggle dark mode', section: 'General' },
];

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export function KeyboardShortcutsOverlay() {
  const [visible, setVisible] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      setVisible((v) => !v);
    }
    if (e.key === 'Escape') {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Group by section
  const sections = SHORTCUTS.reduce<Record<string, typeof SHORTCUTS>>((acc, s) => {
    if (!acc[s.section]) acc[s.section] = [];
    acc[s.section].push(s);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setVisible(false)}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="glass-card glow-cyan max-w-lg w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-base font-semibold text-foreground">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={() => setVisible(false)}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Shortcuts grouped by section */}
              <div className="space-y-5">
                {Object.entries(sections).map(([section, shortcuts], sIdx) => (
                  <motion.div
                    key={section}
                    className="glass-card p-3 space-y-1.5"
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: sIdx * 0.08 }}
                  >
                    <p className="text-[10px] text-cyan-400 uppercase tracking-wider font-medium mb-2">{section}</p>
                    {shortcuts.map((shortcut) => (
                      <div key={shortcut.description} className="flex items-center justify-between py-1 px-1 rounded hover:bg-accent/50 transition-colors">
                        <span className="text-xs text-foreground">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, idx) => (
                            <span key={idx}>
                              <kbd className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded border border-border/50 glass-card text-[11px] text-foreground font-mono shadow-sm">
                                {key}
                              </kbd>
                              {idx < shortcut.keys.length - 1 && <span className="mx-0.5 text-muted-foreground text-[10px]">+</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ))}
              </div>

              {/* Footer hint */}
              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-center gap-2">
                <Command className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">
                  Press <kbd className="inline-flex h-4 px-1 rounded border border-border/50 glass-card text-[9px] text-foreground font-mono mx-0.5">?</kbd> to toggle · <kbd className="inline-flex h-4 px-1 rounded border border-border/50 glass-card text-[9px] text-foreground font-mono mx-0.5">Esc</kbd> to close
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}