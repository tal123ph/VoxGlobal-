import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Globe, Search, ChevronDown, Check, Languages, Sparkles, X } from 'lucide-react';
import { LANGUAGES } from '../data/voices';
import { LanguageOption } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelectLanguage: (language: string) => void;
  onTranslateAndInsert?: (targetLanguageName: string) => void;
  isTranslating?: boolean;
}

const POPULAR_LANGUAGES = [
  'English (US)',
  'Urdu',
  'Spanish (Spain)',
  'Arabic',
  'Hindi',
  'French',
  'German',
  'Japanese',
  'Chinese (Simplified)',
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onTranslateAndInsert,
  isTranslating,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Find active language object
  const currentLang = useMemo(() => {
    return (
      LANGUAGES.find((l) => l.name === selectedLanguage || l.code === selectedLanguage) ||
      LANGUAGES[0]
    );
  }, [selectedLanguage]);

  // Unique regions
  const regions = useMemo(() => {
    const set = new Set<string>();
    LANGUAGES.forEach((l) => set.add(l.region));
    return ['All', ...Array.from(set)];
  }, []);

  // Filtered list
  const filteredLanguages = useMemo(() => {
    return LANGUAGES.filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        l.region.toLowerCase().includes(q);
      const matchesRegion = selectedRegion === 'All' || l.region === selectedRegion;
      return matchesSearch && matchesRegion;
    });
  }, [searchQuery, selectedRegion]);

  return (
    <div id="language-selector-wrapper" ref={dropdownRef} className="relative space-y-3">
      {/* Top Header with non-overlapping responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60 font-bold">
          <Globe className="h-3.5 w-3.5 text-orange-400" />
          <span>Target Language & Dialect</span>
        </label>
        {onTranslateAndInsert && (
          <button
            type="button"
            id="translate-script-btn"
            onClick={() => onTranslateAndInsert(currentLang.name)}
            disabled={isTranslating}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 px-2.5 py-1 text-xs font-semibold text-orange-300 hover:text-white disabled:opacity-40 transition-all cursor-pointer shadow-xs"
            title="Translate and polish current script into this language"
          >
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span>{isTranslating ? 'Translating...' : `Translate to ${currentLang.nativeName}`}</span>
          </button>
        )}
      </div>

      {/* Main trigger button */}
      <button
        id="language-dropdown-trigger"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-left text-sm backdrop-blur-md shadow-sm hover:border-white/20 focus:border-orange-500/80 focus:outline-none transition-all cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl leading-none">{currentLang.flag}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{currentLang.name}</span>
              <span className="text-xs text-white/50 font-normal">({currentLang.nativeName})</span>
            </div>
            <div className="text-[11px] text-orange-300/80 font-mono">
              Region: {currentLang.region} • {currentLang.code}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/50">
            Click to change ({LANGUAGES.length} available)
          </span>
          <ChevronDown
            className={`h-4 w-4 text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180 text-orange-400' : ''}`}
          />
        </div>
      </button>

      {/* Quick Select Popular Language Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider shrink-0 pr-1">
          Quick Pick:
        </span>
        {POPULAR_LANGUAGES.map((langName) => {
          const langObj = LANGUAGES.find((l) => l.name === langName);
          if (!langObj) return null;
          const isCurrent = currentLang.name === langName;
          return (
            <button
              key={langName}
              type="button"
              id={`quick-lang-${langObj.code.toLowerCase()}`}
              onClick={() => onSelectLanguage(langName)}
              className={`flex items-center gap-1.5 shrink-0 rounded-xl px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300 font-bold shadow-xs'
                  : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{langObj.flag}</span>
              <span>{langObj.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          id="language-dropdown-menu"
          className="absolute z-50 left-0 right-0 top-full mt-2 rounded-3xl border border-white/20 bg-[#0e0e14] p-4 sm:p-5 shadow-2xl backdrop-blur-2xl transition-all"
        >
          {/* Search bar with clear button */}
          <div className="relative mb-3.5">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
            <input
              id="language-search-input"
              type="text"
              placeholder="Search 40+ languages (e.g. Spanish, 日本語, Arabic, French)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/50 pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-orange-500/80 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-0.5 text-white/40 hover:text-white"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Region filter pills */}
          <div className="flex flex-wrap gap-1.5 mb-3.5 pb-3 border-b border-white/10">
            {regions.map((region) => (
              <button
                key={region}
                type="button"
                id={`region-filter-${region.toLowerCase()}`}
                onClick={() => setSelectedRegion(region)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  selectedRegion === region
                    ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300 font-bold'
                    : 'bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {region}
              </button>
            ))}
          </div>

          {/* Languages List */}
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/20">
            {filteredLanguages.length === 0 ? (
              <div className="py-8 text-center text-xs text-white/40">
                No languages match &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = lang.name === currentLang.name;
                return (
                  <button
                    key={lang.code}
                    id={`lang-option-${lang.code.toLowerCase()}`}
                    type="button"
                    onClick={() => {
                      onSelectLanguage(lang.name);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-500/20 text-orange-300 font-bold border border-orange-500/40 shadow-xs'
                        : 'text-white/80 hover:bg-white/10 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl leading-none">{lang.flag}</span>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-medium">{lang.name}</span>
                          <span className="text-white/40 font-normal">({lang.nativeName})</span>
                        </div>
                        <div className="text-[10px] text-white/40 font-mono">
                          {lang.region} • {lang.code}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 text-orange-400 font-semibold text-[11px]">
                        <Check className="h-4 w-4" />
                        <span>Active</span>
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer note in dropdown */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40 font-mono">
            <span>Showing {filteredLanguages.length} of {LANGUAGES.length} languages</span>
            <span>Press Esc to close</span>
          </div>
        </div>
      )}
    </div>
  );
};

