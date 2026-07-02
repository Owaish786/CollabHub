"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { SocketProvider } from "@/components/providers/SocketProvider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SocketProvider>{children}</SocketProvider>
    </SessionProvider>
  );
}
