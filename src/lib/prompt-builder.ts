/**
 * Prompt Builder — Constructs AI prompts from skill files + user inputs
 * and parses AI responses into structured ScriptResult.
 */

import {
  type ScriptRequest,
  type ScriptResult,
  type ScriptMetadata,
  getChannelById,
  getLanguageByCode,
} from "./script-channels";

// ─── Channel Skill Context (embedded from skill files) ───

const CHANNEL_CONTEXTS: Record<string, string> = {
  "social-analysis": `
## CHANNEL PROFILE: Social Analysis (Phân tích Xã hội Đương đại)

### Sứ mệnh
Giải mã những quy luật ẩn giấu đằng sau các hiện tượng kinh tế - xã hội đương đại, giúp người xem nhìn xuyên bề mặt để đưa ra quyết định sáng suốt hơn.

### Content Pillars
- 🔥 Giải mã Kinh tế (35%): lạm phát, bất động sản, thị trường lao động
- 🧬 Tâm lý Xã hội (25%): bẫy tâm lý, dopamin, cô đơn kỹ thuật số
- ⚙️ Hệ thống & Cấu trúc (25%): phân hóa giàu nghèo, đô thị hóa, giáo dục
- 🔮 Dự báo & Chiến lược (15%): kịch bản tương lai, chiến lược cá nhân

### Đối tượng mục tiêu
- Gen Z & Millennials (20-38 tuổi)
- Thu nhập tầng trung (8-25 triệu VNĐ/tháng)
- Cảm thấy "mọi thứ đắt hơn nhưng lương đứng yên"
- Khát vọng tự do tài chính, hiểu hệ thống

### Tông giọng: "Người anh lớn tỉnh táo"
- Tự tin, sắc sảo, kịch tính có kiểm soát
- Đồng cảm thật sự, không trịch thượng
- Dữ liệu chắc chắn, ẩn dụ mạnh
- Giải pháp thực tế, không lý thuyết suông

### Signature Phrases
- "Và đây mới là phần đáng sợ nhất..."
- "Không ai nói cho bạn biết điều này, nhưng..."
- "Đây không phải lỗi của bạn. Nhưng nó là trách nhiệm của bạn."
- "Câu hỏi không phải là 'liệu điều này có xảy ra?' — mà là 'khi nào?'"

### Emotional Arc: sốc → lo lắng → tức giận → đồng cảm → tỉnh thức

### Brand Terminology
- "Hội chứng đuổi tàu" — nỗ lực nhiều nhưng khoảng cách xa hơn
- "Bẫy thang máy" — niềm tin hệ thống sẽ đưa bạn lên
- "Chủ nghĩa hư vô tài chính" — mua nhà không nổi thì tiêu cho sướng
- "Dopamin rẻ tiền" — niềm vui tức thì thay thế thành tựu
- "Hố đen đô thị" — thành phố hút mọi nguồn lực
- "Lạm phát ước mơ" — chi phí ước mơ tăng nhanh hơn thu nhập
`,
};

// ─── Script Framework Template ───────────────────────────

const SCRIPT_FRAMEWORK = `
## SCRIPT FRAMEWORK: STORM Model

Viết kịch bản theo mô hình STORM gồm 6 phần:

### PHẦN 1: THE HOOK (0:00–0:45)
- Câu mở đầu gây sốc với SỐ LIỆU CỤ THỂ
- Nghịch lý: "Tại sao A nhưng B?"
- Lời hứa giải mã + Teaser cho cơn bão cuối
- KHÔNG chào hỏi, KHÔNG giới thiệu kênh

### PHẦN 2: CONTEXT BRIDGE (0:45–2:00)
- Bức tranh lớn với ẩn dụ mở rộng
- Liên hệ cá nhân người xem
- Đặt tên thuật ngữ riêng cho hiện tượng
- Điều hướng: "Chúng ta sẽ đi qua X phần..."

### PHẦN 3: DEEP ANALYSIS (2:00–14:00) — 3 "Cơn bão ngầm"
Mỗi cơn bão theo cấu trúc DARE:
- D (DATA): Số liệu cụ thể + nguồn uy tín
- A (ANALOGY): Ẩn dụ mạnh, biến số liệu thành hình ảnh
- R (REALITY): Case study / câu chuyện thực tế
- E (ENGAGE): Câu hỏi tương tác cho người xem

Sắp xếp 3 cơn bão theo độ sốc TĂNG DẦN.
Giữa các cơn bão có câu chuyển tiếp.

### PHẦN 4: THE MIRROR (14:00–16:00)
- Xác nhận cảm xúc: "Sự mệt mỏi không phải lỗi của bạn"
- Bình thường hóa cảm xúc
- Chuyển hướng sang giải pháp

### PHẦN 5: THE BLUEPRINT (16:00–18:30)
- 3 chiến lược hành động CỤ THỂ:
  + Chiến lược 1: Ngay hôm nay
  + Chiến lược 2: Trung hạn
  + Chiến lược 3: Thay đổi tư duy dài hạn

### PHẦN 6: THE CLOSE (18:30–20:00)
- Tóm lược 1 câu
- Quote đáng nhớ
- CTA: Bình luận + Đăng ký + Chia sẻ
- Câu kết ngắn, mạnh

### TTS Markup Rules
Sử dụng các ký hiệu này trong kịch bản:
- [PAUSE Xs] — ngắt nghỉ X giây
- [SLOW]...[/SLOW] — đọc chậm
- [RISE]...[/RISE] — tăng dần cường độ
- [WHISPER]...[/WHISPER] — giọng thầm
- [INTENSE]...[/INTENSE] — giọng mạnh, khẩn cấp
- [SFX: tên] — sound effect
- [BGM: mood] — nhạc nền
- **text** — nhấn mạnh
- ---SECTION_NAME--- — ngắt phần

### Power Words (sử dụng xuyên suốt)
Khẩn cấp: sự thật tàn nhẫn, bẫy kép, cơn bão ngầm, hố đen, tín hiệu đỏ, quả bom hẹn giờ
Bí ẩn: mật mã, lớp sương mù, luật chơi ngầm, mã nguồn, sự thật ngầm định
Sức mạnh: vũ khí tối thượng, tỉnh thức, chiến lược phản kháng, đòn bẩy
Cảm xúc: không phải lỗi của bạn, cuộc chạy đua chuột, thế hệ kiệt sức
`;

// ─── Output Format Specification ─────────────────────────

const OUTPUT_FORMAT = `
## OUTPUT FORMAT (BẮT BUỘC)

Bạn PHẢI trả response đúng format sau, gồm 2 block:

===SCRIPT_START===
[Toàn bộ kịch bản ở đây, bao gồm TTS markup, chia thành 6 phần theo STORM model]
[Thời lượng mục tiêu: 15-20 phút đọc, khoảng 2400-4000 từ]
===SCRIPT_END===

===METADATA_START===
{
  "titles": [
    "Gợi ý tiêu đề 1 (có số liệu + nghịch lý, <60 ký tự)",
    "Gợi ý tiêu đề 2",
    "Gợi ý tiêu đề 3"
  ],
  "description": "Mô tả video chuẩn SEO YouTube, 2-3 câu + timestamps + nguồn tham khảo",
  "hashtags": ["#hashtag1", "#hashtag2", "...tối đa 15 hashtags, mix ngôn ngữ chính + English"],
  "thumbnailPrompts": [
    {
      "prompt": "Detailed AI image generation prompt for YouTube thumbnail. Include: composition, mood, colors (dark background, gold/red accent), text overlay suggestion, style (cinematic/dramatic). The prompt must be in English for AI image generators.",
      "language": "language_code",
      "culturalContext": "Brief description of cultural visual elements to include"
    }
  ]
}
===METADATA_END===
`;

// ─── Language Adaptation Instructions ────────────────────

function getLanguageInstructions(languageCode: string): string {
  const lang = getLanguageByCode(languageCode);
  if (!lang) return "";

  const instructions: Record<string, string> = {
    vi: `
## NGÔN NGỮ: Tiếng Việt 🇻🇳
- Xưng hô: "Bạn" (thân thiện), "Chúng ta" (cùng phe)
- Tông: Thân thiện nhưng sắc sảo, kiểu anh/chị nói chuyện
- Ẩn dụ: Văn hóa Việt (xe đạp, nhà phố, con rùa, đạp xe đuổi tàu)
- Số liệu: Ưu tiên nguồn VN (Tổng cục Thống kê, World Bank Vietnam, GSO)
- CTA: "Bình luận", "Chia sẻ", "Đăng ký kênh"
- Hashtag: Mix tiếng Việt + tiếng Anh
- Thumbnail: Bối cảnh Việt Nam (phố xá, xe máy, chung cư)
`,
    en: `
## LANGUAGE: English 🇺🇸
- Address: "You" / "We" — direct and authoritative
- Tone: Confident narrator, TED-talk meets documentary style
- Metaphors: Western culture (rat race, climbing the ladder, glass ceiling, American Dream collapse)
- Data: Global sources (World Bank, IMF, Pew Research, Bureau of Labor Statistics)
- CTA: "Comment", "Share", "Subscribe"
- Hashtags: English only
- Thumbnail: Universal/Western visual context
`,
    ko: `
## 언어: 한국어 🇰🇷
- 호칭: "여러분" / "우리" — 존댓말 기반 + 친근함
- 어조: Formal하지만 친근한, 뉴스 다큐멘터리 스타일
- 은유: K-culture (경쟁사회, 사교육, 헬조선, N포세대, 영끌, 빚투)
- 데이터: 한국 출처 (통계청, 한국은행, LH, 한국고용정보원)
- CTA: "댓글로 여러분의 이야기를 들려주세요", "구독", "공유"
- 해시태그: 한국어 + 영어 mix
- 썸네일: 한국 시각적 맥락 (서울, 아파트, 지하철)
`,
    ja: `
## 言語: 日本語 🇯🇵
- 呼称: "皆さん" / "私たち" — です/ます調 + たまにカジュアル
- トーン: 丁寧だが鋭い、NHKスペシャル風
- 比喩: 日本文化 (過労死、空気を読む、一億総中流の崩壊、氷河期世代)
- データ: 日本の出典 (総務省統計局、厚生労働省、日銀、NHK調査)
- CTA: "コメント", "チャンネル登録", "共有"
- ハッシュタグ: 日本語 + 英語 mix
- サムネイル: 日本の視覚的文脈 (東京、満員電車、タワマン)
`,
    zh: `
## 语言: 中文 🇨🇳
- 称呼: "你" / "我们" — 你体，口语化
- 语调: 理性分析 + 略带情感，像罗振宇/何帆风格
- 比喻: 中国文化 (内卷、躺平、996、鸡娃、韭菜、上岸)
- 数据: 中国来源 (国家统计局、央行、社科院、贝壳研究院)
- CTA: "评论区聊聊", "点赞", "转发给需要的朋友"
- 标签: 中文 + 英文 mix
- 缩略图: 中国视觉语境 (城市天际线、高楼、地铁)
`,
    th: `
## ภาษา: ไทย 🇹🇭
- สรรพนาม: "คุณ" / "เรา" — สุภาพแต่เป็นกันเอง
- โทน: วิเคราะห์จริงจัง ผสมความเข้าใจ สไตล์สารคดี
- อุปมา: วัฒนธรรมไทย (หนี้, ค่าครองชีพ, BTS/MRT, คอนโด)
- ข้อมูล: แหล่งข้อมูลไทย (สำนักงานสถิติแห่งชาติ, ธปท., สพฐ.)
- CTA: "คอมเม้นท์", "แชร์", "กดติดตาม"
- แฮชแท็ก: ไทย + อังกฤษ mix
- ภาพปก: บริบทภาพไทย (กรุงเทพ, รถติด, คอนโด)
`,
    id: `
## BAHASA: Indonesia 🇮🇩
- Sapaan: "Kamu" / "Kita" — santai tapi serius
- Nada: Analitis, gaya dokumenter santai
- Metafora: Budaya Indonesia (macet, KPR, hustle culture, sandwich generation)
- Data: Sumber Indonesia (BPS, Bank Indonesia, Kemenaker)
- CTA: "Komentar", "Share", "Subscribe"
- Hashtag: Indonesia + English mix
- Thumbnail: Konteks visual Indonesia (Jakarta, kemacetan, apartemen)
`,
    es: `
## IDIOMA: Español 🇪🇸
- Tratamiento: "Tú" / "Nosotros" — cercano pero profesional
- Tono: Analítico, estilo documental tipo DW
- Metáforas: Cultura hispanohablante (la carrera de ratas, burbuja inmobiliaria, generación perdida)
- Datos: Fuentes globales + hispanas (INE, FMI, CEPAL, Banco Mundial)
- CTA: "Comenta", "Comparte", "Suscríbete"
- Hashtags: Español + English mix
- Thumbnail: Contexto visual universal/latino
`,
    pt: `
## IDIOMA: Português 🇧🇷
- Tratamento: "Você" / "A gente" — informal e próximo
- Tom: Analítico mas acessível, estilo podcast investigativo
- Metáforas: Cultura brasileira (jeitinho, classe C, pedalada, correr atrás)
- Dados: Fontes brasileiras (IBGE, Banco Central, IPEA, FGV)
- CTA: "Comenta", "Compartilha", "Se inscreve"
- Hashtags: Português + English mix
- Thumbnail: Contexto visual brasileiro (São Paulo, favela vs. condomínio)
`,
    hi: `
## भाषा: हिन्दी 🇮🇳
- संबोधन: "आप" / "हम" — सम्मानजनक + दोस्ताना
- टोन: गंभीर विश्लेषण, Dhruv Rathee/Abhi and Niyu स्टाइल
- रूपक: भारतीय संस्कृति (rat race, EMI trap, jugaad, middle class squeeze)
- डेटा: भारतीय स्रोत (RBI, NSO, NITI Aayog, World Bank India)
- CTA: "Comment करें", "Share करें", "Subscribe करें"
- Hashtags: Hindi + English mix
- Thumbnail: भारतीय दृश्य संदर्भ (Mumbai/Delhi skyline, traffic, apartments)
`,
  };

  return (
    instructions[languageCode] ||
    `
## LANGUAGE: ${lang.name} ${lang.flag}
- Write the entire script in ${lang.nativeName} (${lang.name})
- Use culturally appropriate metaphors and references
- Cite data sources relevant to ${lang.name}-speaking regions
- Adapt CTA language to ${lang.nativeName}
- Hashtags: ${lang.nativeName} + English mix
- Thumbnail: Visual context appropriate for ${lang.name}-speaking audience
`
  );
}

// ─── Main Prompt Builder ─────────────────────────────────

export function buildScriptPrompt(request: ScriptRequest): string {
  const channel = getChannelById(request.channelId);
  const language = getLanguageByCode(request.language);

  if (!channel || !language) {
    throw new Error(
      `Invalid channel "${request.channelId}" or language "${request.language}"`
    );
  }

  const channelContext =
    CHANNEL_CONTEXTS[request.channelId] || CHANNEL_CONTEXTS["social-analysis"];
  const langInstructions = getLanguageInstructions(request.language);

  return `# NHIỆM VỤ: Tạo kịch bản video chuyên nghiệp

Bạn là một scriptwriter chuyên nghiệp. Hãy viết một kịch bản video YouTube hoàn chỉnh dựa trên các yêu cầu sau.

## CHỦ ĐỀ VIDEO
"${request.topic}"

## NGÔN NGỮ ĐẦU RA: ${language.nativeName} (${language.name}) ${language.flag}

${channelContext}

${SCRIPT_FRAMEWORK}

${langInstructions}

## YÊU CẦU ĐẶC BIỆT
1. Viết TOÀN BỘ kịch bản bằng ${language.nativeName}
2. Kịch bản phải dài 2400-4000 từ (15-20 phút đọc)
3. Bao gồm đầy đủ TTS markup (PAUSE, SLOW, RISE, WHISPER, SFX, BGM)
4. Sử dụng số liệu THẬT và nguồn UY TÍN (phù hợp với ngôn ngữ/quốc gia)
5. Ẩn dụ phải PHÙ HỢP VĂN HÓA của ngôn ngữ đầu ra
6. Tạo 3 gợi ý tiêu đề với công thức: [Số liệu sốc] + [Nghịch lý] + [Lời hứa giải mã]
7. Description phải chuẩn SEO YouTube với timestamps
8. Thumbnail prompt phải bằng TIẾNG ANH (cho AI image generator) nhưng phản ánh bối cảnh văn hóa phù hợp với ngôn ngữ ${language.nativeName}

${OUTPUT_FORMAT}

Hãy viết kịch bản NGAY BÂY GIỜ. Đảm bảo output đúng format với ===SCRIPT_START===, ===SCRIPT_END===, ===METADATA_START===, ===METADATA_END===.`;
}

// ─── Response Parser ─────────────────────────────────────

/**
 * Parse AI response into structured ScriptResult.
 * Extracts script content and metadata JSON from delimiter-marked blocks.
 */
export function parseScriptResponse(response: string): ScriptResult {
  // Extract script
  const scriptMatch = response.match(
    /===SCRIPT_START===([\s\S]*?)===SCRIPT_END===/
  );
  const script = scriptMatch ? scriptMatch[1].trim() : "";

  // Extract metadata JSON
  const metadataMatch = response.match(
    /===METADATA_START===([\s\S]*?)===METADATA_END===/
  );

  let metadata: ScriptMetadata = {
    titles: ["", "", ""],
    description: "",
    hashtags: [],
    thumbnailPrompts: [],
  };

  if (metadataMatch) {
    try {
      const parsed = JSON.parse(metadataMatch[1].trim());
      metadata = {
        titles: parsed.titles || ["", "", ""],
        description: parsed.description || "",
        hashtags: parsed.hashtags || [],
        thumbnailPrompts: parsed.thumbnailPrompts || [],
      };
    } catch {
      // If JSON parsing fails, try to extract what we can
      console.warn("Failed to parse metadata JSON, using defaults");
    }
  }

  return {
    script,
    metadata,
    raw: response,
  };
}
