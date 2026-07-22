import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Workspace from "@/models/Workspace";
import FileModel from "@/models/File";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;
  if (!workspaceId) {
    return NextResponse.json({ success: false, error: "Missing workspaceId" }, { status: 400 });
  }

  try {
    await dbConnect();
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: "Not found or unauthorized" }, { status: 404 });
    }

    const files = await FileModel.find({ workspace: workspaceId })
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name email image")
      .lean();

    return NextResponse.json({ success: true, data: files });
  } catch (error: any) {
    console.error("Error fetching files:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = await params;

  try {
    await dbConnect();
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [{ owner: session.user.id }, { "members.user": session.user.id }],
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: "Not found or unauthorized" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate a unique S3 key
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const s3Key = `workspaces/${workspaceId}/${uniqueFilename}`;
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    if (!bucketName) {
      return NextResponse.json({ success: false, error: "AWS_S3_BUCKET_NAME is not configured" }, { status: 500 });
    }

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          workspaceId,
          uploadedBy: session.user.id,
        },
      })
    );

    // Save metadata to MongoDB
    const fileDoc = await FileModel.create({
      filename: uniqueFilename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      workspace: workspaceId,
      uploadedBy: session.user.id,
      s3Key: s3Key,
    });

    const populatedFile = await FileModel.findById(fileDoc._id)
      .populate("uploadedBy", "name email image")
      .lean();

    return NextResponse.json({ success: true, data: populatedFile });
  } catch (error: any) {
    console.error("Error uploading file to S3:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
