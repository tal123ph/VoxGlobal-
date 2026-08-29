import React from 'react';
import {
  Sparkles,
  Sun,
  Briefcase,
  BookOpen,
  Moon,
  Wind,
  Sliders,
  Smile,
  Radio,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { VOICE_STYLES } from '../data/voices';

interface StyleSelectorProps {
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyle,
  onSelectStyle,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Smile':
        return <Smile className="h-4 w-4 text-emerald-400" />;
      case 'Briefcase':
        return <Briefcase className="h-4 w-4 text-orange-400" />;
      case 'Radio':
        return <Radio className="h-4 w-4 text-sky-400" />;
      case 'BookOpen':
        return <BookOpen className="h-4 w-4 text-purple-400" />;
      case 'MessageSquare':
        return <MessageSquare className="h-4 w-4 text-teal-400" />;
      case 'Moon':
        return <Moon className="h-4 w-4 text-indigo-400" />;
      case 'Zap':
        return <Zap className="h-4 w-4 text-amber-400" />;
      case 'Wind':
        return <Wind className="h-4 w-4 text-cyan-400" />;
      default:
        return <Sparkles className="h-4 w-4 text-orange-400" />;
    }
  };

  return (
    <div id="style-selector-wrapper" className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50 font-bold">
          <Sliders className="h-3.5 w-3.5 text-orange-400" />
          <span>Speaking Style & Emotion Delivery</span>
        </label>
        <span className="text-[11px] text-white/40 font-mono">8 Expressive Modes</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5">
        {VOICE_STYLES.map((style) => {
          const isSelected = selectedStyle === style.id;
          return (
            <button
              key={style.id}
              id={`style-btn-${style.id.toLowerCase()}`}
              type="button"
              onClick={() => onSelectStyle(style.id)}
              className={`flex flex-col items-start rounded-2xl border p-3 text-left transition-all ${
                isSelected
                  ? 'border-white/30 bg-white/15 ring-1 ring-orange-500/50 shadow-md shadow-orange-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
              }`}
            >
              <div className="flex w-full items-center justify-between mb-2">
                {getIcon(style.icon)}
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500 animate-pulse" />
                )}
              </div>
              <span className="text-xs font-bold text-white line-clamp-1">
                {style.name}
              </span>
              <span className="text-[10px] text-white/50 line-clamp-1 mt-0.5">
                {style.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
