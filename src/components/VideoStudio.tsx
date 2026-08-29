import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Tv,
  Image as ImageIcon,
  Video,
  Download,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Layers,
  Palette,
  Type,
  Activity,
  Maximize2,
  Radio,
  Check,
  Upload,
  RefreshCw,
  Film,
  Music,
  Share2,
  Sliders,
  ChevronRight,
  Monitor,
  Smartphone,
  Square,
  Zap,
  Wand2,
  ImagePlus,
  Bot,
  AlertCircle,
  Youtube,
  History,
  Save,
  FolderHeart,
  FolderKanban,
} from 'lucide-react';
import { AudioGenerationItem, VideoAspectRatio, WaveformVisualMode, VideoProjectConfig, UserProject } from '../types';
import { YouTubeUploadModal } from './YouTubeUploadModal';
import { HistoricalThumbnailGenerator } from './HistoricalThumbnailGenerator';

interface VideoStudioProps {
  currentAudioItem: AudioGenerationItem | null;
  audioHistory: AudioGenerationItem[];
  onSelectHistoryAudio: (item: AudioGenerationItem) => void;
  onNavigateToVoiceStudio: () => void;
  onNavigateToProjects?: () => void;
  onSaveProject?: (project: UserProject) => Promise<void> | void;
  initialStep?: 'setup' | 'thumbnail' | 'audiogram' | 'export';
  initialVideoConfig?: VideoProjectConfig;
  autoOpenYouTube?: boolean;
}

// Preset visual themes with high contrast gradients and styling
const THEME_PRESETS = [
  {
    id: 'cyber_neon',
    name: 'Cyber Neon',
    gradient: ['#0f0c1b', '#1a0b2e', '#09152b'],
    accentColor: '#38bdf8',
    secondaryColor: '#ec4899',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
    badgeBorder: 'rgba(56, 189, 248, 0.4)',
    badgeText: '#7dd3fc',
    previewClass: 'from-[#0f0c1b] via-[#1a0b2e] to-[#09152b]',
  },
  {
    id: 'sunset_amber',
    name: 'Sunset Amber',
    gradient: ['#1c0c04', '#2e1208', '#451a03'],
    accentColor: '#f97316',
    secondaryColor: '#fbbf24',
    badgeBg: 'rgba(249, 115, 22, 0.2)',
    badgeBorder: 'rgba(249, 115, 22, 0.4)',
    badgeText: '#fdba74',
    previewClass: 'from-[#1c0c04] via-[#2e1208] to-[#451a03]',
  },
  {
    id: 'cosmic_nebula',
    name: 'Cosmic Nebula',
    gradient: ['#090514', '#1f0d3d', '#3b0764'],
    accentColor: '#c084fc',
    secondaryColor: '#f43f5e',
    badgeBg: 'rgba(192, 132, 252, 0.2)',
    badgeBorder: 'rgba(192, 132, 252, 0.4)',
    badgeText: '#e9d5ff',
    previewClass: 'from-[#090514] via-[#1f0d3d] to-[#3b0764]',
  },
  {
    id: 'emerald_zen',
    name: 'Emerald Matrix',
    gradient: ['#021811', '#062d22', '#064e3b'],
    accentColor: '#34d399',
    secondaryColor: '#a7f3d0',
    badgeBg: 'rgba(52, 211, 153, 0.2)',
    badgeBorder: 'rgba(52, 211, 153, 0.4)',
    badgeText: '#6ee7b7',
    previewClass: 'from-[#021811] via-[#062d22] to-[#064e3b]',
  },
  {
    id: 'crimson_pulse',
    name: 'Crimson Energy',
    gradient: ['#1c0408', '#38040e', '#500718'],
    accentColor: '#f43f5e',
    secondaryColor: '#fb7185',
    badgeBg: 'rgba(244, 63, 94, 0.2)',
    badgeBorder: 'rgba(244, 63, 94, 0.4)',
    badgeText: '#fda4af',
    previewClass: 'from-[#1c0408] via-[#38040e] to-[#500718]',
  },
  {
    id: 'studio_minimal',
    name: 'Slate Minimal',
    gradient: ['#090a0f', '#141724', '#1e2235'],
    accentColor: '#e2e8f0',
    secondaryColor: '#94a3b8',
    badgeBg: 'rgba(226, 232, 240, 0.15)',
    badgeBorder: 'rgba(226, 232, 240, 0.3)',
    badgeText: '#ffffff',
    previewClass: 'from-[#090a0f] via-[#141724] to-[#1e2235]',
  },
];

const ACCENT_COLORS = [
  { name: 'Amber Orange', hex: '#f97316' },
  { name: 'Cyber Cyan', hex: '#38bdf8' },
  { name: 'Neon Purple', hex: '#c084fc' },
  { name: 'Emerald Green', hex: '#34d399' },
  { name: 'Hot Pink', hex: '#ec4899' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Gold Flare', hex: '#fbbf24' },
];

export const VideoStudio: React.FC<VideoStudioProps> = ({
  currentAudioItem,
  audioHistory,
  onSelectHistoryAudio,
  onNavigateToVoiceStudio,
  onNavigateToProjects,
  onSaveProject,
  initialStep,
  initialVideoConfig,
  autoOpenYouTube,
}) => {
  // Step workflow tabs: 1 = Setup Channel, 2 = Design Thumbnail, 3 = Preview & Audiogram, 4 = Export Video
  const [activeStep, setActiveStep] = useState<'setup' | 'thumbnail' | 'audiogram' | 'export'>(
    initialStep || 'setup'
  );

  // Sync initialStep when prop changes
  useEffect(() => {
    if (initialStep) {
      setActiveStep(initialStep);
    }
  }, [initialStep]);

  // Channel & Project configuration
  const [channelName, setChannelName] = useState<string>(() => {
    return initialVideoConfig?.channelName || localStorage.getItem('vox_user_channel_name') || 'VoxGlobal Studio';
  });
  const [channelAvatarColor, setChannelAvatarColor] = useState<string>(initialVideoConfig?.channelAvatarColor || '#f97316');
  const [videoTitle, setVideoTitle] = useState<string>(initialVideoConfig?.title || 'Unlocking Next-Gen Neural AI Voice');
  const [videoSubtitle, setVideoSubtitle] = useState<string>(initialVideoConfig?.subtitle || 'High-Definition 24kHz Audio Experience');
  const [categoryTag, setCategoryTag] = useState<string>(initialVideoConfig?.categoryTag || 'TECH PODCAST');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>(initialVideoConfig?.aspectRatio || '16:9');
  const [themePreset, setThemePreset] = useState<string>(initialVideoConfig?.themePreset || 'cyber_neon');
  const [waveformMode, setWaveformMode] = useState<WaveformVisualMode>(initialVideoConfig?.waveformMode || 'bars');
  const [waveformColor, setWaveformColor] = useState<string>(initialVideoConfig?.waveformColor || '#38bdf8');
  const [customBgImage, setCustomBgImage] = useState<string | null>(initialVideoConfig?.customBgImage || null);
  const [vignetteStrength, setVignetteStrength] = useState<number>(initialVideoConfig?.vignetteStrength ?? 0.5);
  const [showCaptions, setShowCaptions] = useState<boolean>(initialVideoConfig?.showCaptions ?? true);
  const [showTimecode, setShowTimecode] = useState<boolean>(initialVideoConfig?.showTimecode ?? true);
  const [showChannelBadge, setShowChannelBadge] = useState<boolean>(initialVideoConfig?.showChannelBadge ?? true);
  const [isSavingProject, setIsSavingProject] = useState<boolean>(false);
  const [projectSavedToast, setProjectSavedToast] = useState<string | null>(null);

  // Sync when initialVideoConfig prop updates
  useEffect(() => {
    if (initialVideoConfig) {
      if (initialVideoConfig.channelName) setChannelName(initialVideoConfig.channelName);
      if (initialVideoConfig.channelAvatarColor) setChannelAvatarColor(initialVideoConfig.channelAvatarColor);
      if (initialVideoConfig.title) setVideoTitle(initialVideoConfig.title);
      if (initialVideoConfig.subtitle) setVideoSubtitle(initialVideoConfig.subtitle);
      if (initialVideoConfig.categoryTag) setCategoryTag(initialVideoConfig.categoryTag);
      if (initialVideoConfig.aspectRatio) setAspectRatio(initialVideoConfig.aspectRatio);
      if (initialVideoConfig.themePreset) setThemePreset(initialVideoConfig.themePreset);
      if (initialVideoConfig.waveformMode) setWaveformMode(initialVideoConfig.waveformMode);
      if (initialVideoConfig.waveformColor) setWaveformColor(initialVideoConfig.waveformColor);
      if (initialVideoConfig.customBgImage) setCustomBgImage(initialVideoConfig.customBgImage);
      if (initialVideoConfig.vignetteStrength !== undefined) setVignetteStrength(initialVideoConfig.vignetteStrength);
      if (initialVideoConfig.showCaptions !== undefined) setShowCaptions(initialVideoConfig.showCaptions);
      if (initialVideoConfig.showTimecode !== undefined) setShowTimecode(initialVideoConfig.showTimecode);
      if (initialVideoConfig.showChannelBadge !== undefined) setShowChannelBadge(initialVideoConfig.showChannelBadge);
    }
  }, [initialVideoConfig]);

  // AI Suggestion State
  const [isSuggestingIdeas, setIsSuggestingIdeas] = useState<boolean>(false);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [suggestedSubtitles, setSuggestedSubtitles] = useState<string[]>([]);

  // Nano Banana Gemini Image Generation State
  const [thumbnailEngineTab, setThumbnailEngineTab] = useState<'historical' | 'custom'>('historical');
  const [nanoPrompt, setNanoPrompt] = useState<string>(
    'Cinematic historical documentary still of a valiant commander at fortress battlements at sunset, dramatic chiaroscuro volumetric lighting, 8k uhd'
  );
  const [nanoStylePreset, setNanoStylePreset] = useState<string>('cinematic');
  const [isGeneratingNanoImage, setIsGeneratingNanoImage] = useState<boolean>(false);
  const [nanoImageError, setNanoImageError] = useState<string | null>(null);
  const [nanoImageNotice, setNanoImageNotice] = useState<string | null>(null);
  const [generatedThumbnailsHistory, setGeneratedThumbnailsHistory] = useState<
    Array<{ id: string; url: string; prompt: string; style: string; engine?: string; timestamp: number }>
  >([]);

  // Playback & Audiogram Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Video Export States
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedVideoBlob, setExportedVideoBlob] = useState<Blob | null>(null);
  const [exportStatusText, setExportStatusText] = useState<string>('');
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState<boolean>(false);

  // Save Channel Name to local storage
  useEffect(() => {
    if (channelName.trim()) {
      localStorage.setItem('vox_user_channel_name', channelName);
    }
  }, [channelName]);

  // Sync title from current audio item when it changes
  useEffect(() => {
    if (currentAudioItem?.text) {
      const firstLine = currentAudioItem.text.split('\n')[0].replace(/[#*]/g, '').trim();
      if (firstLine.length > 0) {
        setVideoTitle(firstLine.slice(0, 60));
        setVideoSubtitle(`${currentAudioItem.voice} Voice • ${currentAudioItem.language}`);
      }
    }
  }, [currentAudioItem?.id]);

  // Audio source URL
  const audioSrc = useMemo(() => {
    if (!currentAudioItem?.audioBase64) return null;
    return `data:${currentAudioItem.mimeType || 'audio/wav'};base64,${currentAudioItem.audioBase64}`;
  }, [currentAudioItem?.audioBase64, currentAudioItem?.mimeType]);

  // Active theme object
  const currentTheme = useMemo(() => {
    return THEME_PRESETS.find((t) => t.id === themePreset) || THEME_PRESETS[0];
  }, [themePreset]);

  // Initialize Web Audio API Analyser
  const setupWebAudio = () => {
    if (!audioRef.current) return;
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      try {
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        sourceNodeRef.current = source;
      } catch (e) {
        console.warn('Audio source node already attached or error:', e);
      }

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
    }

    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Trigger AI Suggestion
  const handleAISuggestIdeas = async () => {
    setIsSuggestingIdeas(true);
    try {
      const res = await fetch('/api/video/suggest-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelName,
          text: currentAudioItem?.text || videoTitle,
          topic: categoryTag,
        }),
      });
      const data = await res.json();
      if (data?.ideas) {
        if (data.ideas.titles?.length) {
          setSuggestedTitles(data.ideas.titles);
          setVideoTitle(data.ideas.titles[0]);
        }
        if (data.ideas.subtitles?.length) {
          setSuggestedSubtitles(data.ideas.subtitles);
          setVideoSubtitle(data.ideas.subtitles[0]);
        }
        if (data.ideas.recommendedTheme) {
          const match = THEME_PRESETS.find((t) => t.id === data.ideas.recommendedTheme);
          if (match) setThemePreset(match.id);
        }
      }
    } catch (e) {
      console.error('Error suggesting ideas:', e);
    } finally {
      setIsSuggestingIdeas(false);
    }
  };

  // Handle applying historical thumbnail image, title hook, and branding
  const handleApplyHistoricalImage = (imageUrl: string, suggestedTitle?: string, brandingName?: string) => {
    if (imageUrl) {
      setCustomBgImage(imageUrl);
    }
    if (suggestedTitle && suggestedTitle.trim()) {
      setVideoTitle(suggestedTitle.trim());
    }
    if (brandingName && brandingName.trim()) {
      setChannelName(brandingName.trim());
      setShowChannelBadge(true);
    }
    // Add to generated history
    const newEntry = {
      id: `hist-gen-${Date.now()}`,
      url: imageUrl,
      prompt: suggestedTitle ? `Historical Doc: ${suggestedTitle}` : 'Historical Documentary Thumbnail',
      style: 'historical_documentary',
      engine: 'nano-banana-diffusion',
      timestamp: Date.now(),
    };
    setGeneratedThumbnailsHistory((prev) => [newEntry, ...prev.slice(0, 7)]);
  };

  // Draft a rich image generation prompt based on current audio context, title, and channel
  const handleDraftPromptFromContext = () => {
    const audioTopic = currentAudioItem?.text ? currentAudioItem.text.slice(0, 200) : videoTitle;
    let draft = `Cinematic historical documentary still of ${videoTitle || 'an epic historical turning point'}`;
    if (audioTopic) {
      draft += `, inspired by "${audioTopic.replace(/[\n\r]+/g, ' ')}"`;
    }
    draft += `, authentic period accuracy, dramatic volumetric lighting, shallow depth of field, photorealistic textures, 8k uhd streaming documentary cinematography`;
    setNanoPrompt(draft);
  };

  // Generate thumbnail picture with Nano Banana Gemini (gemini-3.1-flash-lite-image)
  const handleGenerateNanoImage = async () => {
    if (!nanoPrompt.trim()) return;
    setIsGeneratingNanoImage(true);
    setNanoImageError(null);

    try {
      const res = await fetch('/api/video/generate-thumbnail-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: nanoPrompt,
          aspectRatio,
          stylePreset: nanoStylePreset,
          title: videoTitle,
          channelName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.imageUrl) {
        throw new Error(data.error || 'Failed to generate image with Nano Banana Gemini');
      }

      // Apply newly generated image as the custom background on the canvas
      setCustomBgImage(data.imageUrl);
      if (data.notice) {
        setNanoImageNotice(data.notice);
      } else {
        setNanoImageNotice(null);
      }

      // Add to session history
      const newEntry = {
        id: `thumb-gen-${Date.now()}`,
        url: data.imageUrl,
        prompt: nanoPrompt,
        style: nanoStylePreset,
        engine: data.generatorEngine || 'nano-banana-diffusion',
        timestamp: Date.now(),
      };
      setGeneratedThumbnailsHistory((prev) => [newEntry, ...prev.slice(0, 7)]);
    } catch (err: any) {
      console.error('Nano Banana Image Generation Error:', err);
      setNanoImageError(err.message || 'Image generation failed. Please try again.');
    } finally {
      setIsGeneratingNanoImage(false);
    }
  };

  // Custom background image upload handler
  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setCustomBgImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Canvas drawing routine: renders thumbnail and video frame
  const drawFrame = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    freqData: Uint8Array | null,
    isExportRender = false,
    exportTimeSec = 0
  ) => {
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Background (Custom Image or Deep Multi-stop Gradient)
    if (customBgImage) {
      const img = new Image();
      img.src = customBgImage;
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, width, height);
      } else {
        drawGradientBg(ctx, width, height);
      }
    } else {
      drawGradientBg(ctx, width, height);
    }

    // 2. Subtle Starfield / Grid overlay
    drawAbstractBackdrop(ctx, width, height);

    // 3. Vignette & Contrast Overlay
    if (vignetteStrength > 0) {
      const radialGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.2,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      radialGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      radialGrad.addColorStop(1, `rgba(0, 0, 0, ${0.4 + vignetteStrength * 0.5})`);
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 4. Draw Audio Waveform Visualizer
    const activeFreqs = freqData || new Uint8Array(128).fill(25);
    drawWaveform(ctx, width, height, activeFreqs);

    // 5. Channel Badge (Top Header)
    if (showChannelBadge) {
      const badgeY = height * 0.08;
      const badgeX = width * 0.08;
      const avatarSize = Math.max(28, width * 0.035);

      // Badge pill background
      ctx.fillStyle = currentTheme.badgeBg;
      ctx.strokeStyle = currentTheme.badgeBorder;
      ctx.lineWidth = 1.5;
      const pillWidth = Math.min(width * 0.6, 280);
      const pillHeight = avatarSize + 14;
      roundRect(ctx, badgeX, badgeY, pillWidth, pillHeight, pillHeight / 2);
      ctx.fill();
      ctx.stroke();

      // Avatar circle
      ctx.fillStyle = channelAvatarColor;
      ctx.beginPath();
      ctx.arc(badgeX + avatarSize / 2 + 7, badgeY + pillHeight / 2, avatarSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Avatar initial text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(12, avatarSize * 0.55)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((channelName[0] || 'V').toUpperCase(), badgeX + avatarSize / 2 + 7, badgeY + pillHeight / 2);

      // Channel Name text
      ctx.fillStyle = currentTheme.badgeText;
      ctx.font = `bold ${Math.max(12, width * 0.018)}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(channelName, badgeX + avatarSize + 14, badgeY + pillHeight / 2 - 1);
    }

    // Category / Topic pill (Top Right)
    if (categoryTag) {
      const tagText = categoryTag.toUpperCase();
      const tagX = width * 0.92;
      const tagY = height * 0.08;
      ctx.font = `bold ${Math.max(10, width * 0.014)}px sans-serif`;
      const textMetrics = ctx.measureText(tagText);
      const tagW = textMetrics.width + 24;
      const tagH = 28;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      roundRect(ctx, tagX - tagW, tagY, tagW, tagH, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = waveformColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, tagX - tagW / 2, tagY + tagH / 2);
    }

    // 6. Main Headline Title
    const titleY = height * (aspectRatio === '9:16' ? 0.38 : 0.46);
    const titleFontSize = Math.max(22, width * (aspectRatio === '9:16' ? 0.055 : 0.038));
    ctx.font = `900 ${titleFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Drop shadow for high readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = '#ffffff';
    wrapText(ctx, videoTitle, width / 2, titleY, width * 0.82, titleFontSize * 1.25);
    ctx.shadowBlur = 0;

    // 7. Subtitle / Tagline
    if (videoSubtitle) {
      const subY = height * (aspectRatio === '9:16' ? 0.52 : 0.62);
      const subFontSize = Math.max(14, width * (aspectRatio === '9:16' ? 0.028 : 0.018));
      ctx.font = `600 ${subFontSize}px sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.textAlign = 'center';
      ctx.fillText(videoSubtitle, width / 2, subY);
    }

    // 8. Timecode & Live Audio Indicator (Bottom Bar)
    if (showTimecode) {
      const barY = height * 0.90;
      const currSec = isExportRender ? exportTimeSec : currentTime;
      const totalSec = duration || currentAudioItem?.duration || 10;
      const timeStr = `${formatTime(currSec)} / ${formatTime(totalSec)}`;

      ctx.font = `bold ${Math.max(11, width * 0.015)}px monospace`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'left';
      ctx.fillText(`⏱️ ${timeStr}`, width * 0.08, barY);

      // 24kHz Studio Badge
      ctx.fillStyle = waveformColor;
      ctx.textAlign = 'right';
      ctx.fillText(`HD 24kHz Neural TTS • ${currentAudioItem?.voice || 'AI Voice'}`, width * 0.92, barY);
    }

    // 9. Synced Captions (if enabled & playing)
    if (showCaptions && currentAudioItem?.text) {
      const captionY = height * (aspectRatio === '9:16' ? 0.72 : 0.78);
      const scriptWords = currentAudioItem.text.split(' ');
      const totalDur = duration || currentAudioItem.duration || 10;
      const progress = totalDur > 0 ? (isExportRender ? exportTimeSec : currentTime) / totalDur : 0;
      const activeWordIndex = Math.floor(progress * scriptWords.length);
      const startIdx = Math.max(0, activeWordIndex - 3);
      const endIdx = Math.min(scriptWords.length, activeWordIndex + 5);
      const captionSnippet = scriptWords.slice(startIdx, endIdx).join(' ');

      if (captionSnippet) {
        ctx.font = `italic 700 ${Math.max(13, width * 0.02)}px sans-serif`;
        const capWidth = ctx.measureText(`“${captionSnippet}…”`).width + 36;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        roundRect(ctx, width / 2 - capWidth / 2, captionY - 18, capWidth, 36, 18);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`“${captionSnippet}…”`, width / 2, captionY);
      }
    }

    ctx.restore();
  };

  // Background Gradient Helper
  const drawGradientBg = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, currentTheme.gradient[0]);
    bgGrad.addColorStop(0.5, currentTheme.gradient[1]);
    bgGrad.addColorStop(1, currentTheme.gradient[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  };

  // Geometric abstract backdrop
  const drawAbstractBackdrop = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    // Ambient glowing radial lights
    const glow1 = ctx.createRadialGradient(width * 0.2, height * 0.3, 10, width * 0.2, height * 0.3, width * 0.45);
    glow1.addColorStop(0, `${currentTheme.accentColor}33`);
    glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    const glow2 = ctx.createRadialGradient(width * 0.8, height * 0.7, 10, width * 0.8, height * 0.7, width * 0.45);
    glow2.addColorStop(0, `${currentTheme.secondaryColor}28`);
    glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  };

  // Waveform Drawer
  const drawWaveform = (ctx: CanvasRenderingContext2D, width: number, height: number, freqs: Uint8Array) => {
    const centerY = height * (aspectRatio === '9:16' ? 0.62 : 0.68);
    ctx.save();

    if (waveformMode === 'bars') {
      const barCount = 48;
      const totalBarWidth = width * 0.72;
      const barGap = 4;
      const barWidth = (totalBarWidth - (barCount - 1) * barGap) / barCount;
      const startX = width / 2 - totalBarWidth / 2;

      for (let i = 0; i < barCount; i++) {
        const freqVal = freqs[i % freqs.length] || 10;
        const normalized = freqVal / 255;
        const barHeight = Math.max(6, normalized * (height * 0.22));
        const x = startX + i * (barWidth + barGap);
        const y = centerY - barHeight / 2;

        const barGrad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        barGrad.addColorStop(0, currentTheme.secondaryColor);
        barGrad.addColorStop(1, waveformColor);

        ctx.fillStyle = barGrad;
        roundRect(ctx, x, y, barWidth, barHeight, barWidth / 2);
        ctx.fill();
      }
    } else if (waveformMode === 'circle') {
      const centerX = width / 2;
      const baseRadius = Math.min(width, height) * 0.14;
      const numPoints = 60;

      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const freqVal = freqs[i % freqs.length] || 15;
        const angle = (i / numPoints) * Math.PI * 2;
        const offset = (freqVal / 255) * (baseRadius * 0.7);
        const r = baseRadius + offset;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = waveformColor;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = waveformColor;
      ctx.shadowBlur = 12;
      ctx.stroke();
    } else if (waveformMode === 'wave') {
      const waveWidth = width * 0.78;
      const startX = width / 2 - waveWidth / 2;
      const points = 50;

      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const freqVal = freqs[i % freqs.length] || 10;
        const x = startX + (i / points) * waveWidth;
        const amplitude = (freqVal / 255) * 45;
        const y = centerY + Math.sin((i / 4) + currentTime * 5) * amplitude;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = waveformColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.shadowColor = waveformColor;
      ctx.shadowBlur = 14;
      ctx.stroke();
    } else {
      // Frequency mesh dots
      const cols = 28;
      const gap = (width * 0.7) / cols;
      const startX = width / 2 - (cols * gap) / 2;

      for (let i = 0; i < cols; i++) {
        const val = (freqs[i % freqs.length] || 10) / 255;
        const dotSize = Math.max(3, val * 12);
        const x = startX + i * gap;
        const y = centerY + Math.sin(i * 0.5) * 15;

        ctx.fillStyle = val > 0.5 ? currentTheme.secondaryColor : waveformColor;
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  };

  // Helper to wrap text cleanly on canvas
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ');
    let line = '';
    const lines: string[] = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    // Center vertical alignment for multiple lines
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    for (let k = 0; k < lines.length; k++) {
      ctx.fillText(lines[k], x, startY + k * lineHeight);
    }
  };

  // Rounded rectangle helper
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // Format time MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Live Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;
    const freqArray = new Uint8Array(128);

    const renderLoop = () => {
      if (!isRunning) return;

      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(freqArray);
      } else if (!isPlaying) {
        // Idle gentle waveform oscillation
        for (let i = 0; i < freqArray.length; i++) {
          freqArray[i] = Math.floor(25 + Math.sin(Date.now() * 0.003 + i * 0.2) * 15);
        }
      }

      drawFrame(ctx, canvas.width, canvas.height, freqArray);
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [
    channelName,
    channelAvatarColor,
    videoTitle,
    videoSubtitle,
    categoryTag,
    aspectRatio,
    themePreset,
    waveformMode,
    waveformColor,
    customBgImage,
    vignetteStrength,
    showCaptions,
    showTimecode,
    showChannelBadge,
    isPlaying,
    currentTime,
    duration,
  ]);

  // Audio Playback Handlers
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    setupWebAudio();

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Play error:', e));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Instant High-Res Thumbnail Download (PNG)
  const handleDownloadThumbnail = () => {
    const offscreenCanvas = document.createElement('canvas');
    let exportW = 1280;
    let exportH = 720;
    if (aspectRatio === '9:16') {
      exportW = 720;
      exportH = 1280;
    } else if (aspectRatio === '1:1') {
      exportW = 1080;
      exportH = 1080;
    }

    offscreenCanvas.width = exportW;
    offscreenCanvas.height = exportH;
    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) return;

    // Render with dynamic simulated waveform
    const sampleFreqs = new Uint8Array(128);
    for (let i = 0; i < sampleFreqs.length; i++) {
      sampleFreqs[i] = Math.floor(90 + Math.sin(i * 0.3) * 60);
    }

    drawFrame(ctx, exportW, exportH, sampleFreqs);

    const dataUrl = offscreenCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${channelName.replace(/\s+/g, '_')}_thumbnail_${aspectRatio}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Video Exporter (Records Canvas + Web Audio stream into downloadable video)
  const handleExportVideo = async (autoOpenYouTubeModal: boolean = false) => {
    if (!audioSrc) {
      alert('Please generate or select an audio track first!');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportStatusText('Initializing audio stream and canvas renderer...');

    try {
      // 1. Prepare export canvas & dimensions
      const exportCanvas = document.createElement('canvas');
      const targetW = aspectRatio === '16:9' ? 1280 : aspectRatio === '9:16' ? 720 : 800;
      const targetH = aspectRatio === '16:9' ? 720 : aspectRatio === '9:16' ? 1280 : 800;
      exportCanvas.width = targetW;
      exportCanvas.height = targetH;
      const exportCtx = exportCanvas.getContext('2d');
      if (!exportCtx) throw new Error('Could not create export canvas context');

      // 2. Audio Context & Destination Muxer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const exportAudioCtx = new AudioCtx();
      const audioDest = exportAudioCtx.createMediaStreamDestination();
      const exportAnalyser = exportAudioCtx.createAnalyser();
      exportAnalyser.fftSize = 256;

      // Decode audio buffer from base64
      const response = await fetch(audioSrc);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await exportAudioCtx.decodeAudioData(arrayBuffer);

      // Create audio buffer source
      const bufferSource = exportAudioCtx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(exportAnalyser);
      exportAnalyser.connect(audioDest);

      // 3. Combine Streams
      const canvasStream = exportCanvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks(),
      ]);

      // 4. MediaRecorder Setup
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
        mimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 3500000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(finalBlob);
        setExportedVideoBlob(finalBlob);
        setExportedVideoUrl(videoUrl);
        setIsExporting(false);
        setExportProgress(100);
        setExportStatusText('Video successfully rendered! Ready for download & YouTube upload.');
        setActiveStep('export');
        if (autoOpenYouTubeModal) {
          setIsYouTubeModalOpen(true);
        }
      };

      // 5. Start Recording and Frame Rendering
      recorder.start();
      bufferSource.start(0);

      const totalDuration = audioBuffer.duration;
      const startTime = performance.now();
      const freqBuffer = new Uint8Array(128);

      const renderExportLoop = () => {
        const elapsedSec = (performance.now() - startTime) / 1000;
        const progressPct = Math.min(99, Math.round((elapsedSec / totalDuration) * 100));
        setExportProgress(progressPct);
        setExportStatusText(`Rendering frame animations & muxing audio (${progressPct}%)...`);

        exportAnalyser.getByteFrequencyData(freqBuffer);
        drawFrame(exportCtx, targetW, targetH, freqBuffer, true, elapsedSec);

        if (elapsedSec < totalDuration) {
          requestAnimationFrame(renderExportLoop);
        } else {
          setTimeout(() => {
            recorder.stop();
            bufferSource.stop();
            exportAudioCtx.close();
          }, 300);
        }
      };

      renderExportLoop();
    } catch (err: any) {
      console.error('Export video error:', err);
      setIsExporting(false);
      alert(`Export error: ${err.message || 'Failed to render video'}`);
    }
  };

  // Save Project to My Projects Hub
  const handleSaveVideoProject = async () => {
    if (!onSaveProject) return;
    setIsSavingProject(true);
    try {
      const videoConfig: VideoProjectConfig = {
        channelName,
        channelAvatarColor,
        title: videoTitle,
        subtitle: videoSubtitle,
        categoryTag,
        aspectRatio,
        themePreset,
        customBgImage: customBgImage || undefined,
        waveformMode,
        waveformColor,
        showCaptions,
        showTimecode,
        showChannelBadge,
        vignetteStrength,
        visualFilter: 'none',
      };

      const project: UserProject = {
        id: `vox-vid-${Date.now()}`,
        userId: currentAudioItem?.userId,
        title: videoTitle || 'Video Audiogram Project',
        description: `${channelName} • ${videoSubtitle || 'Audiogram & Thumbnail'}`,
        projectType: 'video',
        audioItem: currentAudioItem || undefined,
        videoConfig,
        thumbnailData: customBgImage
          ? {
              imageUrl: customBgImage,
              hookText: videoTitle,
              channelName,
              aspectRatio,
            }
          : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFavorite: false,
        tags: [channelName, categoryTag, aspectRatio, waveformMode],
      };

      await onSaveProject(project);
      setProjectSavedToast('✨ Project saved to "My Projects" successfully!');
      setTimeout(() => setProjectSavedToast(null), 4000);
    } catch (e) {
      console.error('Error saving video project:', e);
    } finally {
      setIsSavingProject(false);
    }
  };

  // Direct 1-Click Upload to YouTube handler
  const handleDirectUploadYouTube = () => {
    if (exportedVideoBlob) {
      setIsYouTubeModalOpen(true);
    } else {
      handleExportVideo(true);
    }
  };

  // Auto trigger YouTube if requested via props
  useEffect(() => {
    if (autoOpenYouTube) {
      if (exportedVideoBlob) {
        setIsYouTubeModalOpen(true);
      } else if (audioSrc && !isExporting) {
        handleExportVideo(true);
      }
    }
  }, [autoOpenYouTube]);

  return (
    <div id="video-studio-container" className="space-y-8 animate-fade-in">
      {/* Top Banner & Audio Context Info */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-orange-900/40 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/20 border border-orange-500/40 px-3 py-1 text-xs font-semibold text-orange-300">
              <Film className="h-3.5 w-3.5" />
              <span>YouTube, Shorts & Audiogram Video Studio</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Create Stunning Video & Thumbnails from Your Audio
            </h2>
            <p className="text-sm text-white/70 max-w-2xl">
              Turn your AI voice recordings into high-converting YouTube thumbnails, dynamic audiograms, and export ready-to-publish MP4 videos with animated soundwaves!
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="switch-to-voice-studio-btn"
              onClick={onNavigateToVoiceStudio}
              className="flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 px-3.5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
            >
              <Music className="h-4 w-4 text-orange-400" />
              <span>Voice Studio</span>
            </button>
            {onNavigateToProjects && (
              <button
                id="switch-to-projects-btn"
                onClick={onNavigateToProjects}
                className="flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 px-3.5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
              >
                <FolderHeart className="h-4 w-4 text-amber-400" />
                <span>My Projects</span>
              </button>
            )}
            {onSaveProject && (
              <button
                id="save-video-project-btn"
                onClick={handleSaveVideoProject}
                disabled={isSavingProject}
                className="flex items-center gap-2 rounded-2xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 px-3.5 py-2.5 text-xs font-bold text-emerald-200 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Save className="h-4 w-4 text-emerald-400" />
                <span>{isSavingProject ? 'Saving...' : 'Save Project'}</span>
              </button>
            )}
            <button
              id="quick-download-thumbnail-btn"
              onClick={handleDownloadThumbnail}
              className="flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
            >
              <ImageIcon className="h-4 w-4 text-purple-300" />
              <span>Thumbnail PNG</span>
            </button>
            <button
              id="quick-export-video-btn"
              onClick={() => handleExportVideo(false)}
              disabled={isExporting || !audioSrc}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-400 hover:to-purple-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Rendering {exportProgress}%...</span>
                </>
              ) : (
                <>
                  <Video className="h-4 w-4" />
                  <span>Render MP4</span>
                </>
              )}
            </button>
            <button
              id="quick-upload-youtube-btn"
              onClick={handleDirectUploadYouTube}
              disabled={isExporting || !audioSrc}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50 transform hover:scale-[1.02] active:scale-95"
            >
              <Youtube className="h-4 w-4 fill-current" />
              <span>Upload to YouTube</span>
            </button>
          </div>
        </div>

        {/* Saved Project Toast notification */}
        {projectSavedToast && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between animate-fade-in">
            <span>{projectSavedToast}</span>
            {onNavigateToProjects && (
              <button
                type="button"
                onClick={onNavigateToProjects}
                className="underline hover:text-white cursor-pointer ml-3"
              >
                View in My Projects &rarr;
              </button>
            )}
          </div>
        )}

        {/* Loaded Audio Pill Indicator */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-white/80">
            <Radio className="h-4 w-4 text-orange-400 animate-pulse" />
            <span className="font-medium">Active Track:</span>
            {currentAudioItem ? (
              <span className="font-semibold text-orange-300">
                {currentAudioItem.voice} ({currentAudioItem.language}) • {currentAudioItem.duration}s
              </span>
            ) : (
              <span className="text-white/40 italic">No speech generated yet. You can use sample audio or switch to Voice Studio.</span>
            )}
          </div>

          {/* History switcher */}
          {audioHistory.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-[11px]">Select from recent takes:</span>
              <select
                id="history-audio-picker"
                value={currentAudioItem?.id || ''}
                onChange={(e) => {
                  const found = audioHistory.find((item) => item.id === e.target.value);
                  if (found) onSelectHistoryAudio(found);
                }}
                className="rounded-xl border border-white/15 bg-black/40 px-3 py-1 text-xs text-white focus:outline-none"
              >
                {audioHistory.map((item, idx) => (
                  <option key={item.id} value={item.id} className="bg-neutral-900 text-white">
                    #{audioHistory.length - idx} - {item.voice} ({item.language}) - {item.text.slice(0, 24)}...
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 4-Step Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'setup', label: '1. Channel & Branding', icon: Tv },
          { id: 'thumbnail', label: '2. Thumbnail Designer', icon: ImageIcon },
          { id: 'audiogram', label: '3. Video Audiogram', icon: Activity },
          { id: 'export', label: '4. Export MP4 Video', icon: Download },
        ].map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;
          return (
            <button
              key={step.id}
              id={`step-tab-${step.id}`}
              onClick={() => setActiveStep(step.id as any)}
              className={`flex items-center justify-center gap-2.5 rounded-2xl p-3.5 text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500/20 to-purple-600/20 border border-orange-500/50 text-white shadow-lg shadow-orange-500/10'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-orange-400' : 'text-white/40'}`} />
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Studio Grid: Left Controls (5 cols) & Right Live Canvas Preview (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Controls for Active Step */}
        <div className="lg:col-span-5 space-y-6">
          {/* STEP 1: Channel & Branding Setup */}
          {activeStep === 'setup' && (
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Tv className="h-5 w-5 text-orange-400" />
                  <h3 className="text-base font-bold text-white">Channel & Metadata</h3>
                </div>
                <button
                  id="ai-suggest-ideas-btn"
                  onClick={handleAISuggestIdeas}
                  disabled={isSuggestingIdeas}
                  className="flex items-center gap-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 px-3 py-1.5 text-xs font-semibold text-orange-300 hover:text-white transition-all cursor-pointer"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isSuggestingIdeas ? 'animate-spin' : ''}`} />
                  <span>{isSuggestingIdeas ? 'Thinking...' : 'AI Auto-Suggest'}</span>
                </button>
              </div>

              {/* Channel Name Input */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-white/50 font-bold">
                  Channel / Creator Name
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="channel-name-input"
                    type="text"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    placeholder="e.g. VoxGlobal Podcast, Daily Tech Insights..."
                    className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-orange-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-1">
                    {['#f97316', '#38bdf8', '#c084fc', '#34d399', '#f43f5e'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setChannelAvatarColor(color)}
                        className={`h-7 w-7 rounded-full border-2 transition-all cursor-pointer ${
                          channelAvatarColor === color ? 'border-white scale-110' : 'border-transparent opacity-60'
                        }`}
                        style={{ backgroundColor: color }}
                        title="Channel Icon Color"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Video Title */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-white/50 font-bold">
                  Video / Episode Title
                </label>
                <textarea
                  id="video-title-input"
                  rows={2}
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Enter a punchy, high CTR headline..."
                  className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-orange-500 focus:outline-none resize-none font-semibold"
                />
                {suggestedTitles.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-[11px] text-white/40">AI Recommended Titles:</span>
                    {suggestedTitles.map((t, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setVideoTitle(t)}
                        className="text-left text-xs text-orange-300 hover:text-white hover:underline truncate"
                      >
                        • {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Subtitle & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-white/50 font-bold">
                    Subtitle / Tagline
                  </label>
                  <input
                    id="video-subtitle-input"
                    type="text"
                    value={videoSubtitle}
                    onChange={(e) => setVideoSubtitle(e.target.value)}
                    placeholder="e.g. Episode #1 • Masterclass"
                    className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider text-white/50 font-bold">
                    Topic Badge Tag
                  </label>
                  <input
                    id="category-tag-input"
                    type="text"
                    value={categoryTag}
                    onChange={(e) => setCategoryTag(e.target.value)}
                    placeholder="e.g. TECH, PODCAST, NEWS"
                    className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Advance CTA */}
              <button
                id="go-to-step2-btn"
                onClick={() => setActiveStep('thumbnail')}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-purple-600 py-3 text-xs font-bold text-white shadow-lg transition-all cursor-pointer"
              >
                <span>Continue to Thumbnail Designer</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Thumbnail & Art Designer */}
          {activeStep === 'thumbnail' && (
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white">Visual Art & Styling</h3>
                </div>
                <button
                  id="step2-download-thumb-btn"
                  onClick={handleDownloadThumbnail}
                  className="flex items-center gap-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:text-white transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download PNG</span>
                </button>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-white/50 font-bold">
                  Format / Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: '16:9', label: '16:9 YouTube', sub: 'Landscape 1280x720', icon: Monitor },
                    { id: '9:16', label: '9:16 Shorts', sub: 'TikTok / Reels', icon: Smartphone },
                    { id: '1:1', label: '1:1 Square', sub: 'Instagram / Podcast', icon: Square },
                  ].map((ratio) => {
                    const Icon = ratio.icon;
                    const isSel = aspectRatio === ratio.id;
                    return (
                      <button
                        key={ratio.id}
                        type="button"
                        id={`aspect-ratio-${ratio.id.replace(':', '-')}`}
                        onClick={() => setAspectRatio(ratio.id as any)}
                        className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSel
                            ? 'bg-orange-500/20 border-orange-500 text-white font-bold shadow-md'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className={`h-5 w-5 mb-1 ${isSel ? 'text-orange-400' : 'text-white/40'}`} />
                        <span className="text-xs">{ratio.label}</span>
                        <span className="text-[10px] opacity-60">{ratio.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Thumbnail Generation Suite (Historical Storyteller vs Custom Diffusion) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-white/50 font-bold">
                    AI Thumbnail Engine
                  </label>
                  <div className="flex items-center rounded-xl bg-black/40 p-1 border border-white/10 text-xs">
                    <button
                      type="button"
                      id="tab-thumb-historical"
                      onClick={() => setThumbnailEngineTab('historical')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        thumbnailEngineTab === 'historical'
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>Historical Storyteller (16:9)</span>
                    </button>
                    <button
                      type="button"
                      id="tab-thumb-custom"
                      onClick={() => setThumbnailEngineTab('custom')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        thumbnailEngineTab === 'custom'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      <span>Custom Prompt Studio</span>
                    </button>
                  </div>
                </div>

                {/* Tab 1: 7-Step Historical Storytelling AI Thumbnail Designer */}
                {thumbnailEngineTab === 'historical' && (
                  <HistoricalThumbnailGenerator
                    initialScript={currentAudioItem?.text || videoTitle}
                    currentChannelName={channelName}
                    onApplyImage={handleApplyHistoricalImage}
                    onDownloadCanvas={handleDownloadThumbnail}
                  />
                )}

                {/* Tab 2: Custom Prompt Nano Banana Gemini Generator Card */}
                {thumbnailEngineTab === 'custom' && (
                  <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/40 via-indigo-950/20 to-black/40 p-4 sm:p-5 space-y-4 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300">
                          <Wand2 className="h-4 w-4 text-purple-300 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">Nano Banana Gemini</h4>
                            <span className="rounded-full bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 text-[9px] font-bold text-purple-300">
                              gemini-3.1-flash-lite-image
                            </span>
                          </div>
                          <p className="text-[11px] text-white/60">Generate high-CTR thumbnail artwork via AI</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        id="auto-draft-prompt-btn"
                        onClick={handleDraftPromptFromContext}
                        className="flex items-center gap-1 text-[11px] font-semibold text-purple-300 hover:text-white bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
                        title="Auto-draft prompt based on audio script and video title"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Draft from Script</span>
                      </button>
                    </div>

                    {/* Prompt Textarea */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider text-purple-200/70 font-semibold flex items-center justify-between">
                        <span>Artwork Prompt</span>
                        <span className="text-[10px] text-white/40">{nanoPrompt.length} chars</span>
                      </label>
                      <textarea
                        id="nano-prompt-input"
                        rows={3}
                        value={nanoPrompt}
                        onChange={(e) => setNanoPrompt(e.target.value)}
                        placeholder="Describe your desired thumbnail visual scene..."
                        className="w-full rounded-xl border border-purple-500/30 bg-black/50 p-3 text-xs text-white placeholder:text-white/30 focus:border-purple-400 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    {/* Style Presets */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">
                        Visual Style Preset
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { id: 'cinematic', label: 'Cinematic 8K', emoji: '🎬' },
                          { id: 'cyberpunk', label: 'Cyberpunk Neon', emoji: '🚀' },
                          { id: '3d_render', label: '3D Render', emoji: '🧊' },
                          { id: 'neon_soundwave', label: 'Neon Waves', emoji: '🔊' },
                          { id: 'studio_photo', label: 'Studio Photo', emoji: '🎙️' },
                          { id: 'space_nebula', label: 'Space Nebula', emoji: '🌌' },
                          { id: 'anime_vibrant', label: 'Vibrant Anime', emoji: '🎨' },
                        ].map((style) => {
                          const isSel = nanoStylePreset === style.id;
                          return (
                            <button
                              key={style.id}
                              type="button"
                              id={`nano-style-${style.id}`}
                              onClick={() => setNanoStylePreset(style.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                isSel
                                  ? 'bg-purple-500 border border-purple-400 text-white font-bold shadow-md shadow-purple-500/20'
                                  : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <span className="text-xs">{style.emoji}</span>
                              <span className="truncate">{style.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Prompt Quick Inspiration Chips */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-white/40">Inspiration Presets:</span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          'Cinematic historical documentary still of warrior on ramparts at sunset',
                          'Holographic glowing AI brain with gold circuits',
                          'Vintage studio microphone with neon cyan aura',
                          'Dramatic cybernetic human portrait with neon rim lighting',
                        ].map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setNanoPrompt(chip)}
                            className="text-[10px] text-purple-300 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 px-2 py-0.5 rounded-md transition-colors"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Error notice if any */}
                    {nanoImageError && (
                      <div className="flex items-start gap-2 rounded-xl bg-red-500/15 border border-red-500/30 p-2.5 text-xs text-red-300">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{nanoImageError}</span>
                      </div>
                    )}

                    {/* Friendly notification info if fallback engine was utilized */}
                    {nanoImageNotice && !nanoImageError && (
                      <div className="flex items-start gap-2 rounded-xl bg-purple-500/15 border border-purple-500/30 p-2.5 text-xs text-purple-200">
                        <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-purple-300" />
                        <span>{nanoImageNotice}</span>
                      </div>
                    )}

                    {/* Generate Image CTA Button */}
                    <button
                      type="button"
                      id="nano-generate-image-btn"
                      onClick={handleGenerateNanoImage}
                      disabled={isGeneratingNanoImage || !nanoPrompt.trim()}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-orange-500 hover:from-purple-500 hover:to-orange-400 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/25 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingNanoImage ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-white" />
                          <span>Generating with Nano Banana Gemini ({aspectRatio})...</span>
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-4 w-4" />
                          <span>Generate Thumbnail Picture with Nano Banana</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Session Generated Thumbnails History Gallery */}
                {generatedThumbnailsHistory.length > 0 && (
                  <div className="pt-2 border-t border-purple-500/20 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-white/70">
                      <span className="font-semibold">Generated Artwork Gallery:</span>
                      <span className="text-[10px] text-purple-300">Click to apply to canvas</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {generatedThumbnailsHistory.map((item) => {
                        const isActive = customBgImage === item.url;
                        return (
                          <div
                            key={item.id}
                            className={`group relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer aspect-video bg-black/40 ${
                              isActive
                                ? 'border-amber-400 ring-2 ring-amber-500/40'
                                : 'border-white/15 hover:border-amber-400/60'
                            }`}
                            onClick={() => setCustomBgImage(item.url)}
                          >
                            <img
                              src={item.url}
                              alt="Generated AI Thumbnail"
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {isActive && (
                              <div className="absolute top-1 right-1 rounded-full bg-amber-500 p-0.5 text-black">
                                <Check className="h-2.5 w-2.5" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-[10px] font-bold text-white bg-amber-600/80 px-1.5 py-0.5 rounded">
                                Apply
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Presets */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-white/50 font-bold">
                  Background Themes
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {THEME_PRESETS.map((theme) => {
                    const isSel = themePreset === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        id={`theme-preset-${theme.id}`}
                        onClick={() => {
                          setThemePreset(theme.id);
                          setWaveformColor(theme.accentColor);
                          setCustomBgImage(null);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSel
                            ? 'border-orange-500 bg-white/10 text-white font-bold ring-2 ring-orange-500/20'
                            : 'border-white/10 bg-black/20 text-white/60 hover:bg-white/5'
                        }`}
                      >
                        <div className={`h-4 w-full rounded-md bg-gradient-to-r ${theme.previewClass} mb-1.5`} />
                        <span className="text-xs block truncate">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image Upload */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-white/50 font-bold">
                  Custom Artwork / Image Upload
                </label>
                <label className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-dashed border-white/20 bg-black/30 p-4 text-xs font-semibold text-white/70 hover:border-orange-500 hover:text-white cursor-pointer transition-all">
                  <Upload className="h-4 w-4 text-orange-400" />
                  <span>{customBgImage ? 'Replace Custom Image' : 'Upload Background Image (PNG/JPG)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomImageUpload}
                    className="hidden"
                  />
                </label>
                {customBgImage && (
                  <div className="flex items-center justify-between text-xs text-orange-300">
                    <span>Custom background image active</span>
                    <button
                      type="button"
                      onClick={() => setCustomBgImage(null)}
                      className="text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Waveform Visual Style & Color */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-white/50 font-bold">
                  Waveform Style & Accent Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'bars', label: 'Neon Bars' },
                    { id: 'circle', label: 'Circular' },
                    { id: 'wave', label: 'Sine Wave' },
                    { id: 'frequency_mesh', label: 'Dot Matrix' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      id={`wave-style-${w.id}`}
                      onClick={() => setWaveformMode(w.id as any)}
                      className={`p-2 rounded-xl text-center text-xs transition-all cursor-pointer ${
                        waveformMode === w.id
                          ? 'bg-orange-500/20 border border-orange-500 text-orange-300 font-bold'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setWaveformColor(c.hex)}
                      className={`h-7 w-7 rounded-full border-2 transition-all cursor-pointer ${
                        waveformColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Advance CTA */}
              <button
                id="go-to-step3-btn"
                onClick={() => setActiveStep('audiogram')}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-purple-600 py-3 text-xs font-bold text-white shadow-lg transition-all cursor-pointer"
              >
                <span>Continue to Video Audiogram Player</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* STEP 3: Video Audiogram Preview & Controls */}
          {activeStep === 'audiogram' && (
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Audiogram & Captions</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-mono">
                  <Radio className="h-3.5 w-3.5 animate-pulse" />
                  <span>Real-time Spectrum</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-white/50 font-bold">
                  On-Screen Overlays
                </label>
                <div className="space-y-2">
                  {[
                    {
                      label: 'Animated Subtitles & Caption Ticker',
                      checked: showCaptions,
                      setter: setShowCaptions,
                    },
                    {
                      label: 'Timestamp & Duration Timecode',
                      checked: showTimecode,
                      setter: setShowTimecode,
                    },
                    {
                      label: 'Channel Avatar & Branding Pill',
                      checked: showChannelBadge,
                      setter: setShowChannelBadge,
                    },
                  ].map((toggle, idx) => (
                    <label
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/10 cursor-pointer hover:bg-white/5"
                    >
                      <span className="text-xs text-white/80 font-medium">{toggle.label}</span>
                      <input
                        type="checkbox"
                        checked={toggle.checked}
                        onChange={(e) => toggle.setter(e.target.checked)}
                        className="h-4 w-4 rounded accent-orange-500 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Vignette Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Vignette & Contrast Shadow:</span>
                  <span className="font-mono text-orange-400">{Math.round(vignetteStrength * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={vignetteStrength}
                  onChange={(e) => setVignetteStrength(parseFloat(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              {/* Advance CTA */}
              <button
                id="go-to-step4-btn"
                onClick={() => setActiveStep('export')}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-purple-600 py-3 text-xs font-bold text-white shadow-lg transition-all cursor-pointer"
              >
                <span>Proceed to Video Export & Download</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* STEP 4: Export MP4 Video */}
          {activeStep === 'export' && (
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-green-400" />
                  <h3 className="text-base font-bold text-white">Export MP4 / Video</h3>
                </div>
                <span className="text-xs text-white/50">Ready for YouTube & Socials</span>
              </div>

              {/* Export Status / Action Card */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Export Resolution:</span>
                    <span className="font-mono text-orange-400">
                      {aspectRatio === '16:9' ? '1280x720 (HD)' : aspectRatio === '9:16' ? '720x1280 (Shorts)' : '800x800 (Square)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Audio Encoding:</span>
                    <span className="font-mono text-purple-300">24kHz PCM Synchronized</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">FPS & Codec:</span>
                    <span className="font-mono text-cyan-300">30 FPS • H.264 / VP9</span>
                  </div>
                </div>

                {isExporting && (
                  <div className="space-y-2 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30">
                    <div className="flex items-center justify-between text-xs text-orange-300 font-bold">
                      <span>{exportStatusText}</span>
                      <span>{exportProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-purple-600 transition-all duration-150"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {exportedVideoUrl && (
                  <div className="space-y-4 pt-2">
                    <div className="rounded-2xl overflow-hidden border border-white/20 bg-black">
                      <video
                        src={exportedVideoUrl}
                        controls
                        className="w-full max-h-64 object-contain"
                        autoPlay
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <a
                        id="download-final-video-btn"
                        href={exportedVideoUrl}
                        download={`${channelName.replace(/\s+/g, '_')}_video_${aspectRatio}.mp4`}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-green-500/20 transition-all"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download MP4</span>
                      </a>

                      <button
                        type="button"
                        id="trigger-youtube-upload-btn"
                        onClick={() => setIsYouTubeModalOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-red-600/30 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-95"
                      >
                        <Youtube className="h-4 w-4 fill-current" />
                        <span>Upload to YouTube</span>
                      </button>
                    </div>
                  </div>
                )}

                {!exportedVideoUrl && !isExporting && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      id="trigger-direct-youtube-btn"
                      onClick={handleDirectUploadYouTube}
                      disabled={!audioSrc}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 py-3.5 text-sm font-bold text-white shadow-xl shadow-red-600/30 transition-all cursor-pointer transform hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                    >
                      <Youtube className="h-4 w-4 fill-current" />
                      <span>Direct 1-Click Upload to YouTube</span>
                    </button>
                    <button
                      type="button"
                      id="trigger-export-video-btn"
                      onClick={() => handleExportVideo(false)}
                      disabled={!audioSrc}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-400 hover:to-purple-500 py-3 text-xs font-semibold text-white/90 shadow-lg shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Video className="h-4 w-4" />
                      <span>Render & Export MP4 Video File</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Live Canvas Video & Thumbnail Visualizer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-white/15 bg-black/60 backdrop-blur-2xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Live Canvas Preview & Audiogram Player
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="canvas-download-thumbnail-btn"
                  onClick={handleDownloadThumbnail}
                  className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1 text-xs font-semibold text-white transition-all cursor-pointer"
                  title="Download High Resolution Thumbnail"
                >
                  <Download className="h-3 w-3 text-orange-400" />
                  <span>Save Thumbnail</span>
                </button>
              </div>
            </div>

            {/* Canvas Container with fixed aspect ratio */}
            <div className="relative flex items-center justify-center rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
              <canvas
                id="audiogram-canvas"
                ref={canvasRef}
                width={aspectRatio === '16:9' ? 1280 : aspectRatio === '9:16' ? 720 : 800}
                height={aspectRatio === '16:9' ? 720 : aspectRatio === '9:16' ? 1280 : 800}
                className="w-full h-auto max-h-[480px] object-contain"
              />

              {/* Center Play overlay button if paused */}
              {!isPlaying && audioSrc && (
                <button
                  id="canvas-center-play-btn"
                  onClick={handlePlayPause}
                  className="absolute z-10 flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-2xl hover:scale-110 transition-transform cursor-pointer"
                >
                  <Play className="h-7 w-7 fill-current ml-1" />
                </button>
              )}
            </div>

            {/* Audio Playback Controls & Scrubber */}
            {audioSrc && (
              <div className="space-y-3 pt-2">
                {/* Hidden audio element */}
                <audio
                  ref={audioRef}
                  src={audioSrc}
                  onTimeUpdate={() => {
                    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                  }}
                  onLoadedMetadata={() => {
                    if (audioRef.current) setDuration(audioRef.current.duration);
                  }}
                  onEnded={handleAudioEnded}
                  crossOrigin="anonymous"
                />

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/60">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration || currentAudioItem?.duration || 0)}</span>
                  </div>
                  <input
                    id="audio-scrubber-input"
                    type="range"
                    min="0"
                    max={duration || currentAudioItem?.duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                {/* Player button bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      id="studio-play-pause-btn"
                      onClick={handlePlayPause}
                      className="flex items-center justify-center h-10 w-10 rounded-xl bg-orange-500 hover:bg-orange-400 text-white shadow-md transition-all cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5 fill-current" />
                      ) : (
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      )}
                    </button>

                    <button
                      id="studio-restart-btn"
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = 0;
                          setCurrentTime(0);
                        }
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                      title="Restart Audio"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Channel Tag info */}
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span className="font-semibold text-white/90">{channelName}</span>
                    <span>•</span>
                    <span className="text-orange-400">{aspectRatio}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* YouTube Direct Upload Modal */}
      <YouTubeUploadModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        videoBlob={exportedVideoBlob}
        videoUrl={exportedVideoUrl}
        defaultTitle={videoTitle}
        defaultDescription={videoSubtitle}
        categoryTag={categoryTag}
        aspectRatio={aspectRatio}
        scriptText={currentAudioItem?.text}
        audioItem={currentAudioItem}
        channelName={channelName}
      />
    </div>
  );
};
