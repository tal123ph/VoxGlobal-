import React from 'react';
import {
  Sparkles,
  Sliders,
  User,
  Baby,
  Users,
  Award,
  Gauge,
  Music,
  Check,
  RotateCcw,
} from 'lucide-react';
import { VoiceGender, VoiceAgeRange } from '../types';

interface VoiceCustomizerProps {
  gender: VoiceGender;
  ageRange: VoiceAgeRange;
  style: string;
  speed: number;
  pitch: number;
  onChangeGender: (gender: VoiceGender) => void;
  onChangeAgeRange: (age: VoiceAgeRange) => void;
  onChangeStyle: (style: string) => void;
  onChangeSpeed: (speed: number) => void;
  onChangePitch: (pitch: number) => void;
  onResetToDefaults: () => void;
}

export const VoiceCustomizer: React.FC<VoiceCustomizerProps> = ({
  gender,
  ageRange,
  style,
  speed,
  pitch,
  onChangeGender,
  onChangeAgeRange,
  onChangeStyle,
  onChangeSpeed,
  onChangePitch,
  onResetToDefaults,
}) => {
  // Speed helper label
  const getSpeedLabel = (s: number) => {
    if (s <= 0.8) return 'Slow (Deliberate)';
    if (s >= 1.4) return 'Fast (Brisk)';
    if (s > 1.05) return 'Medium-Fast';
    if (s < 0.95) return 'Gentle Pacing';
    return 'Normal (Natural)';
  };

  // Pitch helper label
  const getPitchLabel = (p: number) => {
    if (p <= -3) return 'Deep / Low Resonance';
    if (p >= 3) return 'High / Bright Resonance';
    if (p > 0) return 'Slightly Higher';
    if (p < 0) return 'Slightly Lower';
    return 'Medium / Natural Balance';
  };

  return (
    <div
      id="voice-customizer-panel"
      className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6 shadow-2xl space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Voice Customization & Acoustics
            </h3>
            <p className="text-[11px] text-white/50">
              Customize natural gender, age inflection, vocal tone, speed, and pitch
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetToDefaults}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          title="Reset customization to studio defaults"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Grid for Gender & Age Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Gender Selection */}
        <div className="space-y-2.5">
          <label className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/60 font-bold">
            <User className="h-3.5 w-3.5 text-orange-400" />
            <span>Voice Gender</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {(['Female', 'Male'] as const).map((g) => {
              const isSelected = gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  id={`customizer-gender-${g.toLowerCase()}`}
                  onClick={() => onChangeGender(g)}
                  className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-white/30 bg-white/15 ring-1 ring-orange-500/50 shadow-md shadow-orange-500/10'
                      : 'border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${
                        g === 'Female'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}
                    >
                      {g.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{g}</div>
                      <div className="text-[10px] text-white/50 font-sans">
                        {g === 'Female' ? 'Soprano & Alto' : 'Tenor & Baritone'}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Age Range Selection */}
        <div className="space-y-2.5">
          <label className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/60 font-bold">
            <Users className="h-3.5 w-3.5 text-orange-400" />
            <span>Age Range</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'Child', label: 'Child', desc: 'Youthful (5-14)' },
                { id: 'Adult', label: 'Adult', desc: 'Mature (18-50)' },
                { id: 'Senior', label: 'Senior', desc: 'Elder (55+)' },
              ] as const
            ).map((item) => {
              const isSelected = ageRange === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  id={`customizer-age-${item.id.toLowerCase()}`}
                  onClick={() => onChangeAgeRange(item.id)}
                  className={`flex flex-col items-start justify-between rounded-2xl border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-white/30 bg-white/15 ring-1 ring-orange-500/50 shadow-md shadow-orange-500/10'
                      : 'border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex w-full items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{item.label}</span>
                    {isSelected && (
                      <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500" />
                    )}
                  </div>
                  <span className="text-[10px] text-white/50">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Speed & Pitch Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-white/10">
        {/* Speech Speed Control */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/60 font-bold">
              <Gauge className="h-3.5 w-3.5 text-orange-400" />
              <span>Speech Speed</span>
            </label>
            <span className="text-xs font-mono font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-lg">
              {speed.toFixed(2)}x • {getSpeedLabel(speed)}
            </span>
          </div>

          <input
            id="speech-speed-slider"
            type="range"
            min={0.5}
            max={2.0}
            step={0.05}
            value={speed}
            onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-orange-500 focus:outline-none"
          />

          {/* Quick Speed Presets */}
          <div className="flex items-center justify-between gap-1.5 pt-1">
            {[
              { val: 0.75, label: '0.75x' },
              { val: 1.0, label: '1.0x (Normal)' },
              { val: 1.25, label: '1.25x' },
              { val: 1.5, label: '1.5x' },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => onChangeSpeed(p.val)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-mono transition-all ${
                  Math.abs(speed - p.val) < 0.04
                    ? 'bg-white/20 text-orange-300 font-bold border border-white/15 shadow-xs'
                    : 'text-white/50 hover:text-white bg-white/5 hover:bg-white/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pitch Control */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-white/60 font-bold">
              <Music className="h-3.5 w-3.5 text-purple-400" />
              <span>Voice Pitch / Tonality</span>
            </label>
            <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg">
              {pitch > 0 ? `+${pitch}` : pitch} semitones • {getPitchLabel(pitch)}
            </span>
          </div>

          <input
            id="voice-pitch-slider"
            type="range"
            min={-6}
            max={6}
            step={1}
            value={pitch}
            onChange={(e) => onChangePitch(parseInt(e.target.value, 10))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-purple-500 focus:outline-none"
          />

          {/* Quick Pitch Presets */}
          <div className="flex items-center justify-between gap-1.5 pt-1">
            {[
              { val: -4, label: 'Low (-4st)' },
              { val: 0, label: 'Medium (0st)' },
              { val: 4, label: 'High (+4st)' },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => onChangePitch(p.val)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-mono transition-all ${
                  pitch === p.val
                    ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 shadow-xs'
                    : 'text-white/50 hover:text-white bg-white/5 hover:bg-white/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
