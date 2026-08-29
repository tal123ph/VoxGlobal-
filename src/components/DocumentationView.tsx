import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  Sparkles,
  Mic,
  Sliders,
  Users,
  Globe,
  Film,
  Cloud,
  Lock,
  Copy,
  Check,
  ChevronRight,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Play,
  Terminal,
  Layers,
  HelpCircle,
  Clock,
  Radio,
} from 'lucide-react';
import { VOICES, LANGUAGES, VOICE_STYLES } from '../data/voices';

interface DocumentationViewProps {
  onOpenStudio: () => void;
  onOpenVideoStudio: () => void;
}

export const DocumentationView: React.FC<DocumentationViewProps> = ({
  onOpenStudio,
  onOpenVideoStudio,
}) => {
  const [activeDocSection, setActiveDocSection] = useState<string>('getting-started');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const sections = [
    { id: 'getting-started', title: '1. Getting Started & Auth Gate', icon: <Lock className="h-4 w-4 text-orange-400" /> },
    { id: 'multilingual-synthesis', title: '2. 40+ Languages & Urdu', icon: <Globe className="h-4 w-4 text-emerald-400" /> },
    { id: 'voice-customization', title: '3. Voice Styles, Gender & Age', icon: <Sliders className="h-4 w-4 text-purple-400" /> },
    { id: 'multi-speaker', title: '4. Multi-Speaker Dialogue Mode', icon: <Users className="h-4 w-4 text-sky-400" /> },
    { id: 'video-studio', title: '5. Video & Motion Waveforms', icon: <Film className="h-4 w-4 text-amber-400" /> },
    { id: 'translation-engine', title: '6. Translation & Polish Engine', icon: <Sparkles className="h-4 w-4 text-rose-400" /> },
    { id: 'cloud-persistence', title: '7. Cloud Sync & Share Links', icon: <Cloud className="h-4 w-4 text-cyan-400" /> },
    { id: 'api-reference', title: '8. Developer REST API Reference', icon: <Code2 className="h-4 w-4 text-orange-400" /> },
    { id: 'best-practices', title: '9. Best Practices & Script Pacing', icon: <HelpCircle className="h-4 w-4 text-lime-400" /> },
  ];

  const curlTtsExample = `curl -X POST https://ais-dev-abk3srn3octgrz4qqrwuog-207592235163.asia-southeast1.run.app/api/tts/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "ستاروں سے آگے جہاں اور بھی ہیں، ابھی عشق کے امتحان اور بھی ہیں۔",
    "voice": "Charon",
    "gender": "Male",
    "ageRange": "Senior",
    "style": "Storyteller",
    "language": "Urdu",
    "speed": 1.0,
    "pitch": 0
  }'`;

  const fetchTtsExample = `const response = await fetch('/api/tts/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Experience lifelike neural voice synthesis.",
    voice: "Kore",
    gender: "Female",
    ageRange: "Adult",
    style: "Friendly",
    language: "English (US)",
    speed: 1.0,
    pitch: 0
  })
});

const data = await response.json();
if (data.success) {
  const audio = new Audio(\`data:\${data.mimeType};base64,\${data.audioBase64}\`);
  audio.play();
}`;

  const dialogueExample = `// Multi-speaker conversation request
const response = await fetch('/api/tts/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Alex: Good morning Puck, how is the audio model performing?\\nPuck: Outstanding Alex! 24kHz clarity with zero latency.",
    isMultiSpeaker: true,
    speakers: [
      { name: "Alex", voice: "Kore" },
      { name: "Puck", voice: "Puck" }
    ]
  })
});`;

  const filteredSections = searchQuery.trim()
    ? sections.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sections;

  return (
    <div id="documentation-page" className="space-y-8 animate-fade-in text-white text-left">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.08] via-white/[0.03] to-transparent p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-orange-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-600/20 blur-[100px]" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-bold text-orange-300">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Official Documentation & Architecture Guide</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            VoxAura AI Studio Documentation
          </h1>
          <p className="text-sm sm:text-base text-white/70 max-w-3xl leading-relaxed">
            Everything you need to know about multilingual neural speech synthesis, authentic voice personas, 
            multi-speaker dialogue scripts, video waveform production, and developer API integration.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={onOpenStudio}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 cursor-pointer"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Launch Studio</span>
            </button>
            <button
              onClick={onOpenVideoStudio}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15 cursor-pointer"
            >
              <Film className="h-3.5 w-3.5 text-orange-400" />
              <span>Video & Thumbnail Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Documentation Body (Sidebar + Content) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Navigation Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4 sticky top-24">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-xl space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/40" />
              <input
                type="text"
                placeholder="Search topics, APIs, languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/30 focus:border-orange-500/60 focus:outline-none"
              />
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-2 pt-1">
              Table of Contents
            </div>

            {/* Section links */}
            <nav className="space-y-1">
              {filteredSections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveDocSection(sec.id)}
                  className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                    activeDocSection === sec.id
                      ? 'bg-gradient-to-r from-orange-500/20 to-purple-500/20 border border-orange-500/40 text-orange-200 font-bold shadow-sm'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {sec.icon}
                    <span className="truncate">{sec.title}</span>
                  </div>
                  <ChevronRight className={`h-3 w-3 shrink-0 ${activeDocSection === sec.id ? 'text-orange-400' : 'text-white/30'}`} />
                </button>
              ))}
            </nav>
          </div>

          {/* Quick Support Card */}
          <div className="rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-orange-400 font-bold">
              <ShieldCheck className="h-4 w-4" />
              <span>Studio Support & Access</span>
            </div>
            <p className="text-white/60 leading-relaxed">
              Have questions or need technical support with custom voices or API integration? Contact lead engineer <strong>Muhammad Talha</strong> directly at{' '}
              <a href="mailto:mtalham99786@gmail.com" className="text-orange-300 hover:underline">
                mtalham99786@gmail.com
              </a>.
            </p>
          </div>
        </div>

        {/* Right Content Area (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Section 1: Getting Started & Auth */}
          {(activeDocSection === 'getting-started' || searchQuery) && (
            <div id="getting-started" className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">1. Getting Started & Sign-Up Gate</h2>
                  <p className="text-xs text-white/50">Access rules, free Google authentication, and security policy</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-white/80 leading-relaxed">
                <p>
                  To maintain high-quality neural voice synthesis and safeguard personal generated audio tracks, 
                  <strong> VoxAura requires all users to sign in or create a free account with Google</strong> before accessing studio features.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                    <div className="font-bold text-orange-300 flex items-center gap-1.5 text-xs">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Why Sign-In is Required:</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-white/70 list-disc list-inside">
                      <li>Allocates cloud computing resources securely.</li>
                      <li>Syncs audio files and custom voice presets to your Firestore account.</li>
                      <li>Prevents automated abuse and protects latency.</li>
                      <li>Allows private sharing links and custom video projects.</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                    <div className="font-bold text-orange-300 flex items-center gap-1.5 text-xs">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <span>Zero Friction Onboarding:</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-white/70 list-disc list-inside">
                      <li>One-click Google Sign-In with Firebase Auth.</li>
                      <li>No credit cards or complex passwords required.</li>
                      <li>Instantly grants full access to all 40+ languages and tools.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: 40+ Languages & Urdu */}
          {(activeDocSection === 'multilingual-synthesis' || searchQuery) && (
            <div id="multilingual-synthesis" className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">2. Multilingual Voice Engine & Urdu Support</h2>
                  <p className="text-xs text-white/50">Native phoneme modeling across global regions and dialects</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-white/80 leading-relaxed">
                <p>
                  VoxAura processes text using an advanced multilingual neural pipeline that accurately renders 
                  regional cadence, accent variations, and complex right-to-left scripts.
                </p>

                {/* Urdu Highlight Box */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                      <span className="text-base">🇵🇰</span>
                      <span>Featured: Urdu Language (`ur-PK` & `ur-IN`)</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] text-emerald-300 font-mono">
                      Native Nastaliq Ready
                    </span>
                  </div>
                  <p className="text-xs text-white/75 leading-relaxed">
                    Full native pronunciation support for Urdu poetry, literature, news broadcasting, and formal speech. 
                    The engine respects Urdu compound vowels, izafat constructions, and rhythmic ghazal meters.
                  </p>
                  <div className="rounded-xl bg-black/40 p-3 border border-white/10 font-serif text-right text-sm text-emerald-100">
                    « ستاروں سے آگے جہاں اور بھی ہیں، ابھی عشق کے امتحان اور بھی ہیں۔ »
                  </div>
                </div>

                {/* Supported Languages Matrix */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-white/60">
                    Key Supported Locales ({LANGUAGES.length}+ Languages)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {LANGUAGES.slice(0, 12).map((lang) => (
                      <div key={lang.code} className="flex items-center gap-2 rounded-xl bg-black/30 border border-white/5 px-3 py-2">
                        <span>{lang.flag}</span>
                        <div className="truncate">
                          <div className="font-semibold text-white truncate">{lang.name}</div>
                          <div className="text-[10px] text-white/40 font-mono">{lang.code}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Voice Styles & Customization */}
          {(activeDocSection === 'voice-customization' || searchQuery) && (
            <div id="voice-customization" className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">3. Voice Personas, Styles, Gender & Age</h2>
                  <p className="text-xs text-white/50">Granular acoustic parameters for tailored voice delivery</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-white/80 leading-relaxed">
                <p>
                  Every voice can be customized with four orthogonal acoustic controls:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                    <span className="font-bold text-purple-300 text-xs">1. Gender & Age Bracket</span>
                    <p className="text-xs text-white/70">
                      Toggle between <strong>Male</strong> and <strong>Female</strong> personas across <strong>Child</strong>, <strong>Adult</strong>, and <strong>Senior</strong> age brackets.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                    <span className="font-bold text-purple-300 text-xs">2. 8 Emotional Delivery Styles</span>
                    <p className="text-xs text-white/70">
                      Choose from <em>Natural</em>, <em>Professional</em>, <em>Energetic</em>, <em>Whisper</em>, <em>Calm</em>, <em>Storyteller</em>, <em>Newscaster</em>, and <em>Friendly</em>.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                    <span className="font-bold text-purple-300 text-xs">3. Cadence Speed (0.5x – 2.0x)</span>
                    <p className="text-xs text-white/70">
                      Adjust playback pace without altering audio pitch or causing digital artifacts.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                    <span className="font-bold text-purple-300 text-xs">4. Pitch Modulation (-6st to +6st)</span>
                    <p className="text-xs text-white/70">
                      Fine-tune vocal resonance higher or lower for distinct character traits.
                    </p>
                  </div>
                </div>

                {/* Available Personas Table */}
                <div className="pt-2">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-white/60 pb-2">
                    Available AI Voice Personas
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {VOICES.map((v) => (
                      <div key={v.id} className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-1">
                        <div className="font-bold text-white">{v.name}</div>
                        <div className="text-[10px] text-orange-300">{v.gender} • {v.ageRange}</div>
                        <div className="text-[10px] text-white/50 line-clamp-1">{v.tagline}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Multi-Speaker Dialogue */}
          {(activeDocSection === 'multi-speaker' || searchQuery) && (
            <div id="multi-speaker" className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">4. Multi-Speaker Dialogue Studio</h2>
                  <p className="text-xs text-white/50">Synthesize realistic dual-character conversations, podcasts & interviews</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-white/80 leading-relaxed">
                <p>
                  Switching to <strong>Dialogue Mode</strong> in the script editor enables seamless dual-voice audio rendering. 
                  Assign separate voice models and personas to each speaker.
                </p>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-300">
                    <span>Script Formatting Syntax:</span>
                    <span className="text-[10px] font-mono text-white/50">Auto-detected prefixes</span>
                  </div>
                  <pre className="rounded-xl bg-black/70 p-3 text-xs font-mono text-sky-200 border border-white/5 overflow-x-auto">
{`Alex: Welcome to the future of AI voice technology!
Puck: Glad to be here, Alex. The audio clarity is breathtaking.
Alex: Indeed. You can alternate speaking turns with zero delay.`}
                  </pre>
                  <p className="text-[11px] text-white/60">
                    The synthesizer seamlessly processes natural pauses between speaker changes for broadcast-ready dialogue pacing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Video & Motion Waveforms */}
          {(activeDocSection === 'video-studio' || searchQuery) && (
            <div id="video-studio" className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                  <Film className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">5. AI Video & Motion Waveform Studio</h2>
                  <p className="text-xs text-white/50">Turn voice recordings into branded videos for YouTube, TikTok, and Podcasts</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-white/80 leading-relaxed">
                <p>
                  Export your audio as engaging MP4 video clips with animated sound waveforms, custom channel branding, 
                  captions, and AI-generated cover art.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-1.5">
                    <span className="font-bold text-amber-300 text-xs">16:9 Landscape</span>
                    <p className="text-[11px] text-white/60">Optimized for YouTube, Podcasts, desktop monitors, and web players.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-1.5">
                    <span className="font-bold text-amber-300 text-xs">9:16 Vertical</span>
                    <p className="text-[11px] text-white/60">Engineered for TikTok, Instagram Reels, and YouTube Shorts.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-1.5">
                    <span className="font-bold text-amber-300 text-xs">1:1 Square</span>
                    <p className="text-[11px] text-white/60">Square format for social feeds, album artwork, and embeds.</p>
                  </div>
                </div>

                {/* Direct YouTube Upload Callout */}
                <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <Film className="h-4 w-4" />
                    <span>Direct Upload to YouTube Channel:</span>
                  </div>
                  <p className="text-xs text-white/70">
                    Once your MP4 video audiogram is rendered, click <strong>Upload to YouTube</strong> to publish directly to your channel via the official YouTube Data API. You can configure custom video titles, descriptions, tags, COPPA compliance, and privacy settings (Public, Unlisted, or Private) in one seamless step.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                  <div className="font-bold text-white text-xs">5 Real-Time Waveform Visualizer Styles:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/70">
                    <div>• <strong>Equalizer Bars:</strong> Crisp vertical neon reactive bars</div>
                    <div>• <strong>Circular Spectrum:</strong> Radial pulsing audio ring</div>
                    <div>• <strong>Neon Waves:</strong> Smooth sine fluid frequency wave</div>
                    <div>• <strong>Frequency Matrix:</strong> High-tech cybersecurity particle mesh</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Translation & Polish */}
          {(activeDocSection === 'translation-engine' || searchQuery) && (
            <div id="translation-engine" className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">6. Script Translation & Cadence Polish Engine</h2>
                  <p className="text-xs text-white/50">AI translation fine-tuned specifically for natural spoken delivery</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-white/80 leading-relaxed">
                <p>
                  Unlike generic word-for-word machine translation, VoxAura polishes scripts to ensure natural vocal breathing, 
                  authentic colloquial phrasing, and conversational flow in the target language (including Urdu, Spanish, Arabic, etc.).
                </p>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs space-y-2">
                  <span className="font-bold text-rose-300">How to use in the studio:</span>
                  <p className="text-white/70">
                    Select your target language from the dropdown, click the <strong>⚡ Translate & Polish</strong> button in the language selector, 
                    and watch your script transform into fluent spoken prose instantly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 7: Cloud Persistence */}
          {(activeDocSection === 'cloud-persistence' || searchQuery) && (
            <div id="cloud-persistence" className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">7. Firebase Cloud Sync & Public Share Links</h2>
                  <p className="text-xs text-white/50">Durable storage, real-time sync, and embeddable iframe players</p>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-white/80 leading-relaxed">
                <p>
                  All audio tracks, favorite presets, and video designs are synced in real time to your private Firestore database. 
                  Every audio item includes one-click public share URL generation:
                </p>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2 text-xs">
                  <span className="font-bold text-cyan-300">Supported Sharing Channels:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-white/70 pt-1">
                    <div className="p-2 bg-white/5 rounded-lg text-center">Direct Link</div>
                    <div className="p-2 bg-white/5 rounded-lg text-center">Iframe Embed Code</div>
                    <div className="p-2 bg-white/5 rounded-lg text-center">X (Twitter)</div>
                    <div className="p-2 bg-white/5 rounded-lg text-center">WhatsApp & LinkedIn</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 8: Developer API Reference */}
          {(activeDocSection === 'api-reference' || searchQuery) && (
            <div id="api-reference" className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">8. Developer REST API Reference</h2>
                  <p className="text-xs text-white/50">Integrate VoxAura neural voice synthesis into any web or mobile application</p>
                </div>
              </div>

              {/* Endpoint 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-mono font-bold text-emerald-300">
                    POST
                  </span>
                  <code className="text-sm font-mono font-bold text-white">/api/tts/generate</code>
                </div>
                <p className="text-xs text-white/70">
                  Synthesizes high-fidelity 24kHz audio from input text using the specified voice persona, language, and style.
                </p>

                {/* Parameters Table */}
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-white/60 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Field</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Required</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      <tr>
                        <td className="p-3 font-mono text-orange-300">text</td>
                        <td className="p-3 font-mono text-purple-300">string</td>
                        <td className="p-3 text-emerald-400 font-semibold">Yes</td>
                        <td className="p-3">The script text to synthesize (or dialogue turns).</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-orange-300">voice</td>
                        <td className="p-3 font-mono text-purple-300">string</td>
                        <td className="p-3 text-white/50">Optional</td>
                        <td className="p-3">Voice persona identifier (e.g. "Kore", "Charon", "Puck"). Default: "Kore".</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-orange-300">language</td>
                        <td className="p-3 font-mono text-purple-300">string</td>
                        <td className="p-3 text-white/50">Optional</td>
                        <td className="p-3">Locale name or code (e.g. "Urdu", "English (US)", "Spanish (Spain)").</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-orange-300">style</td>
                        <td className="p-3 font-mono text-purple-300">string</td>
                        <td className="p-3 text-white/50">Optional</td>
                        <td className="p-3">Delivery style ("Friendly", "Storyteller", "Professional", "Whisper").</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-orange-300">speed</td>
                        <td className="p-3 font-mono text-purple-300">number</td>
                        <td className="p-3 text-white/50">Optional</td>
                        <td className="p-3">Cadence playback multiplier (0.5 to 2.0). Default: 1.0.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Example Request - cURL */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span className="font-bold">cURL Request Example:</span>
                    <button
                      onClick={() => handleCopyCode(curlTtsExample, 'curl')}
                      className="flex items-center gap-1 text-xs text-orange-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedSnippet === 'curl' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedSnippet === 'curl' ? 'Copied!' : 'Copy cURL'}</span>
                    </button>
                  </div>
                  <pre className="rounded-2xl bg-black/80 p-4 text-xs font-mono text-orange-200 border border-white/10 overflow-x-auto">
                    {curlTtsExample}
                  </pre>
                </div>

                {/* Example Request - JS Fetch */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span className="font-bold">JavaScript / TypeScript Fetch:</span>
                    <button
                      onClick={() => handleCopyCode(fetchTtsExample, 'js')}
                      className="flex items-center gap-1 text-xs text-orange-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedSnippet === 'js' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedSnippet === 'js' ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                  <pre className="rounded-2xl bg-black/80 p-4 text-xs font-mono text-emerald-200 border border-white/10 overflow-x-auto">
                    {fetchTtsExample}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Section 9: Best Practices */}
          {(activeDocSection === 'best-practices' || searchQuery) && (
            <div id="best-practices" className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-500/20 border border-lime-500/30 text-lime-400">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">9. Best Practices & Script Pacing Tips</h2>
                  <p className="text-xs text-white/50">Pro tips for natural inflection, pauses, and broadcast-level quality</p>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-white/80 leading-relaxed">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                  <div className="font-bold text-lime-300 text-xs">1. Add Dramatic Vocal Pauses</div>
                  <p className="text-xs text-white/70">
                    Use the <strong>+ Pause (0.8s)</strong> button or insert <code className="text-orange-300 font-mono">[pause 1.0s]</code> to give listeners time to absorb key points.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                  <div className="font-bold text-lime-300 text-xs">2. Spell Out Acronyms & Numbers When Desired</div>
                  <p className="text-xs text-white/70">
                    For customized pronunciation of uncommon acronyms, write them phonetically (e.g. <em>"A-I"</em> instead of <em>"AI"</em>).
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                  <div className="font-bold text-lime-300 text-xs">3. Use Appropriate Punctuation</div>
                  <p className="text-xs text-white/70">
                    Commas, periods, and ellipses dynamically influence the neural model's pitch contour and breath groups.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
