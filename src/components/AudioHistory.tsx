import React, { useState } from 'react';
import {
  History,
  Play,
  Download,
  Trash2,
  Bookmark,
  Sparkles,
  Clock,
  Volume2,
  Cloud,
  Share2,
  Video,
  Youtube,
} from 'lucide-react';
import { AudioGenerationItem } from '../types';

interface AudioHistoryProps {
  history: AudioGenerationItem[];
  isCloudSynced?: boolean;
  onPlayItem: (item: AudioGenerationItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onClearAll: () => void;
  onShareItem?: (item: AudioGenerationItem) => void;
  onCreateVideo?: (item: AudioGenerationItem) => void;
  onUploadYouTube?: (item: AudioGenerationItem) => void;
}

export const AudioHistory: React.FC<AudioHistoryProps> = ({
  history,
  isCloudSynced,
  onPlayItem,
  onDeleteItem,
  onToggleFavorite,
  onClearAll,
  onShareItem,
  onCreateVideo,
  onUploadYouTube,
}) => {
  const [filter, setFilter] = useState<'All' | 'Favorites'>('All');

  const filteredItems = history.filter((item) => {
    if (filter === 'Favorites') return !!item.isFavorite;
    return true;
  });

  const formatDuration = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownload = (item: AudioGenerationItem) => {
    const link = document.createElement('a');
    link.href = `data:${item.mimeType || 'audio/wav'};base64,${item.audioBase64}`;
    const safeName =
      item.text.slice(0, 20).trim().replace(/[^a-zA-Z0-9]/g, '_') || 'vox_speech';
    link.download = `${safeName}_${item.voice}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="audio-history-section"
      className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-6 shadow-2xl space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-orange-400" />
          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white/70">
            Audio Studio Library
          </h3>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-orange-300 font-mono">
            {history.length}
          </span>
          {isCloudSynced && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              <Cloud className="h-2.5 w-2.5" />
              <span>Firestore Persisted</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Favorites toggle */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setFilter('All')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filter === 'All'
                  ? 'bg-white/15 text-white font-bold shadow-xs'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('Favorites')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filter === 'Favorites'
                  ? 'bg-white/15 text-amber-300 font-bold shadow-xs'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              ★ Starred
            </button>
          </div>

          {history.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-white/40 hover:text-rose-400 transition-colors px-2 py-1 cursor-pointer"
              title="Clear all recordings"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-8 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-2xl">
          {filter === 'Favorites'
            ? 'No starred recordings yet. Click the bookmark icon on any track to save it as a favorite.'
            : 'No audio generations yet. Your synthesized audio files will be persisted in Firestore automatically.'}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              id={`history-item-${item.id}`}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-3.5 hover:border-white/20 hover:bg-white/[0.08] transition-all shadow-sm"
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  id={`play-history-btn-${item.id}`}
                  onClick={() => onPlayItem(item)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 transition-transform active:scale-95 cursor-pointer"
                  title="Play in studio player"
                >
                  <Play className="h-4 w-4 ml-0.5 fill-white" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white/90 line-clamp-1">
                    {item.text}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-white/50 mt-1 font-mono">
                    <span className="font-bold text-orange-300">{item.voice}</span>
                    <span>•</span>
                    {item.gender && (
                      <span className="text-rose-300/90">{item.gender}</span>
                    )}
                    {item.ageRange && (
                      <>
                        <span>•</span>
                        <span className="text-amber-300/90">{item.ageRange}</span>
                      </>
                    )}
                    {item.style && (
                      <>
                        <span>•</span>
                        <span className="text-purple-300/90">{item.style}</span>
                      </>
                    )}
                    <span>•</span>
                    <span className="text-white/60">{item.language}</span>
                    <span>•</span>
                    <span>{formatDuration(item.duration)}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-1 shrink-0 self-end sm:self-auto">
                {onUploadYouTube && (
                  <button
                    type="button"
                    id={`youtube-history-btn-${item.id}`}
                    onClick={() => onUploadYouTube(item)}
                    title="Direct Upload to YouTube Channel"
                    className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer"
                  >
                    <Youtube className="h-4 w-4 fill-current" />
                  </button>
                )}

                {onCreateVideo && (
                  <button
                    type="button"
                    id={`video-history-btn-${item.id}`}
                    onClick={() => onCreateVideo(item)}
                    title="Create Video & Thumbnail in Video Studio"
                    className="p-2 rounded-xl text-purple-300/80 hover:text-purple-300 hover:bg-purple-500/20 transition-colors cursor-pointer"
                  >
                    <Video className="h-4 w-4" />
                  </button>
                )}

                {onShareItem && (
                  <button
                    type="button"
                    id={`share-history-btn-${item.id}`}
                    onClick={() => onShareItem(item)}
                    title="Share audio & public link"
                    className="p-2 rounded-xl text-white/40 hover:text-orange-400 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  id={`star-btn-${item.id}`}
                  onClick={() => onToggleFavorite(item.id)}
                  title={item.isFavorite ? 'Remove star' : 'Star recording'}
                  className={`p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer ${
                    item.isFavorite ? 'text-amber-400' : 'text-white/40 hover:text-white'
                  }`}
                >
                  <Bookmark
                    className="h-4 w-4"
                    fill={item.isFavorite ? 'currentColor' : 'none'}
                  />
                </button>

                <button
                  type="button"
                  id={`download-history-btn-${item.id}`}
                  onClick={() => handleDownload(item)}
                  title="Download WAV"
                  className="p-2 rounded-xl text-white/40 hover:text-orange-400 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  id={`delete-history-btn-${item.id}`}
                  onClick={() => onDeleteItem(item.id)}
                  title="Delete from library"
                  className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
