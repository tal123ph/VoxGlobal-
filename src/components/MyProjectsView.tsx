import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FolderKanban,
  Play,
  Pause,
  Trash2,
  Star,
  Share2,
  Download,
  ExternalLink,
  Sparkles,
  Film,
  Mic,
  Image as ImageIcon,
  Search,
  Grid,
  List,
  Calendar,
  Clock,
  ArrowUpDown,
  Check,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
  Volume2,
  Plus,
  FileText,
  Maximize2,
  Layers,
  ChevronRight,
  ShieldCheck,
  Users,
  Video as VideoIcon,
} from 'lucide-react';
import { UserProject, AudioGenerationItem, ProjectType, VideoProjectConfig } from '../types';

interface MyProjectsViewProps {
  projects: UserProject[];
  audioHistory: AudioGenerationItem[];
  currentAudioId?: string;
  isLoggedIn: boolean;
  onOpenInVoiceStudio: (item: AudioGenerationItem) => void;
  onOpenInVideoStudio: (item: AudioGenerationItem, videoConfig?: VideoProjectConfig) => void;
  onDeleteProject: (projectId: string, isAudioHistoryItem?: boolean) => Promise<void>;
  onToggleFavorite: (projectId: string, isAudioHistoryItem?: boolean) => Promise<void>;
  onShareItem: (item: AudioGenerationItem) => void;
  onNavigateToVoiceStudio: () => void;
  onNavigateToVideoStudio: () => void;
}

export const MyProjectsView: React.FC<MyProjectsViewProps> = ({
  projects,
  audioHistory,
  currentAudioId,
  isLoggedIn,
  onOpenInVoiceStudio,
  onOpenInVideoStudio,
  onDeleteProject,
  onToggleFavorite,
  onShareItem,
  onNavigateToVoiceStudio,
  onNavigateToVideoStudio,
}) => {
  // Active Filter Tab: 'all' | 'audio' | 'video' | 'thumbnail' | 'favorites'
  const [activeTab, setActiveTab] = useState<'all' | 'audio' | 'video' | 'thumbnail' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'duration_desc' | 'duration_asc' | 'title_asc'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Multi-select batch mode
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());

  // Inline Audio Playback State
  const [playingItemId, setPlayingItemId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [playbackCurrentTime, setPlaybackCurrentTime] = useState<number>(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Single Delete Confirmation Dialog
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string; isAudioItem?: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Batch Delete Confirmation Dialog
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState<boolean>(false);

  // High-Res Image Preview Lightbox Modal
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; hookText?: string } | null>(null);

  // Combine standalone projects with audio history items (avoiding duplicates)
  const unifiedProjects = useMemo<UserProject[]>(() => {
    const map = new Map<string, UserProject>();

    // 1. First add explicit user projects
    projects.forEach((proj) => {
      map.set(proj.id, proj);
    });

    // 2. Add audio generations from history as projects if not already represented
    audioHistory.forEach((audio) => {
      if (!map.has(audio.id)) {
        const firstLine = audio.text ? audio.text.split('\n')[0].replace(/[#*]/g, '').trim() : 'Voice Speech Track';
        const projectItem: UserProject = {
          id: audio.id,
          userId: audio.userId,
          title: firstLine.length > 55 ? `${firstLine.slice(0, 52)}...` : firstLine,
          description: audio.text,
          projectType: audio.isMultiSpeaker ? 'dialogue' : 'audio',
          audioItem: audio,
          createdAt: audio.createdAt || new Date().toISOString(),
          updatedAt: audio.createdAt || new Date().toISOString(),
          isFavorite: !!audio.isFavorite,
          tags: [audio.voice, audio.language, audio.style || 'Friendly'],
        };
        map.set(audio.id, projectItem);
      }
    });

    return Array.from(map.values());
  }, [projects, audioHistory]);

  // Audio Playback handler
  const handleTogglePlayAudio = (project: UserProject) => {
    const audioData = project.audioItem?.audioBase64;
    if (!audioData) return;

    if (playingItemId === project.id) {
      if (audioPlayerRef.current) {
        if (audioPlayerRef.current.paused) {
          audioPlayerRef.current.play();
        } else {
          audioPlayerRef.current.pause();
          setPlayingItemId(null);
        }
      }
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const mime = project.audioItem?.mimeType || 'audio/wav';
      const src = `data:${mime};base64,${audioData}`;
      const audio = new Audio(src);
      audioPlayerRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPlaybackProgress((audio.currentTime / audio.duration) * 100);
          setPlaybackCurrentTime(audio.currentTime);
        }
      };

      audio.onended = () => {
        setPlayingItemId(null);
        setPlaybackProgress(0);
        setPlaybackCurrentTime(0);
      };

      audio.play().catch((err) => console.warn('Audio play error:', err));
      setPlayingItemId(project.id);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    let list = unifiedProjects.filter((p) => {
      // Tab filter
      if (activeTab === 'audio') {
        if (p.projectType !== 'audio' && p.projectType !== 'dialogue') return false;
      } else if (activeTab === 'video') {
        if (p.projectType !== 'video') return false;
      } else if (activeTab === 'thumbnail') {
        if (p.projectType !== 'thumbnail') return false;
      } else if (activeTab === 'favorites') {
        if (!p.isFavorite) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = p.title.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q) || false;
        const voiceMatch = p.audioItem?.voice.toLowerCase().includes(q) || false;
        const langMatch = p.audioItem?.language.toLowerCase().includes(q) || false;
        const tagMatch = p.tags?.some((t) => t.toLowerCase().includes(q)) || false;
        const hookMatch = p.thumbnailData?.hookText?.toLowerCase().includes(q) || false;
        if (!titleMatch && !descMatch && !voiceMatch && !langMatch && !tagMatch && !hookMatch) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'duration_desc') {
        const durA = a.audioItem?.duration || 0;
        const durB = b.audioItem?.duration || 0;
        return durB - durA;
      }
      if (sortBy === 'duration_asc') {
        const durA = a.audioItem?.duration || 0;
        const durB = b.audioItem?.duration || 0;
        return durA - durB;
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return list;
  }, [unifiedProjects, activeTab, searchQuery, sortBy]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: unifiedProjects.length,
      audio: unifiedProjects.filter((p) => p.projectType === 'audio' || p.projectType === 'dialogue').length,
      video: unifiedProjects.filter((p) => p.projectType === 'video').length,
      thumbnail: unifiedProjects.filter((p) => p.projectType === 'thumbnail').length,
      favorites: unifiedProjects.filter((p) => p.isFavorite).length,
    };
  }, [unifiedProjects]);

  // Handle single deletion execution
  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteProject(projectToDelete.id, projectToDelete.isAudioItem);
      if (playingItemId === projectToDelete.id && audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        setPlayingItemId(null);
      }
      setProjectToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle batch deletion
  const confirmBatchDelete = async () => {
    setIsDeleting(true);
    try {
      for (const id of Array.from(selectedProjectIds)) {
        await onDeleteProject(id, true);
      }
      setSelectedProjectIds(new Set());
      setIsBatchMode(false);
      setIsBatchDeleteModalOpen(false);
    } catch (err) {
      console.error('Batch delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle multi-select toggle
  const toggleSelectProject = (id: string) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Select/Deselect all filtered projects
  const handleSelectAll = () => {
    if (selectedProjectIds.size === filteredProjects.length) {
      setSelectedProjectIds(new Set());
    } else {
      setSelectedProjectIds(new Set(filteredProjects.map((p) => p.id)));
    }
  };

  // Download Audio Helper
  const handleDownloadAudio = (project: UserProject, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!project.audioItem?.audioBase64) return;
    const link = document.createElement('a');
    link.href = `data:${project.audioItem.mimeType || 'audio/wav'};base64,${project.audioItem.audioBase64}`;
    const cleanTitle = project.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    link.download = `${cleanTitle || 'voxaura_project'}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Image Helper
  const handleDownloadImage = (url: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    link.download = `${cleanTitle || 'thumbnail'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="my-projects-container" className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-orange-950/30 via-purple-950/25 to-black/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-purple-600 shadow-lg shadow-orange-500/20 text-white">
                <FolderKanban className="h-5 w-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                My Projects Hub
              </h1>
              <span className="rounded-full bg-white/10 border border-white/15 px-3 py-0.5 text-xs font-bold text-orange-300">
                {unifiedProjects.length} Creations
              </span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Access, audition, load back into the Studio, or permanently delete your customized neural audio tracks, 16:9 audiogram videos, and AI thumbnail designs.
            </p>
          </div>

          {/* Quick Create Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              id="new-voice-project-btn"
              onClick={onNavigateToVoiceStudio}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Mic className="h-4 w-4" />
              <span>New Voice Track</span>
            </button>
            <button
              type="button"
              id="new-video-project-btn"
              onClick={onNavigateToVideoStudio}
              className="flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 px-4 py-2.5 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <Film className="h-4 w-4 text-purple-400" />
              <span>New Video & Thumbnail</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-black/30 rounded-2xl p-3 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <Mic className="h-3.5 w-3.5 text-orange-400" />
              <span>Voice Tracks</span>
            </div>
            <span className="text-sm font-bold text-white">{counts.audio}</span>
          </div>
          <div className="bg-black/30 rounded-2xl p-3 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <Film className="h-3.5 w-3.5 text-purple-400" />
              <span>Video Audiograms</span>
            </div>
            <span className="text-sm font-bold text-white">{counts.video}</span>
          </div>
          <div className="bg-black/30 rounded-2xl p-3 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
              <span>AI Thumbnails</span>
            </div>
            <span className="text-sm font-bold text-white">{counts.thumbnail}</span>
          </div>
          <div className="bg-black/30 rounded-2xl p-3 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400/30" />
              <span>Favorites</span>
            </div>
            <span className="text-sm font-bold text-white">{counts.favorites}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs, Search Bar, Sort & View Controls */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 backdrop-blur-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-2xl text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All ({counts.all})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'audio'
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Mic className="h-3.5 w-3.5 text-orange-300" />
              <span>Voice Audio ({counts.audio})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Film className="h-3.5 w-3.5 text-purple-300" />
              <span>Video Projects ({counts.video})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('thumbnail')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'thumbnail'
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5 text-amber-300" />
              <span>AI Thumbnails ({counts.thumbnail})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('favorites')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'favorites'
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              <span>Favorites ({counts.favorites})</span>
            </button>
          </div>

          {/* Batch Actions & View Mode Toggle */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            {/* Batch Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setIsBatchMode(!isBatchMode);
                setSelectedProjectIds(new Set());
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isBatchMode
                  ? 'bg-orange-500/20 border-orange-500 text-orange-200'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>{isBatchMode ? 'Cancel Batch' : 'Select Multiple'}</span>
            </button>

            {/* View Mode Grid / List */}
            <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Input & Sort Selector Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, voice, language, script text..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-orange-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-white/50" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 focus:border-orange-500 focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-[#121214] text-white">Newest First</option>
              <option value="oldest" className="bg-[#121214] text-white">Oldest First</option>
              <option value="duration_desc" className="bg-[#121214] text-white">Duration (Longest)</option>
              <option value="duration_asc" className="bg-[#121214] text-white">Duration (Shortest)</option>
              <option value="title_asc" className="bg-[#121214] text-white">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Batch Select Controls Banner */}
        {isBatchMode && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSelectAll}
                className="flex items-center gap-1.5 text-orange-300 font-bold hover:text-white cursor-pointer"
              >
                {selectedProjectIds.size === filteredProjects.length ? (
                  <CheckSquare className="h-4 w-4 text-orange-400" />
                ) : (
                  <Square className="h-4 w-4 text-orange-400" />
                )}
                <span>
                  {selectedProjectIds.size === filteredProjects.length ? 'Deselect All' : 'Select All'} ({selectedProjectIds.size}/{filteredProjects.length})
                </span>
              </button>
            </div>

            {selectedProjectIds.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchDeleteModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all cursor-pointer shadow-md"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Selected ({selectedProjectIds.size})</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Projects List / Grid View */}
      {filteredProjects.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-white/40">
            <FolderKanban className="h-8 w-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">No Projects Found</h3>
            <p className="text-xs text-white/50">
              {searchQuery
                ? `No creations match the search query "${searchQuery}". Try clearing your filters.`
                : activeTab !== 'all'
                ? `You do not have any items in the "${activeTab}" category yet.`
                : 'You have not created any audio tracks or video projects yet. Create your first piece below!'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
              >
                Clear Search Filter
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onNavigateToVoiceStudio}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-purple-600 text-xs font-bold text-white shadow-lg cursor-pointer"
                >
                  <Mic className="h-4 w-4" />
                  <span>Generate Voice Audio</span>
                </button>
                <button
                  type="button"
                  onClick={onNavigateToVideoStudio}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white cursor-pointer"
                >
                  <Film className="h-4 w-4 text-purple-400" />
                  <span>Design Video & Thumbnail</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const isSelected = selectedProjectIds.has(project.id);
            const isPlaying = playingItemId === project.id;
            const hasAudio = !!project.audioItem?.audioBase64;
            const hasThumbnail = !!(project.thumbnailData?.imageUrl || project.videoConfig?.customBgImage);
            const thumbUrl = project.thumbnailData?.imageUrl || project.videoConfig?.customBgImage;

            return (
              <div
                key={project.id}
                className={`group relative rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col bg-[#101014]/90 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:border-white/20 ${
                  isSelected
                    ? 'border-orange-500 ring-2 ring-orange-500/30'
                    : 'border-white/10'
                }`}
              >
                {/* Visual / Thumbnail Header */}
                <div className="relative aspect-video w-full overflow-hidden bg-black/60 flex items-center justify-center border-b border-white/10">
                  {hasThumbnail && thumbUrl ? (
                    <>
                      <img
                        src={thumbUrl}
                        alt={project.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                      {/* Zoom button */}
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxImage({
                            url: thumbUrl,
                            title: project.title,
                            hookText: project.thumbnailData?.hookText,
                          })
                        }
                        className="absolute top-2.5 left-2.5 rounded-lg bg-black/60 hover:bg-black/80 border border-white/20 p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer"
                        title="View Full Thumbnail Image"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    /* Waveform & Sound Stage Artwork */
                    <div className="w-full h-full flex flex-col items-center justify-center relative p-4 bg-gradient-to-br from-purple-950/40 via-indigo-950/20 to-black">
                      <div className="flex items-center gap-1 h-12">
                        {[40, 75, 50, 90, 60, 85, 45, 95, 70, 55, 80, 65, 45].map((h, i) => (
                          <div
                            key={i}
                            className={`w-1.5 rounded-full transition-all duration-300 ${
                              isPlaying
                                ? 'bg-gradient-to-t from-orange-500 to-amber-300 animate-pulse'
                                : 'bg-white/20'
                            }`}
                            style={{ height: isPlaying ? `${Math.max(20, (h * (i % 2 === 0 ? 1 : 0.8)))}%` : `${h * 0.5}%` }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-white/40 mt-2 font-mono">
                        {project.audioItem?.voice || 'Neural Audio'} • {project.audioItem?.language || 'Global'}
                      </span>
                    </div>
                  )}

                  {/* Top Right Badges & Favorite */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    {/* Project Type Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border ${
                        project.projectType === 'video'
                          ? 'bg-purple-500/30 border-purple-400/50 text-purple-200'
                          : project.projectType === 'thumbnail'
                          ? 'bg-amber-500/30 border-amber-400/50 text-amber-200'
                          : project.projectType === 'dialogue'
                          ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-200'
                          : 'bg-orange-500/30 border-orange-400/50 text-orange-200'
                      }`}
                    >
                      {project.projectType === 'video'
                        ? '16:9 Video'
                        : project.projectType === 'thumbnail'
                        ? 'Thumbnail'
                        : project.projectType === 'dialogue'
                        ? 'Dialogue'
                        : 'Voice Track'}
                    </span>

                    {/* Star Favorite Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(project.id, !projects.some((p) => p.id === project.id));
                      }}
                      className={`p-1.5 rounded-lg backdrop-blur-md border transition-colors cursor-pointer ${
                        project.isFavorite
                          ? 'bg-yellow-500/30 border-yellow-400 text-yellow-300'
                          : 'bg-black/50 border-white/10 text-white/50 hover:text-white'
                      }`}
                      title={project.isFavorite ? 'Remove Favorite' : 'Mark as Favorite'}
                    >
                      <Star className={`h-3.5 w-3.5 ${project.isFavorite ? 'fill-yellow-400' : ''}`} />
                    </button>
                  </div>

                  {/* Batch Checkbox */}
                  {isBatchMode && (
                    <button
                      type="button"
                      onClick={() => toggleSelectProject(project.id)}
                      className="absolute top-2.5 left-2.5 z-20 p-1.5 rounded-lg bg-black/80 border border-white/30 text-white cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-orange-400" />
                      ) : (
                        <Square className="h-4 w-4 text-white/60" />
                      )}
                    </button>
                  )}

                  {/* Inline Play Button on Preview */}
                  {hasAudio && (
                    <button
                      type="button"
                      onClick={() => handleTogglePlayAudio(project)}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors group/play cursor-pointer"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-xl group-hover/play:scale-110 transition-transform">
                        {isPlaying ? (
                          <Pause className="h-5 w-5 fill-white" />
                        ) : (
                          <Play className="h-5 w-5 fill-white translate-x-0.5" />
                        )}
                      </div>
                    </button>
                  )}

                  {/* Audio Duration Pill */}
                  {project.audioItem?.duration ? (
                    <div className="absolute bottom-2 right-2 rounded-md bg-black/80 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-white/80 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5 text-orange-400" />
                      <span>
                        {Math.floor(project.audioItem.duration / 60)}:
                        {String(Math.floor(project.audioItem.duration % 60)).padStart(2, '0')}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    {/* Project Title */}
                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-orange-300 transition-colors">
                      {project.title}
                    </h3>

                    {/* Script / Description Excerpt */}
                    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed font-sans">
                      {project.description || project.audioItem?.text || 'No script description provided.'}
                    </p>

                    {/* Meta Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {project.audioItem?.voice && (
                        <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/70">
                          🎙️ {project.audioItem.voice}
                        </span>
                      )}
                      {project.audioItem?.language && (
                        <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/70">
                          🌐 {project.audioItem.language}
                        </span>
                      )}
                      {project.audioItem?.style && (
                        <span className="rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300">
                          ✨ {project.audioItem.style}
                        </span>
                      )}
                      {project.thumbnailData?.hookText && (
                        <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300 truncate max-w-[150px]">
                          🔥 {project.thumbnailData.hookText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Creation Date & Action Toolbar */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-white/40 flex items-center gap-1 font-mono">
                      <Calendar className="h-3 w-3" />
                      {new Date(project.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      {/* Open in Voice Studio */}
                      {project.audioItem && (
                        <button
                          type="button"
                          onClick={() => onOpenInVoiceStudio(project.audioItem!)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-orange-500/20 border border-white/10 text-white/70 hover:text-orange-300 transition-colors cursor-pointer"
                          title="Open Script in Voice Studio"
                        >
                          <Mic className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Open in Video Studio */}
                      {project.audioItem && (
                        <button
                          type="button"
                          onClick={() => onOpenInVideoStudio(project.audioItem!, project.videoConfig)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-purple-500/20 border border-white/10 text-white/70 hover:text-purple-300 transition-colors cursor-pointer"
                          title="Open in Video & Audiogram Studio"
                        >
                          <Film className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Download Audio or Image */}
                      {hasAudio && (
                        <button
                          type="button"
                          onClick={(e) => handleDownloadAudio(project, e)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                          title="Download Audio Track (WAV)"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Share Link */}
                      {project.audioItem && (
                        <button
                          type="button"
                          onClick={() => onShareItem(project.audioItem!)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                          title="Share Project Link"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Delete Project Button */}
                      <button
                        type="button"
                        onClick={() =>
                          setProjectToDelete({
                            id: project.id,
                            title: project.title,
                            isAudioItem: !projects.some((p) => p.id === project.id),
                          })
                        }
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 text-white/50 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST / TABLE VIEW */
        <div className="rounded-3xl border border-white/10 bg-[#101014]/90 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-white/70">
              <thead className="border-b border-white/10 bg-white/5 uppercase tracking-wider text-[10px] text-white/50">
                <tr>
                  {isBatchMode && <th className="p-4 w-10">Select</th>}
                  <th className="p-4">Project</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Voice & Style</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProjects.map((project) => {
                  const isSelected = selectedProjectIds.has(project.id);
                  const isPlaying = playingItemId === project.id;
                  const hasAudio = !!project.audioItem?.audioBase64;

                  return (
                    <tr
                      key={project.id}
                      className={`hover:bg-white/5 transition-colors ${
                        isSelected ? 'bg-orange-500/10' : ''
                      }`}
                    >
                      {isBatchMode && (
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => toggleSelectProject(project.id)}
                            className="text-white/60 hover:text-white"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-orange-400" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      )}

                      {/* Project info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {hasAudio && (
                            <button
                              type="button"
                              onClick={() => handleTogglePlayAudio(project)}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 hover:bg-orange-500 border border-orange-500/30 text-orange-300 hover:text-white transition-all cursor-pointer"
                            >
                              {isPlaying ? (
                                <Pause className="h-3.5 w-3.5 fill-current" />
                              ) : (
                                <Play className="h-3.5 w-3.5 fill-current translate-x-0.5" />
                              )}
                            </button>
                          )}
                          <div className="space-y-0.5 max-w-md">
                            <h4 className="font-bold text-white line-clamp-1">{project.title}</h4>
                            <p className="text-[11px] text-white/50 line-clamp-1">{project.description || project.audioItem?.text}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            project.projectType === 'video'
                              ? 'bg-purple-500/20 text-purple-300'
                              : project.projectType === 'thumbnail'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-orange-500/20 text-orange-300'
                          }`}
                        >
                          {project.projectType}
                        </span>
                      </td>

                      {/* Voice & Style */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5 text-[11px]">
                          <span className="text-white font-medium">{project.audioItem?.voice || 'Custom Theme'}</span>
                          <span className="text-white/40">{project.audioItem?.language || 'Global'}</span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="p-4 font-mono text-xs text-white/70">
                        {project.audioItem?.duration
                          ? `${Math.floor(project.audioItem.duration / 60)}:${String(
                              Math.floor(project.audioItem.duration % 60)
                            ).padStart(2, '0')}`
                          : '--'}
                      </td>

                      {/* Created */}
                      <td className="p-4 text-[11px] text-white/50 whitespace-nowrap">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {project.audioItem && (
                            <button
                              type="button"
                              onClick={() => onOpenInVoiceStudio(project.audioItem!)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-orange-500/20 text-white/60 hover:text-orange-300"
                              title="Open in Voice Studio"
                            >
                              <Mic className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {project.audioItem && (
                            <button
                              type="button"
                              onClick={() => onOpenInVideoStudio(project.audioItem!, project.videoConfig)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-purple-500/20 text-white/60 hover:text-purple-300"
                              title="Open in Video Studio"
                            >
                              <Film className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setProjectToDelete({
                                id: project.id,
                                title: project.title,
                                isAudioItem: !projects.some((p) => p.id === project.id),
                              })
                            }
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400"
                            title="Delete Project"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SINGLE PROJECT DELETE CONFIRMATION MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-[#121216] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Project?</h3>
                <p className="text-xs text-white/60">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-white/80">
              <span className="text-white/50 block text-[10px] uppercase font-bold tracking-wider mb-1">Target Project:</span>
              <p className="font-semibold text-white truncate">{projectToDelete.title}</p>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Are you sure you want to permanently delete this project from your creations library and cloud storage?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-red-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH DELETE CONFIRMATION MODAL */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-[#121216] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Delete {selectedProjectIds.size} Projects?
                </h3>
                <p className="text-xs text-white/60">Bulk deletion operation</p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              You are about to permanently delete <strong className="text-red-300">{selectedProjectIds.size} selected projects</strong> from your studio database. This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBatchDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-red-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Confirm Bulk Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIGH-RES IMAGE LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl w-full rounded-3xl overflow-hidden border border-white/20 bg-[#121216] shadow-2xl space-y-3 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h4 className="text-sm font-bold text-white truncate max-w-lg">
                {lightboxImage.title}
              </h4>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {lightboxImage.hookText && (
              <p className="text-xs text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                🔥 High-CTR Title Hook: {lightboxImage.hookText}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={(e) => handleDownloadImage(lightboxImage.url, lightboxImage.title, e)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 text-xs font-bold text-white shadow-lg cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download High-Res Thumbnail</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
