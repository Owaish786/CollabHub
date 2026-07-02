import { resolveMongoUri } from "@/lib/config";

export interface AuthRuntimeStatus {
  ok: boolean;
  warnings: string[];
  googleEnabled: boolean;
  usingLocalMongoFallback: boolean;
}

export function getAuthRuntimeStatus(): AuthRuntimeStatus {
  const warnings: string[] = [];
  const mongo = resolveMongoUri();

  if (mongo.warning) {
    warnings.push(mongo.warning);
  }

  if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
    warnings.push("Missing AUTH_SECRET or NEXTAUTH_SECRET.");
  }

  return {
    ok: true,
    warnings,
    googleEnabled:
      Boolean(process.env.GOOGLE_CLIENT_ID) &&
      Boolean(process.env.GOOGLE_CLIENT_SECRET),
    usingLocalMongoFallback: mongo.usingFallback,
  };
}