import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { redirect } from "next/navigation";
import Workspace from "@/models/Workspace";
import { ClientWorkspaceLayout } from "@/components/layout/ClientWorkspaceLayout";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceLayout({ children, params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { workspaceId } = await params;

  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    redirect("/dashboard");
  }

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
    <ClientWorkspaceLayout
      workspaceId={workspaceId}
      ws={ws}
      userName={session.user.name ?? ""}
      userEmail={session.user.email ?? ""}
    >
      {children}
    </ClientWorkspaceLayout>
  );
}
