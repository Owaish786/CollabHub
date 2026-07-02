import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { resolveMongoUri } from "@/lib/config";
import mongoose from "mongoose";

/**
 * GET /api/auth/status
 * Returns the current MongoDB connection state and URI source.
 * Useful for debugging connection issues in dev.
 */
export async function GET() {
  const { uri, usingFallback, warning } = resolveMongoUri();

  let connected = false;
  let error: string | null = null;

  try {
    await dbConnect();
    connected = mongoose.connection.readyState === 1;
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown connection error";
  }

  const stateMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return NextResponse.json({
    status: connected ? "ok" : "error",
    mongo: {
      state: stateMap[mongoose.connection.readyState] ?? "unknown",
      readyState: mongoose.connection.readyState,
      usingFallback: usingFallback ?? false,
      host: usingFallback ? "localhost:27017" : new URL(uri.replace("mongodb+srv://", "https://")).hostname,
    },
    warning: warning ?? null,
    error,
  });
}