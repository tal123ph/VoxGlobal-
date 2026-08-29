import React from 'react';
import {
  Sparkles,
  Lock,
  Globe,
  Mic,
  Film,
  Cloud,
  ShieldCheck,
  X,
  CheckCircle2,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  featureName?: string;
  loading?: boolean;
}

export const AuthGateModal: React.FC<AuthGateModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  featureName = 'Voice Studio & AI Features',
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="auth-gate-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="auth-gate-modal-container"
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-orange-500/30 bg-[#0e0e14] p-6 sm:p-8 shadow-2xl shadow-orange-500/10 text-white animate-scale-up"
      >
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-orange-500/20 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-purple-600/20 blur-[90px]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full bg-white/5 p-2 text-white/50 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          title="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-purple-600 shadow-lg shadow-orange-500/25">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 px-2.5 py-0.5 text-[10px] font-bold text-orange-300">
              <Sparkles className="h-3 w-3" />
              <span>Authentication Required</span>
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
              Sign Up or Sign In
            </h3>
          </div>
        </div>

        {/* Modal Description */}
        <div className="space-y-4 py-5 text-left">
          <p className="text-sm text-white/80 leading-relaxed">
            Please sign in with your account to access <strong className="text-orange-300">{featureName}</strong>. 
            All studio capabilities, voice synthesizers, and video generators require free authentication.
          </p>

          {/* Unlocked Benefits */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2.5 text-xs">
            <div className="font-semibold text-white/90 uppercase tracking-wider text-[11px] pb-1 border-b border-white/5">
              Signing up unlocks full studio access:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-white/70">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>40+ Languages & Urdu</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>8 Vocal Styles & Pitch</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Multi-Speaker Dialogue</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>AI Video & MP4 Export</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Cloud Sync & History</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Public Share Links</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            id="auth-gate-google-signin-btn"
            type="button"
            onClick={onLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white text-black font-bold py-3.5 px-6 shadow-xl hover:bg-neutral-100 active:scale-[0.98] transition-all cursor-pointer"
          >
            {/* Google G Logo */}
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'Signing In...' : 'Continue with Google'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-xs text-white/50 hover:text-white transition-colors py-2 cursor-pointer"
          >
            Explore Public Documentation First
          </button>
        </div>

        {/* Security Assurance */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-white/40 border-t border-white/5 pt-3">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Protected by Firebase Authentication & Secure Firestore Rules</span>
        </div>
      </div>
    </div>
  );
};
