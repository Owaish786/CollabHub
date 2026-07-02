import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { redirect } from "next/navigation";
import Workspace from "@/models/Workspace";
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceLayout({ children, params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { workspaceId } = await params;

  await dbConnect();

  const workspace = await Workspace.findOne({
    _id: workspaceId,
    $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
  }).lean();

  if (!workspace) redirect("/dashboard");

  const ws = workspace as {
    _id: { toString(): string };
    name: string;
    description?: string;
    settings?: { color?: string };
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <WorkspaceSidebar
        workspaceId={workspaceId}
        workspaceName={ws.name}
        workspaceColor={ws.settings?.color ?? "#6366f1"}
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
