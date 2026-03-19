import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CHANNELS,
  LANGUAGES,
  topicToFilename,
  type ScriptResult,
} from "@/lib/script-channels";
import { buildScriptPrompt, parseScriptResponse } from "@/lib/prompt-builder";
import {
  Sparkles,
  Loader2,
  Download,
  Copy,
  Check,
  Brain,
  Globe,
  Pen,
  FileText,
  Hash,
  Image,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ScriptGeneratorPanelProps {
  onSend: (text: string) => void;
  isSending: boolean;
  latestResponse: string;
}

export function ScriptGeneratorPanel({
  onSend,
  isSending,
  latestResponse,
}: ScriptGeneratorPanelProps) {
  const [channelId, setChannelId] = useState(CHANNELS[0]?.id ?? "");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("vi");
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    titles: true,
    description: true,
    hashtags: true,
    thumbnail: true,
  });

  const previousResponseRef = useRef("");
  const waitingForResultRef = useRef(false);

  // Watch for AI response when generating
  useEffect(() => {
    if (
      waitingForResultRef.current &&
      latestResponse &&
      latestResponse !== previousResponseRef.current
    ) {
      // Check if response contains our delimiters (script is complete)
      if (
        latestResponse.includes("===SCRIPT_END===") &&
        latestResponse.includes("===METADATA_END===")
      ) {
        const parsed = parseScriptResponse(latestResponse);
        // Use microtask to avoid synchronous setState in effect
        queueMicrotask(() => {
          setResult(parsed);
          setIsGenerating(false);
          waitingForResultRef.current = false;
        });
      }
    }
  }, [latestResponse]);

  const handleGenerate = useCallback(() => {
    if (!topic.trim() || !channelId || !language) return;

    try {
      const prompt = buildScriptPrompt({
        channelId,
        topic: topic.trim(),
        language,
      });

      previousResponseRef.current = latestResponse;
      waitingForResultRef.current = true;
      setIsGenerating(true);
      setResult(null);

      onSend(prompt);
    } catch (err) {
      console.error("Failed to build prompt:", err);
      setIsGenerating(false);
    }
  }, [channelId, topic, language, latestResponse, onSend]);

  const handleCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleDownloadScript = useCallback(() => {
    if (!result?.script) return;
    const filename = `kich_ban_${topicToFilename(topic)}.txt`;
    const blob = new Blob([result.script], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, topic]);

  const handleDownloadMetadata = useCallback(() => {
    if (!result?.metadata) return;
    const filename = `metadata_${topicToFilename(topic)}.json`;
    const blob = new Blob([JSON.stringify(result.metadata, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, topic]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const selectedLang = LANGUAGES.find((l) => l.code === language);
  const selectedChannel = CHANNELS.find((c) => c.id === channelId);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card/30 px-6 py-3">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-medium">Script Generator</h2>
        </div>
        {isGenerating && (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] animate-pulse"
          >
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            Generating...
          </Badge>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-4xl p-6 space-y-6">
          {/* ── Form Section ──────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Channel Selector */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <Brain className="h-3.5 w-3.5" />
                Channel
              </label>
              <Select value={channelId} onValueChange={setChannelId}>
                <SelectTrigger className="w-full bg-background/50">
                  <SelectValue placeholder="Select channel..." />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      <span className="flex items-center gap-2">
                        {ch.name}
                        <span className="text-muted-foreground text-xs">
                          — {ch.nameVi}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedChannel && (
                <p className="text-xs text-muted-foreground/70 pl-1">
                  {selectedChannel.description}
                </p>
              )}
            </div>

            {/* Language Selector */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <Globe className="h-3.5 w-3.5" />
                Output Language
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full bg-background/50">
                  <SelectValue placeholder="Select language..." />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                        <span className="text-muted-foreground text-xs">
                          ({lang.name})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Topic Input */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Pen className="h-3.5 w-3.5" />
              Video Topic
            </label>
            <div className="relative">
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={`Nhập chủ đề video... Ví dụ: "Thực Tế Nặng Nề Của Những Năm 2030. Khi Giới Trẻ Không Có Tiền"`}
                className="min-h-[80px] max-h-[160px] resize-none bg-background/50 text-sm"
                disabled={isGenerating || isSending}
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!topic.trim() || isGenerating || isSending}
            className="w-full h-11 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium shadow-lg shadow-amber-500/20 transition-all"
          >
            {isGenerating || isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang tạo kịch bản{selectedLang ? ` (${selectedLang.flag})` : ""}...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Script
                {selectedLang ? ` ${selectedLang.flag}` : ""}
              </>
            )}
          </Button>

          {/* ── Streaming Preview ────────────────────── */}
          {isGenerating && latestResponse && (
            <Card className="bg-card/50 border-amber-500/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                <span className="text-sm font-medium text-amber-400">
                  Preview (streaming...)
                </span>
              </div>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono max-h-[300px] overflow-y-auto">
                {latestResponse.substring(0, 2000)}
                {latestResponse.length > 2000 && "..."}
              </pre>
            </Card>
          )}

          {/* ── Results Section ──────────────────────── */}
          {result && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Download Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleDownloadScript}
                  variant="outline"
                  className="flex-1 gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  disabled={!result.script}
                >
                  <Download className="h-4 w-4" />
                  Download Script (.txt)
                </Button>
                <Button
                  onClick={handleDownloadMetadata}
                  variant="outline"
                  className="flex-1 gap-2 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                  disabled={!result.metadata}
                >
                  <Download className="h-4 w-4" />
                  Download Metadata (.json)
                </Button>
              </div>

              {/* Script Preview */}
              {result.script && (
                <Card className="bg-card/50 border-border overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-border bg-background/30">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-emerald-400" />
                      Kịch bản
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleCopy(result.script, "script")}
                    >
                      {copied === "script" ? (
                        <Check className="h-3 w-3 text-emerald-400 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      {copied === "script" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <div className="p-4 max-h-[500px] overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed script-preview">
                      {result.script}
                    </pre>
                  </div>
                </Card>
              )}

              {/* Metadata: Titles */}
              {result.metadata.titles.some((t) => t) && (
                <MetadataSection
                  icon={<Sparkles className="h-4 w-4 text-amber-400" />}
                  title="Gợi ý Tiêu đề (3 options)"
                  isExpanded={expandedSections.titles}
                  onToggle={() => toggleSection("titles")}
                >
                  <div className="space-y-2">
                    {result.metadata.titles.map(
                      (title, i) =>
                        title && (
                          <div
                            key={i}
                            className="flex items-start gap-2 group"
                          >
                            <Badge
                              variant="outline"
                              className="shrink-0 mt-0.5 text-[10px] w-5 h-5 flex items-center justify-center p-0 border-amber-500/30 text-amber-400"
                            >
                              {i + 1}
                            </Badge>
                            <p className="flex-1 text-sm">{title}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              onClick={() =>
                                handleCopy(title, `title-${i}`)
                              }
                            >
                              {copied === `title-${i}` ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        )
                    )}
                  </div>
                </MetadataSection>
              )}

              {/* Metadata: Description */}
              {result.metadata.description && (
                <MetadataSection
                  icon={<FileText className="h-4 w-4 text-blue-400" />}
                  title="YouTube Description"
                  isExpanded={expandedSections.description}
                  onToggle={() => toggleSection("description")}
                  onCopy={() =>
                    handleCopy(result.metadata.description, "desc")
                  }
                  copied={copied === "desc"}
                >
                  <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground leading-relaxed">
                    {result.metadata.description}
                  </pre>
                </MetadataSection>
              )}

              {/* Metadata: Hashtags */}
              {result.metadata.hashtags.length > 0 && (
                <MetadataSection
                  icon={<Hash className="h-4 w-4 text-violet-400" />}
                  title="Hashtags"
                  isExpanded={expandedSections.hashtags}
                  onToggle={() => toggleSection("hashtags")}
                  onCopy={() =>
                    handleCopy(
                      result.metadata.hashtags.join(" "),
                      "hashtags"
                    )
                  }
                  copied={copied === "hashtags"}
                >
                  <div className="flex flex-wrap gap-1.5">
                    {result.metadata.hashtags.map((tag, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs border-violet-500/20 text-violet-300"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </MetadataSection>
              )}

              {/* Metadata: Thumbnail Prompts */}
              {result.metadata.thumbnailPrompts.length > 0 && (
                <MetadataSection
                  icon={<Image className="h-4 w-4 text-pink-400" />}
                  title="AI Thumbnail Prompts"
                  isExpanded={expandedSections.thumbnail}
                  onToggle={() => toggleSection("thumbnail")}
                >
                  <div className="space-y-3">
                    {result.metadata.thumbnailPrompts.map((tp, i) => (
                      <div key={i} className="space-y-1.5 group">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] border-pink-500/20 text-pink-300"
                          >
                            {tp.language.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {tp.culturalContext}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <p className="flex-1 text-muted-foreground bg-background/40 rounded-lg p-3 font-mono text-xs">
                            {tp.prompt}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-2"
                            onClick={() =>
                              handleCopy(tp.prompt, `thumb-${i}`)
                            }
                          >
                            {copied === `thumb-${i}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </MetadataSection>
              )}
            </div>
          )}

          {/* Empty State */}
          {!result && !isGenerating && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/10">
                <Pen className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                Video Script Generator
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Chọn kênh, nhập chủ đề video và ngôn ngữ đầu ra. AI sẽ tạo
                kịch bản hoàn chỉnh theo framework STORM kèm metadata cho
                YouTube.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Collapsible Metadata Section ────────────────────────

function MetadataSection({
  icon,
  title,
  isExpanded,
  onToggle,
  onCopy,
  copied,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy?: () => void;
  copied?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-card/50 border-border overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-3 border-b border-border bg-background/30 hover:bg-background/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </span>
        <div className="flex items-center gap-1">
          {onCopy && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400 mr-1" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {isExpanded && <div className="p-4">{children}</div>}
    </Card>
  );
}
