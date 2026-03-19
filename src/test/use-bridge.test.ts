import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useBridge } from "@/hooks/use-bridge";

// ─── Mock fetch ──────────────────────────────────────
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

// ─── Mock WebSocket ──────────────────────────────────
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_url: string) {
    MockWebSocket.instances.push(this);
    // Auto-connect after a tick
    setTimeout(() => this.onopen?.(), 0);
  }

  close() {
    this.onclose?.();
  }

  // Helper to simulate incoming messages
  simulateMessage(data: object) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

vi.stubGlobal("WebSocket", MockWebSocket);

// ─── Helpers ─────────────────────────────────────────
function mockStatusResponse(overrides = {}) {
  return {
    online: true,
    autoState: { run: false, allow: false },
    stats: { commandsSent: 0, autoRunClicks: 0, autoAllowClicks: 0 },
    queueLength: 0,
    title: "Untitled Conversation",
    content: "",
    ...overrides,
  };
}

function setupFetchMock(responses: Record<string, unknown>) {
  mockFetch.mockImplementation((url: string) => {
    const path = new URL(url).pathname;
    if (responses[path]) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responses[path]),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockStatusResponse()),
    });
  });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  MockWebSocket.instances = [];
  mockFetch.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useBridge hook", () => {
  describe("initialization", () => {
    it("should start with default state", () => {
      setupFetchMock({ "/status": mockStatusResponse() });

      const { result } = renderHook(() => useBridge());

      expect(result.current.messages).toEqual([]);
      expect(result.current.isSending).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("should poll /status on mount", async () => {
      setupFetchMock({
        "/status": mockStatusResponse({ online: true, content: "hello" }),
      });

      renderHook(() => useBridge());

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/status"),
          expect.anything()
        );
      });
    });

    it("should create a WebSocket connection on mount", async () => {
      setupFetchMock({ "/status": mockStatusResponse() });

      renderHook(() => useBridge());

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe("sendMessage", () => {
    it("should add user and placeholder assistant messages", async () => {
      setupFetchMock({
        "/status": mockStatusResponse(),
        "/chat": {
          status: "queued",
          position: 1,
          model: "Gemini 3 Flash",
          mode: "Fast",
        },
      });

      const { result } = renderHook(() => useBridge());

      await act(async () => {
        result.current.sendMessage("Hello", "Gemini 3 Flash", "Fast");
      });

      // Should have 2 messages: user + assistant placeholder
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].role).toBe("user");
      expect(result.current.messages[0].content).toBe("Hello");
      expect(result.current.messages[1].role).toBe("assistant");
      expect(result.current.messages[1].isStreaming).toBe(true);
    });

    it("should set isSending to true while waiting", async () => {
      setupFetchMock({
        "/status": mockStatusResponse(),
        "/chat": { status: "queued", position: 1 },
      });

      const { result } = renderHook(() => useBridge());

      act(() => {
        result.current.sendMessage("Test", "Gemini 3 Flash", "Fast");
      });

      expect(result.current.isSending).toBe(true);
    });

    it("should not send empty messages", async () => {
      setupFetchMock({ "/status": mockStatusResponse() });

      const { result } = renderHook(() => useBridge());

      await act(async () => {
        result.current.sendMessage("", "Gemini 3 Flash", "Fast");
      });

      expect(result.current.messages).toHaveLength(0);
    });

    it("should not send whitespace-only messages", async () => {
      setupFetchMock({ "/status": mockStatusResponse() });

      const { result } = renderHook(() => useBridge());

      await act(async () => {
        result.current.sendMessage("   ", "Gemini 3 Flash", "Fast");
      });

      expect(result.current.messages).toHaveLength(0);
    });
  });

  describe("WebSocket streaming", () => {
    it("should update assistant message content when WS sends data during streaming", async () => {
      setupFetchMock({
        "/status": mockStatusResponse(),
        "/chat": { status: "queued", position: 1 },
      });

      const { result } = renderHook(() => useBridge());

      // Send a message first
      act(() => {
        result.current.sendMessage("Hello", "Gemini 3 Flash", "Fast");
      });

      // Wait for WebSocket to be created
      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(1);
      });

      // Simulate WebSocket streaming content
      const ws = MockWebSocket.instances[0];
      act(() => {
        ws.simulateMessage({
          title: "Test Conversation",
          content: "First part of response...",
        });
      });

      await waitFor(() => {
        const assistantMsg = result.current.messages.find(
          (m) => m.role === "assistant"
        );
        expect(assistantMsg?.content).toBe("First part of response...");
      });
    });

    it("should update streamTitle from WebSocket", async () => {
      setupFetchMock({
        "/status": mockStatusResponse(),
        "/chat": { status: "queued", position: 1 },
      });

      const { result } = renderHook(() => useBridge());

      act(() => {
        result.current.sendMessage("Hello", "Gemini 3 Flash", "Fast");
      });

      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(1);
      });

      const ws = MockWebSocket.instances[0];
      act(() => {
        ws.simulateMessage({
          title: "Updated Title",
          content: "hello",
        });
      });

      await waitFor(() => {
        expect(result.current.streamTitle).toBe("Updated Title");
      });
    });
  });

  describe("newConversation", () => {
    it("should clear messages and call /conversation", async () => {
      setupFetchMock({
        "/status": mockStatusResponse(),
        "/conversation": {},
        "/chat": { status: "queued", position: 1 },
      });

      const { result } = renderHook(() => useBridge());

      // Add a message first
      await act(async () => {
        result.current.sendMessage("Hello", "Gemini 3 Flash", "Fast");
      });

      // Clear conversation
      await act(async () => {
        await result.current.newConversation();
      });

      expect(result.current.messages).toHaveLength(0);
    });
  });

  describe("error handling", () => {
    it("should set error when bridge is offline", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useBridge());

      await waitFor(() => {
        expect(result.current.error).toBe("Bridge offline");
        expect(result.current.isConnected).toBe(false);
      });
    });

    it("should set error when /chat fails", async () => {
      mockFetch.mockImplementation((url: string) => {
        const path = new URL(url).pathname;
        if (path === "/chat") {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: "Server Error",
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStatusResponse()),
        });
      });

      const { result } = renderHook(() => useBridge());

      await act(async () => {
        try {
          await result.current.sendMessage("Test", "Gemini 3 Flash", "Fast");
        } catch {
          // expected
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe("toggles", () => {
    it("should call /toggle_auto_run", async () => {
      setupFetchMock({
        "/status": mockStatusResponse(),
        "/toggle_auto_run": {},
      });

      const { result } = renderHook(() => useBridge());

      await act(async () => {
        await result.current.toggleAutoRun();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/toggle_auto_run"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should call /toggle_auto_allow", async () => {
      setupFetchMock({
        "/status": mockStatusResponse(),
        "/toggle_auto_allow": {},
      });

      const { result } = renderHook(() => useBridge());

      await act(async () => {
        await result.current.toggleAutoAllow();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/toggle_auto_allow"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
