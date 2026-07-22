import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import FileModel from "@/models/File";
import Workspace from "@/models/Workspace";
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { fileId } = await params;
  if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
    return new NextResponse("Invalid file ID", { status: 400 });
  }

  try {
    await dbConnect();
    
    // Find the file metadata
    const fileDoc = await FileModel.findById(fileId).lean();
    if (!fileDoc) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Verify workspace access
    const workspace = await Workspace.findOne({
      _id: fileDoc.workspace,
      $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
    });

    if (!workspace) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const db = mongoose.connection.db;
    if (!db) {
       throw new Error("Database connection not established");
    }

    const bucket = new GridFSBucket(db, { bucketName: "workspaceFiles" });

    // Ensure the file exists in GridFS
    const files = await bucket.find({ _id: new ObjectId(fileDoc.gridFsId as any) }).toArray();
    if (files.length === 0) {
      return new NextResponse("File not found in storage", { status: 404 });
    }

    // Create a readable stream
    const downloadStream = bucket.openDownloadStream(new ObjectId(fileDoc.gridFsId as any));

    // Convert the Node.js readable stream into a Web ReadableStream
    const stream = new ReadableStream({
      start(controller) {
        downloadStream.on("data", (chunk) => controller.enqueue(chunk));
        downloadStream.on("end", () => controller.close());
        downloadStream.on("error", (error) => controller.error(error));
      },
    });

    // Determine if it should be displayed inline or downloaded based on a query param
    const url = new URL(request.url);
    const download = url.searchParams.get("download") === "true";
    const disposition = download ? `attachment; filename="${encodeURIComponent(fileDoc.originalName)}"` : "inline";

    return new NextResponse(stream, {
      headers: {
        "Content-Type": fileDoc.mimeType,
        "Content-Length": fileDoc.size.toString(),
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error serving file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
