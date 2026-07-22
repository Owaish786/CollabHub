"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Hash, Send, Loader2, SmilePlus, Bot, BarChart3, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useSocket } from "@/components/providers/SocketProvider";

type Message = {
  id: string;
  content: string;
  sender: { id: string; name: string; email?: string };
  channel: string;
  createdAt: string;
};

const CHANNELS = ["general", "announcements", "random"];
const EMOJI_LIST = ["👍", "❤️", "😂", "🎉", "🔥", "👀", "✅", "🚀"];

export default function ChatPage() {
  const params = useParams<{ workspaceId: string }>();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [channel, setChannel] = useState(searchParams.get("channel") ?? "general");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [ghostLoading, setGhostLoading] = useState(false);
  const [digestLoading, setDigestLoading] = useState(false);
  const [ghostResult, setGhostResult] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { socket, isConnected } = useSocket();

  const fetchMessages = useCallback(async (ch: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/chat?workspaceId=${params.workspaceId}&channel=${ch}&limit=50`
      );
      const data = await res.json();
      if (data.success) setMessages(data.data as Message[]);
    } finally {
      setLoading(false);
    }
  }, [params.workspaceId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchMessages(channel); }, [channel, fetchMessages]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join workspace room
    socket.emit("join-workspace", params.workspaceId);

    // Listen for new messages
    const handleNewMessage = (newMessage: Message) => {
      if (newMessage.channel === channel) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((msg) => msg.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      }
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.emit("leave-workspace", params.workspaceId);
      socket.off("new-message", handleNewMessage);
    };
  }, [socket, isConnected, params.workspaceId, channel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: params.workspaceId, channel, content: text }),
      });
      const data = await res.json();
      if (data.success) {
        const savedMessage = data.data as Message;
        setMessages((prev) => [...prev, savedMessage]);
        
        // Broadcast via Socket.io
        if (socket && isConnected) {
          socket.emit("send-message", {
            workspaceId: params.workspaceId,
            message: savedMessage
          });
        }
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  // Ghost AI — analyze conversation
  const triggerGhostAI = async () => {
    if (ghostLoading) return;
    setGhostLoading(true);
    setGhostResult(null);
    try {
      const res = await fetch("/api/ai/ghost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: params.workspaceId, channel }),
      });
      const data = await res.json();
      if (data.success) {
        const count = data.actions?.length ?? 0;
        setGhostResult(
          count > 0
            ? `🤖 Created ${count} task${count > 1 ? "s" : ""} on your Kanban board!`
            : "🤖 No actionable tasks found in recent conversation."
        );
        // Refresh messages to show the Ghost AI summary message
        await fetchMessages(channel);
      } else {
        setGhostResult(`⚠️ ${data.error || "Failed to analyze"}`);
      }
    } catch {
      setGhostResult("⚠️ Something went wrong.");
    } finally {
      setGhostLoading(false);
      setTimeout(() => setGhostResult(null), 6000);
    }
  };

  // Weekly Digest
  const triggerDigest = async () => {
    if (digestLoading) return;
    setDigestLoading(true);
    try {
      const res = await fetch("/api/ai/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: params.workspaceId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMessages(channel);
      }
    } finally {
      setDigestLoading(false);
    }
  };

  // Group messages by sender + time proximity
  const grouped = messages.reduce<Array<Message & { showAvatar: boolean }>>(
    (acc, msg, i) => {
      const prev = messages[i - 1];
      const showAvatar =
        !prev ||
        (prev.sender.id !== msg.sender.id && prev.sender.email !== msg.sender.email) ||
        new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000;
      acc.push({ ...msg, showAvatar });
      return acc;
    },
    []
  );

  // Detect Ghost AI messages
  const isGhostMessage = (content: string) =>
    content.startsWith("🤖 **Ghost AI**") || content.startsWith("📊 **Weekly Digest");

  return (
    <div className="flex h-full">
      {/* Channel sidebar */}
      <div className="flex w-48 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Channels</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {CHANNELS.map((ch) => (
            <button
              key={ch}
              onClick={() => setChannel(ch)}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors",
                channel === ch
                  ? "bg-indigo-50 font-semibold text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Hash className={cn("h-3.5 w-3.5 shrink-0", channel === ch ? "text-indigo-500" : "text-slate-400")} />
              {ch}
            </button>
          ))}
        </div>

        {/* Ghost AI section */}
        <div className="border-t border-slate-200 p-3 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">
            <Sparkles className="h-3 w-3 inline mr-1" />
            AI Tools
          </p>
          <button
            onClick={() => void triggerGhostAI()}
            disabled={ghostLoading}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors disabled:opacity-50"
          >
            {ghostLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Bot className="h-3.5 w-3.5" />
            )}
            {ghostLoading ? "Analyzing..." : "Ghost AI Scan"}
          </button>
          <button
            onClick={() => void triggerDigest()}
            disabled={digestLoading}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            {digestLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <BarChart3 className="h-3.5 w-3.5" />
            )}
            {digestLoading ? "Generating..." : "Weekly Digest"}
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-slate-400" />
            <h1 className="text-base font-semibold text-slate-900">{channel}</h1>
          </div>
        </div>

        {/* Ghost AI result banner */}
        {ghostResult && (
          <div className="mx-5 mt-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm text-violet-800 animate-in fade-in slide-in-from-top-2 duration-300">
            {ghostResult}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                <Hash className="h-7 w-7 text-indigo-400" />
              </div>
              <p className="mt-3 font-semibold text-slate-700">#{channel}</p>
              <p className="mt-1 text-sm text-slate-400">This is the beginning of #{channel}. Say hello!</p>
            </div>
          ) : (
            grouped.map((msg) => {
              const isMe = msg.sender.id === session?.user?.id || (!!session?.user?.email && msg.sender.email === session?.user?.email);
              const isGhost = isGhostMessage(msg.content);
              
              // Ghost AI messages get a special treatment
              if (isGhost) {
                return (
                  <div key={msg.id} className="my-4 mx-auto max-w-lg">
                    <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600">
                          <Bot className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-[12px] font-bold text-violet-700">Ghost AI</span>
                        <span className="text-[10px] text-slate-400">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={cn("flex items-end gap-2 w-full", isMe ? "justify-end" : "justify-start", msg.showAvatar ? "mt-4" : "mt-1")}>
                  {!isMe && (
                    msg.showAvatar ? (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold bg-slate-200 text-slate-700">
                        {msg.sender.name?.[0]?.toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-8 shrink-0" />
                    )
                  )}
                  <div className={cn("flex flex-col min-w-0 max-w-[75%]", isMe ? "items-end" : "items-start")}>
                    {msg.showAvatar && (
                      <div className={cn("flex items-baseline gap-2 mb-1 px-1", isMe && "flex-row-reverse")}>
                        <span className="text-[12px] font-semibold text-slate-700">{msg.sender.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                    <div className={cn(
                      "rounded-2xl px-4 py-2", 
                      isMe 
                        ? "bg-indigo-600 text-white rounded-br-sm" 
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                    )}>
                      <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                    </div>
                  </div>
                  {isMe && (
                    msg.showAvatar ? (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold bg-indigo-100 text-indigo-700">
                        {msg.sender.name?.[0]?.toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-8 shrink-0" />
                    )
                  )}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="relative flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
            {/* Emoji picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <SmilePlus className="h-5 w-5" />
              </button>
              {showEmoji && (
                <div className="absolute bottom-8 left-0 flex gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-medium">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => { setInput((v) => v + emoji); setShowEmoji(false); }}
                      className="rounded p-1 text-lg hover:bg-slate-100 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${channel}`}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              style={{ maxHeight: "120px" }}
            />

            <button
              onClick={() => void sendMessage()}
              disabled={!input.trim() || sending}
              className={cn(
                "shrink-0 rounded-lg p-1.5 transition-colors",
                input.trim() ? "bg-indigo-600 text-white hover:bg-indigo-700" : "text-slate-300 cursor-not-allowed"
              )}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
