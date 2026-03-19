const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { pipeline } = require("stream/promises");

const SCRAPER_URL = process.env.SCRAPER_URL || "http://localhost:5000";
const DOWNLOADS_DIR = path.join(__dirname, "..", "downloads");

/**
 * POST /api/crawl
 * Body: { keyword: string, limit: number }
 * Returns: { images: [{ url, index }], keyword, total }
 */
router.post("/crawl", async (req, res) => {
  try {
    const { keyword, limit = 20 } = req.body;

    if (!keyword || !keyword.trim()) {
      return res.status(400).json({ error: "keyword is required" });
    }

    const clampedLimit = Math.min(Math.max(1, limit), 100);

    console.log(`[CRAWL] keyword="${keyword}" limit=${clampedLimit}`);

    const scraperUrl = `${SCRAPER_URL}/search?keyword=${encodeURIComponent(keyword)}&limit=${clampedLimit}`;

    const response = await fetch(scraperUrl, { timeout: 60000 });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[CRAWL] Scraper error: ${response.status} ${text}`);
      return res.status(502).json({ error: "Scraper service error", detail: text });
    }

    const data = await response.json();
    console.log(`[CRAWL] Found ${data.total} images for "${keyword}"`);

    return res.json(data);
  } catch (err) {
    console.error(`[CRAWL] Error:`, err.message);

    if (err.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "Scraper service is not running. Start the Docker container first.",
      });
    }

    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/proxy-image
 * Query: ?url=<image_url>
 * Proxies the image to avoid CORS issues
 */
router.get("/proxy-image", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: "url query parameter is required" });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/*,*/*;q=0.8",
      },
      timeout: 15000,
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch image: ${response.status}` });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");

    response.body.pipe(res);
  } catch (err) {
    console.error(`[PROXY] Error:`, err.message);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/download
 * Body: { keyword: string, imageUrls: string[] }
 * Downloads selected images, saves to downloads/<keyword>_<index>/, returns ZIP
 */
router.post("/download", async (req, res) => {
  try {
    const { keyword, imageUrls } = req.body;

    if (!keyword || !keyword.trim()) {
      return res.status(400).json({ error: "keyword is required" });
    }

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ error: "imageUrls array is required and must not be empty" });
    }

    // Sanitize keyword for safe use in filenames and HTTP headers
    const safeKeyword = sanitizeFilename(keyword.trim());
    console.log(`[DOWNLOAD] keyword="${keyword}" safeKeyword="${safeKeyword}" images=${imageUrls.length}`);

    // Find the next available index for this keyword
    const existingDirs = fs
      .readdirSync(DOWNLOADS_DIR)
      .filter((d) => d.startsWith(safeKeyword + "_") && fs.statSync(path.join(DOWNLOADS_DIR, d)).isDirectory());

    let maxIndex = 0;
    for (const dir of existingDirs) {
      const match = dir.match(new RegExp(`^${escapeRegExp(safeKeyword)}_(\\d+)$`));
      if (match) {
        maxIndex = Math.max(maxIndex, parseInt(match[1], 10));
      }
    }

    const folderIndex = maxIndex + 1;
    const folderName = `${safeKeyword}_${folderIndex}`;
    const folderPath = path.join(DOWNLOADS_DIR, folderName);
    fs.mkdirSync(folderPath, { recursive: true });

    console.log(`[DOWNLOAD] Saving to ${folderName}`);

    // Download all images
    const downloadResults = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
          timeout: 15000,
        });

        if (!response.ok) {
          console.warn(`[DOWNLOAD] Failed to download ${url}: ${response.status}`);
          downloadResults.push({ url, success: false, error: `HTTP ${response.status}` });
          continue;
        }

        // Determine file extension from Content-Type or URL
        const contentType = response.headers.get("content-type") || "";
        let ext = getExtensionFromContentType(contentType);
        if (!ext) {
          ext = getExtensionFromUrl(url);
        }

        const filename = `${safeKeyword}_${i + 1}${ext}`;
        const filePath = path.join(folderPath, filename);

        const fileStream = fs.createWriteStream(filePath);
        await pipeline(response.body, fileStream);

        downloadResults.push({ url, success: true, filename });
        console.log(`[DOWNLOAD] Saved ${filename}`);
      } catch (err) {
        console.warn(`[DOWNLOAD] Error downloading ${url}:`, err.message);
        downloadResults.push({ url, success: false, error: err.message });
      }
    }

    const successCount = downloadResults.filter((r) => r.success).length;
    console.log(`[DOWNLOAD] Completed: ${successCount}/${imageUrls.length} images saved to ${folderName}`);

    // Create ZIP and send
    res.set("Content-Type", "application/zip");
    res.set("Content-Disposition", `attachment; filename="${folderName}.zip"`);

    const archive = archiver("zip", { zlib: { level: 5 } });
    archive.on("error", (err) => {
      console.error("[DOWNLOAD] Archive error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to create ZIP" });
      }
    });

    archive.pipe(res);
    archive.directory(folderPath, folderName);
    await archive.finalize();
  } catch (err) {
    console.error(`[DOWNLOAD] Error:`, err);
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message });
    }
  }
});

// Utility functions
function sanitizeFilename(name) {
  // Replace non-ASCII with closest ASCII or remove, replace spaces with underscores
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-zA-Z0-9_\-. ]/g, "") // Keep only safe chars
    .replace(/\s+/g, "_") // Spaces → underscores
    .replace(/_+/g, "_") // Collapse multiple underscores
    .replace(/^_|_$/g, "") // Trim leading/trailing underscores
    || "download"; // Fallback if empty
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getExtensionFromContentType(contentType) {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/bmp": ".bmp",
    "image/svg+xml": ".svg",
    "image/x-icon": ".ico",
  };
  for (const [type, ext] of Object.entries(map)) {
    if (contentType.includes(type)) return ext;
  }
  return null;
}

function getExtensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg|ico)$/i);
    return match ? `.${match[1].toLowerCase()}` : ".jpg";
  } catch {
    return ".jpg";
  }
}

module.exports = router;
