import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  LayoutDashboard,
  MessageSquare,
  CheckSquare,
  Sparkles,
  Shield,
  Users,
  ArrowRight,
  Zap,
  Globe,
  Lock,
  Check,
  Star,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Real-Time Documents",
    description:
      "Collaborate on documents simultaneously with live cursors, instant updates, and conflict-free editing powered by CRDTs.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    accent: "from-blue-500 to-indigo-500",
  },
  {
    icon: LayoutDashboard,
    title: "Kanban Boards",
    description:
      "Drag-and-drop task boards that update in real-time. Organize your workflow with customizable columns and swimlanes.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    accent: "from-violet-500 to-purple-500",
  },
  {
    icon: CheckSquare,
    title: "Task Management",
    description:
      "Track tasks with priorities, deadlines, and assignments. Filter and sort across your entire workspace effortlessly.",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    accent: "from-rose-500 to-pink-500",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    description:
      "Instant messaging with channels, reactions, and file sharing. Stay connected with your team in real time.",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    accent: "from-orange-500 to-amber-500",
  },
  {
    icon: Sparkles,
    title: "AI Assistant",
    description:
      "Powered by Google Gemini — summarize documents, generate tasks from meeting notes, and unlock smart suggestions.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description:
      "Fine-grained permissions with owner, admin, member, and guest roles. Keep your workspace secure and organized.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    accent: "from-indigo-500 to-blue-500",
  },
];

const techStack = [
  { name: "Next.js 16+", desc: "App Router + RSC", emoji: "▲" },
  { name: "MongoDB Atlas", desc: "Cloud Database", emoji: "🍃" },
  { name: "Tailwind + shadcn", desc: "Premium UI", emoji: "✦" },
  { name: "NextAuth.js v5", desc: "Auth + OAuth", emoji: "🔐" },
  { name: "Socket.io + Yjs", desc: "Real-Time Engine", emoji: "⚡" },
  { name: "AWS S3", desc: "File Storage", emoji: "☁️" },
  { name: "Google Gemini", desc: "AI Assistant", emoji: "✨" },
  { name: "GitHub Actions", desc: "CI/CD Pipeline", emoji: "🔄" },
];

const testimonials = [
  {
    quote: "CollabHub replaced three separate tools for our team. Everything we need is in one place.",
    name: "Sarah Chen",
    role: "Engineering Lead",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face",
  },
  {
    quote: "The real-time collaboration is incredibly smooth. No conflicts, no lost work.",
    name: "Marcus Johnson",
    role: "Product Manager",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
  },
  {
    quote: "AI-powered task generation from meeting notes alone saved us 2 hours per week.",
    name: "Priya Patel",
    role: "Team Lead",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
  },
];

const stats = [
  { value: "10×", label: "Faster team sync" },
  { value: "CRDT", label: "Conflict-free edits" },
  { value: "E2E", label: "Type-safe APIs" },
  { value: "AWS", label: "Cloud-native infra" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* ── Navigation ── */}
      <nav className="nav-frosted fixed top-0 z-50 w-full">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm transition-transform group-hover:scale-105">
              <span className="text-sm font-bold text-white">C</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-slate-900">
              Collab<span className="text-indigo-600">Hub</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-7 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
              Features
            </a>
            <a href="#tech" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
              Tech Stack
            </a>
            <a href="#testimonials" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
              Reviews
            </a>
          </div>

          {/* CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="btn-primary-glow bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 shadow-sm">
                Get Started
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-600 font-medium">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium">Start free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero-bg relative overflow-hidden pt-28 pb-20 md:pt-40 md:pb-28">
        {/* Dot grid */}
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" />

        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="pointer-events-none absolute top-60 -left-20 h-[400px] w-[400px] rounded-full bg-violet-100/50 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          {/* Badge */}
          <div className="animate-fade-up mb-7 inline-flex items-center gap-2 pill" style={{ animationDelay: "0s" }}>
            <Zap className="h-3 w-3" />
            Powered by MongoDB Atlas &amp; Google Gemini
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up mx-auto max-w-4xl text-balance text-5xl font-bold leading-[1.1] tracking-[-0.03em] text-slate-900 md:text-6xl lg:text-7xl"
            style={{ animationDelay: "0.08s" }}
          >
            Your team&apos;s<br />
            <span className="gradient-text">command center</span>
          </h1>

          <p
            className="animate-fade-up mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-slate-500 md:text-xl"
            style={{ animationDelay: "0.16s" }}
          >
            Real-time collaborative documents, Kanban boards, task management,
            and live chat — all in one beautifully designed workspace.
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-up mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "0.24s" }}
          >
            <Link href="/register">
              <Button
                size="lg"
                className="btn-primary-glow bg-indigo-600 hover:bg-indigo-700 text-white gap-2 px-8 py-6 text-[15px] font-semibold shadow-md"
              >
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 px-8 py-6 text-[15px] font-medium border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              >
                See all features
              </Button>
            </Link>
          </div>

          {/* Trust line */}
          <p className="animate-fade-up mt-6 text-sm text-slate-400" style={{ animationDelay: "0.32s" }}>
            No credit card required · Free forever for small teams
          </p>
        </div>

        {/* Hero dashboard mockup — real Unsplash photo */}
        <div className="animate-fade-up relative z-10 mx-auto mt-16 max-w-5xl px-6" style={{ animationDelay: "0.4s" }}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-strong">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <div className="mx-4 flex-1 rounded-md bg-white border border-slate-200 px-3 py-1 text-xs text-slate-400 max-w-xs">
                app.collabhub.dev/dashboard
              </div>
            </div>
            {/* Dashboard screenshot via Unsplash */}
            <img
              src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&h=600&fit=crop&crop=center"
              alt="CollabHub collaborative dashboard with real-time team workspace"
              className="w-full object-cover"
              width={1200}
              height={600}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="animate-fade-up relative z-10 mx-auto mt-12 max-w-3xl px-6" style={{ animationDelay: "0.5s" }}>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-soft">
                <div className="text-xl font-bold text-indigo-600">{stat.value}</div>
                <div className="mt-0.5 text-xs font-medium text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative bg-slate-50 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="pill mb-5 inline-flex items-center gap-2">
              <Globe className="h-3 w-3" />
              Everything in one workspace
            </div>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Built for how modern teams{" "}
              <span className="gradient-text">actually work</span>
            </h2>
            <p className="mt-4 text-pretty text-slate-500">
              A comprehensive suite of collaboration tools with the performance
              and polish your team deserves.
            </p>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="card-feature group"
                style={{ animationDelay: `${index * 0.07}s` }}
              >
                {/* Top accent bar */}
                <div className={`gradient-line absolute top-0 left-0 bg-gradient-to-r ${feature.accent} group-hover:opacity-100`} />

                <div className={`icon-box mb-4 ${feature.bg} border ${feature.border}`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>

                <h3 className="mb-2 text-[15px] font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{feature.description}</p>

                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  Learn more <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof / Testimonials ── */}
      <section id="testimonials" className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-xl text-center">
            <div className="pill mb-5 inline-flex items-center gap-2">
              <Star className="h-3 w-3" />
              Loved by teams worldwide
            </div>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              What teams are saying
            </h2>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="card-professional p-6">
                <div className="mb-4 flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-slate-700">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-100"
                    width={36}
                    height={36}
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section id="tech" className="bg-slate-50 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
            <div className="grid gap-0 md:grid-cols-2">
              {/* Left — copy */}
              <div className="p-10 md:p-14">
                <div className="pill mb-5 inline-flex items-center gap-2">
                  <Lock className="h-3 w-3" />
                  Cloud Architecture
                </div>
                <h2 className="text-balance text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  Built for scale.{" "}
                  <span className="gradient-text">Powered by AWS.</span>
                </h2>
                <p className="mt-4 text-slate-500">
                  Enterprise-grade infrastructure with auto-scaling, CI/CD
                  pipelines, and real-time WebSocket connections.
                </p>

                <ul className="mt-6 space-y-2.5">
                  {[
                    "99.9% uptime SLA via AWS infrastructure",
                    "End-to-end TypeScript for zero runtime surprises",
                    "CRDT-based real-time sync — no data loss ever",
                    "Automatic MongoDB Atlas backups",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right — tech grid */}
              <div className="border-t border-slate-200 bg-slate-50 p-10 md:border-t-0 md:border-l md:p-14">
                <div className="grid grid-cols-2 gap-3">
                  {techStack.map((tech) => (
                    <div
                      key={tech.name}
                      className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-soft"
                    >
                      <div className="mb-1.5 text-lg leading-none">{tech.emoji}</div>
                      <div className="text-sm font-semibold text-slate-800">{tech.name}</div>
                      <div className="mt-0.5 text-xs text-slate-400">{tech.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-indigo-600 py-24 md:py-28">
        {/* Background pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-500/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-[400px] w-[400px] rounded-full bg-violet-600/30 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-white md:text-5xl">
            Ready to build something{" "}
            <span className="text-indigo-200">together?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-indigo-200">
            Join your team on CollabHub and experience the future of
            collaborative work. Free to start, powerful to scale.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register">
              <Button
                size="lg"
                className="gap-2 bg-white px-8 py-6 text-[15px] font-semibold text-indigo-700 shadow-soft hover:bg-indigo-50 transition-all"
              >
                <Users className="h-4 w-4" />
                Create your workspace
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="ghost"
                size="lg"
                className="px-8 py-6 text-[15px] font-medium text-indigo-100 hover:bg-indigo-500/30 hover:text-white"
              >
                Sign in instead
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-sm text-indigo-300">No credit card required · Setup in 60 seconds</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600">
              <span className="text-[10px] font-bold text-white">C</span>
            </div>
            <span className="text-sm font-semibold text-slate-800">CollabHub</span>
          </div>
          <p className="text-xs text-slate-400">
            Built with Next.js · MongoDB Atlas · AWS · Google Gemini
          </p>
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 transition-colors">
              GitHub
            </a>
            <a href="#" className="hover:text-slate-700 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-700 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
