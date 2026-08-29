export type VoiceGender = 'Female' | 'Male';
export type VoiceAgeRange = 'Child' | 'Adult' | 'Senior';

export interface VoiceProfile {
  id: string;
  name: string;
  gender: VoiceGender;
  ageRange: VoiceAgeRange;
  tagline: string;
  description: string;
  traits: string[];
  bestFor: string[];
  color: string;
  accent: string;
  sampleText: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  samplePhrase: string;
}

export interface VoiceStyle {
  id: string;
  name: string;
  category: 'General' | 'Professional' | 'Expressive' | 'Atmospheric';
  description: string;
  icon: string;
  promptModifier: string;
}

export interface AudioGenerationItem {
  id: string;
  userId?: string;
  text: string;
  voice: string;
  gender: VoiceGender;
  ageRange: VoiceAgeRange;
  style: string;
  language: string;
  speed: number;
  pitch: number;
  duration: number;
  wordCount: number;
  audioBase64: string;
  mimeType: string;
  createdAt: string;
  isFavorite?: boolean;
  isMultiSpeaker?: boolean;
}

export interface UserVoicePreferences {
  preferredGender: 'all' | 'Female' | 'Male';
  preferredAgeRange: 'all' | 'Child' | 'Adult' | 'Senior';
  preferredStyle: string;
  preferredLanguage: string;
  defaultSpeed: number;
  defaultPitch: number;
  preferredVoice: string;
}

export interface DialogueSpeaker {
  id: string;
  name: string;
  voice: string;
  gender?: VoiceGender;
  ageRange?: VoiceAgeRange;
  avatarColor?: string;
}

export interface TextPreset {
  id: string;
  title: string;
  category: string;
  language: string;
  recommendedVoice: string;
  recommendedStyle: string;
  recommendedAge?: VoiceAgeRange;
  recommendedGender?: VoiceGender;
  text: string;
}

export type VideoAspectRatio = '16:9' | '9:16' | '1:1';

export type WaveformVisualMode = 'bars' | 'circle' | 'wave' | 'frequency_mesh' | 'minimal_dots';

export interface VideoProjectConfig {
  channelName: string;
  channelAvatarColor: string;
  title: string;
  subtitle: string;
  categoryTag: string;
  aspectRatio: VideoAspectRatio;
  themePreset: string;
  customBgImage?: string;
  waveformMode: WaveformVisualMode;
  waveformColor: string;
  showCaptions: boolean;
  showTimecode: boolean;
  showChannelBadge: boolean;
  vignetteStrength: number; // 0 - 1
  visualFilter: 'none' | 'cinematic' | 'glow' | 'cyber' | 'warm';
}

export type ProjectType = 'audio' | 'video' | 'thumbnail' | 'dialogue';

export interface UserProject {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  projectType: ProjectType;
  // Associated audio item (for speech/audiogram)
  audioItem?: AudioGenerationItem;
  // Associated video configuration (for audiograms & video exports)
  videoConfig?: VideoProjectConfig;
  // Associated thumbnail & artwork
  thumbnailData?: {
    imageUrl: string;
    hookText?: string;
    channelName?: string;
    engine?: string;
    aspectRatio?: VideoAspectRatio;
    analysisData?: any;
  };
  // Multi-speaker dialogue configuration
  dialogueData?: {
    speakers: DialogueSpeaker[];
    scriptText: string;
  };
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
  tags?: string[];
}

