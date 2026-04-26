'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'เลือก...',
  allowEmpty = false,
  emptyLabel = 'ทั้งหมด',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDocPointerDown);
    document.addEventListener('touchstart', onDocPointerDown);
    return () => {
      document.removeEventListener('mousedown', onDocPointerDown);
      document.removeEventListener('touchstart', onDocPointerDown);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((opt) => opt.toLowerCase().includes(q))
    : options;

  const select = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-dark-gray text-light border border-dark-gray focus:border-primary outline-none text-left text-sm"
      >
        <span className={`truncate ${value ? 'text-light' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Note: we intentionally do NOT render a hidden `<input required>` here.
          A `required` sr-only input blocks form submission silently when empty —
          the browser tries to focus the invalid control, fails because it's off
          screen, and the submit just… doesn't fire. Callers should validate
          the value in JS before submitting. */}

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-secondary border border-dark-gray rounded-lg shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-dark-gray">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="พิมพ์ค้นหา..."
                className="w-full pl-9 pr-3 py-2 bg-dark-gray rounded-md text-light placeholder-gray-400 outline-none border border-dark-gray focus:border-primary text-sm"
              />
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {allowEmpty && (
              <li>
                <button
                  type="button"
                  onClick={() => select('')}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-dark-gray ${
                    value === '' ? 'bg-dark-gray text-primary' : 'text-light'
                  }`}
                >
                  {emptyLabel}
                </button>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-gray-400 text-sm text-center">ไม่พบ &quot;{query}&quot;</li>
            ) : (
              filtered.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => select(opt)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-dark-gray ${
                      value === opt ? 'bg-dark-gray text-primary' : 'text-light'
                    }`}
                  >
                    {opt}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

    </div>
  );
}
