import React, { useState } from 'react';
import { Volume2, Sparkles, Check, User, Mic, UserCheck, Baby, Users } from 'lucide-react';
import { VOICES } from '../data/voices';
import { VoiceProfile, VoiceGender, VoiceAgeRange } from '../types';

interface VoiceSelectorProps {
  selectedVoice: string;
  selectedGender: VoiceGender;
  selectedAgeRange: VoiceAgeRange;
  onSelectVoice: (voiceId: string) => void;
  onSelectGender?: (gender: VoiceGender) => void;
  onSelectAgeRange?: (age: VoiceAgeRange) => void;
  onAuditionSample?: (voice: VoiceProfile) => void;
  isGenerating?: boolean;
}

const VOICE_GRADIENTS: Record<string, string> = {
  Kore: 'from-indigo-500 to-purple-600',
  Puck: 'from-amber-500 to-orange-500',
  Zephyr: 'from-rose-500 to-orange-500',
  Charon: 'from-blue-600 to-indigo-800',
  Fenrir: 'from-sky-500 to-blue-600',
  Aoede: 'from-fuchsia-500 to-pink-600',
  Maya: 'from-pink-500 to-rose-400',
  Eleanor: 'from-amber-600 to-emerald-700',
};

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  selectedGender,
  selectedAgeRange,
  onSelectVoice,
  onSelectGender,
  onSelectAgeRange,
  onAuditionSample,
  isGenerating,
}) => {
  const [filterGender, setFilterGender] = useState<'All' | VoiceGender>('All');
  const [filterAge, setFilterAge] = useState<'All' | VoiceAgeRange>('All');

  const filteredVoices = VOICES.filter((v) => {
    if (filterGender !== 'All' && v.gender !== filterGender) return false;
    if (filterAge !== 'All' && v.ageRange !== filterAge) return false;
    return true;
  });

  return (
    <div id="voice-selector-container" className="space-y-4">
      {/* Header with dual filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50 font-bold">
          <Mic className="h-3.5 w-3.5 text-orange-400" />
          <span>AI Voice Personas</span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {/* Gender Filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl text-xs">
            <span className="text-[10px] text-white/40 px-1 font-medium">Gender:</span>
            {(['All', 'Female', 'Male'] as const).map((gender) => (
              <button
                key={gender}
                id={`filter-gender-${gender.toLowerCase()}`}
                onClick={() => {
                  setFilterGender(gender);
                  if (gender !== 'All' && onSelectGender) onSelectGender(gender);
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterGender === gender
                    ? 'bg-white/15 text-white shadow-sm font-semibold'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>

          {/* Age Filter */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl text-xs">
            <span className="text-[10px] text-white/40 px-1 font-medium">Age:</span>
            {(['All', 'Child', 'Adult', 'Senior'] as const).map((age) => (
              <button
                key={age}
                id={`filter-age-${age.toLowerCase()}`}
                onClick={() => {
                  setFilterAge(age);
                  if (age !== 'All' && onSelectAgeRange) onSelectAgeRange(age);
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterAge === age
                    ? 'bg-white/15 text-orange-300 shadow-sm font-semibold'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Voice Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const gradient = VOICE_GRADIENTS[voice.id] || 'from-indigo-500 to-purple-500';

          return (
            <div
              key={voice.id}
              id={`voice-card-${voice.id.toLowerCase()}`}
              onClick={() => {
                onSelectVoice(voice.id);
                if (onSelectGender) onSelectGender(voice.gender);
                if (onSelectAgeRange) onSelectAgeRange(voice.ageRange);
              }}
              className={`group relative flex flex-col justify-between rounded-2xl border p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-white/30 bg-white/10 ring-1 ring-orange-500/50 shadow-lg shadow-orange-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
              }`}
            >
              {/* Top Row: Avatar, Name, Gender, Age Badges */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white font-bold text-sm shadow-sm`}
                  >
                    {voice.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-white">{voice.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.2 text-[10px] font-medium border ${
                          voice.gender === 'Female'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                        }`}
                      >
                        {voice.gender}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.2 text-[10px] font-medium border ${
                          voice.ageRange === 'Child'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            : voice.ageRange === 'Senior'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        }`}
                      >
                        {voice.ageRange}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 line-clamp-1 mt-0.5">{voice.tagline}</p>
                  </div>
                </div>

                {isSelected ? (
                  <div className="flex h-3 w-3 items-center justify-center mt-1">
                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-sm shadow-orange-500/80 animate-pulse" />
                  </div>
                ) : (
                  <div className="h-3 w-3 rounded-full border border-white/20 mt-1 group-hover:border-white/40" />
                )}
              </div>

              {/* Best For Tags */}
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {voice.bestFor.slice(0, 2).map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-block rounded-lg bg-black/30 border border-white/5 px-2 py-0.5 text-[10px] font-medium text-white/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Audition Button */}
              {onAuditionSample && (
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-mono">24kHz Audio</span>
                  <button
                    type="button"
                    id={`try-voice-btn-${voice.id.toLowerCase()}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAuditionSample(voice);
                    }}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:text-orange-300 disabled:opacity-40 transition-colors"
                  >
                    <Volume2 className="h-3 w-3" />
                    <span>Audition</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
