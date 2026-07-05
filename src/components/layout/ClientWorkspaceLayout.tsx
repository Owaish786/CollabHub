"use client";

import { useState } from "react";
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";
import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  workspaceId: string;
  ws: {
    _id: { toString(): string };
    name: string;
    description?: string;
    settings?: { color?: string };
  };
  userName: string;
  userEmail: string;
}

export function ClientWorkspaceLayout({ children, workspaceId, ws, userName, userEmail }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">
      {/* Mobile header */}
      <div className="md:hidden absolute top-0 left-0 w-full h-14 bg-white border-b border-slate-200 z-40 flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: ws.settings?.color ?? "#6366f1" }}
          >
            {ws.name[0]?.toUpperCase()}
          </div>
          <span className="font-semibold text-slate-800 truncate max-w-[200px]">{ws.name}</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar overlay for mobile */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/20 z-30 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <WorkspaceSidebar
          workspaceId={workspaceId}
          workspaceName={ws.name}
          workspaceColor={ws.settings?.color ?? "#6366f1"}
          userName={userName}
          userEmail={userEmail}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
      </div>

      <main className="flex-1 overflow-y-auto md:pt-0 pt-14 w-full relative">{children}</main>
    </div>
  );
}
