import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { redirect } from "next/navigation";
import CollabDocument from "@/models/Document";
import { RichEditor } from "@/components/features/documents/RichEditor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ workspaceId: string; docId: string }>;
}

export default async function DocumentEditorPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { workspaceId, docId } = await params;
  await dbConnect();

  const doc = await CollabDocument.findOne({ _id: docId, workspace: workspaceId }).lean();
  if (!doc) redirect(`/workspace/${workspaceId}/documents`);

  const d = doc as {
    _id: { toString(): string };
    title: string;
    content: string;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <Link
          href={`/workspace/${workspaceId}/documents`}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Documents
        </Link>
      </div>

      <RichEditor
        docId={d._id.toString()}
        initialTitle={d.title}
        initialContent={d.content}
        workspaceId={workspaceId}
      />
    </div>
  );
}
