import { useState, useCallback } from "react";
import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { ScriptGeneratorPanel } from "@/components/script-generator-panel";
import { ImageCrawlerPanel } from "@/components/image-crawler-panel";
import { useBridge } from "@/hooks/use-bridge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, X, MessageSquare, Pen, ImageDown } from "lucide-react";

export function App() {
  const {
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
  } = useBridge();

  const [selectedModel, setSelectedModel] = useState("Gemini 3 Flash");
  const [selectedMode, setSelectedMode] = useState("Fast");
  const [activeTab, setActiveTab] = useState("chat");

  const handleModelChange = useCallback(
    (model: string) => {
      setSelectedModel(model);
      switchModelMode(model, undefined);
    },
    [switchModelMode]
  );

  const handleModeChange = useCallback(
    (mode: string) => {
      setSelectedMode(mode);
      switchModelMode(undefined, mode);
    },
    [switchModelMode]
  );

  const handleSend = useCallback(
    (text: string) => {
      sendMessage(text, selectedModel, selectedMode);
    },
    [sendMessage, selectedModel, selectedMode]
  );

  // Get the latest assistant response for the script generator
  const latestAssistantMsg = messages
    .filter((m) => m.role === "assistant")
    .at(-1);
  const latestResponse = latestAssistantMsg?.content ?? "";

  return (
    <div className="dark flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar
        status={status}
        isConnected={isConnected}
        wsConnected={wsConnected}
        selectedModel={selectedModel}
        selectedMode={selectedMode}
        onModelChange={handleModelChange}
        onModeChange={handleModeChange}
        onNewConversation={newConversation}
        onSelectConversation={selectConversation}
        onToggleAutoRun={toggleAutoRun}
        onToggleAutoAllow={toggleAutoAllow}
      />

      {/* Main Content — Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-1 flex-col overflow-hidden min-h-0"
      >
        {/* Tab Navigation Bar */}
        <div className="flex items-center border-b border-border bg-card/30 px-4">
          <TabsList className="h-10 bg-transparent border-0 gap-1 p-0">
            <TabsTrigger
              value="chat"
              className="relative h-10 rounded-none border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground transition-all data-[state=active]:border-violet-500 data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent hover:text-foreground/80"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="script"
              className="relative h-10 rounded-none border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground transition-all data-[state=active]:border-amber-500 data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent hover:text-foreground/80"
            >
              <Pen className="h-3.5 w-3.5 mr-1.5" />
              Script Generator
            </TabsTrigger>
            <TabsTrigger
              value="image-crawler"
              className="relative h-10 rounded-none border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground transition-all data-[state=active]:border-emerald-500 data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent hover:text-foreground/80"
            >
              <ImageDown className="h-3.5 w-3.5 mr-1.5" />
              Image Crawler
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <TabsContent
          value="chat"
          className="flex-1 mt-0 overflow-hidden min-h-0"
        >
          <ChatPanel
            messages={messages}
            streamTitle={streamTitle}
            isSending={isSending}
            conversationTitle={status?.title ?? ""}
            queueLength={status?.queueLength ?? 0}
            onSend={handleSend}
          />
        </TabsContent>

        <TabsContent
          value="script"
          className="flex-1 mt-0 overflow-hidden min-h-0"
        >
          <ScriptGeneratorPanel
            onSend={handleSend}
            isSending={isSending}
            latestResponse={latestResponse}
          />
        </TabsContent>

        <TabsContent
          value="image-crawler"
          className="flex-1 mt-0 overflow-hidden min-h-0"
        >
          <ImageCrawlerPanel />
        </TabsContent>
      </Tabs>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <Badge
            variant="destructive"
            className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500/10 text-red-400 border-red-500/20 backdrop-blur-sm"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-300 hover:text-red-200"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  );
}

export default App;
