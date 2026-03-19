import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatPanel } from "@/components/chat-panel";
import type { ChatMessage } from "@/hooks/use-bridge";

// Note: These tests verify the ChatPanel rendering logic.
// The Markdown component is rendered as-is since it's a thin wrapper.

const defaultProps = {
  messages: [] as ChatMessage[],
  streamTitle: "",
  isSending: false,
  conversationTitle: "Test Conversation",
  queueLength: 0,
  onSend: () => {},
};

describe("ChatPanel", () => {
  describe("empty state", () => {
    it("should show empty state when no messages", () => {
      render(<ChatPanel {...defaultProps} />);

      expect(screen.getByText("AI Bridge Client")).toBeInTheDocument();
      expect(
        screen.getByText(/Send a prompt to start a conversation/)
      ).toBeInTheDocument();
    });

    it("should show conversation title in header", () => {
      render(
        <ChatPanel
          {...defaultProps}
          conversationTitle="My Chat"
        />
      );

      expect(screen.getByText("My Chat")).toBeInTheDocument();
    });

    it("should prefer streamTitle over conversationTitle", () => {
      render(
        <ChatPanel
          {...defaultProps}
          conversationTitle="My Chat"
          streamTitle="Streaming Title"
        />
      );

      expect(screen.getByText("Streaming Title")).toBeInTheDocument();
    });
  });

  describe("messages", () => {
    it("should render user messages", () => {
      const messages: ChatMessage[] = [
        {
          id: "1",
          role: "user",
          content: "Hello, AI!",
          model: "Gemini 3 Flash",
          mode: "Fast",
          timestamp: new Date("2026-01-01T12:00:00"),
        },
      ];

      render(<ChatPanel {...defaultProps} messages={messages} />);

      expect(screen.getByText("Hello, AI!")).toBeInTheDocument();
    });

    it("should render model and mode badges on messages", () => {
      const messages: ChatMessage[] = [
        {
          id: "1",
          role: "user",
          content: "Hello",
          model: "Gemini 3 Flash",
          mode: "Fast",
          timestamp: new Date("2026-01-01T12:00:00"),
        },
      ];

      render(<ChatPanel {...defaultProps} messages={messages} />);

      expect(screen.getByText("Gemini 3 Flash")).toBeInTheDocument();
      expect(screen.getByText("Fast")).toBeInTheDocument();
    });

    it("should show streaming indicator for streaming messages", () => {
      const messages: ChatMessage[] = [
        {
          id: "1",
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isStreaming: true,
        },
      ];

      render(<ChatPanel {...defaultProps} messages={messages} />);

      expect(
        screen.getByText("Waiting for response...")
      ).toBeInTheDocument();
    });

    it("should show Streaming... label for ongoing stream with content", () => {
      const messages: ChatMessage[] = [
        {
          id: "1",
          role: "assistant",
          content: "Partial response here",
          timestamp: new Date(),
          isStreaming: true,
        },
      ];

      render(<ChatPanel {...defaultProps} messages={messages} />);

      expect(screen.getByText("Streaming...")).toBeInTheDocument();
    });
  });

  describe("queue indicator", () => {
    it("should show queue badge when queueLength > 0", () => {
      render(<ChatPanel {...defaultProps} queueLength={3} />);

      expect(screen.getByText("Queue: 3")).toBeInTheDocument();
    });

    it("should not show queue badge when queueLength is 0", () => {
      render(<ChatPanel {...defaultProps} queueLength={0} />);

      expect(screen.queryByText(/Queue:/)).not.toBeInTheDocument();
    });
  });

  describe("input", () => {
    it("should have an input textarea with placeholder", () => {
      render(<ChatPanel {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(
        /Type your prompt/
      );
      expect(textarea).toBeInTheDocument();
    });

    it("should disable textarea while sending", () => {
      render(<ChatPanel {...defaultProps} isSending={true} />);

      const textarea = screen.getByPlaceholderText(
        /Type your prompt/
      );
      expect(textarea).toBeDisabled();
    });

    it("should call onSend when Enter is pressed", async () => {
      const onSend = vi.fn();
      render(<ChatPanel {...defaultProps} onSend={onSend} />);

      const textarea = screen.getByPlaceholderText(
        /Type your prompt/
      );

      await userEvent.type(textarea, "Hello World{Enter}");

      expect(onSend).toHaveBeenCalledWith("Hello World");
    });

    it("should not call onSend on Shift+Enter", async () => {
      const onSend = vi.fn();
      render(<ChatPanel {...defaultProps} onSend={onSend} />);

      const textarea = screen.getByPlaceholderText(
        /Type your prompt/
      );

      await userEvent.type(textarea, "Hello{Shift>}{Enter}{/Shift}");

      expect(onSend).not.toHaveBeenCalled();
    });
  });
});
