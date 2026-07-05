"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { InviteMembersModal } from "@/components/features/workspace/invite-members-modal";

interface Props {
  workspaceId: string;
  workspaceName: string;
  workspaceColor: string;
  userName: string;
  userEmail: string;
  onCloseMobile?: () => void;
}

const navItems = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function WorkspaceSidebar({
  workspaceId,
  workspaceName,
  workspaceColor,
  userName,
  userEmail,
  onCloseMobile,
}: Props) {
  const pathname = usePathname();
  const base = `/workspace/${workspaceId}`;

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      {/* Workspace header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: workspaceColor }}
          >
            {workspaceName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-900">
              {workspaceName}
            </p>
            <p className="text-[11px] text-slate-400">Workspace</p>
          </div>
        </div>
        
        <div className="px-1">
          <InviteMembersModal workspaceId={workspaceId} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const href = `${base}${item.href}`;
          const isActive =
            item.href === ""
              ? pathname === base
              : pathname.startsWith(href);

          return (
            <Link
              key={item.label}
              href={href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon
                className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-600" : "text-slate-400")}
              />
              {item.label}
            </Link>
          );
        })}

        {/* Chat channels */}
        <div className="mt-4 px-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Channels
          </p>
          {["general", "announcements", "random"].map((channel) => (
            <Link
              key={channel}
              href={`${base}/chat?channel=${channel}`}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Hash className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {channel}
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom: user + back */}
      <div className="border-t border-slate-200 p-3 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          All workspaces
        </Link>

        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
            {userName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-slate-700">{userName}</p>
            <p className="truncate text-[11px] text-slate-400">{userEmail}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
