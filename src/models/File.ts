import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFile extends Document {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  workspace: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  s3Key: string;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    s3Key: { type: String, required: true },
  },
  { timestamps: true }
);

// Add indexes for efficient querying
FileSchema.index({ workspace: 1, createdAt: -1 });

export default mongoose.models.File || mongoose.model<IFile>("File", FileSchema);
