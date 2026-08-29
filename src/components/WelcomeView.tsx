import React, { useState } from 'react';
import {
  Mic,
  Sparkles,
  Volume2,
  Globe,
  Users,
  Sliders,
  Share2,
  Play,
  ArrowRight,
  Headphones,
  Zap,
  CheckCircle2,
  Cloud,
  Layers,
  Radio,
  ExternalLink,
  Mail,
  Music,
  BookOpen,
  Lock,
  Film,
  Youtube,
} from 'lucide-react';
import { VOICES, LANGUAGES } from '../data/voices';
import { User } from '../lib/firebase';

interface WelcomeViewProps {
  user: User | null;
  onEnterStudio: () => void;
  onOpenDocs: () => void;
  onRequireAuth: (featureName: string) => void;
  onSelectSamplePreset: (preset: {
    text: string;
    voice: string;
    language: string;
    style: string;
    gender: 'Male' | 'Female';
    ageRange: 'Child' | 'Adult' | 'Senior';
  }) => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  user,
  onEnterStudio,
  onOpenDocs,
  onRequireAuth,
  onSelectSamplePreset,
}) => {
  const [activeDemoTab, setActiveDemoTab] = useState<number>(0);

  const handleLaunchStudioAction = () => {
    if (!user) {
      onRequireAuth('Voice Studio Workspace');
      return;
    }
    onEnterStudio();
  };

  const handleTryDemoAction = (demo: any) => {
    if (!user) {
      onRequireAuth('Voice Studio & Interactive Presets');
      return;
    }
    onSelectSamplePreset(demo);
    onEnterStudio();
  };

  const sampleDemos = [
    {
      title: 'Global Tech Keynote',
      language: 'English (US)',
      voice: 'Puck',
      gender: 'Male' as const,
      ageRange: 'Adult' as const,
      style: 'Professional',
      badge: 'Conference Keynote',
      text: 'Welcome everyone! Today we are thrilled to unveil our next-generation neural speech technology, connecting voices across forty languages effortlessly.',
    },
    {
      title: 'Serene Meditation Guide',
      language: 'English (UK)',
      voice: 'Aoede',
      gender: 'Female' as const,
      ageRange: 'Adult' as const,
      style: 'Whisper',
      badge: 'Mindfulness & Calm',
      text: 'Close your eyes, breathe in deeply through your nose, and feel the calm silence washing over your body. You are safe, relaxed, and present.',
    },
    {
      title: 'Energetic Sports Broadcast',
      language: 'English (US)',
      voice: 'Fenrir',
      gender: 'Male' as const,
      ageRange: 'Adult' as const,
      style: 'Energetic',
      badge: 'Live Commentary',
      text: 'Down to the final three seconds on the game clock! He steps back, launches the deep three-pointer at the buzzer... and it is IN!',
    },
    {
      title: 'Warm Fairy Tale Storyteller',
      language: 'French (France)',
      voice: 'Kore',
      gender: 'Female' as const,
      ageRange: 'Adult' as const,
      style: 'Storytelling',
      badge: 'Audiobook & Novel',
      text: 'Il était une fois, au cœur d’une forêt enchantée, un arbre magique dont les feuilles chantaient sous la douce lueur des étoiles dorées.',
    },
    {
      title: 'Empathetic Customer Care',
      language: 'Spanish (Spain)',
      voice: 'Kore',
      gender: 'Female' as const,
      ageRange: 'Adult' as const,
      style: 'Friendly',
      badge: 'Client Support',
      text: '¡Hola! Entiendo perfectamente tu consulta. No te preocupes, resolveremos cada detalle juntos con la mayor rapidez posible.',
    },
    {
      title: 'اردو کلاسک ادب و شاعری (Urdu Poetry & Narration)',
      language: 'Urdu',
      voice: 'Charon',
      gender: 'Male' as const,
      ageRange: 'Senior' as const,
      style: 'Storyteller',
      badge: 'Urdu Literature',
      text: 'ستاروں سے آگے جہاں اور بھی ہیں، ابھی عشق کے امتحان اور بھی ہیں۔ تہذیب و ادب کی شائستگی اور الفاظ کا حسن جب زندہ آواز میں ڈھلتا ہے۔',
    },
  ];

  const features = [
    {
      icon: <Globe className="h-6 w-6 text-orange-400" />,
      title: '40+ World Languages',
      desc: 'Multilingual neural synthesis supporting English, Spanish, French, German, Japanese, Urdu, Arabic, Hindi, and more with natural local accents.',
    },
    {
      icon: <Sliders className="h-6 w-6 text-purple-400" />,
      title: 'Granular Voice Customization',
      desc: 'Fine-tune gender (Male/Female), age bracket (Child/Adult/Senior), and 8 authentic emotional styles from Whisper to Energetic.',
    },
    {
      icon: <Users className="h-6 w-6 text-emerald-400" />,
      title: 'Multi-Speaker Dialogue Studio',
      desc: 'Create dynamic multi-character scripts, podcast conversations, and dramatic scene dialogues with independent actor voice assignments.',
    },
    {
      icon: <Youtube className="h-6 w-6 text-red-500" />,
      title: 'Direct 1-Click YouTube Upload',
      desc: 'Generate animated soundwave audiograms, YouTube Shorts (9:16), or landscape podcasts (16:9) and publish directly to your YouTube channel via Google OAuth.',
    },
    {
      icon: <Share2 className="h-6 w-6 text-sky-400" />,
      title: 'Public Links & Social Sharing',
      desc: 'Generate instant public share URLs, embed responsive iframe players into your website or blog, and share directly to X, WhatsApp, and LinkedIn.',
    },
    {
      icon: <Cloud className="h-6 w-6 text-amber-400" />,
      title: 'Firebase Cloud Persistence',
      desc: 'Keep all your synthesized audio tracks, starred favorites, and voice customizer settings safely synced to your Google account.',
    },
    {
      icon: <Headphones className="h-6 w-6 text-rose-400" />,
      title: '24kHz Audio & Waveform',
      desc: 'Studio-grade 24kHz WAV outputs with real-time dynamic frequency visualizers, pitch preservation, and precision playback speed modulation.',
    },
  ];

  const currentDemo = sampleDemos[activeDemoTab];

  return (
    <div id="welcome-page-container" className="space-y-12 animate-fade-in">
      {/* Hero Showcase Section */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] via-white/[0.02] to-transparent p-6 sm:p-10 lg:p-14 shadow-2xl backdrop-blur-xl">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-orange-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-purple-600/20 blur-[100px]" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Hero Left Column: Copy & Actions */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-300">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-orange-400" />
              <span>Next-Gen Neural Speech Synthesis Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Transform Your Words Into{' '}
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-purple-400 bg-clip-text text-transparent">
                Human-Quality Voice
              </span>{' '}
              Instantly.
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-2xl">
              Welcome to <strong>VOXAURA AI Voice Studio</strong>. Synthesize lifelike speech across 40+ global languages with customizable gender, age brackets, expressive speaking styles, multi-speaker dialogue composition, and instant cloud sharing.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="welcome-enter-studio-cta"
                onClick={handleLaunchStudioAction}
                className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-purple-600 hover:from-orange-400 hover:to-purple-500 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-orange-500/25 transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                {!user ? <Lock className="h-4 w-4 text-orange-200" /> : <Mic className="h-4 w-4" />}
                <span>{user ? 'Open Voice Studio Workspace' : 'Sign In to Access Studio'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                id="welcome-try-preset-cta"
                onClick={() => handleTryDemoAction(currentDemo)}
                className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 hover:bg-white/15 px-5 py-3.5 text-sm font-semibold text-white transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 text-orange-400" />
                <span>Try Active Demo Script</span>
              </button>

              <button
                id="welcome-read-docs-cta"
                onClick={onOpenDocs}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 hover:bg-white/10 px-4 py-3.5 text-sm font-medium text-white/80 hover:text-white transition-all cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-purple-400" />
                <span>View Documentation</span>
              </button>
            </div>

            {/* Key Trust Signals */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
              <div>
                <div className="font-bold text-white text-base">40+</div>
                <div className="text-white/50">Global Locales</div>
              </div>
              <div>
                <div className="font-bold text-white text-base">24kHz</div>
                <div className="text-white/50">Studio Audio Quality</div>
              </div>
              <div>
                <div className="font-bold text-white text-base">Cloud Synced</div>
                <div className="text-white/50">Firebase Real-time</div>
              </div>
            </div>
          </div>

          {/* Hero Right Column: Interactive Script Preview Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-white/15 bg-[#0e0e13]/90 p-5 sm:p-6 shadow-2xl backdrop-blur-2xl space-y-4">
              {/* Header inside card */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                  </div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Interactive Audio Showcase
                  </span>
                </div>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-mono text-orange-300">
                  {currentDemo.language}
                </span>
              </div>

              {/* Demo selector pill tabs */}
              <div className="flex flex-wrap gap-1.5">
                {sampleDemos.map((demo, idx) => (
                  <button
                    key={demo.title}
                    onClick={() => setActiveDemoTab(idx)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                      activeDemoTab === idx
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {demo.title}
                  </button>
                ))}
              </div>

              {/* Script display box */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-300">Voice: {currentDemo.voice}</span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/60">{currentDemo.gender}, {currentDemo.ageRange}</span>
                  </div>
                  <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] text-purple-300">
                    {currentDemo.style}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-white/90 italic leading-relaxed">
                  &ldquo;{currentDemo.text}&rdquo;
                </p>

                {/* Simulated Audio Waveform visualization */}
                <div className="flex items-center justify-between gap-1 h-7 pt-1 px-1">
                  {[40, 65, 30, 85, 95, 55, 75, 45, 90, 60, 35, 80, 100, 70, 50, 65, 85, 40, 75, 90, 45, 60, 80, 55].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="flex-1 rounded-full bg-gradient-to-t from-orange-500 to-purple-400 opacity-80"
                    />
                  ))}
                </div>
              </div>

              {/* Load & Synthesize Button */}
              <button
                id="load-demo-to-workspace-btn"
                onClick={() => {
                  onSelectSamplePreset(currentDemo);
                  onEnterStudio();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-orange-500 hover:text-white border border-white/15 p-3 text-xs font-bold text-white transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <Play className="h-4 w-4 text-orange-400 group-hover:text-white" />
                <span>Load This Preset & Synthesize Live</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Studio Capabilities Grid */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300">
            <Layers className="h-3.5 w-3.5" />
            <span>Engineered for Creators & Teams</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Everything You Need for High-Fidelity Audio
          </h2>
          <p className="text-xs sm:text-sm text-white/60">
            From single-sentence voiceovers to multi-character podcasts, VOXAURA delivers deep customization and seamless workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] p-6 space-y-3 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                {item.icon}
              </div>
              <h3 className="text-base font-bold text-white">{item.title}</h3>
              <p className="text-xs text-white/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3-Step Simple Workflow */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-orange-950/20 via-purple-950/20 to-black/40 p-6 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-white">How It Works in 3 Simple Steps</h2>
          <p className="text-xs text-white/50">Go from raw text transcript to polished studio audio in seconds</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-xs font-bold text-white">
              1
            </div>
            <h4 className="text-sm font-bold text-white">Enter Script & Choose Language</h4>
            <p className="text-xs text-white/60">
              Type or paste your text transcript, and select from 40+ supported world languages and regional dialects.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-xs font-bold text-white">
              2
            </div>
            <h4 className="text-sm font-bold text-white">Customize Voice Identity & Style</h4>
            <p className="text-xs text-white/60">
              Select gender, age brackets, vocal speed, pitch tuning, and emotional tone from Whisper to Energetic.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white">
              3
            </div>
            <h4 className="text-sm font-bold text-white">Synthesize, Play & Share</h4>
            <p className="text-xs text-white/60">
              Listen to the 24kHz audio in real time, download the WAV file, or generate a public share link instantly.
            </p>
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={handleLaunchStudioAction}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-purple-600 hover:brightness-110 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
          >
            {!user ? <Lock className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            <span>{user ? 'Launch Studio Workspace Now' : 'Sign In to Access Studio'}</span>
          </button>
        </div>
      </section>

      {/* Developer & Creator Spotlight Banner */}
      <section className="rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-purple-500/5 to-transparent p-6 sm:p-8 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-purple-600 text-white font-bold text-xl shadow-lg shadow-orange-500/30">
              MT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">Built by Muhammad Talha</span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  Lead Engineer
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Full-Stack AI Application Developer & Audio Architect
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="mailto:mtalham99786@gmail.com"
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
            >
              <Mail className="h-3.5 w-3.5 text-orange-400" />
              <span>Email</span>
            </a>

            <a
              href="https://www.linkedin.com/in/muhammad-talha12b"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-[#0A66C2]/40 bg-[#0A66C2]/20 hover:bg-[#0A66C2]/30 px-3.5 py-2 text-xs font-semibold text-[#70b5f9] transition-colors"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              <span>LinkedIn Profile</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>

            <a
              href="https://github.com/tal123ph"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/50 hover:bg-black/80 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub Repository</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
