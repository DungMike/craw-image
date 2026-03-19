import { useCallback, useEffect, useRef, useState } from "react";
import { api, type BridgeStatus } from "@/lib/api";

const WS_URL = "ws://localhost:9813";
const POLL_INTERVAL = 3000;
// How long content must be unchanged before we consider the response "done"
const CONTENT_STABLE_MS = 5000;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  mode?: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export function useBridge() {
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamTitle, setStreamTitle] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track the content snapshot BEFORE sending a new message
  const preMessageContentRef = useRef<string>("");
  // Track the latest content from WS or polling while streaming
  const latestContentRef = useRef<string>("");
  // Track the last time content changed (for stability detection)
  const contentLastChangedRef = useRef<number>(0);
  // Flag to indicate we are actively waiting for a response
  const waitingForResponseRef = useRef(false);
  // Streaming assistant message id
  const streamingMsgIdRef = useRef<string>("");

  // ── Stale-content guard ──────────────────────────────
  // After newConversation / selectConversation, the bridge server and WS
  // will keep broadcasting the OLD content until the AI starts replying.
  // We record the stale content string so we can ignore it.
  const staleContentRef = useRef<string>("");
  // When true, we reject any incoming content that matches staleContentRef
  const ignoreStaleContentRef = useRef(false);

  /** Returns true if `content` should be treated as stale / old data */
  const isStaleContent = useCallback((content: string): boolean => {
    if (!ignoreStaleContentRef.current) return false;
    if (!staleContentRef.current) return false;
    // Exact match with known stale content → reject
    return content === staleContentRef.current;
  }, []);

  // ────────────────────────────────────────────────────
  // Poll bridge status (background, every POLL_INTERVAL)
  // ────────────────────────────────────────────────────
  const pollStatus = useCallback(async () => {
    try {
      const s = await api.status();
      setStatus(s);
      setIsConnected(s.online);

      // Only clear error if it was a connection error
      if (error === "Bridge offline") setError(null);

      // If we are waiting for response and polling gives us content, use it
      if (waitingForResponseRef.current && s.content) {
        const newContent = s.content;

        // Skip stale content from previous conversation
        if (isStaleContent(newContent)) return;

        // Content is genuinely new → clear the stale guard
        if (ignoreStaleContentRef.current) {
          ignoreStaleContentRef.current = false;
          staleContentRef.current = "";
        }

        if (newContent !== latestContentRef.current) {
          latestContentRef.current = newContent;
          contentLastChangedRef.current = Date.now();

          // Update the streaming assistant message in-place
          if (streamingMsgIdRef.current) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamingMsgIdRef.current
                  ? { ...m, content: newContent }
                  : m
              )
            );
          }
        }
      }
    } catch {
      setIsConnected(false);
      setError("Bridge offline");
    }
  }, [error, isStaleContent]);

  useEffect(() => {
    pollStatus();
    pollRef.current = setInterval(pollStatus, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pollStatus]);

  // ────────────────────────────────────────────────────
  // WebSocket connection — primary source for streaming
  // ────────────────────────────────────────────────────
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.title) {
            setStreamTitle(data.title);
          }

          if (data.content && waitingForResponseRef.current) {
            const newContent = data.content;

            // Skip stale content from previous conversation
            if (isStaleContent(newContent)) return;

            // Content is genuinely new → clear the stale guard
            if (ignoreStaleContentRef.current) {
              ignoreStaleContentRef.current = false;
              staleContentRef.current = "";
            }

            if (newContent !== latestContentRef.current) {
              latestContentRef.current = newContent;
              contentLastChangedRef.current = Date.now();

              // Update the streaming assistant message in-place
              if (streamingMsgIdRef.current) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamingMsgIdRef.current
                      ? { ...m, content: newContent }
                      : m
                  )
                );
              }
            }
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
    // NOTE: isStaleContent is stable (useCallback with no deps) so this
    // effectively runs once on mount, which is what we want.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ────────────────────────────────────────────────────
  // Send chat message
  // ────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string, model?: string, mode?: string) => {
      if (!text.trim()) return;

      // 1. Capture current content as the "before" snapshot
      //    Also use it as stale-content baseline so we never show it
      //    for this new prompt.
      preMessageContentRef.current = latestContentRef.current;

      // If the stale guard is still active (newConversation was just called),
      // keep it alive. Otherwise start fresh — the pre-message content IS
      // the stale content we want to ignore.
      if (!ignoreStaleContentRef.current && latestContentRef.current) {
        staleContentRef.current = latestContentRef.current;
        ignoreStaleContentRef.current = true;
      }

      // 2. Add user message to the list
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        model,
        mode,
        timestamp: new Date(),
      };

      // 3. Create a placeholder streaming assistant message
      const assistantMsgId = crypto.randomUUID();
      streamingMsgIdRef.current = assistantMsgId;

      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        model,
        mode,
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsSending(true);
      setError(null);
      waitingForResponseRef.current = true;
      contentLastChangedRef.current = Date.now();
      // Reset latestContent so the stability check starts fresh
      latestContentRef.current = "";

      try {
        // 4. Send to API
        await api.chat({ text, model, mode });

        // 5. Wait for content to stabilize
        //    Content is "stable" when it has been unchanged for CONTENT_STABLE_MS
        //    AND it is different from the pre-message snapshot
        //    AND it is not stale content
        //    AND queue is empty
        await new Promise<void>((resolve) => {
          const checkInterval = setInterval(async () => {
            const now = Date.now();
            const timeSinceLastChange =
              now - contentLastChangedRef.current;
            const contentChanged =
              latestContentRef.current !== preMessageContentRef.current;
            const hasContent = latestContentRef.current.length > 0;
            const notStale = !isStaleContent(latestContentRef.current);

            // Check if content has stabilized
            if (
              contentChanged &&
              hasContent &&
              notStale &&
              timeSinceLastChange >= CONTENT_STABLE_MS
            ) {
              clearInterval(checkInterval);
              resolve();
              return;
            }

            // Also poll /status to check queue and grab latest content
            try {
              const s = await api.status();
              if (s.content && s.content !== latestContentRef.current) {
                // Skip stale content
                if (isStaleContent(s.content)) return;

                // Genuinely new → clear stale guard
                if (ignoreStaleContentRef.current) {
                  ignoreStaleContentRef.current = false;
                  staleContentRef.current = "";
                }

                latestContentRef.current = s.content;
                contentLastChangedRef.current = Date.now();

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: s.content }
                      : m
                  )
                );
              }
            } catch {
              // ignore
            }
          }, 1500);

          // Timeout after 180s
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
          }, 180000);
        });

        // 6. Finalize the assistant message — mark as not streaming
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: latestContentRef.current || m.content,
                  isStreaming: false,
                  timestamp: new Date(),
                }
              : m
          )
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to send message"
        );
        // Remove the empty assistant message on error
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
      } finally {
        setIsSending(false);
        waitingForResponseRef.current = false;
        streamingMsgIdRef.current = "";
        // Clear stale guard when done
        ignoreStaleContentRef.current = false;
        staleContentRef.current = "";
      }
    },
    [isStaleContent]
  );

  // ────────────────────────────────────────────────────
  // Conversation management
  // ────────────────────────────────────────────────────
  const newConversation = useCallback(async () => {
    try {
      // Record stale content BEFORE resetting — this is the content
      // that the server will keep broadcasting until AI replies anew.
      staleContentRef.current = latestContentRef.current;
      ignoreStaleContentRef.current = true;

      await api.newConversation();
      setMessages([]);
      setStreamTitle("");
      latestContentRef.current = "";
      preMessageContentRef.current = "";
      waitingForResponseRef.current = false;
      streamingMsgIdRef.current = "";

      // Poll status for connectivity info, but DO NOT let it overwrite
      // our freshly-reset refs with stale content (the guard handles it)
      try {
        const s = await api.status();
        setStatus(s);
        setIsConnected(s.online);
      } catch {
        // ignore
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create conversation"
      );
    }
  }, []);

  const selectConversation = useCallback(
    async (title: string) => {
      try {
        // Record stale content before switching
        staleContentRef.current = latestContentRef.current;
        ignoreStaleContentRef.current = true;

        await api.selectConversation(title);
        setMessages([]);
        setStreamTitle("");
        latestContentRef.current = "";
        preMessageContentRef.current = "";
        waitingForResponseRef.current = false;
        streamingMsgIdRef.current = "";

        // Poll for new conversation state
        try {
          const s = await api.status();
          setStatus(s);
          setIsConnected(s.online);
          // For selectConversation, the server may return the content of the
          // selected conversation — that's NOT stale, but it's from a
          // different topic so we accept it only if it differs.
          if (s.content && s.content !== staleContentRef.current) {
            latestContentRef.current = s.content;
            ignoreStaleContentRef.current = false;
            staleContentRef.current = "";
          }
        } catch {
          // ignore
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to switch conversation"
        );
      }
    },
    []
  );

  // ────────────────────────────────────────────────────
  // Toggles
  // ────────────────────────────────────────────────────
  const toggleAutoRun = useCallback(async () => {
    try {
      await api.toggleAutoRun();
      await pollStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to toggle auto-run"
      );
    }
  }, [pollStatus]);

  const toggleAutoAllow = useCallback(async () => {
    try {
      await api.toggleAutoAllow();
      await pollStatus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to toggle auto-allow"
      );
    }
  }, [pollStatus]);

  // ────────────────────────────────────────────────────
  // Switch model/mode
  // ────────────────────────────────────────────────────
  const switchModelMode = useCallback(
    async (model?: string, mode?: string) => {
      try {
        const result = await api.switchModelMode({ model, mode });

        // Poll switch status until done
        await new Promise<void>((resolve) => {
          const check = setInterval(async () => {
            try {
              const switchStatus = await api.switchStatus();
              if (
                switchStatus.id === result.id &&
                (switchStatus.status === "done" ||
                  switchStatus.status === "error")
              ) {
                clearInterval(check);
                if (switchStatus.status === "error") {
                  setError(
                    switchStatus.error || "Model/mode switch failed"
                  );
                }
                resolve();
              }
            } catch {
              // keep polling
            }
          }, 500);

          setTimeout(() => {
            clearInterval(check);
            resolve();
          }, 15000);
        });

        await pollStatus();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to switch model/mode"
        );
      }
    },
    [pollStatus]
  );

  return {
    status,
    messages,
    streamTitle,
    isConnected,
    wsConnected,
    isSending,
    error,
    sendMessage,
    newConversation,
    selectConversation,
    toggleAutoRun,
    toggleAutoAllow,
    switchModelMode,
    setError,
  };
}
