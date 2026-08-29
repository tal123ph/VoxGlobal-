import React, { useState } from 'react';
import {
  LogIn,
  LogOut,
  User as UserIcon,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Settings,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { User } from '../lib/firebase';
import { UserVoicePreferences } from '../types';

interface AuthHeaderProps {
  user: User | null;
  loading: boolean;
  authError: string | null;
  preferences: UserVoicePreferences;
  onLogin: () => void;
  onLogout: () => void;
  onClearError: () => void;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  user,
  loading,
  authError,
  preferences,
  onLogin,
  onLogout,
  onClearError,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div id="auth-header-container" className="relative flex items-center gap-3">
      {/* Error alert toast if present */}
      {authError && (
        <div
          id="auth-error-banner"
          className="absolute right-0 top-12 z-50 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-950/90 p-3 text-xs text-rose-200 shadow-2xl backdrop-blur-md"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span className="max-w-xs">{authError}</span>
          <button
            onClick={onClearError}
            className="ml-2 rounded-lg bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 hover:bg-rose-500/30"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 animate-pulse">
          <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-orange-500 animate-spin" />
          <span>Syncing Auth...</span>
        </div>
      ) : user ? (
        /* Authenticated User Menu */
        <div className="relative">
          <button
            id="user-profile-menu-button"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 p-1.5 pr-3 hover:bg-white/15 transition-all shadow-md cursor-pointer"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                referrerPolicy="no-referrer"
                className="h-7 w-7 rounded-xl object-cover ring-1 ring-orange-500/50"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500 text-xs font-bold text-white">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-white line-clamp-1 max-w-[120px]">
                {user.displayName || 'Studio User'}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <Cloud className="h-2.5 w-2.5" />
                <span>Firestore Synced</span>
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-white/50" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div
              id="user-dropdown-menu"
              className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-white/15 bg-black/90 p-3 shadow-2xl backdrop-blur-2xl space-y-3"
            >
              <div className="border-b border-white/10 pb-2.5 px-1">
                <div className="text-xs font-bold text-white">
                  {user.displayName || 'Studio Creator'}
                </div>
                <div className="text-[11px] text-white/50 truncate">{user.email}</div>
                <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Cloud Database Connected</span>
                </div>
              </div>

              {/* Cloud Sync details */}
              <div className="space-y-1 text-[11px] text-white/60 px-1 font-mono">
                <div className="flex justify-between">
                  <span>Cloud Storage:</span>
                  <span className="text-white">Firestore</span>
                </div>
                <div className="flex justify-between">
                  <span>Preferred Voice:</span>
                  <span className="text-orange-400">{preferences.preferredVoice}</span>
                </div>
              </div>

              {/* Sign out button */}
              <button
                id="sign-out-btn"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Guest / Sign in with Google */
        <button
          id="google-signin-btn"
          type="button"
          onClick={onLogin}
          className="flex items-center gap-2 rounded-2xl bg-white text-black px-4 py-2 text-xs font-bold hover:bg-white/90 transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {/* Google G SVG */}
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Sign in with Google</span>
        </button>
      )}
    </div>
  );
};
