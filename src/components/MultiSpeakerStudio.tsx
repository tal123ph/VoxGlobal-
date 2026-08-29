import React from 'react';
import { Users, Plus, Trash2, Mic } from 'lucide-react';
import { VOICES } from '../data/voices';
import { DialogueSpeaker } from '../types';

interface MultiSpeakerStudioProps {
  speakers: DialogueSpeaker[];
  onChangeSpeakers: (speakers: DialogueSpeaker[]) => void;
  dialogueText: string;
  onChangeDialogueText: (text: string) => void;
}

export const MultiSpeakerStudio: React.FC<MultiSpeakerStudioProps> = ({
  speakers,
  onChangeSpeakers,
  dialogueText,
  onChangeDialogueText,
}) => {
  const updateSpeaker = (index: number, key: 'name' | 'voice', value: string) => {
    const updated = [...speakers];
    updated[index] = { ...updated[index], [key]: value };
    onChangeSpeakers(updated);
  };

  const insertSpeakerTag = (speakerName: string) => {
    const prefix = dialogueText.endsWith('\n') || dialogueText === '' ? '' : '\n';
    onChangeDialogueText(`${dialogueText}${prefix}${speakerName}: `);
  };

  return (
    <div id="multi-speaker-studio" className="space-y-3.5 rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-orange-400" />
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/70">
            Multi-Speaker Cast
          </span>
        </div>
        <span className="text-[11px] text-orange-400/80 font-mono">2-Speaker Dynamic Audio</span>
      </div>

      {/* Speaker Configuration Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {speakers.map((speaker, idx) => (
          <div
            key={speaker.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 shadow-sm hover:border-white/20 transition-all"
          >
            <div className="flex items-center gap-3 w-full">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm text-white shadow-sm ${
                  idx === 0
                    ? 'bg-gradient-to-br from-orange-500 to-amber-600'
                    : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                }`}
              >
                {idx + 1}
              </div>
              <div className="flex-1 space-y-1">
                <input
                  type="text"
                  value={speaker.name}
                  onChange={(e) => updateSpeaker(idx, 'name', e.target.value)}
                  placeholder={`Speaker ${idx + 1} Name`}
                  className="w-full text-xs font-bold text-white bg-transparent border-b border-white/20 pb-0.5 focus:border-orange-500 focus:outline-none"
                />
                <div className="flex items-center gap-1.5">
                  <Mic className="h-3 w-3 text-white/40" />
                  <select
                    value={speaker.voice}
                    onChange={(e) => updateSpeaker(idx, 'voice', e.target.value)}
                    className="w-full text-[11px] text-white/70 bg-transparent focus:outline-none cursor-pointer"
                  >
                    {VOICES.map((v) => (
                      <option key={v.id} value={v.id} className="bg-[#121218] text-white">
                        {v.name} ({v.gender} • {v.tagline.split(',')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => insertSpeakerTag(speaker.name)}
                className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80 hover:bg-white/20 hover:text-white transition-colors whitespace-nowrap"
                title={`Insert '${speaker.name}: ' into script`}
              >
                + Add Line
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-white/40 italic">
        Format your script with speaker tags (e.g. &ldquo;{speakers[0]?.name || 'Alex'}: Hello!&rdquo; and &ldquo;{speakers[1]?.name || 'Sarah'}: Hi there!&rdquo;)
      </p>
    </div>
  );
};
