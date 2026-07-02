"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, getProviders } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  Check,
  X,
} from "lucide-react";

function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(() => {
    return [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "One uppercase letter", met: /[A-Z]/.test(password) },
      { label: "One lowercase letter", met: /[a-z]/.test(password) },
      { label: "One number", met: /\d/.test(password) },
    ];
  }, [password]);

  const strength = checks.filter((c) => c.met).length;
  const strengthPercent = (strength / checks.length) * 100;
  const strengthColor =
    strength <= 1
      ? "bg-destructive"
      : strength <= 2
        ? "bg-warning"
        : strength <= 3
          ? "bg-info"
          : "bg-success";

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      {/* Strength bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${strengthColor}`}
          style={{ width: `${strengthPercent}%` }}
        />
      </div>

      {/* Requirements */}
      <div className="grid grid-cols-2 gap-1">
        {checks.map((check) => (
          <div
            key={check.label}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              check.met ? "text-success" : "text-muted-foreground"
            }`}
          >
            {check.met ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            {check.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [hasGoogleProvider, setHasGoogleProvider] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [hasGithubProvider, setHasGithubProvider] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadProviders = async () => {
      const providers = await getProviders();
      if (!mounted) return;
      setHasGoogleProvider(Boolean(providers?.google));
      setHasGithubProvider(Boolean(providers?.github));
    };
    void loadProviders();
    return () => { mounted = false; };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Failed to sign in with Google");
      setIsGoogleLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setIsGithubLoading(true);
    try {
      await signIn("github", { callbackUrl: "/dashboard" });
    } catch {
      setError("Failed to sign in with GitHub");
      setIsGithubLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login?registered=true");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — Brand panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-indigo-600 p-12 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-indigo-500/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-violet-600/40 blur-3xl" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <span className="text-base font-bold text-white">C</span>
          </div>
          <span className="text-xl font-semibold text-white">CollabHub</span>
        </div>

        <div className="relative z-10 my-8">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop&crop=center"
            alt="Team working together"
            className="w-full rounded-2xl object-cover shadow-2xl ring-1 ring-white/10"
            width={600} height={400}
          />
        </div>

        <div className="relative z-10">
          <p className="text-2xl font-semibold leading-tight text-white">
            &ldquo;One workspace for everything your team builds together.&rdquo;
          </p>
          <p className="mt-3 text-sm text-indigo-200">Documents · Tasks · Chat · AI — all in one place.</p>
        </div>
      </div>

      {/* Right — Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        <div className="animate-fade-up w-full max-w-sm">

          {/* Logo */}
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
                <span className="text-base font-bold text-white">C</span>
              </div>
              <span className="text-xl font-semibold tracking-tight text-slate-900">
                Collab<span className="text-indigo-600">Hub</span>
              </span>
            </Link>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">Create your account</h1>
            <p className="mt-1.5 text-sm text-slate-500">Start collaborating with your team today</p>
          </div>

          <div className="space-y-3 mb-5">
            {hasGoogleProvider && (
              <Button
                variant="outline"
                className="w-full gap-2.5 border-slate-200 bg-white py-5 text-slate-700 shadow-soft transition-all hover:bg-slate-50 hover:border-slate-300 font-medium"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isGithubLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Continue with Google
              </Button>
            )}

            {hasGithubProvider && (
              <Button
                variant="outline"
                className="w-full gap-2.5 border-slate-200 bg-white py-5 text-slate-700 shadow-soft transition-all hover:bg-slate-50 hover:border-slate-300 font-medium"
                onClick={handleGithubSignIn}
                disabled={isGoogleLoading || isGithubLoading || isLoading}
              >
                {isGithubLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                  </svg>
                )}
                Continue with GitHub
              </Button>
            )}
          </div>

          {(hasGoogleProvider || hasGithubProvider) && (
            <div className="divider-text mb-5">or create with email</div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
              <div className="relative">
                <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="name" type="text" placeholder="John Doe" value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 border-slate-200 bg-white focus:border-indigo-400"
                  required disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="email" type="email" placeholder="you@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-slate-200 bg-white focus:border-indigo-400"
                  required disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10 border-slate-200 bg-white focus:border-indigo-400"
                  required disabled={isLoading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10 pl-10 border-slate-200 bg-white focus:border-indigo-400"
                  required disabled={isLoading} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-600">Passwords don&apos;t match</p>
              )}
            </div>

            <Button type="submit"
              className="btn-primary-glow w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 font-semibold mt-2"
              disabled={isLoading || isGoogleLoading || isGithubLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
