import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import FileModel from "@/models/File";
import Workspace from "@/models/Workspace";
import mongoose from "mongoose";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Configure S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

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
      return new NextResponse("File not found in database", { status: 404 });
    }

    // Verify workspace access
    const workspace = await Workspace.findOne({
      _id: fileDoc.workspace,
      $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
    });

    if (!workspace) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      return new NextResponse("AWS_S3_BUCKET_NAME is not configured", { status: 500 });
    }

    // Fetch from S3
    const s3Response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: fileDoc.s3Key,
      })
    );

    if (!s3Response.Body) {
      return new NextResponse("File not found in S3", { status: 404 });
    }

    // The S3 SDK returns a stream (in Node.js, it's a Readable stream)
    // We can cast it to any and then transform it to a Web ReadableStream
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeStream = s3Response.Body as any;

    const stream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk: Buffer) => controller.enqueue(chunk));
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (error: Error) => controller.error(error));
      },
    });

    // Determine if it should be displayed inline or downloaded based on a query param
    const url = new URL(request.url);
    const download = url.searchParams.get("download") === "true";
    const disposition = download ? `attachment; filename="${encodeURIComponent(fileDoc.originalName)}"` : "inline";

    return new NextResponse(stream, {
      headers: {
        "Content-Type": fileDoc.mimeType,
        "Content-Length": s3Response.ContentLength?.toString() || fileDoc.size.toString(),
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    console.error("Error serving file from S3:", error);
    if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") {
       return new NextResponse("File missing from S3 bucket", { status: 404 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
