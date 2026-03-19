import { describe, it, expect, vi, beforeEach } from "vitest";
import { api, AVAILABLE_MODELS, AVAILABLE_MODES } from "@/lib/api";

// Mock global fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("API client", () => {
  describe("api.chat", () => {
    it("should POST to /chat with correct body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "queued",
            position: 1,
            model: "Gemini 3 Flash",
            mode: "Fast",
          }),
      });

      const result = await api.chat({
        text: "What is 2+2",
        model: "Gemini 3 Flash",
        mode: "Fast",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:5001/chat",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            text: "What is 2+2",
            model: "Gemini 3 Flash",
            mode: "Fast",
          }),
        })
      );
      expect(result.status).toBe("queued");
      expect(result.model).toBe("Gemini 3 Flash");
    });

    it("should throw on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      await expect(
        api.chat({ text: "test", model: "Gemini 3 Flash", mode: "Fast" })
      ).rejects.toThrow("API error: 500 Internal Server Error");
    });

    it("should send text-only request when model and mode are not provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "queued",
            position: 1,
            model: "Gemini 3 Flash",
            mode: "Fast",
          }),
      });

      await api.chat({ text: "Hello world" });

      const callBody = JSON.parse(
        mockFetch.mock.calls[0][1].body as string
      );
      expect(callBody.text).toBe("Hello world");
    });
  });

  describe("api.status", () => {
    it("should GET /status and return bridge status", async () => {
      const mockStatus = {
        online: true,
        autoState: { run: false, allow: false },
        stats: { commandsSent: 3, autoRunClicks: 0, autoAllowClicks: 0 },
        queueLength: 0,
        title: "Untitled Conversation",
        content: "2 + 2 is **4**.",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatus),
      });

      const result = await api.status();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:5001/status",
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(result.online).toBe(true);
      expect(result.content).toBe("2 + 2 is **4**.");
      expect(result.queueLength).toBe(0);
    });
  });

  describe("api.newConversation", () => {
    it("should POST to /conversation", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await api.newConversation();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:5001/conversation",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("api.selectConversation", () => {
    it("should POST to /select_conversation with title", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await api.selectConversation("My Chat");

      const callBody = JSON.parse(
        mockFetch.mock.calls[0][1].body as string
      );
      expect(callBody.title).toBe("My Chat");
    });
  });

  describe("api.toggleAutoRun", () => {
    it("should POST to /toggle_auto_run", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await api.toggleAutoRun();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:5001/toggle_auto_run",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("api.toggleAutoAllow", () => {
    it("should POST to /toggle_auto_allow", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await api.toggleAutoAllow();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:5001/toggle_auto_allow",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("api.switchModelMode", () => {
    it("should POST to /switch_model_mode with model and mode", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "queued",
            id: "m1abc",
            model: "Gemini 3 Flash",
            mode: "Fast",
          }),
      });

      const result = await api.switchModelMode({
        model: "Gemini 3 Flash",
        mode: "Fast",
      });

      expect(result.id).toBe("m1abc");
      expect(result.model).toBe("Gemini 3 Flash");
    });
  });

  describe("api.switchStatus", () => {
    it("should GET /switch_status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "m1abc",
            status: "done",
            model: "Gemini 3 Flash",
            mode: "Fast",
            error: null,
            elapsed_ms: 1200,
          }),
      });

      const result = await api.switchStatus();

      expect(result.status).toBe("done");
      expect(result.elapsed_ms).toBe(1200);
    });
  });

  describe("api.stats", () => {
    it("should GET /stats", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ commands: 5 }),
      });

      const result = await api.stats();
      expect(result).toEqual({ commands: 5 });
    });
  });
});

describe("Constants", () => {
  it("should have 6 available models", () => {
    expect(AVAILABLE_MODELS).toHaveLength(6);
    expect(AVAILABLE_MODELS).toContain("Gemini 3 Flash");
    expect(AVAILABLE_MODELS).toContain("Claude Sonnet 4.6 (Thinking)");
  });

  it("should have 2 available modes", () => {
    expect(AVAILABLE_MODES).toHaveLength(2);
    expect(AVAILABLE_MODES).toContain("Planning");
    expect(AVAILABLE_MODES).toContain("Fast");
  });
});
