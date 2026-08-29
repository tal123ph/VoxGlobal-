import React, { useState, useEffect } from 'react';
import {
  Share2,
  Copy,
  Check,
  Globe,
  ExternalLink,
  Code2,
  Sparkles,
  X,
  Mail,
  MessageCircle,
  Play,
  Pause,
  Cloud,
  CheckCircle2,
} from 'lucide-react';
import { AudioGenerationItem } from '../types';
import { createPublicShare } from '../lib/firestoreService';

interface ShareModalProps {
  isOpen: boolean;
  audioItem: AudioGenerationItem | null;
  creatorName?: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  audioItem,
  creatorName = 'Creator',
  onClose,
}) => {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedEmbed, setCopiedEmbed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'social' | 'embed'>('social');
  const [hasNativeShare, setHasNativeShare] = useState<boolean>(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && !!navigator.share) {
      setHasNativeShare(true);
    }
  }, []);

  // When opened with an audio item, ensure Firestore public share record is ready
  useEffect(() => {
    if (isOpen && audioItem) {
      setIsGeneratingLink(true);
      createPublicShare(audioItem, creatorName)
        .then((res) => {
          setShareUrl(res.shareUrl);
        })
        .catch((err) => {
          console.error('Failed to create share link:', err);
          const fallback = `${window.location.origin}${window.location.pathname}?share=${audioItem.id}`;
          setShareUrl(fallback);
        })
        .finally(() => {
          setIsGeneratingLink(false);
        });
    }
  }, [isOpen, audioItem, creatorName]);

  if (!isOpen || !audioItem) return null;

  const scriptSnippet =
    audioItem.text.length > 80
      ? `${audioItem.text.substring(0, 80)}...`
      : audioItem.text;

  const shareTitle = `Listen to this speech generated with VoxAura AI (${audioItem.voice} • ${audioItem.language})`;
  const shareText = `🎙️ Check out this AI synthesized voice clip (${audioItem.voice}, ${audioItem.language}): "${scriptSnippet}"`;

  // Social sharing direct URLs
  const socialLinks = [
    {
      name: 'X (Twitter)',
      color: 'bg-black hover:bg-neutral-900 border-white/20 text-white',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'WhatsApp',
      color: 'bg-[#25D366]/20 hover:bg-[#25D366]/30 border-[#25D366]/40 text-[#25D366]',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    },
    {
      name: 'LinkedIn',
      color: 'bg-[#0A66C2]/20 hover:bg-[#0A66C2]/30 border-[#0A66C2]/40 text-[#0A66C2]',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Facebook',
      color: 'bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border-[#1877F2]/40 text-[#1877F2]',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.688 5H18V0h-3.808C10.597 0 9 1.582 9 4.615V8z" />
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Telegram',
      color: 'bg-[#229ED9]/20 hover:bg-[#229ED9]/30 border-[#229ED9]/40 text-[#229ED9]',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Reddit',
      color: 'bg-[#FF4500]/20 hover:bg-[#FF4500]/30 border-[#FF4500]/40 text-[#FF4500]',
      icon: (
        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z" />
        </svg>
      ),
      url: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`,
    },
    {
      name: 'Email',
      color: 'bg-white/10 hover:bg-white/15 border-white/20 text-white/90',
      icon: <Mail className="h-4 w-4" />,
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + '\n\nListen here: ' + shareUrl)}`,
    },
  ];

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const embedCode = `<iframe src="${shareUrl}" width="100%" height="280" frameborder="0" allow="autoplay" style="border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.3);"></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (e) {
        // Share sheet dismissed by user
      }
    }
  };

  return (
    <div
      id="share-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="share-modal-dialog"
        className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0f0f14] p-6 sm:p-7 shadow-2xl space-y-5 backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Share Audio Snippet</h3>
              <p className="text-xs text-white/50">
                Public share link & direct social media integration
              </p>
            </div>
          </div>
          <button
            id="close-share-modal-btn"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/50 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Audio Summary Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">{audioItem.voice}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-orange-300 font-mono">
                {audioItem.language}
              </span>
              {audioItem.style && (
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] text-purple-300">
                  {audioItem.style}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
              <Cloud className="h-3 w-3" />
              <span>Public Cloud Link</span>
            </div>
          </div>
          <p className="text-xs text-white/70 line-clamp-2 italic font-sans">
            &ldquo;{audioItem.text}&rdquo;
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('social')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'social'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Social & Public Link</span>
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'embed'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Embed Widget</span>
          </button>
        </div>

        {/* Social Sharing Tab */}
        {activeTab === 'social' && (
          <div className="space-y-4">
            {/* Public Link Copy Bar */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider">
                Public Shareable Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="public-share-url-input"
                  type="text"
                  readOnly
                  value={isGeneratingLink ? 'Generating public Firestore link...' : shareUrl}
                  className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-white/90 focus:outline-none select-all"
                />
                <button
                  id="copy-public-link-btn"
                  onClick={handleCopyLink}
                  disabled={isGeneratingLink || !shareUrl}
                  className="flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md shadow-orange-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Native Mobile / OS Share Button */}
            {hasNativeShare && (
              <button
                id="native-device-share-btn"
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 p-2.5 text-xs font-bold text-white transition-all cursor-pointer"
              >
                <Share2 className="h-4 w-4 text-orange-400" />
                <span>Share via System Share Sheet</span>
              </button>
            )}

            {/* Social Media Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider">
                Share Directly to Social Platforms
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {socialLinks.map((plat) => (
                  <a
                    key={plat.name}
                    id={`share-${plat.name.toLowerCase().replace(/[^a-z]/g, '')}-btn`}
                    href={plat.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center gap-2 rounded-2xl border p-2.5 text-xs font-semibold transition-all shadow-sm active:scale-95 ${plat.color}`}
                  >
                    {plat.icon}
                    <span>{plat.name.split(' ')[0]}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Embed Widget Tab */}
        {activeTab === 'embed' && (
          <div className="space-y-3">
            <label className="text-xs font-bold text-white/70 uppercase tracking-wider">
              Embed Audio Player HTML
            </label>
            <p className="text-xs text-white/50">
              Paste this responsive iframe code into any website, blog post, or Notion document to embed your audio snippet.
            </p>
            <textarea
              id="embed-code-textarea"
              readOnly
              rows={3}
              value={embedCode}
              className="w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-xs font-mono text-white/80 select-all focus:outline-none"
            />
            <button
              id="copy-embed-code-btn"
              onClick={handleCopyEmbed}
              className="flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md shadow-orange-600/20 active:scale-95 cursor-pointer"
            >
              {copiedEmbed ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Embed Code Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Embed Code</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[11px] text-white/40 font-mono">
          <span>Anyone with the public link can listen</span>
          <span className="text-orange-400">24kHz Audio</span>
        </div>
      </div>
    </div>
  );
};
