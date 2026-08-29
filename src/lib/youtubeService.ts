import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

// Ensure YouTube scopes are attached to provider
export const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
];

// Memory cache for OAuth access token
let cachedYouTubeAccessToken: string | null = null;
let isAuthenticatingYouTube = false;

/**
 * Ensures we have an active OAuth Access Token with YouTube upload permissions.
 * Prompts Google popup with YouTube scopes if not already cached.
 */
export async function getYouTubeAccessToken(forcePrompt = false): Promise<string> {
  if (cachedYouTubeAccessToken && !forcePrompt) {
    return cachedYouTubeAccessToken;
  }

  if (isAuthenticatingYouTube) {
    throw new Error('Authentication is already in progress.');
  }

  try {
    isAuthenticatingYouTube = true;

    // Create provider specifically with YouTube upload & readonly scopes
    const ytProvider = new GoogleAuthProvider();
    ytProvider.addScope('https://www.googleapis.com/auth/youtube.upload');
    ytProvider.addScope('https://www.googleapis.com/auth/youtube.readonly');
    ytProvider.setCustomParameters({ prompt: 'consent' });

    const result = await signInWithPopup(auth, ytProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Could not retrieve YouTube OAuth access token from Google.');
    }

    cachedYouTubeAccessToken = credential.accessToken;
    return cachedYouTubeAccessToken;
  } catch (error: any) {
    console.error('Failed to authenticate YouTube OAuth:', error);
    throw error;
  } finally {
    isAuthenticatingYouTube = false;
  }
}

/**
 * Resets cached token on sign out or auth refresh
 */
export function clearYouTubeAccessToken() {
  cachedYouTubeAccessToken = null;
}

export interface YouTubeChannelInfo {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  thumbnailUrl: string;
  subscriberCount?: string;
  videoCount?: string;
}

export interface YouTubeUploadParams {
  title: string;
  description: string;
  tags?: string[];
  privacyStatus: 'public' | 'unlisted' | 'private';
  videoBlob: Blob;
  madeForKids?: boolean;
}

export interface YouTubeUploadResult {
  videoId: string;
  videoUrl: string;
  title: string;
  channelTitle?: string;
}

export class YouTubeServiceError extends Error {
  code?: number;
  isServiceDisabled: boolean;
  activationUrl?: string;
  projectId?: string;
  status?: string;

  constructor(
    message: string,
    options?: {
      code?: number;
      isServiceDisabled?: boolean;
      activationUrl?: string;
      projectId?: string;
      status?: string;
    }
  ) {
    super(message);
    this.name = 'YouTubeServiceError';
    this.code = options?.code;
    this.isServiceDisabled = options?.isServiceDisabled || false;
    this.activationUrl = options?.activationUrl;
    this.projectId = options?.projectId;
    this.status = options?.status;
  }
}

export function parseYouTubeApiError(errorData: any, status: number): YouTubeServiceError {
  const errObj = errorData?.error || errorData;
  const rawMsg = errObj?.message || 'YouTube API request failed.';
  const code = errObj?.code || status;

  let isServiceDisabled = false;
  let activationUrl: string | undefined;
  let projectId: string | undefined;

  if (
    errObj?.status === 'PERMISSION_DENIED' ||
    rawMsg.includes('YouTube Data API v3 has not been used in project') ||
    rawMsg.includes('is disabled') ||
    rawMsg.includes('accessNotConfigured')
  ) {
    isServiceDisabled = true;
  }

  if (Array.isArray(errObj?.details)) {
    for (const detail of errObj.details) {
      if (detail.reason === 'SERVICE_DISABLED') {
        isServiceDisabled = true;
      }
      if (detail.metadata?.activationUrl) {
        activationUrl = detail.metadata.activationUrl;
      }
      if (detail.metadata?.consumer) {
        projectId = detail.metadata.consumer.replace('projects/', '');
      }
    }
  }

  if (!activationUrl && rawMsg.includes('https://console.developers.google.com')) {
    const match = rawMsg.match(/https:\/\/console\.developers\.google\.com\/apis\/[^\s]+/);
    if (match) {
      activationUrl = match[0];
    }
  }

  if (!activationUrl && isServiceDisabled) {
    activationUrl = 'https://console.cloud.google.com/apis/library/youtube.googleapis.com';
  }

  const cleanMessage = isServiceDisabled
    ? 'YouTube Data API v3 is not enabled in your Google Cloud Project. Please enable it in the Google Cloud Console to activate channel publishing.'
    : rawMsg;

  return new YouTubeServiceError(cleanMessage, {
    code,
    isServiceDisabled,
    activationUrl,
    projectId,
    status: errObj?.status,
  });
}

/**
 * Retrieves the authenticated user's YouTube Channel info
 */
export async function fetchMyYouTubeChannel(token: string): Promise<YouTubeChannelInfo | null> {
  const url = 'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true';
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const parsedErr = parseYouTubeApiError(errorData, response.status);
    console.warn('YouTube channel fetch notice:', parsedErr.message);

    if (response.status === 401) {
      cachedYouTubeAccessToken = null;
    }
    throw parsedErr;
  }

  const data = await response.json();
  if (!data.items || data.items.length === 0) {
    return null;
  }

  const channel = data.items[0];
  return {
    id: channel.id,
    title: channel.snippet?.title || 'My Channel',
    description: channel.snippet?.description || '',
    customUrl: channel.snippet?.customUrl,
    thumbnailUrl:
      channel.snippet?.thumbnails?.medium?.url ||
      channel.snippet?.thumbnails?.default?.url ||
      '',
    subscriberCount: channel.statistics?.subscriberCount,
    videoCount: channel.statistics?.videoCount,
  };
}

/**
 * Direct Resumable / Multipart Upload of video blob to authenticated user's YouTube Channel
 */
export async function uploadVideoToYouTube(
  token: string,
  params: YouTubeUploadParams,
  onProgress?: (percent: number, statusText: string) => void
): Promise<YouTubeUploadResult> {
  const { title, description, tags = [], privacyStatus, videoBlob, madeForKids = false } = params;

  if (!videoBlob || videoBlob.size === 0) {
    throw new Error('Video file blob is empty. Please render the video before uploading.');
  }

  if (onProgress) onProgress(5, 'Initiating YouTube upload session...');

  // Step 1: Initialize Resumable Upload
  const metadata = {
    snippet: {
      title: title.trim() || 'AI Synthesized Voice Audiogram',
      description: `${description}\n\n🎙️ Created with VoxAura AI Studio (Multilingual Neural Voice & Video Generator)`,
      tags: [...tags, 'VoxAura', 'AIVoice', 'TextToSpeech', 'Audiogram', 'AIStudio'],
      categoryId: '27', // Education / Tech
    },
    status: {
      privacyStatus,
      selfDeclaredMadeForKids: madeForKids,
      embeddable: true,
    },
  };

  const initResponse = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Length': videoBlob.size.toString(),
        'X-Upload-Content-Type': videoBlob.type || 'video/mp4',
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!initResponse.ok) {
    const errorData = await initResponse.json().catch(() => ({}));
    if (initResponse.status === 401 || initResponse.status === 403) {
      cachedYouTubeAccessToken = null;
    }
    const parsedErr = parseYouTubeApiError(errorData, initResponse.status);
    throw parsedErr;
  }

  const uploadLocation = initResponse.headers.get('Location');
  if (!uploadLocation) {
    throw new Error('YouTube did not return a resumable upload location URL.');
  }

  if (onProgress) onProgress(20, 'Transferring video data to YouTube...');

  // Step 2: Upload Binary Video Payload via XMLHttpRequest to track real progress
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadLocation, true);
    xhr.setRequestHeader('Content-Type', videoBlob.type || 'video/mp4');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = 20 + Math.round((event.loaded / event.total) * 75);
        const uploadedMB = (event.loaded / (1024 * 1024)).toFixed(1);
        const totalMB = (event.total / (1024 * 1024)).toFixed(1);
        onProgress(Math.min(percent, 95), `Uploading: ${uploadedMB}MB of ${totalMB}MB (${percent}%)`);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100, 'Video uploaded successfully to YouTube!');
        try {
          const responseData = JSON.parse(xhr.responseText);
          const videoId = responseData.id;
          resolve({
            videoId,
            videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
            title: responseData.snippet?.title || title,
            channelTitle: responseData.snippet?.channelTitle,
          });
        } catch (e) {
          reject(new Error('Uploaded video, but could not parse YouTube response ID.'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          const parsedErr = parseYouTubeApiError(errRes, xhr.status);
          reject(parsedErr);
        } catch {
          reject(new Error(`YouTube upload failed with HTTP status ${xhr.status}: ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network connection error while uploading to YouTube.'));
    };

    xhr.send(videoBlob);
  });
}
