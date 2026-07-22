"use client";

import { cn } from "@/lib/utils";
import type { PresenceUser } from "@/hooks/usePresence";
import { Eye, FileText, CheckSquare, MessageSquare, Settings, LayoutDashboard } from "lucide-react";

interface PresenceBarProps {
  peers: PresenceUser[];
}

const PAGE_LABELS: Record<string, { label: string; icon: typeof Eye }> = {
  "/": { label: "Overview", icon: LayoutDashboard },
  "/tasks": { label: "Tasks", icon: CheckSquare },
  "/documents": { label: "Documents", icon: FileText },
  "/chat": { label: "Chat", icon: MessageSquare },
  "/settings": { label: "Settings", icon: Settings },
};

function getPageInfo(page: string) {
  // Match the end of the path to determine the section
  for (const [key, val] of Object.entries(PAGE_LABELS)) {
    if (key === "/" && (page.endsWith(page.split("/workspace/")[1]?.split("/")[1] || "") && !page.includes("/tasks") && !page.includes("/documents") && !page.includes("/chat") && !page.includes("/settings"))) {
      return val;
    }
    if (key !== "/" && page.includes(key)) return val;
  }
  return { label: "Browsing", icon: Eye };
}

export function PresenceBar({ peers }: PresenceBarProps) {
  if (peers.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-200 bg-gradient-to-r from-emerald-50/50 to-transparent">
      {/* Live indicator */}
      <div className="flex items-center gap-1.5 mr-1">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
          Live
        </span>
      </div>

      {/* User avatars */}
      <div className="flex items-center -space-x-1.5">
        {peers.slice(0, 8).map((peer) => {
          const pageInfo = getPageInfo(peer.page);
          const PageIcon = pageInfo.icon;
          return (
            <div key={peer.socketId} className="group relative">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white transition-transform hover:scale-110 hover:z-10 cursor-default"
                )}
                style={{ backgroundColor: peer.color }}
                title={`${peer.name} — ${pageInfo.label}`}
              >
                {peer.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={peer.image}
                    alt={peer.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  peer.name?.[0]?.toUpperCase() ?? "?"
                )}
              </div>
              {/* Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] text-white shadow-lg">
                  <span className="font-semibold">{peer.name}</span>
                  <span className="flex items-center gap-1 mt-0.5 text-slate-300">
                    <PageIcon className="h-3 w-3" />
                    {pageInfo.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {peers.length > 8 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 ring-2 ring-white">
            +{peers.length - 8}
          </div>
        )}
      </div>
    </div>
  );
}
