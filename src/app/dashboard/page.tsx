import "./dashboard.css";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Workspace from "@/models/Workspace";
import { CreateWorkspaceForm } from "@/components/features/workspace/create-workspace-form";
import { SignOutButton } from "@/components/features/auth/sign-out-button";
import {
  Plus,
  FileText,
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  Users,
  ArrowRight,
  Zap,
  HardDrive,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  await dbConnect();

  const workspaces = await Workspace.find({
    $or: [
      { owner: session.user.id },
      { "members.user": session.user.id },
    ],
  })
    .sort({ updatedAt: -1 })
    .limit(6);

  const firstName = session.user.name?.split(" ")[0] || "there";

  const features = [
    {
      icon: LayoutDashboard,
      title: "Kanban Boards",
      desc: "Visual drag-and-drop task management with real-time sync across your team.",
      color: "var(--feature-violet)",
      colorBg: "var(--feature-violet-bg)",
    },
    {
      icon: FileText,
      title: "Live Documents",
      desc: "Collaborative rich-text editing with presence indicators and version history.",
      color: "var(--feature-blue)",
      colorBg: "var(--feature-blue-bg)",
    },
    {
      icon: CheckSquare,
      title: "Smart Tasks",
      desc: "AI-powered task breakdown, assignments, priorities, and deadline tracking.",
      color: "var(--feature-rose)",
      colorBg: "var(--feature-rose-bg)",
    },
    {
      icon: MessageSquare,
      title: "Team Chat",
      desc: "Real-time workspace messaging with channels and threaded conversations.",
      color: "var(--feature-emerald)",
      colorBg: "var(--feature-emerald-bg)",
    },
    {
      icon: HardDrive,
      title: "Cloud Drive",
      desc: "Securely upload, organize, and share files with your team via AWS S3.",
      color: "var(--feature-amber)",
      colorBg: "var(--feature-amber-bg)",
    },
    {
      icon: Zap,
      title: "Ghost AI",
      desc: "AI project manager that auto-generates tasks, digests, and insights for you.",
      color: "var(--feature-cyan)",
      colorBg: "var(--feature-cyan-bg)",
    },
  ];

  const workspaceColors = [
    "var(--feature-violet)",
    "var(--feature-blue)",
    "var(--feature-rose)",
    "var(--feature-emerald)",
    "var(--feature-amber)",
    "var(--feature-cyan)",
  ];

  return (
    <div className="dashboard-page">
      {/* ── Ambient background ── */}
      <div className="dashboard-bg" aria-hidden="true">
        <div className="dashboard-bg__orb dashboard-bg__orb--1" />
        <div className="dashboard-bg__orb dashboard-bg__orb--2" />
        <div className="dashboard-bg__orb dashboard-bg__orb--3" />
      </div>

      {/* ── Header ── */}
      <header className="dashboard-header">
        <div className="dashboard-header__inner">
          <Link href="/dashboard" className="dashboard-logo">
            <div className="dashboard-logo__icon">
              <span>C</span>
            </div>
            <span className="dashboard-logo__text">
              Collab<span className="gradient-text">Hub</span>
            </span>
          </Link>

          <div className="dashboard-header__right">
            <Link href="/profile" className="dashboard-profile-link">
              <div className="dashboard-avatar">
                {session.user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span className="dashboard-username">{session.user.name}</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="dashboard-main">

        {/* Hero greeting */}
        <section className="dashboard-hero">
          <div className="dashboard-hero__badge">
            <Zap className="dashboard-hero__badge-icon" />
            <span>Dashboard</span>
          </div>
          <h1 className="dashboard-hero__title">
            Good {getTimeOfDay()}, <span className="gradient-text">{firstName}</span>
          </h1>
          <p className="dashboard-hero__subtitle">
            Here&apos;s an overview of your workspaces and tools. Jump in and start collaborating.
          </p>
        </section>

        {/* Quick workspace creation */}
        <section className="dashboard-section" style={{ animationDelay: "0.1s" }}>
          <CreateWorkspaceForm />
        </section>

        {/* Feature cards */}
        <section className="dashboard-section" style={{ animationDelay: "0.15s" }}>
          <div className="dashboard-section__header">
            <h2 className="dashboard-section__title">Platform Features</h2>
            <p className="dashboard-section__subtitle">Everything your team needs in one place</p>
          </div>
          <div className="dashboard-features-grid">
            {features.map((item) => (
              <div key={item.title} className="dashboard-feature-card">
                <div
                  className="dashboard-feature-card__icon"
                  style={{
                    background: item.colorBg,
                    color: item.color,
                  }}
                >
                  <item.icon style={{ width: 20, height: 20 }} />
                </div>
                <div className="dashboard-feature-card__content">
                  <h3 className="dashboard-feature-card__title">{item.title}</h3>
                  <p className="dashboard-feature-card__desc">{item.desc}</p>
                </div>
                <div
                  className="dashboard-feature-card__accent"
                  style={{ background: item.color }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Workspace list */}
        <section className="dashboard-section" style={{ animationDelay: "0.2s" }}>
          <div className="dashboard-section__header">
            <h2 className="dashboard-section__title">Your Workspaces</h2>
            <p className="dashboard-section__subtitle">
              {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
            </p>
          </div>

          {workspaces.length === 0 ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty__icon">
                <Plus style={{ width: 32, height: 32 }} />
              </div>
              <h3 className="dashboard-empty__title">No workspaces yet</h3>
              <p className="dashboard-empty__desc">
                Create your first workspace above to start collaborating with your team.
              </p>
            </div>
          ) : (
            <div className="dashboard-workspaces-grid">
              {workspaces.map((workspace, idx) => {
                const isOwner = workspace.owner.toString() === session.user.id;
                const accentColor = workspaceColors[idx % workspaceColors.length];

                return (
                  <Link
                    key={workspace._id.toString()}
                    href={`/workspace/${workspace._id.toString()}`}
                    className="dashboard-workspace-card"
                  >
                    <div className="dashboard-workspace-card__top">
                      <div
                        className="dashboard-workspace-card__icon"
                        style={{ background: accentColor }}
                      >
                        <LayoutDashboard style={{ width: 18, height: 18, color: "#fff" }} />
                      </div>
                      <span
                        className={`dashboard-workspace-card__badge ${
                          isOwner
                            ? "dashboard-workspace-card__badge--owner"
                            : "dashboard-workspace-card__badge--member"
                        }`}
                      >
                        {isOwner ? "Owner" : "Member"}
                      </span>
                    </div>

                    <h3 className="dashboard-workspace-card__name">{workspace.name}</h3>
                    <p className="dashboard-workspace-card__desc">
                      {workspace.description || "No description yet."}
                    </p>

                    <div className="dashboard-workspace-card__footer">
                      <div className="dashboard-workspace-card__members">
                        <Users style={{ width: 14, height: 14 }} />
                        <span>{workspace.members.length} members</span>
                      </div>
                      <div className="dashboard-workspace-card__arrow">
                        <ArrowRight style={{ width: 16, height: 16 }} />
                      </div>
                    </div>

                    <div
                      className="dashboard-workspace-card__glow"
                      style={{ background: accentColor }}
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
