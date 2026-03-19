import { useState, useCallback } from "react";
import {
  Search,
  Download,
  Loader2,
  CheckCircle2,
  ImageOff,
  X,
  Images,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────
interface CrawledImage {
  url: string;
  index: number;
}

type JobStatus = "idle" | "crawling" | "done" | "error";

// ── Constants ────────────────────────────────────────────────────
const API_BASE = "/api";

// ── Component ────────────────────────────────────────────────────
export function ImageCrawlerPanel() {
  const [keyword, setKeyword] = useState("");
  const [limit, setLimit] = useState(20);
  const [images, setImages] = useState<CrawledImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<JobStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // ── Crawl ───────────────────────────────────────────────────
  const handleCrawl = useCallback(async () => {
    if (!keyword.trim()) return;

    setStatus("crawling");
    setError(null);
    setImages([]);
    setSelected(new Set());
    setFailedImages(new Set());

    try {
      const res = await fetch(`${API_BASE}/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), limit }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      setImages(data.images || []);
      setStatus("done");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setStatus("error");
    }
  }, [keyword, limit]);

  // ── Toggle select ──────────────────────────────────────────
  const toggleSelect = useCallback((url: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }, []);

  // ── Select all / Deselect all ──────────────────────────────
  const toggleSelectAll = useCallback(() => {
    const validImages = images.filter((img) => !failedImages.has(img.url));
    if (selected.size === validImages.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(validImages.map((img) => img.url)));
    }
  }, [images, selected, failedImages]);

  // ── Download ───────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (selected.size === 0) return;

    setDownloading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          imageUrls: Array.from(selected),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Download failed: ${res.status}`);
      }

      // Trigger file download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${keyword.trim()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Download failed";
      setError(message);
    } finally {
      setDownloading(false);
    }
  }, [selected, keyword]);

  // ── Image error handler ────────────────────────────────────
  const handleImageError = useCallback((url: string) => {
    setFailedImages((prev) => new Set(prev).add(url));
  }, []);

  // ── Proxy URL ──────────────────────────────────────────────
  const proxyUrl = (url: string) =>
    `${API_BASE}/proxy-image?url=${encodeURIComponent(url)}`;

  const validImages = images.filter((img) => !failedImages.has(img.url));

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ─── Search Bar ─────────────────────────────────────── */}
      <div className="border-b border-border bg-card/40 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-end gap-3">
          {/* Keyword */}
          <div className="flex-1">
            <label
              htmlFor="crawl-keyword"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Keyword
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="crawl-keyword"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCrawl()}
                placeholder="e.g. cat, sunset, architecture..."
                className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                disabled={status === "crawling"}
              />
            </div>
          </div>

          {/* Limit */}
          <div className="w-28">
            <label
              htmlFor="crawl-limit"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Limit
            </label>
            <input
              id="crawl-limit"
              type="number"
              min={1}
              max={100}
              value={limit}
              onChange={(e) => setLimit(Math.min(100, Math.max(1, +e.target.value || 1)))}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-center text-sm text-foreground outline-none transition-colors focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
              disabled={status === "crawling"}
            />
          </div>

          {/* Crawl Button */}
          <button
            id="crawl-button"
            onClick={handleCrawl}
            disabled={!keyword.trim() || status === "crawling"}
            className="h-10 rounded-lg bg-linear-to-r from-violet-600 to-indigo-600 px-5 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
          >
            {status === "crawling" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Crawling...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Crawl
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Action Bar (when images loaded) ────────────────── */}
      {status === "done" && images.length > 0 && (
        <div className="flex items-center justify-between border-b border-border bg-card/20 px-6 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{validImages.length}</span>{" "}
              images found
            </span>
            <span className="text-border">•</span>
            <button
              onClick={toggleSelectAll}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              {selected.size === validImages.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {selected.size > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400 border border-violet-500/20">
                <CheckCircle2 className="h-3 w-3" />
                {selected.size} selected
              </span>
            )}
            <button
              id="download-button"
              onClick={handleDownload}
              disabled={selected.size === 0 || downloading}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download Selected
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── Error Banner ───────────────────────────────────── */}
      {error && (
        <div className="mx-6 mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm text-red-400">
          <ImageOff className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-300 hover:text-red-200">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ─── Image Grid ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {status === "idle" && (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground/40">
            <Images className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">Search for images</p>
            <p className="text-sm mt-1">Enter a keyword and click Crawl to get started</p>
          </div>
        )}

        {status === "crawling" && (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-12 w-12 animate-spin text-violet-500 mb-4" />
            <p className="text-lg font-medium">Crawling images...</p>
            <p className="text-sm mt-1 text-muted-foreground/60">
              Searching Google Images for "{keyword}"
            </p>
          </div>
        )}

        {status === "done" && images.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground/40">
            <ImageOff className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">No images found</p>
            <p className="text-sm mt-1">Try a different keyword</p>
          </div>
        )}

        {(status === "done" || status === "error") && images.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {images.map((img) => {
              const isSelected = selected.has(img.url);
              const isFailed = failedImages.has(img.url);

              if (isFailed) return null;

              return (
                <button
                  key={img.url}
                  onClick={() => toggleSelect(img.url)}
                  className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    isSelected
                      ? "border-violet-500 ring-2 ring-violet-500/30 scale-[0.97]"
                      : "border-transparent hover:border-border/80 hover:scale-[0.98]"
                  }`}
                >
                  <img
                    src={proxyUrl(img.url)}
                    alt={`${keyword} ${img.index + 1}`}
                    loading="lazy"
                    onError={() => handleImageError(img.url)}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Overlay on hover/selected */}
                  <div
                    className={`absolute inset-0 transition-all duration-200 ${
                      isSelected
                        ? "bg-violet-500/20"
                        : "bg-black/0 group-hover:bg-black/20"
                    }`}
                  />

                  {/* Checkmark */}
                  <div
                    className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200 ${
                      isSelected
                        ? "bg-violet-500 scale-100 opacity-100"
                        : "bg-black/40 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>

                  {/* Index badge */}
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
                    #{img.index + 1}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
