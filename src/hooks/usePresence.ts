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

export function usePresence({ workspaceId, user }: UsePresenceOptions) {
  const { socket, isConnected } = useSocket();
  const pathname = usePathname();
  const [peers, setPeers] = useState<PresenceUser[]>([]);
  const [cursors, setCursors] = useState<Map<string, { x: number; y: number; name: string; color: string }>>(new Map());
  const joinedRef = useRef(false);

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
  }, [socket, isConnected, user, workspaceId, pathname]);

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

  // Listen for cursor updates
  useEffect(() => {
    if (!socket) return;

    const handleCursor = (data: { socketId: string; x: number; y: number }) => {
      setCursors((prev) => {
        const next = new Map(prev);
        // Find the peer to get name and color
        const peer = peers.find((p) => p.socketId === data.socketId);
        next.set(data.socketId, {
          x: data.x,
          y: data.y,
          name: peer?.name ?? "Unknown",
          color: peer?.color ?? "#6366f1",
        });
        return next;
      });
    };

    socket.on("cursor-update", handleCursor);
    return () => {
      socket.off("cursor-update", handleCursor);
    };
  }, [socket, peers]);

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

  return { peers, cursors, broadcastCursor };
}
