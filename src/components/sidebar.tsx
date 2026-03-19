import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { AVAILABLE_MODELS, AVAILABLE_MODES } from "@/lib/api";
import type { BridgeStatus } from "@/lib/api";
import {
  Plus,
  ArrowRightLeft,
  Wifi,
  WifiOff,
  Zap,
  Shield,
  Bot,
  Activity,
  Radio,
} from "lucide-react";

interface SidebarProps {
  status: BridgeStatus | null;
  isConnected: boolean;
  wsConnected: boolean;
  selectedModel: string;
  selectedMode: string;
  onModelChange: (model: string) => void;
  onModeChange: (mode: string) => void;
  onNewConversation: () => void;
  onSelectConversation: (title: string) => void;
  onToggleAutoRun: () => void;
  onToggleAutoAllow: () => void;
}

export function Sidebar({
  status,
  isConnected,
  wsConnected,
  selectedModel,
  selectedMode,
  onModelChange,
  onModeChange,
  onNewConversation,
  onSelectConversation,
  onToggleAutoRun,
  onToggleAutoAllow,
}: SidebarProps) {
  const [conversationTitle, setConversationTitle] = useState("");

  const handleSwitchConversation = () => {
    if (conversationTitle.trim()) {
      onSelectConversation(conversationTitle.trim());
      setConversationTitle("");
    }
  };

  return (
    <div className="flex h-full w-72 flex-col border-r border-border bg-card/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">AI Bridge</h1>
          <p className="text-xs text-muted-foreground">Control Panel</p>
        </div>
      </div>

      <Separator />

      {/* Connection Status */}
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            {isConnected ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-red-400" />
            )}
            API Bridge
          </span>
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className={`text-[10px] px-1.5 py-0 ${isConnected ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : ""}`}
          >
            {isConnected ? "Online" : "Offline"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Radio
              className={`h-3.5 w-3.5 ${wsConnected ? "text-emerald-400" : "text-red-400"}`}
            />
            WebSocket
          </span>
          <Badge
            variant={wsConnected ? "default" : "destructive"}
            className={`text-[10px] px-1.5 py-0 ${wsConnected ? "bg-blue-500/15 text-blue-400 border-blue-500/20" : ""}`}
          >
            {wsConnected ? "Live" : "Disconnected"}
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Model Selector */}
      <div className="space-y-3 p-4">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          AI Model
        </label>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-full bg-background/50">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_MODELS.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Mode
        </label>
        <Select value={selectedMode} onValueChange={onModeChange}>
          <SelectTrigger className="w-full bg-background/50">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_MODES.map((mode) => (
              <SelectItem key={mode} value={mode}>
                {mode}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Auto Toggles */}
      <div className="space-y-3 p-4">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Automation
        </label>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Auto Run
          </span>
          <Switch
            checked={status?.autoState?.run ?? false}
            onCheckedChange={onToggleAutoRun}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <Shield className="h-3.5 w-3.5 text-sky-400" />
            Auto Allow
          </span>
          <Switch
            checked={status?.autoState?.allow ?? false}
            onCheckedChange={onToggleAutoAllow}
          />
        </div>
      </div>

      <Separator />

      {/* Conversation Management */}
      <div className="space-y-3 p-4">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Conversations
        </label>
        <Button
          onClick={onNewConversation}
          variant="outline"
          className="w-full justify-start gap-2 bg-background/50"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
        <div className="flex gap-2">
          <Input
            placeholder="Conversation title..."
            value={conversationTitle}
            onChange={(e) => setConversationTitle(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && handleSwitchConversation()
            }
            className="bg-background/50 text-sm"
          />
          <Button
            size="icon"
            variant="outline"
            onClick={handleSwitchConversation}
            className="shrink-0"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Stats */}
      {status && (
        <div className="space-y-2 p-4">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Statistics
          </label>
          <Card className="bg-background/30 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Activity className="h-3 w-3" />
                Commands Sent
              </span>
              <span className="font-mono font-medium">
                {status.stats?.commandsSent ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Auto Run Clicks</span>
              <span className="font-mono font-medium">
                {status.stats?.autoRunClicks ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Auto Allow Clicks</span>
              <span className="font-mono font-medium">
                {status.stats?.autoAllowClicks ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Queue Length</span>
              <span className="font-mono font-medium">
                {status.queueLength ?? 0}
              </span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
