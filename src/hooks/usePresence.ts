"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { usePathname } from "next/navigation";

export interface PresenceUser {
  socketId: string;
  id: string;
  name: string;
  email?: string;
  image?: string;
  color: string;
  page: string;
  cursor: { x: number; y: number } | null;
  lastSeen: number;
}

// Generate a consistent color for a user based on their id
const USER_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#06b6d4",
];

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

interface UsePresenceOptions {
  workspaceId: string;
  user: {
    id: string;
    name: string;
    email?: string;
    image?: string;
  } | null;
}

export interface CursorData {
  x: number;
  y: number;
  name: string;
  color: string;
}

export function usePresence({ workspaceId, user }: UsePresenceOptions) {
  const { socket, isConnected } = useSocket();
  const pathname = usePathname();
  const [peers, setPeers] = useState<PresenceUser[]>([]);
  
  // Use a ref for cursors — high-frequency updates that should NOT trigger React re-renders
  const cursorsRef = useRef<Map<string, CursorData>>(new Map());
  // A version counter to let CursorOverlay know when to repaint via requestAnimationFrame
  const cursorVersionRef = useRef(0);
  
  const joinedRef = useRef(false);

  const userStringified = JSON.stringify(user);

  // Join workspace with identity
  useEffect(() => {
    if (!socket || !isConnected || !user || !workspaceId) return;
    if (joinedRef.current) return;

    socket.emit("join-workspace", {
      workspaceId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        color: getUserColor(user.id),
        page: pathname,
      },
    });
    joinedRef.current = true;

    return () => {
      socket.emit("leave-workspace", workspaceId);
      joinedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, userStringified, workspaceId]);

  // Track page changes
  useEffect(() => {
    if (!socket || !isConnected || !workspaceId || !joinedRef.current) return;
    socket.emit("page-update", { workspaceId, page: pathname });
  }, [socket, isConnected, workspaceId, pathname]);

  // Listen for presence updates
  useEffect(() => {
    if (!socket) return;

    const handlePresence = (presenceList: PresenceUser[]) => {
      // Filter out self
      const others = presenceList.filter((p) => p.socketId !== socket.id);
      setPeers(others);
    };

    socket.on("presence-update", handlePresence);
    return () => {
      socket.off("presence-update", handlePresence);
    };
  }, [socket]);

  // Listen for cursor updates — write to ref, not state
  const peersRef = useRef<PresenceUser[]>([]);
  peersRef.current = peers;

  useEffect(() => {
    if (!socket) return;

    const handleCursor = (data: { socketId: string; x: number; y: number }) => {
      const peer = peersRef.current.find((p) => p.socketId === data.socketId);
      cursorsRef.current.set(data.socketId, {
        x: data.x,
        y: data.y,
        name: peer?.name ?? "Unknown",
        color: peer?.color ?? "#6366f1",
      });
      cursorVersionRef.current++;
    };

    socket.on("cursor-update", handleCursor);
    return () => {
      socket.off("cursor-update", handleCursor);
    };
  }, [socket]);

  // Broadcast own cursor movement (throttled)
  const lastEmitRef = useRef(0);
  const broadcastCursor = useCallback(
    (x: number, y: number) => {
      if (!socket || !isConnected || !workspaceId) return;
      const now = Date.now();
      if (now - lastEmitRef.current < 50) return; // 20fps max
      lastEmitRef.current = now;
      socket.emit("cursor-move", { workspaceId, x, y });
    },
    [socket, isConnected, workspaceId]
  );

  return { peers, cursorsRef, cursorVersionRef, broadcastCursor };
}
