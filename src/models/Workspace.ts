import mongoose, { Document, Model, Schema } from "mongoose";
import type { Role } from "@/types";

export interface IWorkspaceMember {
  user: mongoose.Types.ObjectId;
  role: Role;
  joinedAt: Date;
}

export interface IWorkspace extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  members: IWorkspaceMember[];
  settings: {
    color?: string;
    icon?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member", "guest"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: [true, "Workspace name is required"],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: 500,
      default: "",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    members: [WorkspaceMemberSchema],
    settings: {
      color: { type: String, default: "#6366f1" },
      icon: { type: String, default: "layout-grid" },
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from name before saving
WorkspaceSchema.pre("validate", function (next) {
  if (this.isModified("name") && !this.slug) {
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") +
      "-" +
      Date.now().toString(36) +
      "-" +
      randomSuffix;
  }
  next();
});

const Workspace: Model<IWorkspace> =
  mongoose.models.Workspace ||
  mongoose.model<IWorkspace>("Workspace", WorkspaceSchema);

export default Workspace;
