const API_BASE = "http://localhost:5001";

export interface ChatRequest {
  text: string;
  model?: string;
  mode?: string;
}

export interface ChatResponse {
  status: string;
  position: number;
  model: string;
  mode: string;
}

export interface BridgeStatus {
  online: boolean;
  autoState: { run: boolean; allow: boolean };
  stats: { commandsSent: number; autoRunClicks: number; autoAllowClicks: number };
  queueLength: number;
  title: string;
  content: string;
}

export interface SwitchModelModeRequest {
  model?: string;
  mode?: string;
}

export interface SwitchModelModeResponse {
  status: string;
  id: string;
  model: string;
  mode: string;
}

export interface SwitchStatusResponse {
  id: string;
  status: "none" | "pending" | "done" | "error";
  model: string;
  mode: string;
  error: string | null;
  elapsed_ms: number;
}

export interface StatsResponse {
  [key: string]: unknown;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  chat: (data: ChatRequest) =>
    request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  status: () => request<BridgeStatus>("/status"),

  newConversation: () =>
    request<unknown>("/conversation", { method: "POST" }),

  selectConversation: (title: string) =>
    request<unknown>("/select_conversation", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  toggleAutoRun: () =>
    request<unknown>("/toggle_auto_run", { method: "POST" }),

  toggleAutoAllow: () =>
    request<unknown>("/toggle_auto_allow", { method: "POST" }),

  switchModelMode: (data: SwitchModelModeRequest) =>
    request<SwitchModelModeResponse>("/switch_model_mode", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  switchStatus: () => request<SwitchStatusResponse>("/switch_status"),

  stats: () => request<StatsResponse>("/stats"),
};

export const AVAILABLE_MODELS = [
  "Gemini 3.1 Pro (High)",
  "Gemini 3.1 Pro (Low)",
  "Gemini 3 Flash",
  "Claude Sonnet 4.6 (Thinking)",
  "Claude Opus 4.6 (Thinking)",
  "GPT-OSS 120B (Medium)",
] as const;

export const AVAILABLE_MODES = ["Planning", "Fast"] as const;
