import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Sparkles,
  Globe,
  Mic,
  Sliders,
  Play,
  RotateCcw,
  Languages,
  Wand2,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  Headphones,
  Music,
  Share2,
  Loader2,
  Info,
  ShieldCheck,
  Cloud,
  Film,
  Video as VideoIcon,
  BookOpen,
  Lock,
  FolderKanban,
  FolderHeart,
} from 'lucide-react';
import { VoiceSelector } from './components/VoiceSelector';
import { VoiceCustomizer } from './components/VoiceCustomizer';
import { LanguageSelector } from './components/LanguageSelector';
import { StyleSelector } from './components/StyleSelector';
import { AudioPlayer } from './components/AudioPlayer';
import { AudioHistory } from './components/AudioHistory';
import { PresetLibrary } from './components/PresetLibrary';
import { MultiSpeakerStudio } from './components/MultiSpeakerStudio';
import { VideoStudio } from './components/VideoStudio';
import { MyProjectsView } from './components/MyProjectsView';
import { AuthHeader } from './components/AuthHeader';
import { ShareModal } from './components/ShareModal';
import { WelcomeView } from './components/WelcomeView';
import { DocumentationView } from './components/DocumentationView';
import { AuthGateModal } from './components/AuthGateModal';
import { Footer } from './components/Footer';
import { VOICES, LANGUAGES, VOICE_STYLES } from './data/voices';
import { useAuth } from './lib/useAuth';
import {
  saveAudioToFirestore,
  toggleFavoriteInFirestore,
  deleteAudioFromFirestore,
  subscribeToUserAudio,
  getPublicShare,
  saveUserProject,
  deleteUserProject,
  toggleProjectFavorite,
  subscribeToUserProjects,
} from './lib/firestoreService';
import {
  VoiceProfile,
  VoiceGender,
  VoiceAgeRange,
  AudioGenerationItem,
  DialogueSpeaker,
  TextPreset,
  UserProject,
  VideoProjectConfig,
} from './types';

export default function App() {
  // Firebase Auth Hook
  const {
    user,
    loading: authLoading,
    authError,
    preferences,
    loginWithGoogle,
    logout,
    updatePreferences,
    clearError,
  } = useAuth();

  // Primary Studio State
  const [text, setText] = useState<string>(
    'Welcome to VoxAura AI Voice Studio. Experience natural, lifelike speech customized by gender, age range, speaking style, and fine-tuned pitch and speed across dozens of global languages.'
  );
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [selectedGender, setSelectedGender] = useState<VoiceGender>('Female');
  const [selectedAgeRange, setSelectedAgeRange] = useState<VoiceAgeRange>('Adult');
  const [selectedStyle, setSelectedStyle] = useState<string>('Friendly');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English (US)');
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [speechPitch, setSpeechPitch] = useState<number>(0);

  // Dialogue / Multi-speaker mode
  const [isMultiSpeaker, setIsMultiSpeaker] = useState<boolean>(false);
  const [speakers, setSpeakers] = useState<DialogueSpeaker[]>([
    { id: 'spk-1', name: 'Alex', voice: 'Kore', gender: 'Female', ageRange: 'Adult', avatarColor: 'sky' },
    { id: 'spk-2', name: 'Puck', voice: 'Puck', gender: 'Male', ageRange: 'Child', avatarColor: 'amber' },
  ]);

  // Navigation View State: 'welcome' | 'studio' | 'video' | 'docs'
  const [activeNavTab, setActiveNavTab] = useState<'welcome' | 'studio' | 'video' | 'docs'>('welcome');

  // Auth Gate Modal State
  const [isAuthGateOpen, setIsAuthGateOpen] = useState<boolean>(false);
  const [authGateFeature, setAuthGateFeature] = useState<string>('Voice Studio');

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<AudioGenerationItem | null>(null);

  // Guard helper: Enforce authentication before using any feature
  const requireAuth = (featureName = 'Voice Studio'): boolean => {
    if (!user) {
      setAuthGateFeature(featureName);
      setIsAuthGateOpen(true);
      return false;
    }
    return true;
  };

  // Video Studio configuration state
  const [videoInitialStep, setVideoInitialStep] = useState<'setup' | 'thumbnail' | 'audiogram' | 'export'>('setup');
  const [videoAutoOpenYouTube, setVideoAutoOpenYouTube] = useState<boolean>(false);

  // Quick switch to Video & Thumbnail Creator for an audio item
  const handleOpenVideoStudioForAudio = (item: AudioGenerationItem) => {
    if (!requireAuth('Video & Thumbnail Creator')) return;
    setCurrentAudio(item);
    setVideoInitialStep('setup');
    setVideoAutoOpenYouTube(false);
    setActiveNavTab('video');
  };

  // Quick direct YouTube upload for an audio item
  const handleOpenYouTubeForAudio = (item: AudioGenerationItem) => {
    if (!requireAuth('Direct YouTube Channel Publishing')) return;
    setCurrentAudio(item);
    setVideoInitialStep('export');
    setVideoAutoOpenYouTube(true);
    setActiveNavTab('video');
  };

  // Safe navigation tab switcher
  const handleSwitchNavTab = (tab: 'welcome' | 'studio' | 'video' | 'docs') => {
    if ((tab === 'studio' || tab === 'video') && !user) {
      requireAuth(tab === 'studio' ? 'Voice Studio Workspace' : 'Video & Thumbnail Studio');
      return;
    }
    if (tab === 'video') {
      setVideoAutoOpenYouTube(false);
    }
    setActiveNavTab(tab);
  };

  // Sharing Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareModalItem, setShareModalItem] = useState<AudioGenerationItem | null>(null);
  const [shareNotification, setShareNotification] = useState<string | null>(null);

  // History state (synced with Firestore when logged in, or localStorage for guests)
  const [history, setHistory] = useState<AudioGenerationItem[]>(() => {
    try {
      const saved = localStorage.getItem('vox_speech_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Check URL for public share parameter on page load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const shareId = params.get('share');
      if (shareId) {
        getPublicShare(shareId).then((sharedItem) => {
          if (sharedItem) {
            setCurrentAudio(sharedItem);
            setText(sharedItem.text);
            if (sharedItem.voice) setSelectedVoice(sharedItem.voice);
            if (sharedItem.gender) setSelectedGender(sharedItem.gender as VoiceGender);
            if (sharedItem.ageRange) setSelectedAgeRange(sharedItem.ageRange as VoiceAgeRange);
            if (sharedItem.style) setSelectedStyle(sharedItem.style);
            if (sharedItem.language) setSelectedLanguage(sharedItem.language);
            if (sharedItem.speed) setSpeechSpeed(sharedItem.speed);
            if (sharedItem.pitch !== undefined) setSpeechPitch(sharedItem.pitch);
            setActiveNavTab('studio');
            setShareNotification(
              `🎧 Shared audio track loaded (${sharedItem.voice} • ${sharedItem.language}). Press Play to listen!`
            );
          }
        }).catch((e) => console.error('Error fetching public audio share:', e));
      }
    } catch (e) {
      console.error('Failed to parse share URL param:', e);
    }
  }, []);

  // Sync user preferences on login
  useEffect(() => {
    if (user && preferences) {
      if (preferences.preferredVoice) setSelectedVoice(preferences.preferredVoice);
      if (preferences.preferredGender && preferences.preferredGender !== 'all') {
        setSelectedGender(preferences.preferredGender as VoiceGender);
      }
      if (preferences.preferredAgeRange && preferences.preferredAgeRange !== 'all') {
        setSelectedAgeRange(preferences.preferredAgeRange as VoiceAgeRange);
      }
      if (preferences.preferredStyle) setSelectedStyle(preferences.preferredStyle);
      if (preferences.preferredLanguage) setSelectedLanguage(preferences.preferredLanguage);
      if (preferences.defaultSpeed) setSpeechSpeed(preferences.defaultSpeed);
      if (preferences.defaultPitch !== undefined) setSpeechPitch(preferences.defaultPitch);
    }
  }, [user, preferences]);

  // Real-time Firestore sync for history when user is logged in
  useEffect(() => {
    if (!user) {
      // Guest mode - fallback to localStorage
      try {
        const saved = localStorage.getItem('vox_speech_history');
        if (saved) setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse local history', e);
      }
      return;
    }

    // Subscribe to Firestore audio collection
    const unsubscribe = subscribeToUserAudio(user.uid, (cloudItems) => {
      setHistory(cloudItems);
      // Also cache to local storage
      try {
        localStorage.setItem('vox_speech_history', JSON.stringify(cloudItems));
      } catch {}
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Estimated duration (approx 140 words per minute adjusted for speed)
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const rawSeconds = Math.max(1, Math.round((wordCount / 140) * 60));
  const estimatedSeconds = Math.max(1, Math.round(rawSeconds / (speechSpeed || 1.0)));

  // Reset to default voice customization
  const handleResetToDefaults = () => {
    setSelectedGender('Female');
    setSelectedAgeRange('Adult');
    setSelectedStyle('Friendly');
    setSpeechSpeed(1.0);
    setSpeechPitch(0);
    setSelectedVoice('Kore');
  };

  // Synthesize Text to Speech Handler
  const handleGenerateSpeech = async () => {
    if (!requireAuth('AI Voice Synthesis')) return;

    if (!text.trim()) {
      setErrorMessage('Please enter some text to convert to speech.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        text: text.trim(),
        voice: selectedVoice,
        gender: selectedGender,
        ageRange: selectedAgeRange,
        style: selectedStyle,
        speed: speechSpeed,
        pitch: speechPitch,
        language: selectedLanguage,
        isMultiSpeaker,
      };

      if (isMultiSpeaker) {
        payload.speakers = speakers.map((s) => ({
          name: s.name,
          voice: s.voice,
        }));
      }

      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        throw new Error(
          response.ok
            ? 'Invalid response format from audio service.'
            : `Speech generation failed (HTTP ${response.status}: ${response.statusText || 'Server Error'}).`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Speech generation failed (${response.status} ${response.statusText}).`);
      }

      const newAudioItem: AudioGenerationItem = {
        id: `vox-${Date.now()}`,
        userId: user?.uid,
        text: text.trim(),
        voice: isMultiSpeaker ? `${speakers[0].voice} & ${speakers[1].voice}` : selectedVoice,
        gender: selectedGender,
        ageRange: selectedAgeRange,
        style: selectedStyle,
        language: selectedLanguage,
        speed: speechSpeed,
        pitch: speechPitch,
        duration: data.duration || estimatedSeconds,
        wordCount: data.wordCount || wordCount,
        audioBase64: data.audioBase64,
        mimeType: data.mimeType || 'audio/wav',
        createdAt: data.createdAt || new Date().toISOString(),
        isMultiSpeaker,
        isFavorite: false,
      };

      setCurrentAudio(newAudioItem);

      // Save to Firestore if authenticated, or localStorage
      if (user) {
        await saveAudioToFirestore(user.uid, newAudioItem);
      } else {
        setHistory((prev) => {
          const updated = [newAudioItem, ...prev.slice(0, 24)];
          try {
            localStorage.setItem('vox_speech_history', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch (err: any) {
      console.error('Error generating audio:', err);
      const msg = err?.message || 'An unexpected error occurred while generating speech.';
      setErrorMessage(
        msg === 'Failed to fetch'
          ? 'Unable to connect to the audio synthesis server. Please check your connection and try again.'
          : msg
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Audition a voice sample
  const handleAuditionVoice = async (voice: VoiceProfile) => {
    if (!requireAuth('Voice Persona Audition')) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voice.sampleText,
          voice: voice.id,
          gender: voice.gender,
          ageRange: voice.ageRange,
          style: 'Friendly',
          speed: 1.0,
          pitch: 0,
          language: selectedLanguage,
        }),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        throw new Error(`Failed to audition voice sample (HTTP ${response.status}).`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to audition voice sample.');
      }

      const newAudioItem: AudioGenerationItem = {
        id: `vox-audition-${Date.now()}`,
        userId: user?.uid,
        text: voice.sampleText,
        voice: voice.name,
        gender: voice.gender,
        ageRange: voice.ageRange,
        style: 'Friendly',
        language: selectedLanguage,
        speed: 1.0,
        pitch: 0,
        duration: data.duration || 4,
        wordCount: voice.sampleText.split(/\s+/).length,
        audioBase64: data.audioBase64,
        mimeType: 'audio/wav',
        createdAt: new Date().toISOString(),
      };

      setSelectedVoice(voice.id);
      setSelectedGender(voice.gender);
      setSelectedAgeRange(voice.ageRange);
      setCurrentAudio(newAudioItem);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not audition voice sample.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Translate & Polish Text for Natural Spoken Cadence
  const handleTranslateAndInsert = async (targetLang: string) => {
    if (!requireAuth('AI Script Translation')) return;

    if (!text.trim()) return;

    setIsTranslating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/tts/translate-and-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLanguage: targetLang,
          polishMode: selectedStyle.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Translation failed.');
      }

      setText(data.resultText);
      setSelectedLanguage(targetLang);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to translate script.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Add Natural Vocal Pause to Script
  const handleAddPause = (pauseSeconds = '1.0s') => {
    setText((prev) => `${prev} [pause ${pauseSeconds}] `);
  };

  // Load Preset Template
  const handleSelectPreset = (preset: TextPreset) => {
    if (!requireAuth('Preset Script Library')) return;

    setText(preset.text);
    setSelectedVoice(preset.recommendedVoice);
    setSelectedLanguage(preset.language);
    setSelectedStyle(preset.recommendedStyle);
    if (preset.recommendedGender) setSelectedGender(preset.recommendedGender);
    if (preset.recommendedAge) setSelectedAgeRange(preset.recommendedAge);

    if (preset.id === 'dialogue-interview') {
      setIsMultiSpeaker(true);
    } else {
      setIsMultiSpeaker(false);
    }
  };

  // History controls (Firestore + local)
  const handleDeleteHistoryItem = async (id: string) => {
    if (user) {
      await deleteAudioFromFirestore(user.uid, id);
    } else {
      setHistory((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        try {
          localStorage.setItem('vox_speech_history', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const targetItem = history.find((i) => i.id === id);
    if (!targetItem) return;

    const newFav = !targetItem.isFavorite;

    if (user) {
      await toggleFavoriteInFirestore(user.uid, id, newFav);
    } else {
      setHistory((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, isFavorite: newFav } : item
        );
        try {
          localStorage.setItem('vox_speech_history', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Clear all speech recordings from your studio history?')) {
      if (user) {
        for (const item of history) {
          await deleteAudioFromFirestore(user.uid, item.id);
        }
      } else {
        setHistory([]);
        try {
          localStorage.removeItem('vox_speech_history');
        } catch {}
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-white flex flex-col font-sans antialiased selection:bg-orange-500/30 selection:text-orange-200 relative overflow-x-hidden">
      {/* Immersive Ambient Glow Orbs */}
      <div className="pointer-events-none fixed top-[-120px] left-[-120px] w-[540px] h-[540px] bg-purple-900/20 rounded-full blur-[140px] -z-10" />
      <div className="pointer-events-none fixed bottom-[-160px] right-[-120px] w-[640px] h-[640px] bg-orange-900/15 rounded-full blur-[150px] -z-10" />
      <div className="pointer-events-none fixed top-[40%] right-[10%] w-[380px] h-[380px] bg-indigo-900/10 rounded-full blur-[120px] -z-10" />

      {/* Top Navigation Bar with Authentication & Database Sync */}
      <header
        id="app-header"
        className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-md bg-black/30"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 py-3.5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-purple-600 shadow-lg shadow-orange-500/20 text-white">
              <div className="w-4 h-4 bg-white rounded-xs rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-bold tracking-tight text-white">VOXAURA</span>
                <span className="rounded-full bg-orange-500/15 border border-orange-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-orange-300 tracking-wide">
                  AI Voice Studio
                </span>
              </div>
              <p className="text-xs text-white/50 hidden sm:block">
                Multilingual neural speech synthesis with customizable voice gender, age, and style
              </p>
            </div>
          </div>

          {/* Middle/Right Header: Navigation Switcher, Badges & Auth */}
          <div className="flex items-center gap-3">
            {/* View Switcher Tabs */}
            <div className="flex items-center rounded-2xl bg-white/5 border border-white/10 p-1">
              <button
                id="nav-welcome-tab-btn"
                onClick={() => handleSwitchNavTab('welcome')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeNavTab === 'welcome'
                    ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md shadow-orange-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Welcome & Features</span>
              </button>

              <button
                id="nav-studio-tab-btn"
                onClick={() => handleSwitchNavTab('studio')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeNavTab === 'studio'
                    ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md shadow-orange-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {!user ? <Lock className="h-3 w-3 text-orange-400" /> : <Mic className="h-3.5 w-3.5" />}
                <span>Voice Studio</span>
                {!user && (
                  <span className="rounded-md bg-orange-500/20 border border-orange-500/30 px-1 py-0.2 text-[8px] font-bold text-orange-300">
                    Sign In
                  </span>
                )}
              </button>

              <button
                id="nav-video-tab-btn"
                onClick={() => handleSwitchNavTab('video')}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeNavTab === 'video'
                    ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md shadow-orange-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {!user ? <Lock className="h-3 w-3 text-orange-400" /> : <Film className="h-3.5 w-3.5 text-orange-400" />}
                <span>Video Studio</span>
                {!user ? (
                  <span className="rounded-md bg-orange-500/20 border border-orange-500/30 px-1 py-0.2 text-[8px] font-bold text-orange-300">
                    Sign In
                  </span>
                ) : (
                  <span className="ml-0.5 rounded-full bg-orange-500/30 border border-orange-500/50 px-1.5 py-0.2 text-[9px] font-extrabold text-orange-300">
                    NEW
                  </span>
                )}
              </button>

              <button
                id="nav-docs-tab-btn"
                onClick={() => handleSwitchNavTab('docs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeNavTab === 'docs'
                    ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md shadow-orange-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5 text-purple-400" />
                <span>Documentation</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80">
              <Globe className="h-3.5 w-3.5 text-orange-400" />
              <span>40+ Languages</span>
            </div>

            {/* Google Authentication & Firestore Menu */}
            <AuthHeader
              user={user}
              loading={authLoading}
              authError={authError}
              preferences={preferences}
              onLogin={loginWithGoogle}
              onLogout={logout}
              onClearError={clearError}
            />
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-8 py-8 space-y-7">
        {/* Public Shared Audio Banner */}
        {shareNotification && (
          <div
            id="shared-audio-banner"
            className="flex items-center justify-between gap-3 rounded-2xl border border-orange-500/40 bg-orange-500/10 p-4 text-orange-200 text-sm backdrop-blur-md shadow-lg shadow-orange-500/5 animate-fade-in"
          >
            <div className="flex items-center gap-2.5">
              <Share2 className="h-5 w-5 shrink-0 text-orange-400" />
              <span>{shareNotification}</span>
            </div>
            <button
              onClick={() => setShareNotification(null)}
              className="text-xs font-semibold text-orange-300 hover:text-white transition-colors cursor-pointer px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Welcome View Showcase */}
        {activeNavTab === 'welcome' && (
          <WelcomeView
            user={user}
            onEnterStudio={() => handleSwitchNavTab('studio')}
            onOpenDocs={() => setActiveNavTab('docs')}
            onRequireAuth={(feature) => requireAuth(feature)}
            onSelectSamplePreset={(preset) => {
              if (!requireAuth('Interactive Voice Presets')) return;
              setText(preset.text);
              setSelectedVoice(preset.voice);
              setSelectedLanguage(preset.language);
              setSelectedStyle(preset.style);
              setSelectedGender(preset.gender);
              setSelectedAgeRange(preset.ageRange);
              setActiveNavTab('studio');
            }}
          />
        )}

        {/* Dedicated Documentation View */}
        {activeNavTab === 'docs' && (
          <DocumentationView
            onOpenStudio={() => handleSwitchNavTab('studio')}
            onOpenVideoStudio={() => handleSwitchNavTab('video')}
          />
        )}

        {/* Studio Workspace View */}
        {activeNavTab === 'studio' && (
          <div className="space-y-7 animate-fade-in">

        {/* Error notification */}
        {errorMessage && (
          <div
            id="error-banner"
            className="flex items-start justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-rose-200 text-sm backdrop-blur-md shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold text-rose-300 hover:text-white transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Primary Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left Column: Script Editor, Voice Customizer & Controls (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Script Text Input Card */}
            <div
              id="script-editor-card"
              className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-7 shadow-2xl space-y-4 relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-400" />
                  <h2 className="text-xs uppercase tracking-[0.2em] text-white/50 font-bold">
                    Script Input
                  </h2>
                </div>

                {/* Mode Toggle: Single vs Multi-Speaker */}
                <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setIsMultiSpeaker(false)}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      !isMultiSpeaker
                        ? 'bg-white/15 text-white shadow-sm font-semibold'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    Solo Voice
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMultiSpeaker(true)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                      isMultiSpeaker
                        ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300 shadow-sm font-semibold'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    <Users className="h-3 w-3" />
                    <span>Dialogue (2-Voice)</span>
                  </button>
                </div>
              </div>

              {/* Multi-speaker Dialogue Controls if enabled */}
              {isMultiSpeaker && (
                <MultiSpeakerStudio
                  speakers={speakers}
                  onChangeSpeakers={setSpeakers}
                  dialogueText={text}
                  onChangeDialogueText={setText}
                />
              )}

              {/* Textarea */}
              <div className="relative">
                <textarea
                  id="tts-text-input"
                  rows={6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter or paste text here to convert into natural AI speech..."
                  className="w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-4 text-sm sm:text-base text-white/90 leading-relaxed placeholder:text-white/30 focus:border-orange-500/70 focus:outline-none focus:ring-1 focus:ring-orange-500/50 backdrop-blur-sm"
                />
              </div>

              {/* Script Toolbar & Stats */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-white/50">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-mono text-white/70">
                    {text.length} chars
                  </span>
                  <span>•</span>
                  <span className="font-mono">{wordCount} words</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-white/60">
                    <Clock className="h-3 w-3 text-orange-400/80" />
                    <span className="font-mono">~{estimatedSeconds}s audio</span>
                  </span>
                </div>

                {/* Quick Script Helpers */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddPause('0.8s')}
                    title="Insert natural dramatic pause into script"
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs text-white/80 transition-all font-medium cursor-pointer"
                  >
                    + Pause (0.8s)
                  </button>

                  <button
                    type="button"
                    onClick={() => setText('')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-xs text-white/50 hover:text-rose-400 transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Voice Customization Console (Gender, Age Range, Speech Speed, Pitch) */}
            {!isMultiSpeaker && (
              <VoiceCustomizer
                gender={selectedGender}
                ageRange={selectedAgeRange}
                style={selectedStyle}
                speed={speechSpeed}
                pitch={speechPitch}
                onChangeGender={(g) => {
                  setSelectedGender(g);
                  // Find first matching voice persona
                  const match = VOICES.find(
                    (v) => v.gender === g && (v.ageRange === selectedAgeRange || true)
                  );
                  if (match) setSelectedVoice(match.id);
                }}
                onChangeAgeRange={(a) => {
                  setSelectedAgeRange(a);
                  const match = VOICES.find(
                    (v) => v.ageRange === a && (v.gender === selectedGender || true)
                  );
                  if (match) setSelectedVoice(match.id);
                }}
                onChangeStyle={setSelectedStyle}
                onChangeSpeed={setSpeechSpeed}
                onChangePitch={setSpeechPitch}
                onResetToDefaults={handleResetToDefaults}
              />
            )}

            {/* Language & Dialect Selector */}
            <div className="relative z-20 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onSelectLanguage={setSelectedLanguage}
                onTranslateAndInsert={handleTranslateAndInsert}
                isTranslating={isTranslating}
              />
            </div>

            {/* Speaking Style & Emotion Delivery (8 Modes) */}
            {!isMultiSpeaker && (
              <div className="relative z-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
                <StyleSelector
                  selectedStyle={selectedStyle}
                  onSelectStyle={setSelectedStyle}
                />
              </div>
            )}

            {/* AI Voice Personas Grid */}
            {!isMultiSpeaker && (
              <div className="relative z-0 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
                <VoiceSelector
                  selectedVoice={selectedVoice}
                  selectedGender={selectedGender}
                  selectedAgeRange={selectedAgeRange}
                  onSelectVoice={setSelectedVoice}
                  onSelectGender={setSelectedGender}
                  onSelectAgeRange={setSelectedAgeRange}
                  onAuditionSample={handleAuditionVoice}
                  isGenerating={isGenerating}
                />
              </div>
            )}

            {/* Main CTA Synthesize Button */}
            <button
              id="synthesize-speech-btn"
              type="button"
              onClick={handleGenerateSpeech}
              disabled={isGenerating || !text.trim()}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 p-4 sm:p-4.5 text-base font-bold text-white shadow-xl shadow-orange-600/25 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.99] cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Synthesizing Natural Speech...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>
                    Synthesize {isMultiSpeaker ? 'Dual-Speaker Dialogue' : `${selectedVoice} (${selectedGender}, ${selectedAgeRange}) Audio`}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Audio Player & Studio Library (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Audio Studio Player with Speed & Pitch Controls */}
            <AudioPlayer
              currentAudio={currentAudio}
              onSelectVoice={setSelectedVoice}
              onCreateVideo={handleOpenVideoStudioForAudio}
              onUploadYouTube={handleOpenYouTubeForAudio}
              onShare={(item) => {
                setShareModalItem(item);
                setIsShareModalOpen(true);
              }}
            />

            {/* Generation History & Cloud Persisted Library */}
            <AudioHistory
              history={history}
              isCloudSynced={!!user}
              onPlayItem={(item) => setCurrentAudio(item)}
              onDeleteItem={handleDeleteHistoryItem}
              onToggleFavorite={handleToggleFavorite}
              onClearAll={handleClearHistory}
              onCreateVideo={handleOpenVideoStudioForAudio}
              onUploadYouTube={handleOpenYouTubeForAudio}
              onShareItem={(item) => {
                setShareModalItem(item);
                setIsShareModalOpen(true);
              }}
            />

            {/* Acoustic Standards & Cloud Persistence Info Box */}
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl space-y-3.5">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <ShieldCheck className="h-4 w-4 text-orange-400" />
                <h3 className="text-xs uppercase tracking-[0.2em] text-white/50 font-bold">
                  Studio Features & Security
                </h3>
              </div>
              <ul className="space-y-3 text-xs text-white/70">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>
                    <strong className="text-white">Firestore Cloud Persistence:</strong> Real-time storage of your audio scripts, favorite tracks, and customized voice parameters.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>
                    <strong className="text-white">Full Vocal Customization:</strong> Gender selection (Male/Female), age ranges (Child, Adult, Senior), and 8 authentic speaking styles.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>
                    <strong className="text-white">Natural Speed & Pitch Controls:</strong> Web Audio engine with pitch preservation for crisp, distortion-free playback modulation.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span>
                    <strong className="text-white">Google Authentication:</strong> Secure Google Sign-In with Firebase Auth to safeguard private audio creations.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section: Multi-Lingual Presets & Templates */}
        <div className="pt-2">
          <PresetLibrary onSelectPreset={handleSelectPreset} />
        </div>
          </div>
        )}

        {/* Video & Thumbnail Studio View */}
        {activeNavTab === 'video' && (
          <VideoStudio
            currentAudioItem={currentAudio}
            audioHistory={history}
            onSelectHistoryAudio={(item) => setCurrentAudio(item)}
            onNavigateToVoiceStudio={() => setActiveNavTab('studio')}
            initialStep={videoInitialStep}
            autoOpenYouTube={videoAutoOpenYouTube}
          />
        )}
      </main>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareModalOpen}
        audioItem={shareModalItem}
        creatorName={user?.displayName || 'VoxAura Creator'}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareModalItem(null);
        }}
      />

      {/* Auth Gate Modal (Required before accessing features) */}
      <AuthGateModal
        isOpen={isAuthGateOpen}
        onClose={() => setIsAuthGateOpen(false)}
        onLogin={loginWithGoogle}
        featureName={authGateFeature}
        loading={authLoading}
      />

      {/* Crafted Footer */}
      <Footer onNavigateToDocs={() => setActiveNavTab('docs')} />
    </div>
  );
}
