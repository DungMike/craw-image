import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/markdown";
import type { ChatMessage } from "@/hooks/use-bridge";
import { Send, Loader2, User, Bot, Sparkles } from "lucide-react";

interface ChatPanelProps {
  messages: ChatMessage[];
  streamTitle: string;
  isSending: boolean;
  conversationTitle: string;
  queueLength: number;
  onSend: (text: string) => void;
}

export function ChatPanel({
  messages,
  streamTitle,
  isSending,
  conversationTitle,
  queueLength,
  onSend,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change or content updates
  const lastMsgContent = messages[messages.length - 1]?.content;
  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        const scrollContainer = scrollRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    });
  }, [messages.length, lastMsgContent]);

  const handleSend = () => {
    if (input.trim() && !isSending) {
      onSend(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card/30 px-6 py-3">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <h2 className="text-sm font-medium">
            {streamTitle || conversationTitle || "Untitled Conversation"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {queueLength > 0 && (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]"
            >
              Queue: {queueLength}
            </Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 px-6">
        <div className="mx-auto max-w-3xl space-y-6 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/10">
                <Bot className="h-8 w-8 text-violet-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">AI Bridge Client</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Send a prompt to start a conversation. Responses will stream
                in real-time via WebSocket.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-card/30 p-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-3 rounded-xl border border-border bg-background/60 p-2 pl-4 backdrop-blur-sm focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/20 transition-all">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your prompt... (Enter to send, Shift+Enter for new line)"
              className="min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent p-2 shadow-none focus-visible:ring-0 text-sm"
              rows={1}
              disabled={isSending}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="shrink-0 h-9 w-9 rounded-lg bg-linear-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 shadow-lg shadow-violet-500/20 transition-all"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground/50">
            Model & mode are selected in the sidebar. Responses stream via
            WebSocket.
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isStreaming = message.isStreaming;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isUser
            ? "bg-linear-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/10"
            : "bg-linear-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/10"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-emerald-400" />
        ) : (
          <Bot className="h-4 w-4 text-violet-400" />
        )}
      </div>

      <div
        className={`flex-1 min-w-0 overflow-hidden rounded-xl border p-4 ${
          isUser
            ? "bg-emerald-500/5 border-emerald-500/10 text-sm"
            : "bg-card/50 border-border"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : isStreaming && !message.content ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Waiting for response...</span>
          </div>
        ) : (
          <>
            <Markdown content={message.content} />
            {isStreaming && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Streaming...</span>
              </div>
            )}
          </>
        )}

        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground/50">
            {message.timestamp.toLocaleTimeString()}
          </span>
          {message.model && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-border/50"
            >
              {message.model}
            </Badge>
          )}
          {message.mode && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${
                message.mode === "Fast"
                  ? "border-amber-500/30 text-amber-400"
                  : "border-blue-500/30 text-blue-400"
              }`}
            >
              {message.mode}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
