import React, { useState, useEffect } from 'react';
import {
  Youtube,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  Globe,
  EyeOff,
  UserCheck,
  RefreshCw,
  Sparkles,
  X,
  Radio,
  Tv,
  Download,
  ShieldAlert,
  Film,
  Wand2,
  Hash,
  Copy,
  Check,
  Tag,
  TrendingUp,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getYouTubeAccessToken,
  fetchMyYouTubeChannel,
  uploadVideoToYouTube,
  YouTubeChannelInfo,
  YouTubeUploadResult,
  YouTubeServiceError,
} from '../lib/youtubeService';
import { AudioGenerationItem } from '../types';

interface YouTubeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoBlob: Blob | null;
  videoUrl: string | null;
  defaultTitle: string;
  defaultDescription: string;
  categoryTag?: string;
  aspectRatio: string;
  scriptText?: string;
  audioItem?: AudioGenerationItem | null;
  channelName?: string;
}

interface YouTubeSeoResult {
  primaryTitle: string;
  titles: string[];
  description: string;
  hashtags: string[];
  searchTags: string[];
  seoFocusScore: number;
  targetKeywords: string[];
  hookSummary: string;
}

export const YouTubeUploadModal: React.FC<YouTubeUploadModalProps> = ({
  isOpen,
  onClose,
  videoBlob,
  videoUrl,
  defaultTitle,
  defaultDescription,
  categoryTag,
  aspectRatio,
  scriptText,
  audioItem,
  channelName = 'VoxAura Channel',
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [channel, setChannel] = useState<YouTubeChannelInfo | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [apiActivationUrl, setApiActivationUrl] = useState<string | null>(null);
  const [isApiDisabled, setIsApiDisabled] = useState<boolean>(false);

  // Form fields
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [privacyStatus, setPrivacyStatus] = useState<'public' | 'unlisted' | 'private'>('public');
  const [tagsInput, setTagsInput] = useState<string>('VoxAura, AIVoice, Audiogram, UrduTTS, Podcast');
  const [madeForKids, setMadeForKids] = useState<boolean>(false);

  // AI SEO Optimizer state
  const [isGeneratingSeo, setIsGeneratingSeo] = useState<boolean>(false);
  const [seoResult, setSeoResult] = useState<YouTubeSeoResult | null>(null);
  const [seoError, setSeoError] = useState<string | null>(null);
  const [seoTone, setSeoTone] = useState<'engaging' | 'educational' | 'storytelling' | 'viral_shorts'>('engaging');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showAdvancedSeo, setShowAdvancedSeo] = useState<boolean>(true);

  // Upload progress state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<YouTubeUploadResult | null>(null);

  // Derive active script text
  const currentScript = scriptText || audioItem?.text || defaultDescription || defaultTitle;
  const currentVoice = audioItem?.voice || 'Kore';
  const currentLanguage = audioItem?.language || 'English';

  // Initialize form fields when opening
  useEffect(() => {
    if (isOpen) {
      const isShort = aspectRatio === '9:16';
      const cleanTitle = defaultTitle
        ? `${defaultTitle.slice(0, 80)}${isShort && !defaultTitle.includes('#Shorts') ? ' #Shorts' : ''}`
        : `AI Neural Voice Audiogram ${isShort ? '#Shorts' : ''}`;
      setTitle(cleanTitle);

      const cleanDesc = defaultDescription
        ? `${defaultDescription}\n\n🎙️ Synthesized with VoxAura AI Studio (Multilingual 24kHz Neural TTS)`
        : 'Generated with VoxAura Multilingual Voice & Video Studio.';
      setDescription(cleanDesc);

      setUploadResult(null);
      setUploadError(null);
      setUploadProgress(0);
      setAuthError(null);
      setIsApiDisabled(false);
      setApiActivationUrl(null);
      setSeoResult(null);
      setSeoError(null);
    }
  }, [isOpen, defaultTitle, defaultDescription, aspectRatio]);

  // AI SEO Generator
  const handleGenerateSeo = async () => {
    setIsGeneratingSeo(true);
    setSeoError(null);

    try {
      const res = await fetch('/api/video/generate-youtube-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: currentScript,
          currentTitle: title || defaultTitle,
          channelName: channel?.title || channelName,
          voice: currentVoice,
          language: currentLanguage,
          aspectRatio,
          style: seoTone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.seo) {
        throw new Error(data.error || 'Failed to generate SEO metadata.');
      }

      const seo: YouTubeSeoResult = data.seo;
      setSeoResult(seo);

      // Auto-apply optimized fields
      if (seo.primaryTitle) {
        setTitle(seo.primaryTitle);
      }
      if (seo.description) {
        setDescription(seo.description);
      }
      if (seo.searchTags && seo.searchTags.length > 0) {
        setTagsInput(seo.searchTags.join(', '));
      }
    } catch (err: any) {
      console.error('SEO generation failed:', err);
      setSeoError(err.message || 'Failed to generate SEO suggestions. Please retry.');
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  const handleCopyText = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  const handleToggleHashtag = (tag: string) => {
    const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
    if (description.includes(formattedTag)) {
      setDescription((prev) => prev.replace(new RegExp(`\\s*${formattedTag}\\b`, 'g'), '').trim());
    } else {
      setDescription((prev) => `${prev.trim()} ${formattedTag}`);
    }
  };

  // Attempt to check if token exists or prompt user
  const handleConnectYouTube = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    setIsApiDisabled(false);
    setApiActivationUrl(null);

    try {
      const accessToken = await getYouTubeAccessToken(true);
      setToken(accessToken);
      try {
        const ch = await fetchMyYouTubeChannel(accessToken);
        setChannel(ch);
      } catch (chErr: any) {
        if (chErr instanceof YouTubeServiceError && chErr.isServiceDisabled) {
          setIsApiDisabled(true);
          setApiActivationUrl(chErr.activationUrl || 'https://console.cloud.google.com/apis/library/youtube.googleapis.com');
          setAuthError('YouTube Data API v3 needs to be enabled in your Google Cloud Project.');
        } else {
          // If channel details cannot be fetched, keep token connected so upload can proceed
          setChannel({
            id: 'my-channel',
            title: 'Connected YouTube Account',
            description: 'Google Account authenticated with YouTube upload permissions',
            thumbnailUrl: '',
          });
        }
      }
    } catch (err: any) {
      console.warn('YouTube auth connection notice:', err);
      if (err instanceof YouTubeServiceError && err.isServiceDisabled) {
        setIsApiDisabled(true);
        setApiActivationUrl(err.activationUrl || 'https://console.cloud.google.com/apis/library/youtube.googleapis.com');
        setAuthError('YouTube Data API v3 needs to be enabled in your Google Cloud Project.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing YouTube authorization.');
      } else {
        setAuthError(err?.message || 'Failed to authorize YouTube access.');
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleDownloadVideo = () => {
    if (!videoBlob) return;
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50) || 'voxaura_video';
    a.download = `${safeTitle}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleStartUpload = async () => {
    if (!videoBlob) {
      setUploadError('No rendered video blob available. Please render your video first.');
      return;
    }

    if (!token) {
      await handleConnectYouTube();
      return;
    }

    if (!title.trim()) {
      setUploadError('Please provide a title for your YouTube video.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setIsApiDisabled(false);
    setUploadProgress(5);
    setUploadStatusText('Starting direct upload to your YouTube channel...');

    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const result = await uploadVideoToYouTube(
        token,
        {
          title: title.trim(),
          description: description.trim(),
          tags: parsedTags,
          privacyStatus,
          videoBlob,
          madeForKids,
        },
        (progress, status) => {
          setUploadProgress(progress);
          setUploadStatusText(status);
        }
      );

      setUploadResult(result);
      setIsUploading(false);
      setUploadProgress(100);
    } catch (err: any) {
      console.warn('Direct YouTube upload notice:', err);
      setIsUploading(false);
      if (err instanceof YouTubeServiceError && err.isServiceDisabled) {
        setIsApiDisabled(true);
        setApiActivationUrl(err.activationUrl || 'https://console.cloud.google.com/apis/library/youtube.googleapis.com');
        setUploadError(
          'YouTube Data API v3 is not enabled in your Google Cloud project. Enable it using the link below to allow direct uploads.'
        );
      } else {
        setUploadError(err?.message || 'Failed to upload video to YouTube. Please verify permissions.');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/20 bg-gradient-to-b from-[#180d26] via-[#11091d] to-[#0a0512] p-5 sm:p-7 shadow-2xl text-white my-6 max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isUploading}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer disabled:opacity-50 z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-white/10">
          <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 shadow-lg shadow-red-500/20 shrink-0">
            <Youtube className="h-6 w-6 fill-current" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Direct Upload & SEO Publisher</span>
              <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-extrabold text-red-400">
                Official API
              </span>
            </h2>
            <p className="text-xs text-white/60">
              Optimize description, ranked hashtags, and upload directly to your YouTube channel.
            </p>
          </div>
        </div>

        {/* API Activation Guidance Box when YouTube Data API is disabled in Cloud Console */}
        {isApiDisabled && apiActivationUrl && (
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 to-orange-950/60 border border-amber-500/50 space-y-3 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-amber-200">1-Time Setup: Enable YouTube Data API in Google Cloud</h3>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  Google requires the <strong>YouTube Data API v3</strong> to be turned ON in your Google Cloud Project before third-party apps can publish videos on your behalf.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <a
                href={apiActivationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <span>Enable YouTube API in Google Console</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button
                type="button"
                onClick={handleConnectYouTube}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>I've Enabled It (Retry)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDownloadVideo();
                  window.open('https://studio.youtube.com/channel/upload', '_blank');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-600/20 hover:bg-red-600/30 px-3.5 py-2 text-xs font-semibold text-red-300 hover:text-white transition-all cursor-pointer ml-auto"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download MP4 & Open YouTube Studio</span>
              </button>
            </div>
          </div>
        )}

        {/* Channel Status Banner */}
        <div className="mt-4">
          {!channel ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Connect YouTube Account</div>
                  <div className="text-[11px] text-white/70">
                    Authorize VoxAura to publish videos directly to your channel.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleConnectYouTube}
                disabled={isLoadingAuth}
                className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {isLoadingAuth ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Youtube className="h-4 w-4 fill-current" />
                    <span>Connect Channel</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                {channel.thumbnailUrl ? (
                  <img
                    src={channel.thumbnailUrl}
                    alt={channel.title}
                    className="h-9 w-9 rounded-full border border-white/20 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <Tv className="h-4 w-4" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{channel.title}</span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                  </div>
                  <div className="text-[11px] text-white/50">
                    {channel.subscriberCount ? `${parseInt(channel.subscriberCount).toLocaleString()} subscribers • ` : ''}
                    Connected & Verified
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConnectYouTube}
                className="flex items-center gap-1 text-[11px] text-white/60 hover:text-white underline cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Switch Channel</span>
              </button>
            </div>
          )}
        </div>

        {authError && !isApiDisabled && (
          <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Upload Success View */}
        {uploadResult ? (
          <div className="mt-6 p-6 rounded-2xl bg-green-950/40 border border-green-500/40 space-y-4 text-center animate-fade-in">
            <div className="inline-flex p-3 rounded-full bg-green-500/20 text-green-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Successfully Uploaded to YouTube!</h3>
              <p className="text-xs text-white/70 max-w-md mx-auto">
                Your video has been published to <strong className="text-white">{uploadResult.channelTitle || channel?.title || 'YouTube'}</strong>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-orange-300 break-all">
              {uploadResult.videoUrl}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={uploadResult.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-600/30 transition-all"
              >
                <Youtube className="h-4 w-4 fill-current" />
                <span>Watch on YouTube</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          /* Form Controls & AI SEO Suite */
          <div className="mt-5 space-y-5">
            {/* AI SEO Planner Assistant Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/40 via-purple-950/40 to-slate-900/60 border border-orange-500/30 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>AI YouTube SEO Optimizer</span>
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        Gemini 3.7
                      </span>
                    </h3>
                    <p className="text-[11px] text-white/60">
                      Crafts high-CTR titles, structured descriptions, chapters, and viral hashtags based on audio.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={seoTone}
                    onChange={(e) => setSeoTone(e.target.value as any)}
                    className="rounded-xl border border-white/15 bg-black/60 px-2.5 py-1.5 text-xs text-white outline-none focus:border-orange-500"
                  >
                    <option value="engaging">🔥 Engaging / High CTR</option>
                    <option value="viral_shorts">⚡ Viral Shorts / Reels</option>
                    <option value="educational">🎓 Educational & Search</option>
                    <option value="storytelling">📖 Storytelling & Drama</option>
                  </select>

                  <button
                    type="button"
                    id="generate-seo-package-btn"
                    onClick={handleGenerateSeo}
                    disabled={isGeneratingSeo}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    {isGeneratingSeo ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Optimizing...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-3.5 w-3.5" />
                        <span>Generate SEO Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {seoError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-[11px] text-red-300">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{seoError}</span>
                </div>
              )}

              {/* SEO Generated Result Insights */}
              {seoResult && (
                <div className="pt-2 border-t border-white/10 space-y-3 animate-fade-in">
                  {/* SEO Score and Keywords */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 font-bold text-green-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>SEO Score: {seoResult.seoFocusScore}/100</span>
                      </div>
                      <span className="text-white/30">•</span>
                      <span className="text-[11px] text-white/70 italic">"{seoResult.hookSummary}"</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-white/40">Target Keywords:</span>
                      {seoResult.targetKeywords?.map((kw, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] text-orange-200 border border-white/10"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Title Recommendations */}
                  {seoResult.titles && seoResult.titles.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-orange-300 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" />
                        <span>Select High-Ranking Title Variation:</span>
                      </label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {seoResult.titles.map((t, idx) => {
                          const isSelected = title === t;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setTitle(t)}
                              className={`flex items-center justify-between text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-orange-500/20 border-orange-500 text-orange-200 ring-1 ring-orange-500/30'
                                  : 'bg-black/30 border-white/10 text-white/80 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <span className="font-medium pr-2 truncate">{t}</span>
                              <span className="text-[10px] font-mono text-white/40 shrink-0">
                                {idx === 0 ? '🏆 Search SEO' : idx === 1 ? '🔥 High CTR' : '⚡ Viral'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Hashtags Explorer & 1-Click Toggle */}
                  {seoResult.hashtags && seoResult.hashtags.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-orange-300">
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          <span>Ranked YouTube Hashtags (Click to toggle in description):</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const tagsStr = seoResult.hashtags.join(' ');
                            setDescription((prev) => `${prev.trim()}\n\n${tagsStr}`);
                          }}
                          className="text-[10px] text-orange-400 hover:text-orange-300 underline cursor-pointer"
                        >
                          Append All Hashtags
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {seoResult.hashtags.map((tag, i) => {
                          const formatted = tag.startsWith('#') ? tag : `#${tag}`;
                          const isIncluded = description.includes(formatted);
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleToggleHashtag(formatted)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                isIncluded
                                  ? 'bg-orange-500/25 border-orange-400 text-orange-200'
                                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              <Hash className="h-3 w-3" />
                              <span>{formatted.replace('#', '')}</span>
                              {isIncluded && <Check className="h-2.5 w-2.5 ml-0.5 text-orange-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Video Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                  <span>Video Title</span>
                  <span className="text-[10px] text-white/40">({title.length}/100 chars)</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleCopyText(title, 'title')}
                  className="flex items-center gap-1 text-[10px] text-white/50 hover:text-white cursor-pointer"
                >
                  {copiedSection === 'title' ? (
                    <>
                      <Check className="h-3 w-3 text-green-400" />
                      <span className="text-green-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Title</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                value={title}
                maxLength={100}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., The Future of AI Speech & Voices #Shorts"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
              />
            </div>

            {/* Video Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                  <span>SEO Description & Script Transcript</span>
                  <span className="text-[10px] text-white/40">({description.length}/5000 chars)</span>
                </label>
                <button
                  type="button"
                  onClick={() => handleCopyText(description, 'desc')}
                  className="flex items-center gap-1 text-[10px] text-white/50 hover:text-white cursor-pointer"
                >
                  {copiedSection === 'desc' ? (
                    <>
                      <Check className="h-3 w-3 text-green-400" />
                      <span className="text-green-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Description</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={description}
                rows={5}
                maxLength={5000}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add structured description, takeaways, audio details, and links..."
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-y"
              />
            </div>

            {/* Privacy & Tags Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Privacy Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80">Visibility & Privacy</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'public', label: 'Public', icon: Globe },
                    { id: 'unlisted', label: 'Unlisted', icon: EyeOff },
                    { id: 'private', label: 'Private', icon: Lock },
                  ].map((p) => {
                    const Icon = p.icon;
                    const isSel = privacyStatus === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPrivacyStatus(p.id as any)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                          isSel
                            ? 'bg-red-500/20 border-red-500 text-red-300 ring-1 ring-red-500/30'
                            : 'bg-black/30 border-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 mb-1" />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white/80 flex items-center gap-1">
                    <Tag className="h-3 w-3 text-orange-400" />
                    <span>Search Tags (comma separated)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleCopyText(tagsInput, 'tags')}
                    className="text-[10px] text-white/50 hover:text-white cursor-pointer flex items-center gap-1"
                  >
                    {copiedSection === 'tags' ? (
                      <>
                        <Check className="h-3 w-3 text-green-400" />
                        <span className="text-green-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="VoxAura, AIVoice, NeuralTTS, Audiogram, Shorts"
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-xs text-white placeholder-white/40 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
                />
              </div>
            </div>

            {/* Made for Kids Checkbox */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-black/20 border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={madeForKids}
                onChange={(e) => setMadeForKids(e.target.checked)}
                className="h-4 w-4 rounded accent-red-500 cursor-pointer"
              />
              <div className="text-[11px] text-white/80">
                <span>Set as "Made for Kids" (COPPA Compliance)</span>
                <p className="text-[10px] text-white/40">Leave unchecked for general audience</p>
              </div>
            </label>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-center justify-between text-xs text-red-300 font-bold">
                  <div className="flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 animate-pulse" />
                    <span>{uploadStatusText}</span>
                  </div>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-black/50 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadError && !isApiDisabled && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleDownloadVideo}
                disabled={!videoBlob}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Save MP4 Locally</span>
              </button>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUploading}
                  className="rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-white/70 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  id="modal-start-youtube-upload-btn"
                  onClick={handleStartUpload}
                  disabled={isUploading || !videoBlob}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-6 py-2.5 text-xs font-bold text-white shadow-xl shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Uploading Video...</span>
                    </>
                  ) : (
                    <>
                      <Youtube className="h-4 w-4 fill-current" />
                      <span>Publish Video to YouTube</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

