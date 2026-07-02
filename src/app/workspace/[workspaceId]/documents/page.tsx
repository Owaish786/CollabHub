import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import CollabDocument from "@/models/Document";
import { NewDocButton } from "@/components/features/documents/NewDocButton";
import { FileText, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  params: Promise<{ workspaceId: string }>;
}

export default async function DocumentsPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { workspaceId } = await params;

  await dbConnect();
  const docs = await CollabDocument.find({ workspace: workspaceId })
    .sort({ updatedAt: -1 })
    .select("title updatedAt createdBy")
    .lean();

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500">{docs.length} document{docs.length !== 1 ? "s" : ""}</p>
        </div>
        <NewDocButton workspaceId={workspaceId} />
      </div>

      {/* Document grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-700">No documents yet</h3>
            <p className="mt-1 text-sm text-slate-400">Create your first document to start collaborating.</p>
            <div className="mt-4">
              <NewDocButton workspaceId={workspaceId} />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {docs.map((doc) => {
              const d = doc as { _id: { toString(): string }; title: string; updatedAt: Date };
              return (
                <Link
                  key={d._id.toString()}
                  href={`${d._id.toString()}`}
                  className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="mt-4 truncate text-sm font-semibold text-slate-800 group-hover:text-indigo-700">
                    {d.title || "Untitled Document"}
                  </h3>
                  <p className="mt-auto flex items-center gap-1 pt-4 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(d.updatedAt), { addSuffix: true })}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
