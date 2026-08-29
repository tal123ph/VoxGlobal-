import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
  // Remove sensitive fingerprinting headers
  res.removeHeader('X-Powered-By');
  next();
});

// In-Memory Rate Limiting for DoS & Resource Exhaustion Protection
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

function createRateLimiter(options: { windowMs: number; max: number; message: string }) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
    const key = `${req.path}:${ip.split(',')[0].trim()}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + options.windowMs });
      return next();
    }

    record.count += 1;
    if (record.count > options.max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: options.message,
        retryAfterSeconds: retryAfter,
      });
    }

    return next();
  };
}

// Clean up stale rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

// Global and Route-specific Rate Limiters
const globalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many requests. Please slow down.',
});

const expensiveAiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'AI generation request rate limit exceeded. Please wait a moment before trying again.',
});

const uploadLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Upload rate limit reached. Please wait before submitting more videos.',
});

const seoLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 40,
  message: 'SEO metadata generation rate limit reached. Please wait a moment.',
});

app.use('/api', globalApiLimiter);
app.use('/api/tts/generate', expensiveAiLimiter);
app.use('/api/video/generate-thumbnail-image', expensiveAiLimiter);
app.use('/api/video/historical-thumbnail-generate', expensiveAiLimiter);
app.use('/api/video/generate-youtube-seo', seoLimiter);
app.use('/api/facebook/upload-video', uploadLimiter);

// Input Sanitization Helpers
function sanitizeInputString(val: any, maxLength = 25000): string {
  if (typeof val !== 'string') return '';
  // Remove control characters (except common formatting like newlines and tabs)
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, maxLength);
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Lazy Gemini Client initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing on the server.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Helper to call Gemini models with exponential backoff and optional fallback models
async function generateContentWithRetry(
  params: Parameters<GoogleGenAI['models']['generateContent']>[0],
  fallbackModels: string[] = []
): Promise<any> {
  const modelsToTry = [params.model, ...fallbackModels.filter((m) => m !== params.model)];
  let lastError: any = null;
  const client = getGeminiClient();

  for (const modelName of modelsToTry) {
    // Retry up to 3 times per model for transient errors (503, 429, UNAVAILABLE)
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await client.models.generateContent({
          ...params,
          model: modelName,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('429') ||
          errMsg.includes('high demand') ||
          errMsg.includes('Resource has been exhausted') ||
          err?.status === 'UNAVAILABLE' ||
          err?.code === 503;

        if (isTransient && attempt < maxRetries) {
          const delayMs = 500 * Math.pow(2, attempt) + Math.random() * 200;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // If not transient or last attempt for this model, break inner loop to try next model
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Utility: Convert raw 16-bit linear PCM audio into a standard WAV container
 */
function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  // RIFF chunk descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);

  // fmt sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // 16 for PCM
  header.writeUInt16LE(1, 20); // Linear PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Text-to-Speech generation endpoint
app.post('/api/tts/generate', async (req, res) => {
  try {
    const rawText = req.body.text;
    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide valid text to convert to audio.' });
    }

    const text = sanitizeInputString(rawText, 25000);
    const voice = sanitizeInputString(req.body.voice || 'Kore', 64) || 'Kore';
    const gender = sanitizeInputString(req.body.gender || 'Female', 32);
    const ageRange = sanitizeInputString(req.body.ageRange || 'Adult', 32);
    const style = sanitizeInputString(req.body.style || 'Friendly', 64);
    const language = sanitizeInputString(req.body.language || 'English', 64);
    
    // Bounds clamping
    const rawSpeed = Number(req.body.speed);
    const speed = isNaN(rawSpeed) ? 1.0 : Math.max(0.25, Math.min(4.0, rawSpeed));
    const rawPitch = Number(req.body.pitch);
    const pitch = isNaN(rawPitch) ? 0 : Math.max(-20, Math.min(20, rawPitch));

    const isMultiSpeaker = Boolean(req.body.isMultiSpeaker);
    const speakers = Array.isArray(req.body.speakers) ? req.body.speakers.slice(0, 5) : [];

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check your environment variables.',
      });
    }

    let speechPrompt = text.trim();

    // Map UI voice IDs to valid Gemini TTS prebuilt voices: 'Kore', 'Puck', 'Zephyr', 'Charon', 'Fenrir'
    const voiceMapping: Record<string, string> = {
      Kore: 'Kore',
      Puck: 'Puck',
      Zephyr: 'Zephyr',
      Charon: 'Charon',
      Fenrir: 'Fenrir',
      Aoede: 'Kore',
      Maya: 'Kore',
      Eleanor: 'Kore',
      Liam: 'Puck',
      Callum: 'Fenrir',
      Tariq: 'Fenrir',
      Fatima: 'Kore',
      Sarah: 'Kore',
      Elena: 'Zephyr',
    };

    const targetGeminiVoice = voiceMapping[voice] || (gender === 'Male' ? 'Fenrir' : 'Kore');

    let speechConfig: any;

    if (isMultiSpeaker && Array.isArray(speakers) && speakers.length >= 2) {
      speechConfig = {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: speakers[0].name || 'Speaker 1',
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceMapping[speakers[0].voice] || 'Kore',
                },
              },
            },
            {
              speaker: speakers[1].name || 'Speaker 2',
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceMapping[speakers[1].voice] || 'Puck',
                },
              },
            },
          ],
        },
      };
    } else {
      speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: targetGeminiVoice },
        },
      };
    }

    const response = await generateContentWithRetry({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [
        {
          parts: [{ text: speechPrompt }],
        },
      ],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig,
      },
    });

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    const base64Audio = inlineData?.data;

    if (!base64Audio) {
      return res.status(502).json({
        error: 'The AI voice model did not return audio data. Please try again with shorter text or a different voice style.',
      });
    }

    // Convert raw PCM from Gemini to full WAV format
    const rawPcm = Buffer.from(base64Audio, 'base64');
    const wavBuffer = pcmToWav(rawPcm, 24000, 1, 16);
    const base64Wav = wavBuffer.toString('base64');

    const durationSeconds = rawPcm.length / (24000 * 2); // 24kHz * 2 bytes per sample (16-bit)
    const wordCount = text.trim().split(/\s+/).length;

    return res.json({
      success: true,
      audioBase64: base64Wav,
      mimeType: 'audio/wav',
      sampleRate: 24000,
      duration: durationSeconds,
      wordCount,
      voice,
      gender,
      ageRange,
      style,
      speed,
      pitch,
      language,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    let userMsg = 'Failed to synthesize speech. Please try again in a moment.';
    const rawErr = error?.message || String(error);
    if (rawErr.includes('503') || rawErr.includes('UNAVAILABLE') || rawErr.includes('high demand')) {
      userMsg = 'AI speech model is currently experiencing high demand. Please try again shortly.';
    } else if (rawErr.includes('429') || rawErr.includes('Quota')) {
      userMsg = 'Request limit reached. Please wait a moment and try again.';
    }
    return res.status(500).json({ error: userMsg });
  }
});

// Translation and Vocal Polish Endpoint
app.post('/api/tts/translate-and-polish', async (req, res) => {
  try {
    const { text, targetLanguage, polishMode } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    let instruction = `You are a professional linguistic and vocal adaptation assistant. Translate the following text into ${targetLanguage} while ensuring it sounds completely natural, fluent, and pleasant when spoken aloud.`;

    if (polishMode === 'conversational') {
      instruction += ' Adapt the phrasing for a natural, engaging conversation style.';
    } else if (polishMode === 'professional') {
      instruction += ' Adapt the phrasing for formal narration, podcasting, or broadcasting.';
    } else if (polishMode === 'expressive') {
      instruction += ' Ensure emotional warmth and rhythmic vocal cadences with natural punctuation.';
    }

    instruction += ' Return ONLY the final translated/polished text without quotes, explanations, or prefixes.';

    const response = await generateContentWithRetry(
      {
        model: 'gemini-3.7-flash',
        contents: [
          {
            parts: [{ text: `${instruction}\n\nOriginal text:\n${text}` }],
          },
        ],
      },
      ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
    );

    const resultText = response.text?.trim() || text;

    return res.json({
      success: true,
      resultText,
      targetLanguage,
    });
  } catch (error: any) {
    console.error('Error translating/polishing:', error);
    let userMsg = 'Failed to translate or polish text. Please try again.';
    const rawErr = error?.message || String(error);
    if (rawErr.includes('503') || rawErr.includes('UNAVAILABLE') || rawErr.includes('high demand')) {
      userMsg = 'AI translation service is experiencing temporary high demand. Please retry in a few seconds.';
    } else if (rawErr.includes('429') || rawErr.includes('Quota')) {
      userMsg = 'Rate limit reached. Please wait a moment and retry.';
    }
    return res.status(500).json({ error: userMsg });
  }
});

// Language detection endpoint
app.post('/api/tts/detect-language', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required.' });
    }

    const response = await generateContentWithRetry(
      {
        model: 'gemini-3.7-flash',
        contents: [
          {
            parts: [
              {
                text: `Detect the primary language of the following text. Reply ONLY with a single JSON object in format: {"languageName": "English", "languageCode": "en", "confidence": 0.98}\n\nText: "${text.slice(0, 300)}"`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      },
      ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
    );

    let detected = { languageName: 'English', languageCode: 'en', confidence: 1.0 };
    try {
      if (response.text) {
        detected = JSON.parse(response.text);
      }
    } catch {
      // fallback
    }

    return res.json({ success: true, detected });
  } catch (error: any) {
    console.error('Error detecting language:', error);
    return res.json({
      success: true,
      detected: { languageName: 'English', languageCode: 'en', confidence: 0.8 },
    });
  }
});

// Suggest video ideas and thumbnail concepts
app.post('/api/video/suggest-ideas', async (req, res) => {
  try {
    const { channelName = 'My Channel', text = '', topic = '' } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const prompt = `You are a world-class YouTube producer and podcast branding director.
Based on the following channel name and audio script, generate engaging thumbnail and video concepts.

Channel Name: "${channelName}"
Audio Script / Context: "${text.slice(0, 1000)}"
Topic/Theme: "${topic}"

Respond ONLY with a JSON object with this exact schema:
{
  "titles": ["Catchy Title 1 (Punchy, 4-8 words)", "Alternative Intriguing Title 2", "Curiosity-Driven Title 3"],
  "subtitles": ["High CTR Hook 1", "Episode Tagline 2", "Key Takeaway 3"],
  "recommendedTheme": "neon_dark" | "sunset_amber" | "cyber_cyan" | "emerald_zen" | "electric_purple" | "crimson_pulse",
  "visualPrompt": "Detailed visual description of a background scene suitable for a video thumbnail",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"]
}`;

    const response = await generateContentWithRetry(
      {
        model: 'gemini-3.7-flash',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
        },
      },
      ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
    );

    let parsed = {
      titles: [channelName ? `${channelName} Showcase` : 'AI Voice Masterpiece'],
      subtitles: ['Exclusive High-Fidelity Audio Experience'],
      recommendedTheme: 'sunset_amber',
      visualPrompt: 'Futuristic digital soundwaves flowing across an abstract dark nebula with golden light beams',
      tags: ['AIVoice', 'Podcast', 'AudioStudio', 'Tech'],
    };

    try {
      if (response.text) {
        parsed = JSON.parse(response.text);
      }
    } catch (e) {
      console.warn('Failed to parse thumbnail suggestions JSON:', e);
    }

    return res.json({ success: true, ideas: parsed });
  } catch (error: any) {
    console.error('Error suggesting video ideas:', error);
    return res.status(500).json({
      error: 'Failed to generate thumbnail ideas. Please try again.',
    });
  }
});

// AI YouTube SEO & Metadata Optimizer endpoint
app.post('/api/video/generate-youtube-seo', async (req, res) => {
  try {
    const {
      scriptText = '',
      currentTitle = '',
      channelName = '',
      voice = 'Kore',
      language = 'English',
      aspectRatio = '16:9',
      style = 'Engaging',
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const cleanScript = sanitizeInputString(scriptText, 15000);
    const cleanCurrentTitle = sanitizeInputString(currentTitle, 200);
    const isShorts = aspectRatio === '9:16';

    const systemPrompt = `You are an elite YouTube Growth Strategist, SEO Specialist, and Digital Content Optimizer.
Your job is to take an audio script / speech transcript, language, and video format, and craft an exceptionally optimized YouTube package designed to maximize CTR (Click-Through Rate), search ranking, viewer retention, and algorithmic discovery.

Context:
- Script / Transcript: "${cleanScript.slice(0, 3500) || cleanCurrentTitle || 'AI Audio Experience'}"
- Video Aspect Ratio: ${aspectRatio} (${isShorts ? 'YouTube Shorts / Vertical Reels' : 'Standard Widescreen YouTube Video'})
- AI Voice / Persona: ${voice}
- Language: ${language}
- Channel Brand: "${channelName || 'VoxAura Creator'}"
- Style/Mood: ${style}

Output Requirements:
1. "titles": Array of 3 distinct, high-CTR titles (max 85 characters each, avoid clickbait spam, use strong curiosity/search hooks, include #Shorts only if isShorts).
   - Index 0: Search-optimized & high-ranking title
   - Index 1: High-CTR curiosity hook / question title
   - Index 2: Punchy, viral-oriented title
2. "primaryTitle": The single best title from the list.
3. "description": A masterfully structured, search-indexed YouTube description. Include:
   - A captivating 2-sentence hook containing primary high-volume keywords in the first 2 lines.
   - Bulleted summary / key highlights of the spoken audio or story.
   - Timestamps/Chapter markers placeholder if applicable (e.g. 00:00 - Introduction, etc.).
   - Audio & Voice Production Notes (e.g., "🎙️ Voice: ${voice} | 🌐 Language: ${language} | ⚡ Powered by VoxAura AI Neural Studio").
   - Engagement prompt / Call to action (e.g. "What part resonated most with you? Let us know in the comments below! Don't forget to Like and Subscribe!").
   - A cleanly formatted hashtags row at the end (e.g., #AIVoice #${language.replace(/[^a-zA-Z0-9]/g, '')} #Shorts).
4. "hashtags": Array of 5-8 relevant, high-traffic YouTube hashtags (with leading '#' symbol, accurately matching topic, language, and Shorts format if 9:16).
5. "searchTags": Array of 10-15 exact-match and semantic YouTube tags (comma-separated style keywords, no '#' symbol) for the YouTube video tags box.
6. "seoFocusScore": An estimated optimization rating (number between 92 and 99).
7. "targetKeywords": Array of 3-5 top SEO keywords targeted.
8. "hookSummary": 1 punchy sentence describing the core value proposition of this video.

Respond ONLY with a valid JSON object matching this schema:
{
  "primaryTitle": "...",
  "titles": ["...", "...", "..."],
  "description": "...",
  "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Tag4", "#Tag5"],
  "searchTags": ["Tag One", "Tag Two", "Tag Three", "Tag Four"],
  "seoFocusScore": 96,
  "targetKeywords": ["keyword 1", "keyword 2", "keyword 3"],
  "hookSummary": "..."
}`;

    const response = await generateContentWithRetry(
      {
        model: 'gemini-3.7-flash',
        contents: [{ parts: [{ text: systemPrompt }] }],
        config: {
          responseMimeType: 'application/json',
        },
      },
      ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
    );

    let parsedSeo = {
      primaryTitle: isShorts
        ? `${cleanCurrentTitle || 'Amazing AI Voice Audiogram'} #Shorts`
        : (cleanCurrentTitle || 'Next-Gen AI Neural Voice Experience'),
      titles: [
        cleanCurrentTitle || 'Next-Gen AI Neural Voice Experience',
        'How AI Is Transforming Digital Voice & Sound',
        'Listen to This 24kHz High-Fidelity Audio Experience',
      ],
      description: `${cleanScript.slice(0, 180)}...\n\n🎙️ Audio Details:\n• Spoken Voice: ${voice}\n• Language: ${language}\n• Audio Master: 24kHz Neural Synthesis\n\n💬 Subscribe to ${channelName || 'VoxAura'} for more daily audio stories, insights, and studio recitations!\n\n#AIVoice #Podcast #Audiogram ${isShorts ? '#Shorts' : ''}`,
      hashtags: ['#AIVoice', '#Audiogram', '#Podcast', '#TechTrends', isShorts ? '#Shorts' : '#Audiobook'],
      searchTags: ['AI Voice', 'Neural Audio', 'Text to Speech', 'VoxAura Studio', 'Podcast Audiogram', 'Voice Synthesis'],
      seoFocusScore: 95,
      targetKeywords: ['AI Voice', 'Text to Speech', 'High Quality Audio'],
      hookSummary: 'High-definition neural audio story optimized for maximum listener engagement.',
    };

    try {
      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed.primaryTitle) parsedSeo.primaryTitle = parsed.primaryTitle;
        if (Array.isArray(parsed.titles)) parsedSeo.titles = parsed.titles;
        if (parsed.description) parsedSeo.description = parsed.description;
        if (Array.isArray(parsed.hashtags)) parsedSeo.hashtags = parsed.hashtags;
        if (Array.isArray(parsed.searchTags)) parsedSeo.searchTags = parsed.searchTags;
        if (typeof parsed.seoFocusScore === 'number') parsedSeo.seoFocusScore = parsed.seoFocusScore;
        if (Array.isArray(parsed.targetKeywords)) parsedSeo.targetKeywords = parsed.targetKeywords;
        if (parsed.hookSummary) parsedSeo.hookSummary = parsed.hookSummary;
      }
    } catch (parseErr) {
      console.warn('Failed to parse Gemini YouTube SEO response JSON:', parseErr);
    }

    return res.json({
      success: true,
      seo: parsedSeo,
    });
  } catch (error: any) {
    console.error('Error generating YouTube SEO metadata:', error);
    return res.status(500).json({
      error: 'Failed to generate YouTube SEO metadata. Please try again.',
    });
  }
});

// Generate Thumbnail Picture with Nano Banana Gemini (gemini-3.1-flash-lite-image / gemini-3.1-flash-image) with fallback
app.post('/api/video/generate-thumbnail-image', async (req, res) => {
  try {
    const {
      prompt,
      aspectRatio = '16:9',
      stylePreset = 'cinematic',
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide a valid image prompt.' });
    }

    // Build enriched prompt for high-CTR YouTube/Podcast thumbnail artwork
    let fullPrompt = prompt.trim();
    if (stylePreset === 'cyberpunk') {
      fullPrompt += ', cyberpunk aesthetic, volumetric neon lighting, vibrant magenta and cyan highlights, 8k resolution octane render, ultra-detailed';
    } else if (stylePreset === 'cinematic') {
      fullPrompt += ', cinematic lighting, shallow depth of field, dramatic composition, film photography aesthetic, 8k UHD, high dynamic range';
    } else if (stylePreset === '3d_render') {
      fullPrompt += ', 3D isometric digital art, blender render, smooth clay and glass materials, vibrant studio lighting, trending on ArtStation';
    } else if (stylePreset === 'neon_soundwave') {
      fullPrompt += ', abstract audio soundwaves and frequency rings glowing with holographic neon particles in deep space, hyper-realistic';
    } else if (stylePreset === 'studio_photo') {
      fullPrompt += ', professional studio portrait photography, soft key light, dark elegant studio backdrop, Hasselblad medium format quality';
    } else if (stylePreset === 'anime_vibrant') {
      fullPrompt += ', high quality Makoto Shinkai anime landscape style, rich saturated colors, breathtaking lighting and celestial sky';
    } else if (stylePreset === 'space_nebula') {
      fullPrompt += ', cosmic deep space nebula with glowing stars, golden interstellar dust, and radiant auroras, ultra-high resolution';
    }

    // Valid aspect ratios for nano banana: "16:9", "9:16", "1:1", "4:3", "3:4"
    const validAspectRatio = ['16:9', '9:16', '1:1', '4:3', '3:4'].includes(aspectRatio)
      ? aspectRatio
      : '16:9';

    let imageUrl = '';
    let generatorEngine = 'nano-banana-diffusion';
    let fallbackNotice = '';

    // Step 1: Attempt generation with Nano Banana diffusion models
    try {
      let response;
      const client = getGeminiClient();
      const imageModels = ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image', 'gemini-3-pro-image'];
      
      for (const imgModel of imageModels) {
        try {
          response = await client.models.generateContent({
            model: imgModel,
            contents: {
              parts: [{ text: fullPrompt }],
            },
            config: {
              imageConfig: {
                aspectRatio: validAspectRatio as any,
              },
            },
          });
          if (response?.candidates?.[0]?.content?.parts?.some((p: any) => p.inlineData?.data)) {
            generatorEngine = imgModel;
            break;
          }
        } catch (_imgAttemptErr) {
          // Try next image diffusion model
          continue;
        }
      }

      const parts = response?.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (_modelErr: any) {
      // Quietly proceed to vector artwork fallback
    }

    // Step 2: Fallback to AI Vector / SVG Artwork generation with Gemini 3.7 Flash
    if (!imageUrl) {
      try {
        let viewBox = '0 0 1920 1080';
        if (validAspectRatio === '9:16') viewBox = '0 0 1080 1920';
        else if (validAspectRatio === '1:1') viewBox = '0 0 1080 1080';
        else if (validAspectRatio === '4:3') viewBox = '0 0 1440 1080';
        else if (validAspectRatio === '3:4') viewBox = '0 0 1080 1440';

        const svgPrompt = `You are a world-class digital graphic artist specializing in high-contrast YouTube video thumbnails and cover artworks.
Create a rich, professional, complete standalone SVG illustration for:
"${fullPrompt}".
Style: "${stylePreset}".
ViewBox: "${viewBox}".
Requirements:
1. Produce clean, self-contained, valid SVG code with glowing radial & linear gradients, high-contrast atmospheric lighting, digital geometric or organic mesh elements, particles/stars, and visual depth.
2. Do NOT include html tags or markdown blocks. Return ONLY the raw valid <svg xmlns="http://www.w3.org/2000/svg" ...> ... </svg> string.`;

        const svgResponse = await generateContentWithRetry(
          {
            model: 'gemini-3.7-flash',
            contents: [{ parts: [{ text: svgPrompt }] }],
          },
          ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
        );

        const rawText = svgResponse.text || '';
        const match = rawText.match(/<svg[\s\S]*?<\/svg>/i);
        if (match && match[0]) {
          const cleanSvg = match[0].trim();
          const base64Svg = Buffer.from(cleanSvg, 'utf-8').toString('base64');
          imageUrl = `data:image/svg+xml;base64,${base64Svg}`;
          generatorEngine = 'gemini-vector-artwork';
          fallbackNotice = 'Generated via Gemini AI Vector Engine (Free Tier quota friendly).';
        }
      } catch (_svgErr: any) {
        // Proceed to Step 3 procedural fallback
      }
    }

    // Step 3: High-Reliability Procedural Futuristic Canvas / SVG Fallback if both remote calls failed
    if (!imageUrl) {
      let width = 1920;
      let height = 1080;
      if (validAspectRatio === '9:16') { width = 1080; height = 1920; }
      else if (validAspectRatio === '1:1') { width = 1080; height = 1080; }

      // Generate dynamic procedural neon cyber wallpaper
      const proceduralSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0a051b" />
            <stop offset="50%" stop-color="#140c36" />
            <stop offset="100%" stop-color="#05010d" />
          </linearGradient>
          <linearGradient id="neonGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#a855f7" />
            <stop offset="50%" stop-color="#ec4899" />
            <stop offset="100%" stop-color="#3b82f6" />
          </linearGradient>
          <radialGradient id="sunFlare" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.8" />
            <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
          <filter id="blurGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="40" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
        <circle cx="${width * 0.5}" cy="${height * 0.45}" r="${Math.min(width, height) * 0.4}" fill="url(#sunFlare)" filter="url(#blurGlow)" />
        
        <!-- Cyber soundwaves / landscape grid -->
        <g stroke="url(#neonGlow)" stroke-width="3" fill="none" opacity="0.6" filter="url(#blurGlow)">
          <path d="M 0,${height * 0.75} Q ${width * 0.25},${height * 0.55} ${width * 0.5},${height * 0.7} T ${width},${height * 0.65}" />
          <path d="M 0,${height * 0.8} Q ${width * 0.3},${height * 0.65} ${width * 0.6},${height * 0.78} T ${width},${height * 0.72}" />
          <path d="M 0,${height * 0.85} Q ${width * 0.2},${height * 0.75} ${width * 0.5},${height * 0.82} T ${width},${height * 0.8}" stroke-width="1.5" opacity="0.4" />
        </g>
        
        <!-- Geometric Accent Ring -->
        <circle cx="${width * 0.5}" cy="${height * 0.45}" r="${Math.min(width, height) * 0.25}" fill="none" stroke="url(#neonGlow)" stroke-width="4" stroke-dasharray="12 8" opacity="0.7" />
        <circle cx="${width * 0.5}" cy="${height * 0.45}" r="${Math.min(width, height) * 0.28}" fill="none" stroke="#60a5fa" stroke-width="1.5" opacity="0.4" />
        
        <!-- Glowing Particles -->
        <circle cx="${width * 0.2}" cy="${height * 0.3}" r="3" fill="#ec4899" opacity="0.8" />
        <circle cx="${width * 0.3}" cy="${height * 0.2}" r="4" fill="#a855f7" opacity="0.7" />
        <circle cx="${width * 0.75}" cy="${height * 0.25}" r="5" fill="#38bdf8" opacity="0.9" />
        <circle cx="${width * 0.85}" cy="${height * 0.4}" r="3" fill="#f43f5e" opacity="0.8" />
        <circle cx="${width * 0.65}" cy="${height * 0.6}" r="4" fill="#c084fc" opacity="0.7" />
        <circle cx="${width * 0.15}" cy="${height * 0.65}" r="3" fill="#60a5fa" opacity="0.8" />
      </svg>`;

      imageUrl = `data:image/svg+xml;base64,${Buffer.from(proceduralSvg).toString('base64')}`;
      generatorEngine = 'procedural-art-engine';
      fallbackNotice = 'Generated high-resolution procedural studio artwork.';
    }

    return res.json({
      success: true,
      imageUrl,
      prompt: fullPrompt,
      aspectRatio: validAspectRatio,
      generatorEngine,
      notice: fallbackNotice,
    });
  } catch (error: any) {
    console.error('Error generating thumbnail image:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate thumbnail picture.' });
  }
});

// ==========================================
// EXPERT HISTORICAL STORYTELLING THUMBNAIL GENERATOR
// ==========================================
app.post('/api/video/historical-thumbnail-generate', async (req, res) => {
  try {
    const {
      script = '',
      channelName = 'Hamari History',
      aspectRatio = '16:9',
      stylePreset = 'historical_documentary',
      includeBranding = true,
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const cleanScript = sanitizeInputString(script, 20000);
    if (!cleanScript || cleanScript.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide a historical story or script to analyze.' });
    }

    const cleanChannel = sanitizeInputString(channelName || 'Hamari History', 64) || 'Hamari History';
    const validAspectRatio = ['16:9', '9:16', '1:1'].includes(aspectRatio) ? aspectRatio : '16:9';

    // Step A: Deep 7-Step Script Analysis & Thumbnail Engineering with Gemini 3.7 Flash
    const analysisPrompt = `You are an expert YouTube thumbnail designer specializing in historical storytelling channels (such as "Hamari History", Kings and Generals, Epic History TV, and Netflix/BBC historical docudramas).

I am providing you with a historical story/script. Your job is to deeply analyze the script BEFORE designing the thumbnail.

THUMBNAIL GOAL:
Create a highly clickable, cinematic 16:9 YouTube thumbnail that visually communicates the main conflict, mystery, emotion, or historical event in the script within 1–2 seconds.

IMPORTANT:
Do NOT create a generic historical thumbnail.
Do NOT simply put the title of the story on a background.
Instead, identify the SINGLE most dramatic and visually interesting moment from the script and make that the central visual focus.

STEP 1 — ANALYZE THE SCRIPT
Extract:
- historicalEra (e.g. Mughal Empire 1526, Ottoman Siege 1453, Ancient Indus Valley, Roman Republic 44 BC, World War II 1942, etc.)
- location (specific geographic setting, palace, battlefield, fortress, desert, mountain pass)
- mainCharacter (dominant hero subject, realistic facial expression, historical garb)
- opposingForce (opposing leader, invading army, approaching fire, betrayal, dramatic event)
- mainConflict (core dramatic tension)
- mostDramaticMoment (the single climax or turning point)
- strongestEmotion (defiance, terror, sorrow, awe, vengeful determination)
- importantObjects (swords, shields, royal crowns, seal, siege engines, period banners)
- mysteryHook (the curiosity question viewer wants answered)
- bestVisualScene (concrete visual description of the single most dramatic scene)

STEP 2 — CREATE THE VISUAL CONCEPT
- One dominant hero subject
- One secondary subject or opposing force
- Strong facial emotion when characters are present
- Cinematic chiaroscuro lighting (volumetric torchlight, golden hour sunset, smoke-filled battlefield rays, moonlight)
- Historical environments strictly appropriate to the period
- Dramatic depth with atmospheric haze, dust, embers, or fog ONLY when appropriate
- Strong foreground/background separation
- High contrast, professional documentary/cinematic photography style (Hasselblad / Arri Alexa 65 look)

STEP 3 — THUMBNAIL COMPOSITION
- Composition strategy: Hero on left + event on right, OR hero on right + enemy/event on left, OR central heroic subject with atmospheric depth
- Reserves negative space (typically upper third or one side) for bold short text overlay
- Sharp main subject, cinematic depth of field with soft atmospheric background

STEP 4 — TEXT HOOKS (SHORT & HIGH-CTR)
Generate 3 to 4 SHORT thumbnail text options based on the strongest hook in the script.
Rules:
- STRICTLY 3 to 6 words maximum
- Large, bold, curiosity-driven wording
- Examples: "THE LAST DEFENDER", "THE NIGHT THE EMPIRE FELL", "HE FOUGHT ALONE", "THE FORGOTTEN SIEGE", "WHAT REALLY HAPPENED?"
- Include primaryHook (the single best 3-6 word text) and textHooks array.

STEP 5 — HISTORICAL ACCURACY
Strictly enforce period-accurate costumes, armor, architecture, weapons, and vehicles.
ABSOLUTELY NO modern buildings/clothing, NO generic fantasy armor, NO futuristic lasers or anachronisms.

STEP 6 — DIFFUSION IMAGE PROMPT
Write an ultra-detailed, photorealistic prompt for Nano Banana image diffusion.
- Must describe character features, authentic historical clothing/armor textures, lighting source, atmospheric elements, depth of field, color palette, 8k resolution, cinematic historical documentary photography.
- Avoid rendering text inside the image prompt itself so the user can overlay sharp rendered text.

STEP 7 — CLICKABILITY & DRAMATIC QUESTION
- visualQuestionAnswered: 1 clear sentence explaining "What is the most visually dramatic question this story makes the viewer want answered?"
- clickabilityScore: Estimated rating (95-99)
- channelBranding: "${cleanChannel}"

SCRIPT TO ANALYZE:
"""
${cleanScript.slice(0, 8000)}
"""

Respond ONLY with a valid JSON object matching this structure:
{
  "historicalEra": "...",
  "location": "...",
  "mainCharacter": "...",
  "opposingForce": "...",
  "mainConflict": "...",
  "mostDramaticMoment": "...",
  "strongestEmotion": "...",
  "importantObjects": "...",
  "mysteryHook": "...",
  "bestVisualScene": "...",
  "compositionStrategy": "Hero on left (sharp focus) with burning fortress in distant right background",
  "primaryHook": "THE NIGHT THE EMPIRE FELL",
  "textHooks": ["THE NIGHT THE EMPIRE FELL", "THE LAST DEFENDER", "THE SECRET BETRAYAL", "HE FOUGHT ALONE"],
  "visualQuestionAnswered": "How did a single general hold the gates against an overwhelming army of 50,000?",
  "clickabilityScore": 98,
  "channelBranding": "${cleanChannel}",
  "diffusionPrompt": "Cinematic historical documentary still of ... photorealistic skin texture, dramatic volumetric lighting, historical accuracy, 8k uhd, cinematic depth of field, award-winning cinematography"
}`;

    const analysisResponse = await generateContentWithRetry(
      {
        model: 'gemini-3.7-flash',
        contents: [{ parts: [{ text: analysisPrompt }] }],
        config: {
          responseMimeType: 'application/json',
        },
      },
      ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
    );

    let parsedData = {
      historicalEra: 'Classical Historical Era',
      location: 'Ancient Fortress Citadel',
      mainCharacter: 'Defiant Historical Commander in period-accurate battle armor',
      opposingForce: 'Approaching opposing army under a dramatic storm sky',
      mainConflict: 'Epic defense against impossible odds',
      mostDramaticMoment: 'The decisive moment before the gates are breached',
      strongestEmotion: 'Unyielding defiance and tactical focus',
      importantObjects: 'Battle-worn steel blade, standard banner, stone ramparts',
      mysteryHook: 'The secret strategy that turned the tide of history',
      bestVisualScene: 'Hero commander standing on the battlements at twilight with torchlight illuminating his determined expression as smoke rises behind him',
      compositionStrategy: 'Hero on left in sharp focus with atmospheric depth on the right',
      primaryHook: 'THE LAST DEFENDER',
      textHooks: ['THE LAST DEFENDER', 'THE NIGHT THE EMPIRE FELL', 'WHAT REALLY HAPPENED?', 'THE SECRET BETRAYAL'],
      visualQuestionAnswered: 'What secret tactic allowed them to survive the legendary siege?',
      clickabilityScore: 98,
      channelBranding: cleanChannel,
      diffusionPrompt: 'Cinematic historical documentary photograph of a heroic commander in authentic historical armor standing at fortress battlements at golden hour sunset, dramatic volumetric lighting, cinematic depth of field, photorealistic skin and fabric textures, atmospheric smoke and embers, 8k uhd documentary cinematography',
    };

    try {
      if (analysisResponse.text) {
        const parsed = JSON.parse(analysisResponse.text);
        parsedData = { ...parsedData, ...parsed };
      }
    } catch (parseErr) {
      console.warn('Failed to parse Gemini Historical Analysis JSON:', parseErr);
    }

    // Step B: Generate the High-Resolution 16:9 Thumbnail Image with Nano Banana or Cinematic Vector Engine
    let imageUrl = '';
    let generatorEngine = 'nano-banana-diffusion';
    let fallbackNotice = '';

    const fullImagePrompt = `${parsedData.diffusionPrompt}, cinematic historical documentary photography, authentic period accuracy, dramatic volumetric natural lighting, shallow depth of field, 8k uhd, high contrast, Arri Alexa 65 color grading, no text, no modern objects, award-winning streaming documentary aesthetic`;

    try {
      const client = getGeminiClient();
      let imgResponse;
      const imageModels = ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image', 'gemini-3-pro-image'];
      
      for (const imgModel of imageModels) {
        try {
          imgResponse = await client.models.generateContent({
            model: imgModel,
            contents: {
              parts: [{ text: fullImagePrompt }],
            },
            config: {
              imageConfig: {
                aspectRatio: validAspectRatio as any,
              },
            },
          });
          if (imgResponse?.candidates?.[0]?.content?.parts?.some((p: any) => p.inlineData?.data)) {
            generatorEngine = imgModel;
            break;
          }
        } catch (_imgErr) {
          continue;
        }
      }

      const parts = imgResponse?.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (_diffusionError: any) {
      // Quietly proceed to vector scene generation
    }

    // Fallback: Cinematic Vector Scene with Gemini 3.7 Flash if diffusion is busy or quota-limited
    if (!imageUrl) {
      try {
        const svgDocPrompt = `You are a master historical documentary artist. Create a rich, cinematic, high-contrast SVG illustration for a YouTube thumbnail for "${cleanChannel}":
Scene: "${parsedData.bestVisualScene}".
Era: "${parsedData.historicalEra}".
Mood: "${parsedData.strongestEmotion}".
ViewBox: "0 0 1920 1080".
Requirements:
1. Pure valid standalone SVG with rich atmospheric chiaroscuro gradients, golden torchlight/sunset highlights, dramatic hero silhouette/character, textured fortress/battlefield background, and volumetric light rays.
2. Return ONLY the raw valid <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"> ... </svg> with no markdown blocks.`;

        const svgResponse = await generateContentWithRetry(
          {
            model: 'gemini-3.7-flash',
            contents: [{ parts: [{ text: svgDocPrompt }] }],
          },
          ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
        );

        const rawText = svgResponse.text || '';
        const match = rawText.match(/<svg[\s\S]*?<\/svg>/i);
        if (match && match[0]) {
          const cleanSvg = match[0].trim();
          const base64Svg = Buffer.from(cleanSvg, 'utf-8').toString('base64');
          imageUrl = `data:image/svg+xml;base64,${base64Svg}`;
          generatorEngine = 'gemini-historical-vector';
          fallbackNotice = 'Generated via Gemini Cinematic Vector Art Engine (Free Tier quota friendly).';
        }
      } catch (_svgErr: any) {
        // Fallback to procedural historical canvas
      }
    }

    if (!imageUrl) {
      // Procedural Historical Dramatic Wallpaper
      const procSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
        <defs>
          <linearGradient id="histSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0f0702" />
            <stop offset="50%" stop-color="#2d1305" />
            <stop offset="85%" stop-color="#6e2d0a" />
            <stop offset="100%" stop-color="#c25e19" />
          </linearGradient>
          <radialGradient id="torchGlow" cx="30%" cy="50%" r="45%">
            <stop offset="0%" stop-color="#ff9900" stop-opacity="0.85" />
            <stop offset="60%" stop-color="#cc4400" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#histSky)" />
        <circle cx="576" cy="540" r="500" fill="url(#torchGlow)" />
        <path d="M 0,850 L 400,750 L 800,800 L 1200,720 L 1600,780 L 1920,700 L 1920,1080 L 0,1080 Z" fill="#0d0703" />
        <rect x="250" y="600" width="60" height="250" fill="#1a0c06" />
        <rect x="350" y="550" width="80" height="300" fill="#120804" />
        <circle cx="390" cy="520" r="12" fill="#ffaa33" opacity="0.9" />
      </svg>`;
      imageUrl = `data:image/svg+xml;base64,${Buffer.from(procSvg).toString('base64')}`;
      generatorEngine = 'procedural-historical-engine';
      fallbackNotice = 'Generated procedural historical dramatic background.';
    }

    return res.json({
      success: true,
      imageUrl,
      analysis: parsedData,
      primaryHook: parsedData.primaryHook,
      textHooks: parsedData.textHooks,
      visualQuestion: parsedData.visualQuestionAnswered,
      clickabilityScore: parsedData.clickabilityScore,
      generatorEngine,
      notice: fallbackNotice,
    });
  } catch (error: any) {
    console.error('Error generating historical thumbnail:', error);
    return res.status(500).json({ error: error?.message || 'Failed to analyze script and generate thumbnail.' });
  }
});

// ==========================================
// FACEBOOK PAGE DIRECT VIDEO UPLOAD API
// ==========================================

// 1. Verify Facebook Page Access & Fetch Details
app.post('/api/facebook/verify-page-access', async (req, res) => {
  try {
    const pageId = (req.body.pageId || process.env.FACEBOOK_PAGE_ID || '').trim();
    const accessToken = (req.body.accessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '').trim();

    if (!pageId) {
      return res.status(400).json({ error: 'Facebook Page ID is required.' });
    }
    if (!accessToken) {
      return res.status(400).json({ error: 'Facebook Page Access Token is required.' });
    }

    // Call Facebook Graph API to verify page access and permissions
    const fbUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}?fields=id,name,picture{url},category,link,verification_status&access_token=${encodeURIComponent(accessToken)}`;
    const fbResponse = await fetch(fbUrl);
    const data: any = await fbResponse.json();

    if (data.error) {
      console.warn('Facebook Page verification failed:', data.error);
      return res.status(400).json({
        error: data.error.message || 'Failed to verify Facebook Page credentials.',
        details: data.error,
      });
    }

    return res.json({
      success: true,
      page: {
        id: data.id,
        name: data.name,
        pictureUrl: data.picture?.data?.url || null,
        category: data.category || 'General Page',
        link: data.link || `https://www.facebook.com/${data.id}`,
      },
    });
  } catch (error: any) {
    console.error('Error in verify-page-access:', error);
    return res.status(500).json({ error: error?.message || 'Failed to connect to Facebook Graph API.' });
  }
});

// 2. Fetch all Facebook Pages managed by a user token
app.post('/api/facebook/get-user-pages', async (req, res) => {
  try {
    const userAccessToken = (req.body.userAccessToken || req.body.accessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '').trim();

    if (!userAccessToken) {
      return res.status(400).json({ error: 'Facebook User or System Access Token is required.' });
    }

    const fbUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,category,picture{url},access_token,tasks&access_token=${encodeURIComponent(userAccessToken)}`;
    const fbResponse = await fetch(fbUrl);
    const data: any = await fbResponse.json();

    if (data.error) {
      return res.status(400).json({
        error: data.error.message || 'Could not fetch Facebook Pages.',
        details: data.error,
      });
    }

    const pages = (data.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      pictureUrl: p.picture?.data?.url || null,
      pageAccessToken: p.access_token || '',
      tasks: p.tasks || [],
    }));

    return res.json({
      success: true,
      pages,
    });
  } catch (error: any) {
    console.error('Error fetching Facebook Pages:', error);
    return res.status(500).json({ error: error?.message || 'Failed to fetch user Facebook Pages.' });
  }
});

// 3. AI Generate High-Converting Facebook Caption & Hashtags
app.post('/api/facebook/generate-caption', async (req, res) => {
  try {
    const { videoTitle, audioScript, topic, tone = 'engaging' } = req.body;

    const prompt = `You are a social media growth expert specializing in viral Facebook Page video posts.
Generate an engaging, high-converting Facebook video post caption for:
- Video Title: "${videoTitle || 'AI Voice Innovation'}"
- Speech Transcript / Topic: "${audioScript || topic || 'Neural Text-to-Speech synthesis'}"
- Desired Tone: "${tone}"

Requirements:
1. Craft a catchy 1-2 sentence hook at the start with relevant emojis.
2. Provide a 2-3 sentence engaging synopsis explaining what viewers will learn or experience.
3. Include a clear Call to Action (e.g., "Drop your thoughts below 👇", "Share this with a creator!").
4. Provide 4-6 targeted, high-traffic hashtags (e.g. #AIVoice #TechInnovation #PodcastVideo).
5. Output ONLY the ready-to-paste text without introductory meta remarks or markdown backticks.`;

    const response = await generateContentWithRetry(
      {
        model: 'gemini-3.7-flash',
        contents: [{ parts: [{ text: prompt }] }],
      },
      ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
    );

    const caption = response.text?.trim() || `${videoTitle}\n\n${audioScript}\n\n#AIVoice #ContentCreation #Trending`;
    return res.json({ success: true, caption });
  } catch (error: any) {
    console.error('Error generating Facebook caption:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate AI caption.' });
  }
});

// 4. Directly Upload Video to Facebook Page (Meta Graph Video API)
app.post('/api/facebook/upload-video', async (req, res) => {
  try {
    const pageId = (req.body.pageId || process.env.FACEBOOK_PAGE_ID || '').trim();
    const accessToken = (req.body.accessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '').trim();
    const { videoBase64, title, description, published = true } = req.body;

    if (!pageId) {
      return res.status(400).json({ error: 'Facebook Page ID is required to upload a video.' });
    }
    if (!accessToken) {
      return res.status(400).json({ error: 'Facebook Page Access Token is required to upload a video.' });
    }
    if (!videoBase64) {
      return res.status(400).json({ error: 'Video data (videoBase64) is required for upload.' });
    }

    // Extract raw base64 data if it contains a data URL prefix
    let cleanBase64 = videoBase64;
    let mimeType = 'video/mp4';
    if (videoBase64.startsWith('data:')) {
      const parts = videoBase64.split(';base64,');
      if (parts.length === 2) {
        mimeType = parts[0].replace('data:', '') || 'video/mp4';
        cleanBase64 = parts[1];
      }
    }

    const videoBuffer = Buffer.from(cleanBase64, 'base64');
    if (videoBuffer.length === 0) {
      return res.status(400).json({ error: 'Video buffer is empty or corrupted.' });
    }

    console.log(`Uploading video to Facebook Page ID: ${pageId} (Size: ${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB, MIME: ${mimeType})`);

    // Prepare multipart form data for Facebook Graph Video endpoint
    const formData = new FormData();
    formData.append('access_token', accessToken);
    formData.append('title', title || 'New AI Studio Video');
    formData.append('description', description || title || 'Synthesized with VoxGlobal AI Video Studio');
    formData.append('published', published ? 'true' : 'false');

    // Create Blob from video buffer
    const videoBlob = new Blob([videoBuffer], { type: mimeType });
    const filename = mimeType.includes('webm') ? 'video.webm' : 'video.mp4';
    formData.append('source', videoBlob, filename);

    // Call Facebook Graph Video API
    const uploadUrl = `https://graph-video.facebook.com/v19.0/${encodeURIComponent(pageId)}/videos`;
    const fbResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const result: any = await fbResponse.json();

    if (result.error) {
      console.error('Facebook Graph Video API error:', result.error);
      let userFriendlyError = result.error.message || 'Failed to upload video to Facebook Page.';
      
      // Common Facebook Graph API error code guidance
      if (result.error.code === 190) {
        userFriendlyError = 'The Facebook Page Access Token has expired or is invalid. Please generate a fresh Page Access Token.';
      } else if (result.error.code === 200 || result.error.code === 10) {
        userFriendlyError = 'Permission denied. Ensure your Facebook Page Token has "pages_manage_posts" and "publish_video" permissions.';
      } else if (result.error.code === 100) {
        userFriendlyError = `Facebook API parameter error: ${result.error.message}`;
      }

      return res.status(400).json({
        error: userFriendlyError,
        rawError: result.error,
      });
    }

    const videoId = result.id;
    const directFbUrl = `https://www.facebook.com/${encodeURIComponent(pageId)}/videos/${videoId}`;
    const watchUrl = `https://www.facebook.com/watch/?v=${videoId}`;

    console.log(`Video uploaded successfully to Facebook Page! Video ID: ${videoId}`);

    return res.json({
      success: true,
      videoId,
      videoUrl: directFbUrl,
      watchUrl,
      pageId,
      published,
      title: title || 'New AI Studio Video',
      uploadedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error uploading video to Facebook Page:', error);
    return res.status(500).json({ error: error?.message || 'Server error uploading video to Facebook Page.' });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TTS Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
