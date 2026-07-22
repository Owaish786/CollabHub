import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Workspace from "@/models/Workspace";
import FileModel from "@/models/File";
import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

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
    const db = mongoose.connection.db;
    
    if (!db) {
       throw new Error("Database connection not established");
    }

    const bucket = new GridFSBucket(db, { bucketName: "workspaceFiles" });

    // Generate a unique filename to avoid collisions in GridFS
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.name}`;

    const uploadStream = bucket.openUploadStream(uniqueFilename, {
      metadata: {
        contentType: file.type,
        workspaceId,
        uploadedBy: session.user.id,
      },
    });

    await new Promise((resolve, reject) => {
      uploadStream.on("finish", resolve);
      uploadStream.on("error", reject);
      uploadStream.end(buffer);
    });

    const fileDoc = await FileModel.create({
      filename: uniqueFilename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      workspace: workspaceId,
      uploadedBy: session.user.id,
      gridFsId: uploadStream.id,
    });

    const populatedFile = await FileModel.findById(fileDoc._id)
      .populate("uploadedBy", "name email image")
      .lean();

    return NextResponse.json({ success: true, data: populatedFile });
  } catch (error: any) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
