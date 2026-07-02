import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/shared/Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CollabHub — Real-Time Collaborative Team Workspace",
    template: "%s | CollabHub",
  },
  description:
    "Real-time collaborative documents, Kanban boards, task management, and live chat — all in one beautifully crafted workspace powered by AI.",
  keywords: [
    "collaboration",
    "real-time",
    "team workspace",
    "kanban",
    "task management",
    "live chat",
    "AI assistant",
  ],
  openGraph: {
    title: "CollabHub — Real-Time Collaborative Team Workspace",
    description:
      "Real-time collaborative documents, Kanban boards, task management, and live chat — all in one workspace.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          {children}
          <Toaster richColors position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
