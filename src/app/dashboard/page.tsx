import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Workspace from "@/models/Workspace";
import { CreateWorkspaceForm } from "@/components/features/workspace/create-workspace-form";
import { SignOutButton } from "@/components/features/auth/sign-out-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  FileText,
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
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

  return (
    <div className="mesh-gradient min-h-screen">
      {/* Top Bar */}
      <header className="glass fixed top-0 z-50 w-full">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">C</span>
            </div>
            <span className="text-lg font-bold">
              Collab<span className="gradient-text">Hub</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Welcome, {session.user.name}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
              {session.user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        <div className="animate-fade-up">
          <h1 className="text-3xl font-bold">
            Good {getTimeOfDay()},{" "}
            <span className="gradient-text">
              {session.user.name?.split(" ")[0]}
            </span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Here&apos;s what&apos;s happening in your workspaces.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-up mt-8" style={{ animationDelay: "0.1s" }}>
          <CreateWorkspaceForm />
        </div>

        {/* Empty State */}
        <div
          className="animate-fade-up mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          style={{ animationDelay: "0.2s" }}
        >
          {[
            {
              icon: LayoutDashboard,
              title: "Kanban Boards",
              desc: "Drag & drop task boards",
              color: "from-violet-500 to-purple-500",
            },
            {
              icon: FileText,
              title: "Documents",
              desc: "Collaborative editing",
              color: "from-blue-500 to-indigo-500",
            },
            {
              icon: CheckSquare,
              title: "Tasks",
              desc: "Track & assign work",
              color: "from-pink-500 to-rose-500",
            },
            {
              icon: MessageSquare,
              title: "Chat",
              desc: "Real-time messaging",
              color: "from-emerald-500 to-teal-500",
            },
          ].map((item) => (
            <Card
              key={item.title}
              className="glass-card group cursor-pointer border-0 transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader className="pb-3">
                <div
                  className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color}`}
                >
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workspace list */}
        <div className="animate-fade-up mt-12" style={{ animationDelay: "0.3s" }}>
          <h2 className="mb-4 text-xl font-semibold">Your Workspaces</h2>
          {workspaces.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center rounded-2xl p-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">No workspaces yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first workspace to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {workspaces.map((workspace) => {
                const isOwner = workspace.owner.toString() === session.user.id;

                return (
                  <Link key={workspace._id.toString()} href={`/workspace/${workspace._id.toString()}`}>
                    <Card className="glass-card border-0 transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <LayoutDashboard className="h-5 w-5" />
                          </div>
                          <span className="rounded-full border border-border/50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {isOwner ? "Owner" : "Member"}
                          </span>
                        </div>
                        <CardTitle className="text-base">{workspace.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          {workspace.description || "No description yet."}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{workspace.members.length} team members</span>
                          <span>{workspace.slug}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
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
