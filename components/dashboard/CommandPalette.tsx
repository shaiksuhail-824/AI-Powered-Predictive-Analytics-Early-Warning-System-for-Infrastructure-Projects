'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import { Search, X } from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { filters, setFilter } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4 backdrop-blur-sm bg-bg-base/80">
      <div className="w-full max-w-xl bg-panel border border-border-glass rounded-card shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center px-4 border-b border-border-glass">
          <Search className="w-5 h-5 text-secondary" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 h-14 bg-transparent border-0 px-4 text-primary placeholder:text-secondary focus:outline-none focus:ring-0 text-lg"
            placeholder="Search projects, sectors, states... (Esc to close)"
            value={filters.searchQuery}
            onChange={(e) => setFilter('searchQuery', e.target.value)}
          />
          <button onClick={() => setIsOpen(false)} className="text-secondary hover:text-primary p-2">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {filters.searchQuery && (
          <div className="px-4 py-3 text-sm text-secondary bg-panel/50">
            Filtering by: <span className="text-accent-cyan font-medium">{filters.searchQuery}</span>
          </div>
        )}
        
        {!filters.searchQuery && (
          <div className="px-4 py-8 text-center text-sm text-secondary">
            Type to search across Project IDs, States, Sectors, and Ministries.
          </div>
        )}
      </div>
    </div>
  );
};
