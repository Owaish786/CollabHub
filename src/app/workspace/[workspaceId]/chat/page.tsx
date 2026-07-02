"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Hash, Send, Loader2, SmilePlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  content: string;
  sender: { id: string; name: string };
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fetchMessages = useCallback(async (ch: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/chat?workspaceId=${params.workspaceId}&channel=${ch}&limit=50`
      );
      const data = await res.json();
      if (data.success) setMessages((data.data as Message[]).reverse());
    } finally {
      setLoading(false);
    }
  }, [params.workspaceId]);

  useEffect(() => { void fetchMessages(channel); }, [channel, fetchMessages]);

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
      if (data.success) setMessages((prev) => [...prev, data.data as Message]);
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

  // Group messages by sender + time proximity
  const grouped = messages.reduce<Array<Message & { showAvatar: boolean }>>(
    (acc, msg, i) => {
      const prev = messages[i - 1];
      const showAvatar =
        !prev ||
        prev.sender.id !== msg.sender.id ||
        new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000;
      acc.push({ ...msg, showAvatar });
      return acc;
    },
    []
  );

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
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-5 py-4">
          <Hash className="h-5 w-5 text-slate-400" />
          <h1 className="text-base font-semibold text-slate-900">{channel}</h1>
        </div>

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
              const isMe = msg.sender.id === session?.user?.id;
              return (
                <div key={msg.id} className={cn("flex items-start gap-3", msg.showAvatar ? "mt-4" : "mt-0.5")}>
                  {msg.showAvatar ? (
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
                      isMe ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
                    )}>
                      {msg.sender.name?.[0]?.toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-8 shrink-0" />
                  )}
                  <div className="min-w-0">
                    {msg.showAvatar && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-semibold text-slate-800">{msg.sender.name}</span>
                        <span className="text-[11px] text-slate-400">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed text-slate-700 break-words">{msg.content}</p>
                  </div>
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
