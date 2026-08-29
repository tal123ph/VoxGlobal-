import React from 'react';
import { Sparkles, ArrowUpRight, BookOpen } from 'lucide-react';
import { PRESET_TEMPLATES } from '../data/voices';
import { TextPreset } from '../types';

interface PresetLibraryProps {
  onSelectPreset: (preset: TextPreset) => void;
}

export const PresetLibrary: React.FC<PresetLibraryProps> = ({ onSelectPreset }) => {
  return (
    <div id="preset-library-container" className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50 font-bold">
          <BookOpen className="h-3.5 w-3.5 text-orange-400" />
          <span>Multi-Lingual Presets & Templates</span>
        </label>
        <span className="text-[11px] text-white/40">Click any card to load template</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PRESET_TEMPLATES.map((preset) => (
          <button
            key={preset.id}
            id={`preset-card-${preset.id}`}
            type="button"
            onClick={() => onSelectPreset(preset)}
            className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-black/30 p-4 text-left hover:border-white/20 hover:bg-white/[0.08] transition-all shadow-sm cursor-pointer"
          >
            <div>
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-md">
                  {preset.category}
                </span>
                <ArrowUpRight className="h-4 w-4 text-white/40 group-hover:text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-orange-200">
                {preset.title}
              </h4>
              <p className="text-[11px] text-white/50 line-clamp-2 mt-1.5 leading-relaxed">
                {preset.text}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-white/40 font-mono">
              <span className="text-white/60">{preset.language}</span>
              <span className="text-orange-400/90 font-sans font-semibold">Voice: {preset.recommendedVoice}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
