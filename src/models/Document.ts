import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDocument extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  workspace: mongoose.Types.ObjectId;
  content: string;
  yjsState?: Buffer;
  createdBy: mongoose.Types.ObjectId;
  lastEditedBy?: mongoose.Types.ObjectId;
  collaborators: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
      maxlength: 200,
      default: "Untitled Document",
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    content: {
      type: String,
      default: "",
    },
    yjsState: {
      type: Buffer,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastEditedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    collaborators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for workspace + updated queries
DocumentSchema.index({ workspace: 1, updatedAt: -1 });

const CollabDocument: Model<IDocument> =
  mongoose.models.Document ||
  mongoose.model<IDocument>("Document", DocumentSchema);

export default CollabDocument;
