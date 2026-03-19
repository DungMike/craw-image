/**
 * Script Generator — Channel & Language Configuration
 */

// ─── Channel Types ───────────────────────────────────────

export interface Channel {
  id: string;
  name: string;
  nameVi: string;
  description: string;
  icon: string; // lucide icon name
  skillPath: string; // relative path under src/skill/
}

export const CHANNELS: Channel[] = [
  {
    id: "social-analysis",
    name: "Social Analysis",
    nameVi: "Phân tích Xã hội",
    description:
      "Giải mã các vấn đề kinh tế, xã hội, tâm lý đương đại. Phong cách sắc sảo, dữ liệu mạnh, nghịch lý gây sốc.",
    icon: "Brain",
    skillPath: "channel-social-analysis",
  },
  // Future channels can be added here:
  // { id: "tech-review", name: "Tech Review", ... }
  // { id: "lifestyle", name: "Lifestyle", ... }
];

// ─── Language Types ──────────────────────────────────────

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "th", name: "Thai", nativeName: "ภาษาไทย", flag: "🇹🇭" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
];

// ─── Script Request / Result Types ───────────────────────

export interface ScriptRequest {
  channelId: string;
  topic: string;
  language: string; // language code
  model?: string;
  mode?: string;
}

export interface ThumbnailPrompt {
  prompt: string;
  language: string;
  culturalContext: string;
}

export interface ScriptMetadata {
  titles: [string, string, string];
  description: string;
  hashtags: string[];
  thumbnailPrompts: ThumbnailPrompt[];
}

export interface ScriptResult {
  script: string;
  metadata: ScriptMetadata;
  raw: string; // full AI response
}

// ─── Helpers ─────────────────────────────────────────────

export function getChannelById(id: string): Channel | undefined {
  return CHANNELS.find((c) => c.id === id);
}

export function getLanguageByCode(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code);
}

/**
 * Generate a safe filename from the topic string.
 * Removes special chars, replaces spaces with underscores, lowercase.
 */
export function topicToFilename(topic: string): string {
  return topic
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .substring(0, 80);
}
