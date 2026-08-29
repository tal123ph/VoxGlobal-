import {
  db,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
  User,
} from './firebase';
import { AudioGenerationItem, UserVoicePreferences, UserProject } from '../types';

export const DEFAULT_PREFERENCES: UserVoicePreferences = {
  preferredGender: 'all',
  preferredAgeRange: 'all',
  preferredStyle: 'Friendly',
  preferredLanguage: 'English (US)',
  defaultSpeed: 1.0,
  defaultPitch: 0,
  preferredVoice: 'Kore',
};

// Sync user profile & load preferences with offline fallback
export async function syncUserProfile(user: User): Promise<UserVoicePreferences> {
  const localPrefKey = `vox_user_prefs_${user.uid}`;
  let cachedPreferences: UserVoicePreferences = DEFAULT_PREFERENCES;
  try {
    const saved = localStorage.getItem(localPrefKey);
    if (saved) {
      cachedPreferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
    }
  } catch {}

  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const initialData = {
        userId: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Creator',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: cachedPreferences,
      };
      await setDoc(userRef, initialData, { merge: true });
      return cachedPreferences;
    } else {
      const data = userSnap.data();
      const mergedPreferences = { ...DEFAULT_PREFERENCES, ...(data.preferences || {}), ...cachedPreferences };
      
      // Update basic profile info in background
      setDoc(
        userRef,
        {
          displayName: user.displayName || data.displayName || 'Creator',
          photoURL: user.photoURL || data.photoURL || '',
          updatedAt: new Date().toISOString(),
          preferences: mergedPreferences,
        },
        { merge: true }
      ).catch(() => {});

      try {
        localStorage.setItem(localPrefKey, JSON.stringify(mergedPreferences));
      } catch {}

      return mergedPreferences;
    }
  } catch (err: any) {
    // Gracefully handle offline / connection delays without breaking app flow
    console.warn('Firestore offline/unreachable during profile sync, using local preferences cache:', err?.message || err);
    return cachedPreferences;
  }
}

// Save user voice customization preferences to Firestore
export async function saveUserPreferences(
  userId: string,
  preferences: Partial<UserVoicePreferences>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        preferences,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error saving user preferences to Firestore:', err);
  }
}

// In-memory audio payload cache to avoid redundant subcollection reads and handle offline state gracefully
const chunkAudioMemoryCache = new Map<string, string>();

// Helper to split a large base64 string into chunks (< 600KB each)
function chunkBase64String(str: string, chunkSize = 600000): string[] {
  if (!str) return [];
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks;
}

// Save synthesized audio generation item to Firestore
export async function saveAudioToFirestore(
  userId: string,
  item: AudioGenerationItem
): Promise<void> {
  try {
    const itemRef = doc(db, 'users', userId, 'audio_generations', item.id);
    const audioData = item.audioBase64 || '';
    
    // Store in local memory cache
    if (audioData) {
      chunkAudioMemoryCache.set(item.id, audioData);
    }
    
    // If audio is under 700KB (~500KB binary), store directly on document
    if (audioData.length < 700000) {
      const cleanItem = {
        ...item,
        userId,
        chunked: false,
        chunkCount: 1,
        createdAt: item.createdAt || new Date().toISOString(),
      };
      await setDoc(itemRef, cleanItem);
    } else {
      // Chunk the audio payload into subcollection
      const chunks = chunkBase64String(audioData, 600000);
      const cleanItem = {
        ...item,
        audioBase64: '', // clear from main doc to prevent 1MB limit overflow
        userId,
        chunked: true,
        chunkCount: chunks.length,
        createdAt: item.createdAt || new Date().toISOString(),
      };
      await setDoc(itemRef, cleanItem);

      // Write chunks into subcollection
      for (let i = 0; i < chunks.length; i++) {
        const chunkRef = doc(db, 'users', userId, 'audio_generations', item.id, 'chunks', `chunk_${i}`);
        await setDoc(chunkRef, { index: i, data: chunks[i] });
      }
    }
  } catch (err) {
    console.warn('Notice saving audio generation to Firestore (caching locally):', err);
  }
}

// Reassemble chunked audio generation if needed
async function resolveAudioItemChunks(userId: string, docData: any): Promise<AudioGenerationItem> {
  if (!docData.chunked || docData.audioBase64) {
    if (docData.id && docData.audioBase64) {
      chunkAudioMemoryCache.set(docData.id, docData.audioBase64);
    }
    return docData as AudioGenerationItem;
  }

  // Check memory cache first
  if (docData.id && chunkAudioMemoryCache.has(docData.id)) {
    const cached = chunkAudioMemoryCache.get(docData.id)!;
    return { ...docData, audioBase64: cached } as AudioGenerationItem;
  }

  try {
    const chunkCount = docData.chunkCount || 1;
    let fullBase64 = '';
    for (let i = 0; i < chunkCount; i++) {
      try {
        const chunkRef = doc(db, 'users', userId, 'audio_generations', docData.id, 'chunks', `chunk_${i}`);
        const chunkSnap = await getDoc(chunkRef);
        if (chunkSnap.exists()) {
          fullBase64 += chunkSnap.data().data || '';
        }
      } catch (chunkErr: any) {
        // Quietly handle offline or pending network sync
        console.warn(`Audio chunk ${i} read deferred (offline/network):`, chunkErr?.message || chunkErr);
      }
    }
    if (fullBase64) {
      chunkAudioMemoryCache.set(docData.id, fullBase64);
      return { ...docData, audioBase64: fullBase64 } as AudioGenerationItem;
    }
    return docData as AudioGenerationItem;
  } catch (e: any) {
    console.warn('Deferred chunked audio resolution (offline/cache):', e?.message || e);
    return docData as AudioGenerationItem;
  }
}

// Toggle favorite in Firestore
export async function toggleFavoriteInFirestore(
  userId: string,
  itemId: string,
  isFavorite: boolean
): Promise<void> {
  try {
    const itemRef = doc(db, 'users', userId, 'audio_generations', itemId);
    await updateDoc(itemRef, {
      isFavorite,
    });
  } catch (err) {
    console.error('Error toggling favorite in Firestore:', err);
  }
}

// Delete audio record from Firestore
export async function deleteAudioFromFirestore(
  userId: string,
  itemId: string
): Promise<void> {
  try {
    const itemRef = doc(db, 'users', userId, 'audio_generations', itemId);
    await deleteDoc(itemRef);
  } catch (err) {
    console.error('Error deleting audio from Firestore:', err);
  }
}

// Subscribe to real-time audio library for a user
export function subscribeToUserAudio(
  userId: string,
  onUpdate: (items: AudioGenerationItem[]) => void
) {
  try {
    const generationsRef = collection(db, 'users', userId, 'audio_generations');
    const q = query(generationsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      async (snapshot) => {
        const rawItems: any[] = [];
        snapshot.forEach((doc) => {
          rawItems.push(doc.data());
        });

        // Resolve any chunked audio items asynchronously
        const resolvedItems = await Promise.all(
          rawItems.map((item) => resolveAudioItemChunks(userId, item))
        );
        onUpdate(resolvedItems);
      },
      (error) => {
        console.error('Firestore audio subscription error:', error);
      }
    );
  } catch (err) {
    console.error('Error subscribing to user audio generations:', err);
    return () => {};
  }
}

// Create or retrieve a public shareable audio link in Firestore (chunked if > 700KB)
export async function createPublicShare(
  item: AudioGenerationItem,
  creatorName?: string
): Promise<{ shareId: string; shareUrl: string }> {
  try {
    // Generate clean share ID or use existing item ID
    const shareId = item.id.startsWith('vox-') ? item.id : `vox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const shareRef = doc(db, 'public_shares', shareId);
    const audioData = item.audioBase64 || '';

    if (audioData.length < 700000) {
      const shareData = {
        id: shareId,
        userId: item.userId || 'anonymous',
        creatorName: creatorName || 'VoxAura Creator',
        text: item.text,
        voice: item.voice,
        gender: item.gender || 'Female',
        ageRange: item.ageRange || 'Adult',
        style: item.style || 'Friendly',
        language: item.language || 'English (US)',
        speed: item.speed || 1.0,
        pitch: item.pitch || 0,
        duration: item.duration || 0,
        wordCount: item.wordCount || 0,
        audioBase64: item.audioBase64,
        chunked: false,
        chunkCount: 1,
        mimeType: item.mimeType || 'audio/wav',
        createdAt: item.createdAt || new Date().toISOString(),
      };
      await setDoc(shareRef, shareData, { merge: true });
    } else {
      // Chunk large share payloads into subcollections
      const chunks = chunkBase64String(audioData, 600000);
      const shareData = {
        id: shareId,
        userId: item.userId || 'anonymous',
        creatorName: creatorName || 'VoxAura Creator',
        text: item.text,
        voice: item.voice,
        gender: item.gender || 'Female',
        ageRange: item.ageRange || 'Adult',
        style: item.style || 'Friendly',
        language: item.language || 'English (US)',
        speed: item.speed || 1.0,
        pitch: item.pitch || 0,
        duration: item.duration || 0,
        wordCount: item.wordCount || 0,
        audioBase64: '', // leave empty in parent doc
        chunked: true,
        chunkCount: chunks.length,
        mimeType: item.mimeType || 'audio/wav',
        createdAt: item.createdAt || new Date().toISOString(),
      };
      await setDoc(shareRef, shareData, { merge: true });

      // Save chunks to subcollection
      for (let i = 0; i < chunks.length; i++) {
        const chunkDocRef = doc(db, 'public_shares', shareId, 'chunks', `chunk_${i}`);
        await setDoc(chunkDocRef, { index: i, data: chunks[i] });
      }
    }

    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?share=${shareId}`;

    return { shareId, shareUrl };
  } catch (err) {
    console.error('Error creating public share in Firestore:', err);
    // Fallback URL with state hash if offline or Firestore error
    const baseUrl = window.location.origin + window.location.pathname;
    return {
      shareId: item.id,
      shareUrl: `${baseUrl}?share=${item.id}`,
    };
  }
}

// Fetch a public audio snippet by its share ID
export async function getPublicShare(
  shareId: string
): Promise<AudioGenerationItem | null> {
  // Check in-memory cache first
  if (chunkAudioMemoryCache.has(shareId)) {
    const audioBase64 = chunkAudioMemoryCache.get(shareId)!;
    // Attempt basic doc get or return synthetic
    try {
      const shareRef = doc(db, 'public_shares', shareId);
      const snap = await getDoc(shareRef);
      if (snap.exists()) {
        return { ...snap.data(), audioBase64 } as AudioGenerationItem;
      }
    } catch {}
  }

  try {
    const shareRef = doc(db, 'public_shares', shareId);
    const snap = await getDoc(shareRef);

    if (snap.exists()) {
      const data = snap.data();
      if (!data.chunked || data.audioBase64) {
        if (data.audioBase64) {
          chunkAudioMemoryCache.set(shareId, data.audioBase64);
        }
        return data as AudioGenerationItem;
      }
      // Reassemble chunked audio
      const chunkCount = data.chunkCount || 1;
      let fullBase64 = '';
      for (let i = 0; i < chunkCount; i++) {
        try {
          const chunkRef = doc(db, 'public_shares', shareId, 'chunks', `chunk_${i}`);
          const chunkSnap = await getDoc(chunkRef);
          if (chunkSnap.exists()) {
            fullBase64 += chunkSnap.data().data || '';
          }
        } catch (cErr: any) {
          console.warn(`Public share chunk ${i} read deferred:`, cErr?.message || cErr);
        }
      }
      if (fullBase64) {
        chunkAudioMemoryCache.set(shareId, fullBase64);
      }
      return { ...data, audioBase64: fullBase64 || data.audioBase64 } as AudioGenerationItem;
    }
    return null;
  } catch (err: any) {
    console.warn('Could not fetch public share (offline/network):', err?.message || err);
    return null;
  }
}

// ----------------------------------------------------
// USER PROJECTS PERSISTENCE (Audio, Video, Thumbnails)
// ----------------------------------------------------

export async function saveUserProject(
  userId: string,
  project: UserProject
): Promise<void> {
  try {
    const projectRef = doc(db, 'users', userId, 'user_projects', project.id);
    const cleanProject: any = {
      ...project,
      userId,
      updatedAt: new Date().toISOString(),
      createdAt: project.createdAt || new Date().toISOString(),
    };
    await setDoc(projectRef, cleanProject, { merge: true });
  } catch (err: any) {
    console.warn('Notice saving user project to Firestore (offline/caching locally):', err?.message || err);
  }
}

export async function deleteUserProject(
  userId: string,
  projectId: string
): Promise<void> {
  try {
    const projectRef = doc(db, 'users', userId, 'user_projects', projectId);
    await deleteDoc(projectRef);
  } catch (err: any) {
    console.error('Error deleting project from Firestore:', err);
  }
}

export async function toggleProjectFavorite(
  userId: string,
  projectId: string,
  isFavorite: boolean
): Promise<void> {
  try {
    const projectRef = doc(db, 'users', userId, 'user_projects', projectId);
    await updateDoc(projectRef, {
      isFavorite,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error toggling project favorite in Firestore:', err);
  }
}

export function subscribeToUserProjects(
  userId: string,
  onUpdate: (projects: UserProject[]) => void
) {
  try {
    const projectsRef = collection(db, 'users', userId, 'user_projects');
    const q = query(projectsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const items: UserProject[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as UserProject);
        });
        onUpdate(items);
      },
      (error) => {
        console.error('Firestore user projects subscription error:', error);
      }
    );
  } catch (err) {
    console.error('Error subscribing to user projects:', err);
    return () => {};
  }
}

