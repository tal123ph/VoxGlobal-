import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Copy,
  Check,
  Repeat,
  Sparkles,
  Gauge,
  Music,
  Sliders,
  Share2,
  Video,
  Youtube,
} from 'lucide-react';
import { AudioGenerationItem } from '../types';

interface AudioPlayerProps {
  currentAudio: AudioGenerationItem | null;
  onSelectVoice?: (voice: string) => void;
  onShare?: (item: AudioGenerationItem) => void;
  onCreateVideo?: (item: AudioGenerationItem) => void;
  onUploadYouTube?: (item: AudioGenerationItem) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ currentAudio, onShare, onCreateVideo, onUploadYouTube }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Web Audio Context for fine acoustic preservation
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(currentAudio?.speed || 1.0);
  const [playbackPitch, setPlaybackPitch] = useState<number>(currentAudio?.pitch || 0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [preservePitchMode, setPreservePitchMode] = useState<boolean>(true);

  // Audio source URL from base64
  const audioSrc = currentAudio
    ? `data:${currentAudio.mimeType || 'audio/wav'};base64,${currentAudio.audioBase64}`
    : '';

  // Setup audio element when item changes
  useEffect(() => {
    if (!audioSrc) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = audioSrc;
      audioRef.current.load();
      audioRef.current.playbackRate = currentAudio?.speed || 1.0;
      setPlaybackSpeed(currentAudio?.speed || 1.0);
      setPlaybackPitch(currentAudio?.pitch || 0);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [audioSrc, currentAudio]);

  // Connect Web Audio API filter for natural acoustic shaping
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const source = ctx.createMediaElementSource(audio);
          const filter = ctx.createBiquadFilter();
          filter.type = 'peaking';
          filter.frequency.value = 1000;
          filter.Q.value = 1.0;
          filter.gain.value = 0;

          source.connect(filter);
          filter.connect(ctx.destination);

          audioCtxRef.current = ctx;
          sourceNodeRef.current = source;
          filterNodeRef.current = filter;
        }
      }
    } catch (e) {
      // Audio source already connected or unsupported, safe fallback
    }
  }, []);

  // Update pitch filter when pitch slider changes
  useEffect(() => {
    if (filterNodeRef.current) {
      // High pitch -> boost high presence gently; Low pitch -> warm low resonance
      if (playbackPitch > 0) {
        filterNodeRef.current.frequency.value = 2800;
        filterNodeRef.current.gain.value = playbackPitch * 1.2;
      } else if (playbackPitch < 0) {
        filterNodeRef.current.frequency.value = 240;
        filterNodeRef.current.gain.value = Math.abs(playbackPitch) * 1.5;
      } else {
        filterNodeRef.current.gain.value = 0;
      }
    }
  }, [playbackPitch]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current || !audioSrc) return;

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Audio playback error:', err));
    }
  };

  // Time updates
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || currentAudio?.duration || 0);
    }
  };

  const handleEnded = () => {
    if (!isLooping) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Speed change with natural pitch preservation
  const handleSpeedChange = (rate: number) => {
    setPlaybackSpeed(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      if ('preservesPitch' in audioRef.current) {
        (audioRef.current as any).preservesPitch = preservePitchMode;
      }
    }
  };

  // Pitch adjustment
  const handlePitchChange = (pitchVal: number) => {
    setPlaybackPitch(pitchVal);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      audioRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const toggleLoop = () => {
    const next = !isLooping;
    setIsLooping(next);
    if (audioRef.current) {
      audioRef.current.loop = next;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const handleDownload = () => {
    if (!currentAudio) return;
    const link = document.createElement('a');
    link.href = `data:${currentAudio.mimeType || 'audio/wav'};base64,${currentAudio.audioBase64}`;
    const safeName =
      currentAudio.text.slice(0, 24).trim().replace(/[^a-zA-Z0-9]/g, '_') || 'vox_speech';
    link.download = `${safeName}_${currentAudio.voice}_${currentAudio.language}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyText = () => {
    if (!currentAudio) return;
    navigator.clipboard.writeText(currentAudio.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Waveform visualization canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let barOffsets = Array.from({ length: 64 }, (_, i) => Math.sin(i * 0.3) * 0.5 + 0.5);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const numBars = 52;
      const gap = 3;
      const barWidth = (width - gap * (numBars - 1)) / numBars;
      const progress = duration > 0 ? currentTime / duration : 0;

      for (let i = 0; i < numBars; i++) {
        const barProgress = i / numBars;
        const isPast = barProgress <= progress;

        // Dynamic height modulation when playing
        let barHeightRatio = barOffsets[i % barOffsets.length];
        if (isPlaying) {
          const timeMod = Date.now() * 0.005 * playbackSpeed;
          barHeightRatio =
            0.2 +
            0.7 *
              Math.abs(
                Math.sin(timeMod + i * 0.4) * Math.cos(timeMod * 0.7 + i * 0.2)
              );
        }

        const barHeight = Math.max(6, barHeightRatio * (height * 0.78));
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        ctx.beginPath();
        const radius = Math.min(barWidth / 2, 2);
        ctx.roundRect(x, y, barWidth, barHeight, radius);

        if (isPast) {
          const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          grad.addColorStop(0, '#f97316');
          grad.addColorStop(1, '#ea580c');
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        }
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, playbackSpeed]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!currentAudio) {
    return (
      <div
        id="audio-player-empty"
        className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl shadow-2xl space-y-3"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 mb-2">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white">Studio Audio Engine Ready</h3>
        <p className="text-xs sm:text-sm text-white/50 max-w-sm mx-auto leading-relaxed">
          Type or select a script prompt, customize voice gender, age range, and speaking style, and click &ldquo;Synthesize Audio&rdquo; to generate natural lifelike speech.
        </p>
      </div>
    );
  }

  return (
    <div
      id="audio-player-active"
      className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-7 shadow-2xl space-y-5 transition-all"
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
      />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-purple-600 text-white font-bold shadow-md shadow-orange-500/20">
            {currentAudio.voice.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm sm:text-base">
                {currentAudio.voice}
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-orange-300">
                {currentAudio.language}
              </span>
              {currentAudio.gender && (
                <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                  {currentAudio.gender}
                </span>
              )}
              {currentAudio.ageRange && (
                <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  {currentAudio.ageRange}
                </span>
              )}
              {currentAudio.style && (
                <span className="inline-flex items-center rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                  {currentAudio.style}
                </span>
              )}
            </div>
            <p className="text-xs text-white/50 mt-0.5 font-mono">
              24kHz WAV • {currentAudio.wordCount} words • {formatTime(duration || currentAudio.duration)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {onUploadYouTube && (
            <button
              id="player-upload-youtube-btn"
              onClick={() => onUploadYouTube(currentAudio)}
              title="Directly upload audiogram video or Shorts to YouTube Channel"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 transition-all active:scale-95 cursor-pointer transform hover:scale-[1.02]"
            >
              <Youtube className="h-3.5 w-3.5 fill-current" />
              <span>Upload to YouTube</span>
            </button>
          )}

          {onCreateVideo && (
            <button
              id="player-make-video-btn"
              onClick={() => onCreateVideo(currentAudio)}
              title="Create Video & Thumbnail from this audio"
              className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/15 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500/25 hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Video className="h-3.5 w-3.5 text-purple-400" />
              <span>Make Video</span>
            </button>
          )}

          {onShare && (
            <button
              id="player-share-audio-btn"
              onClick={() => onShare(currentAudio)}
              title="Share audio snippet & public link"
              className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-300 hover:bg-orange-500/20 hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <Share2 className="h-3.5 w-3.5 text-orange-400" />
              <span>Share</span>
            </button>
          )}

          <button
            id="copy-text-btn"
            onClick={handleCopyText}
            title="Copy script text"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-white/60" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            id="download-audio-btn"
            onClick={handleDownload}
            title="Download WAV Audio file"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-3.5 py-1.5 text-xs font-bold text-white hover:brightness-110 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download WAV</span>
          </button>
        </div>
      </div>

      {/* Waveform Canvas */}
      <div className="relative h-20 w-full overflow-hidden rounded-2xl bg-black/40 border border-white/10 p-2">
        <canvas
          ref={canvasRef}
          width={600}
          height={72}
          className="h-full w-full object-contain cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            const targetTime = percentage * (duration || 1);
            if (audioRef.current) {
              audioRef.current.currentTime = targetTime;
              setCurrentTime(targetTime);
            }
          }}
        />
      </div>

      {/* Scrub bar & Time Indicators */}
      <div>
        <input
          id="audio-scrub-bar"
          type="range"
          min={0}
          max={duration || 1}
          step={0.01}
          value={currentTime}
          onChange={handleSeek}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-orange-500 focus:outline-none"
        />
        <div className="flex justify-between text-xs font-mono text-white/50 mt-1.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || currentAudio.duration)}</span>
        </div>
      </div>

      {/* Primary Playback Transport Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Play / Restart / Loop */}
        <div className="flex items-center gap-3">
          <button
            id="audio-restart-btn"
            onClick={handleRestart}
            title="Restart playback"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            id="audio-toggle-play-btn"
            onClick={togglePlay}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-orange-600 to-orange-500 text-white hover:scale-105 shadow-lg shadow-orange-600/30 transition-all active:scale-95"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5 fill-white" />}
          </button>

          <button
            id="audio-loop-btn"
            onClick={toggleLoop}
            title="Toggle Loop"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
              isLooping
                ? 'border-orange-500/50 bg-orange-500/20 text-orange-300'
                : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Repeat className="h-4 w-4" />
          </button>
        </div>

        {/* Volume & Mute */}
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-2 rounded-xl">
          <button
            id="audio-mute-btn"
            onClick={toggleMute}
            className="text-white/60 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4 text-white/40" />
            ) : (
              <Volume2 className="h-4 w-4 text-white/70" />
            )}
          </button>
          <input
            id="audio-volume-slider"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1.5 w-16 md:w-24 cursor-pointer appearance-none rounded-lg bg-white/10 accent-orange-500"
          />
        </div>
      </div>

      {/* Advanced Playback Speed & Pitch Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-white/10">
        {/* Playback Speech Speed Controls */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-white/70 uppercase tracking-wider">
              <Gauge className="h-3.5 w-3.5 text-orange-400" />
              <span>Playback Speed</span>
            </label>
            <span className="text-xs font-mono font-bold text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-lg">
              {playbackSpeed.toFixed(2)}x
            </span>
          </div>

          <input
            id="playback-speed-slider"
            type="range"
            min={0.5}
            max={2.5}
            step={0.05}
            value={playbackSpeed}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-orange-500"
          />

          {/* Predefined Speed Options */}
          <div className="flex items-center justify-between gap-1 pt-0.5">
            {[
              { val: 0.75, label: 'Slow (0.75x)' },
              { val: 1.0, label: 'Normal (1.0x)' },
              { val: 1.25, label: 'Fast (1.25x)' },
              { val: 1.5, label: '1.5x' },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                id={`playback-speed-preset-${p.val}`}
                onClick={() => handleSpeedChange(p.val)}
                className={`rounded-lg px-2 py-1 text-[11px] font-mono transition-all ${
                  Math.abs(playbackSpeed - p.val) < 0.04
                    ? 'bg-white/20 text-orange-300 font-bold border border-white/15 shadow-xs'
                    : 'text-white/50 hover:text-white bg-white/5 hover:bg-white/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Playback Voice Pitch Controls */}
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-white/70 uppercase tracking-wider">
              <Music className="h-3.5 w-3.5 text-purple-400" />
              <span>Voice Pitch Tonality</span>
            </label>
            <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg">
              {playbackPitch > 0 ? `+${playbackPitch}` : playbackPitch} semitones
            </span>
          </div>

          <input
            id="playback-pitch-slider"
            type="range"
            min={-6}
            max={6}
            step={1}
            value={playbackPitch}
            onChange={(e) => handlePitchChange(parseInt(e.target.value, 10))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-purple-500"
          />

          {/* Predefined Pitch Options */}
          <div className="flex items-center justify-between gap-1 pt-0.5">
            {[
              { val: -4, label: 'Low Pitch (-4st)' },
              { val: 0, label: 'Medium (Natural)' },
              { val: 4, label: 'High Pitch (+4st)' },
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                id={`playback-pitch-preset-${p.val}`}
                onClick={() => handlePitchChange(p.val)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-mono transition-all ${
                  playbackPitch === p.val
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

      {/* Script Preview Box */}
      <div className="rounded-2xl bg-black/40 border border-white/10 p-4">
        <span className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
          Synthesized Transcript
        </span>
        <p className="mt-1 text-xs sm:text-sm text-white/80 leading-relaxed max-h-24 overflow-y-auto font-sans">
          {currentAudio.text}
        </p>
      </div>
    </div>
  );
};
