import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Invite from "@/models/Invite";
import Workspace, { IWorkspaceMember } from "@/models/Workspace";
import { AcceptInviteButton } from "./accept-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertCircle } from "lucide-react";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const session = await auth();
  const { token } = await params;
  
  if (!session?.user) {
    // Redirect to login but keep the callback URL to come back here
    redirect(`/login?callbackUrl=/invite/${token}`);
  }

  await dbConnect();

  const invite = await Invite.findOne({ token }).populate("inviterId", "name");
  
  if (!invite) {
    return <ErrorCard message="Invalid invite link. Please check the URL and try again." />;
  }

  if (invite.status !== "pending" || invite.isExpired) {
    return <ErrorCard message="This invite link has expired or has already been used." />;
  }

  if (invite.email && session.user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return <ErrorCard message={`This invite is meant for ${invite.email}. Please log in with the correct account.`} />;
  }

  const workspace = await Workspace.findById(invite.workspaceId);
  
  if (!workspace) {
    return <ErrorCard message="The workspace for this invite no longer exists." />;
  }

  // Check if already a member
  const isAlreadyMember = workspace.members.some(
    (m: IWorkspaceMember) => m.user.toString() === session.user.id
  );

  if (isAlreadyMember) {
    redirect(`/workspace/${workspace._id}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-0 ring-1 ring-slate-200">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <Users className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">You&apos;ve been invited!</CardTitle>
            <CardDescription className="text-base text-slate-500">
              <span className="font-medium text-slate-900">{invite.inviterId?.name || "A user"}</span> has invited you to join the{" "}
              <span className="font-medium text-slate-900">{workspace.name}</span> workspace.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AcceptInviteButton token={token} />
          <p className="text-center text-xs text-slate-500">
            You will join this workspace as a {invite.role}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-red-100 shadow-md">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl text-red-600">Unable to accept invite</CardTitle>
          <CardDescription className="text-base text-slate-600">
            {message}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
