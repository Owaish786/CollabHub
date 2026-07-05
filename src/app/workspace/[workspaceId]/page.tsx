import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import Workspace from "@/models/Workspace";
import Task from "@/models/Task";
import CollabDocument from "@/models/Document";
import Message from "@/models/Message";
import mongoose from "mongoose";
import { CheckSquare, FileText, MessageSquare, Users, ArrowRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceOverviewPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { workspaceId } = await params;
  await dbConnect();

  const [workspace, taskStats, recentDocs, recentMessages] = await Promise.all([
    Workspace.findById(workspaceId).populate("members.user", "name email").lean(),
    Task.aggregate([
      { $match: { workspace: new mongoose.Types.ObjectId(workspaceId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    CollabDocument.find({ workspace: workspaceId })
      .sort({ updatedAt: -1 })
      .limit(4)
      .select("title updatedAt")
      .lean(),
    Message.find({ workspace: workspaceId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("sender", "name")
      .lean(),
  ]);

  if (!workspace) redirect("/dashboard");

  const ws = workspace as {
    name: string;
    description?: string;
    members: Array<{ user: { name?: string; email?: string }; role: string }>;
  };

  const statusMap: Record<string, number> = {};
  for (const s of taskStats) {
    statusMap[s._id as string] = s.count as number;
  }
  const totalTasks = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const doneTasks = statusMap["done"] ?? 0;

  const quickLinks = [
    { href: `/workspace/${workspaceId}/tasks`, label: "Tasks", icon: CheckSquare, color: "bg-rose-50 text-rose-600", count: totalTasks, sub: `${doneTasks} done` },
    { href: `/workspace/${workspaceId}/documents`, label: "Documents", icon: FileText, color: "bg-blue-50 text-blue-600", count: recentDocs.length, sub: "recent" },
    { href: `/workspace/${workspaceId}/chat`, label: "Chat", icon: MessageSquare, color: "bg-emerald-50 text-emerald-600", count: recentMessages.length, sub: "new messages" },
    { href: `/workspace/${workspaceId}/settings`, label: "Members", icon: Users, color: "bg-violet-50 text-violet-600", count: ws.members.length, sub: "in workspace" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{ws.name}</h1>
        {ws.description && (
          <p className="mt-1 text-slate-500">{ws.description}</p>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${link.color}`}>
              <link.icon className="h-5 w-5" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-slate-900">{link.count}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {link.label} · {link.sub}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
              Open <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent documents */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent Documents</h2>
            <Link href={`/workspace/${workspaceId}/documents`} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentDocs.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-400">No documents yet</p>
                <Link href={`/workspace/${workspaceId}/documents`} className="mt-2 inline-block text-xs font-medium text-indigo-600">
                  Create one →
                </Link>
              </div>
            ) : (
              recentDocs.map((doc) => {
                const d = doc as { _id: { toString(): string }; title: string; updatedAt: Date };
                return (
                  <Link
                    key={d._id.toString()}
                    href={`/workspace/${workspaceId}/documents/${d._id.toString()}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="flex-1 truncate text-sm text-slate-700">{d.title}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(d.updatedAt), { addSuffix: true })}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Recent messages */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Recent Messages</h2>
            <Link href={`/workspace/${workspaceId}/chat`} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              Open chat
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentMessages.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-400">No messages yet</p>
                <Link href={`/workspace/${workspaceId}/chat`} className="mt-2 inline-block text-xs font-medium text-indigo-600">
                  Start chatting →
                </Link>
              </div>
            ) : (
              recentMessages.map((msg) => {
                const m = msg as {
                  _id: { toString(): string };
                  content: string;
                  sender: { name?: string };
                  createdAt: Date;
                };
                return (
                  <div key={m._id.toString()} className="flex items-start gap-3 px-5 py-3.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700">
                      {m.sender?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-slate-700">{m.sender?.name ?? "Unknown"}</p>
                      <p className="truncate text-sm text-slate-500">{m.content}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
