import React, { useState } from 'react';
import {
  Sparkles,
  History,
  Landmark,
  Shield,
  Flame,
  Check,
  Copy,
  Download,
  RefreshCw,
  AlertCircle,
  Eye,
  Film,
  Layers,
  ScrollText,
  Compass,
} from 'lucide-react';

export interface HistoricalAnalysisResult {
  historicalEra: string;
  location: string;
  mainCharacter: string;
  opposingForce: string;
  mainConflict: string;
  mostDramaticMoment: string;
  strongestEmotion: string;
  importantObjects: string;
  mysteryHook: string;
  bestVisualScene: string;
  compositionStrategy: string;
  primaryHook: string;
  textHooks: string[];
  visualQuestionAnswered: string;
  clickabilityScore: number;
  channelBranding: string;
  diffusionPrompt: string;
}

interface HistoricalThumbnailGeneratorProps {
  initialScript?: string;
  currentChannelName?: string;
  onApplyImage: (imageUrl: string, suggestedTitle?: string, brandingName?: string) => void;
  onDownloadCanvas: () => void;
}

export const HISTORICAL_GENRES = [
  {
    id: 'historical_documentary',
    name: 'Cinematic Docudrama',
    icon: Landmark,
    description: 'Netflix/BBC style, rich natural lighting, photorealistic textures',
  },
  {
    id: 'epic_battle',
    name: 'Epic Siege & Battlefield',
    icon: Shield,
    description: 'Dramatic clash, atmospheric smoke, embers, heroic defiance',
  },
  {
    id: 'ancient_mystery',
    name: 'Ancient Lost Mystery',
    icon: Compass,
    description: 'Temples, forgotten relics, shadowy ruins, dramatic chiaroscuro',
  },
  {
    id: 'royal_intrigue',
    name: 'Royal Court & Dynasty',
    icon: Flame,
    description: 'Emperors, golden halls, high-tension political turning points',
  },
  {
    id: 'last_stand',
    name: 'Solitary Hero / Last Stand',
    icon: Film,
    description: 'Close-up emotional focus, solitary defender, overwhelming odds',
  },
];

export const HistoricalThumbnailGenerator: React.FC<HistoricalThumbnailGeneratorProps> = ({
  initialScript = '',
  currentChannelName = 'Hamari History',
  onApplyImage,
  onDownloadCanvas,
}) => {
  const [scriptText, setScriptText] = useState<string>(
    initialScript ||
      'In the winter of 1526, on the dusty plains of Panipat, Babur faced an army of 100,000 soldiers with only 12,000 battle-hardened troops. With innovative Ottoman cart barricades, gunpowder cannons, and flanking cavalry tactics, he fought to decide the fate of Hindustan.'
  );
  const [channelBrand, setChannelBrand] = useState<string>(currentChannelName || 'Hamari History');
  const [selectedGenre, setSelectedGenre] = useState<string>('historical_documentary');
  const [isAnalyzingAndGenerating, setIsAnalyzingAndGenerating] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<HistoricalAnalysisResult | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [engineUsed, setEngineUsed] = useState<string>('nano-banana-diffusion');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTextHook, setSelectedTextHook] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showFullAnalysis, setShowFullAnalysis] = useState<boolean>(true);

  // Sync script if changed externally and user hasn't edited yet
  React.useEffect(() => {
    if (initialScript && initialScript.trim().length > 0 && (!scriptText || scriptText.length < 20)) {
      setScriptText(initialScript);
    }
  }, [initialScript]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateHistoricalThumbnail = async () => {
    if (!scriptText.trim()) {
      setErrorMessage('Please provide a historical story or script to analyze.');
      return;
    }

    setIsAnalyzingAndGenerating(true);
    setErrorMessage(null);
    setStatusNotice(null);

    try {
      const response = await fetch('/api/video/historical-thumbnail-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptText,
          channelName: channelBrand,
          aspectRatio: '16:9',
          stylePreset: selectedGenre,
          includeBranding: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze script and generate thumbnail.');
      }

      setGeneratedImageUrl(data.imageUrl);
      setAnalysisResult(data.analysis);
      setEngineUsed(data.generatorEngine || 'nano-banana-diffusion');
      setStatusNotice(data.notice || null);
      setSelectedTextHook(data.primaryHook || (data.textHooks && data.textHooks[0]) || '');

      // Automatically apply the generated artwork and text hook to the active video canvas
      onApplyImage(data.imageUrl, data.primaryHook, channelBrand);
    } catch (err: any) {
      console.error('Historical Thumbnail Generation Error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during generation.');
    } finally {
      setIsAnalyzingAndGenerating(false);
    }
  };

  return (
    <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-black/40 to-stone-950/30 p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-md shadow-amber-500/10">
            <History className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Historical Storytelling Thumbnail Designer
              </h3>
              <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                7-STEP AI SUITE
              </span>
            </div>
            <p className="text-xs text-white/60">
              Deep historical script analysis &bull; High-CTR 16:9 cinematic documentary artwork
            </p>
          </div>
        </div>

        {/* Channel Branding Quick Tag */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50 font-medium">Channel Brand:</span>
          <button
            type="button"
            onClick={() => setChannelBrand('Hamari History')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              channelBrand === 'Hamari History'
                ? 'bg-amber-500 text-black border border-amber-400 shadow-sm'
                : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
            }`}
          >
            Hamari History
          </button>
          <input
            type="text"
            value={channelBrand}
            onChange={(e) => setChannelBrand(e.target.value)}
            placeholder="Custom channel..."
            className="w-32 rounded-xl border border-white/15 bg-black/40 px-2.5 py-1 text-xs text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Script Input & Genre Selection */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold uppercase tracking-wider text-amber-300/80 flex items-center gap-1.5">
              <ScrollText className="h-3.5 w-3.5" />
              <span>Historical Story / Script Input</span>
            </label>
            <span className="text-[11px] text-white/40">{scriptText.length} characters</span>
          </div>
          <textarea
            rows={4}
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder="Paste your historical script, battle description, mystery story, or docudrama voiceover here..."
            className="w-full rounded-2xl border border-amber-500/30 bg-black/50 p-3.5 text-xs text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Historical Genre Presets */}
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-white/50 font-bold">
            Documentary Sub-Genre & Atmosphere
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {HISTORICAL_GENRES.map((genre) => {
              const Icon = genre.icon;
              const isSelected = selectedGenre === genre.id;
              return (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 bg-amber-500/15 text-white ring-1 ring-amber-500/40 shadow-sm'
                      : 'border-white/10 bg-black/30 text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isSelected ? 'bg-amber-500 text-black' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{genre.name}</div>
                    <div className="text-[10px] text-white/50 line-clamp-1">{genre.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error & Notice Messages */}
      {errorMessage && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-500/15 border border-red-500/30 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {statusNotice && !errorMessage && (
        <div className="flex items-start gap-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 p-3 text-xs text-amber-200">
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Main Generate Button */}
      <button
        type="button"
        id="btn-analyze-historical-thumbnail"
        onClick={handleGenerateHistoricalThumbnail}
        disabled={isAnalyzingAndGenerating || !scriptText.trim()}
        className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-xl shadow-amber-600/25 transition-all cursor-pointer disabled:opacity-50"
      >
        {isAnalyzingAndGenerating ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin text-white" />
            <span>Analyzing Script &amp; Crafting 16:9 Documentary Thumbnail...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 text-amber-200" />
            <span>Deep Analyze Story &amp; Generate 16:9 Cinematic Thumbnail</span>
          </>
        )}
      </button>

      {/* 7-Step Deep Analysis Result Panel */}
      {analysisResult && (
        <div className="space-y-5 rounded-2xl border border-amber-500/30 bg-black/60 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                7-Step Script Breakdown &amp; CTR Strategy
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                Clickability: {analysisResult.clickabilityScore || 98}%
              </span>
              <button
                type="button"
                onClick={() => setShowFullAnalysis(!showFullAnalysis)}
                className="text-[11px] text-amber-400 hover:underline font-medium cursor-pointer"
              >
                {showFullAnalysis ? 'Hide Details' : 'View Full Details'}
              </button>
            </div>
          </div>

          {/* 1-to-2 Second Dramatic Question */}
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 mb-1 flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              <span>Core Visual Dramatic Question (Answers in 1–2s):</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white italic leading-snug">
              "{analysisResult.visualQuestionAnswered || analysisResult.mysteryHook}"
            </p>
          </div>

          {/* Short 3-6 Word Text Hooks (Max CTR) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center justify-between">
              <span>Short High-CTR Thumbnail Text (3–6 Words Max):</span>
              <span className="text-[10px] text-amber-400 font-normal">Click any hook to apply to canvas</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(analysisResult.textHooks || [analysisResult.primaryHook]).map((hook, idx) => {
                const isSelected = selectedTextHook === hook;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedTextHook(hook);
                      if (generatedImageUrl) {
                        onApplyImage(generatedImageUrl, hook, channelBrand);
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs font-extrabold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 ring-2 ring-amber-500/40'
                        : 'border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-amber-500/40'
                    }`}
                  >
                    <span>{hook}</span>
                    {isSelected ? (
                      <Check className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-white/40">Apply</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expanded 7-Step Extraction Grid */}
          {showFullAnalysis && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
              <div className="space-y-1 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 block">
                  1. Era &amp; Environment
                </span>
                <p className="text-white font-medium">{analysisResult.historicalEra}</p>
                <p className="text-white/60 text-[11px]">{analysisResult.location}</p>
              </div>

              <div className="space-y-1 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 block">
                  2. Hero vs Opposing Force
                </span>
                <p className="text-white font-medium">{analysisResult.mainCharacter}</p>
                <p className="text-white/60 text-[11px]">vs. {analysisResult.opposingForce}</p>
              </div>

              <div className="space-y-1 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 block">
                  3. Most Dramatic Climax Moment
                </span>
                <p className="text-white/80">{analysisResult.mostDramaticMoment}</p>
                <span className="inline-block mt-1 text-[10px] text-amber-300 font-semibold">
                  Emotion: {analysisResult.strongestEmotion}
                </span>
              </div>

              <div className="space-y-1 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 block">
                  4. Composition &amp; Depth
                </span>
                <p className="text-white/80">{analysisResult.compositionStrategy}</p>
                <span className="inline-block mt-1 text-[10px] text-white/50">
                  Objects: {analysisResult.importantObjects}
                </span>
              </div>
            </div>
          )}

          {/* Generated Image Preview & Quick Actions */}
          {generatedImageUrl && (
            <div className="pt-3 border-t border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Generated 16:9 Documentary Artwork:</span>
                <span className="text-[11px] text-amber-400 font-mono">Engine: {engineUsed}</span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/40 aspect-video bg-black/60 shadow-xl group">
                <img
                  src={generatedImageUrl}
                  alt="Historical YouTube Thumbnail"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* Channel Watermark Preview */}
                <div className="absolute top-2.5 left-2.5 rounded-lg bg-black/70 border border-amber-500/40 px-2 py-1 text-[10px] font-bold text-amber-300 backdrop-blur-md">
                  {channelBrand}
                </div>

                {/* Text Hook Overlay Preview */}
                {selectedTextHook && (
                  <div className="absolute bottom-3 left-3 right-3 text-center sm:text-left">
                    <span className="inline-block px-3 py-1.5 rounded-xl bg-black/80 border border-amber-400/60 text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide backdrop-blur-md shadow-2xl">
                      {selectedTextHook}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onApplyImage(generatedImageUrl, selectedTextHook, channelBrand)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 py-2.5 text-xs font-bold text-black shadow-md cursor-pointer transition-all"
                >
                  <Layers className="h-4 w-4" />
                  <span>Apply to Canvas Studio</span>
                </button>

                <button
                  type="button"
                  onClick={onDownloadCanvas}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 py-2.5 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4 text-amber-300" />
                  <span>Download 1280×720 PNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(analysisResult.diffusionPrompt, 'prompt')}
                  className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/70 hover:text-white transition-all cursor-pointer"
                  title="Copy Diffusion Prompt"
                >
                  {copiedField === 'prompt' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
