"use client";

import { useEffect, useRef, useState } from "react";
import type { CursorData } from "@/hooks/usePresence";

interface CursorOverlayProps {
  cursorsRef: React.RefObject<Map<string, CursorData>>;
  cursorVersionRef: React.RefObject<number>;
}

/** Smooth-interpolated cursor with a name label that fades in/out. */
function AnimatedCursor({
  targetX,
  targetY,
  name,
  color,
}: {
  targetX: number;
  targetY: number;
  name: string;
  color: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: targetX, y: targetY });
  const animFrameRef = useRef<number>(0);
  const [visible, setVisible] = useState(false);

  // Animate toward the target using lerp
  useEffect(() => {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      posRef.current.x = lerp(posRef.current.x, targetX, 0.15);
      posRef.current.y = lerp(posRef.current.y, targetY, 0.15);

      if (ref.current) {
        ref.current.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [targetX, targetY]);

  // Fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed top-0 left-0 pointer-events-none z-[9999] transition-opacity duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translate(${targetX}px, ${targetY}px)`,
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.25))" }}
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19807L11.7841 12.3673H5.65376Z"
          fill={color}
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      {/* Name label */}
      <div
        className="absolute left-4 top-4 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-lg"
        style={{
          backgroundColor: color,
          boxShadow: `0 2px 8px ${color}44`,
        }}
      >
        {name}
      </div>
    </div>
  );
}

export function CursorOverlay({ cursorsRef, cursorVersionRef }: CursorOverlayProps) {
  // Use requestAnimationFrame to read cursor data from the ref without triggering React state updates
  const [cursorEntries, setCursorEntries] = useState<[string, CursorData][]>([]);
  const lastVersionRef = useRef(0);

  useEffect(() => {
    let rafId: number;

    const sync = () => {
      if (cursorVersionRef.current !== lastVersionRef.current) {
        lastVersionRef.current = cursorVersionRef.current;
        setCursorEntries(Array.from(cursorsRef.current.entries()));
      }
      rafId = requestAnimationFrame(sync);
    };

    rafId = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(rafId);
  }, [cursorsRef, cursorVersionRef]);

  if (cursorEntries.length === 0) return null;

  return (
    <>
      {cursorEntries.map(([socketId, cursor]) => (
        <AnimatedCursor
          key={socketId}
          targetX={cursor.x}
          targetY={cursor.y}
          name={cursor.name}
          color={cursor.color}
        />
      ))}
    </>
  );
}
