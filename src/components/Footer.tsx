import React, { useState } from 'react';
import {
  Sparkles,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Headphones,
  Cloud,
  Cpu,
  Layers,
  Code2,
  Shield,
  Heart,
  Radio,
} from 'lucide-react';

interface FooterProps {
  onNavigateToDocs?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateToDocs }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const email = 'mtalham99786@gmail.com';
  const linkedinUrl = 'https://www.linkedin.com/in/muhammad-talha12b';
  const githubUrl = 'https://github.com/tal123ph';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <footer id="app-footer" className="mt-auto border-t border-white/10 bg-[#08080c]/90 backdrop-blur-xl pt-12 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 space-y-10">
        {/* Top Grid: Brand & Mission, Creator Card, Capabilities, Tech Stack */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand Col (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-purple-600 shadow-md shadow-orange-500/20 text-white">
                <div className="w-3.5 h-3.5 bg-white rounded-xs rotate-45" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white">VOXAURA</span>
                <span className="rounded-full bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 text-[9px] font-bold text-orange-300">
                  AI TTS Studio
                </span>
              </div>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              State-of-the-art multilingual neural voice synthesis engine. Empowering creators, developers, educators, and storytellers worldwide with hyper-realistic human voice generation.
            </p>

            <div className="flex items-center gap-2 text-[11px] text-white/40 font-mono">
              <div className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Studio Engine Active • 24kHz PCM</span>
            </div>
          </div>

          {/* Lead Developer Spotlight (4 cols) */}
          <div className="lg:col-span-4 rounded-2xl border border-orange-500/20 bg-gradient-to-b from-orange-500/10 via-white/[0.02] to-transparent p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-300">
                Created & Architected By
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 font-semibold">
                Available for Collaboration
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-purple-600 text-white font-bold text-base shadow-md shadow-orange-500/20">
                MT
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Muhammad Talha</h4>
                <p className="text-[11px] text-white/60">Full-Stack AI Software Engineer</p>
              </div>
            </div>

            {/* Direct Contact Links */}
            <div className="space-y-2 pt-1 text-xs">
              {/* Email */}
              <div className="flex items-center justify-between rounded-xl bg-black/40 border border-white/10 px-3 py-2">
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 text-white/80 hover:text-orange-400 transition-colors truncate"
                  title="Send email"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                  <span className="truncate">{email}</span>
                </a>
                <button
                  onClick={handleCopyEmail}
                  className="p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
                  title="Copy email address"
                >
                  {copiedEmail ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Social Link Badges */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-[#0A66C2]/40 bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 py-2 px-2 text-[11px] font-semibold text-[#82c1ff] transition-all"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <span>LinkedIn</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>

                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 py-2 px-2 text-[11px] font-semibold text-white transition-all"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </div>
            </div>
          </div>

          {/* Architecture & Capabilities (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Platform Features & Architecture
            </span>

            <ul className="space-y-2 text-xs text-white/70">
              <li className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-orange-400" />
                <span>40+ Global Locales & Regional Dialects</span>
              </li>
              <li className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-purple-400" />
                <span>Dual Neural Speech Engine with Fallback</span>
              </li>
              <li className="flex items-center gap-2">
                <Cloud className="h-3.5 w-3.5 text-emerald-400" />
                <span>Firestore Cloud Sync & Library Storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-sky-400" />
                <span>Google Firebase Authentication</span>
              </li>
              <li className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-amber-400" />
                <span>Public Share Links & Iframe Embed Code</span>
              </li>
            </ul>

            {onNavigateToDocs && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onNavigateToDocs}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1.5 text-xs font-semibold text-orange-300 transition-colors cursor-pointer"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>Open Developer Documentation</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10" />

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
            <span>Designed & Built by</span>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-white hover:text-orange-400 transition-colors underline decoration-orange-500/40 underline-offset-2"
            >
              Muhammad Talha
            </a>
            <span>•</span>
            <span>All Rights Reserved</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-white/40">
            <span>React 18</span>
            <span>•</span>
            <span>TypeScript</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span className="text-orange-400">VOXAURA v2.5</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
