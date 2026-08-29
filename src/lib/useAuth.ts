import { useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from './firebase';
import { syncUserProfile, saveUserPreferences, DEFAULT_PREFERENCES } from './firestoreService';
import { clearYouTubeAccessToken } from './youtubeService';
import { UserVoicePreferences } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserVoicePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userPrefs = await syncUserProfile(currentUser);
          setPreferences(userPrefs);
        } catch (err) {
          console.error('Error syncing profile on auth change:', err);
        }
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const userPrefs = await syncUserProfile(result.user);
        setPreferences(userPrefs);
      }
    } catch (err: any) {
      // Gracefully handle expected user cancellations or popup dismissals
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        // User closed or dismissed the popup intentionally — do not treat as an application error
        console.info('Google sign-in popup dismissed by user.');
        setAuthError(null);
      } else if (err?.code === 'auth/popup-blocked') {
        console.warn('Google sign-in popup blocked by browser settings.');
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups or open the app in a new window.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        console.warn('Firebase Auth unauthorized domain:', err);
        setAuthError('This domain is not authorized in Firebase Console Auth settings.');
      } else {
        console.error('Google sign-in error:', err);
        setAuthError(err?.message || 'Failed to sign in with Google. Please try again.');
      }
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
      clearYouTubeAccessToken();
      setUser(null);
      setPreferences(DEFAULT_PREFERENCES);
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  const updatePreferences = async (newPrefs: Partial<UserVoicePreferences>) => {
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    if (user) {
      await saveUserPreferences(user.uid, updated);
    }
  };

  return {
    user,
    loading,
    authError,
    preferences,
    loginWithGoogle,
    logout,
    updatePreferences,
    clearError: () => setAuthError(null),
  };
}
