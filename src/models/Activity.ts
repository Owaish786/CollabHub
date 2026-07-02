import mongoose, { Document, Model, Schema } from "mongoose";
import type { ActivityAction, ActivityTargetType } from "@/types";

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  action: ActivityAction;
  targetType: ActivityTargetType;
  targetId: mongoose.Types.ObjectId;
  targetTitle?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "created",
        "updated",
        "deleted",
        "commented",
        "assigned",
        "moved",
        "joined",
        "left",
      ],
      required: true,
    },
    targetType: {
      type: String,
      enum: [
        "document",
        "task",
        "board",
        "member",
        "workspace",
        "message",
      ],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    targetTitle: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for fetching recent activity per workspace
ActivitySchema.index({ workspace: 1, createdAt: -1 });

const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", ActivitySchema);

export default Activity;
