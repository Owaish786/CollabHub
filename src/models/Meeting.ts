import mongoose, { Document, Model, Schema } from "mongoose";
import type { MeetingStatus, MeetingType, MeetingParticipantStatus } from "@/types";

export interface IMeetingParticipant {
  user: mongoose.Types.ObjectId;
  status: MeetingParticipantStatus;
}

export interface IMeeting extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  workspace: mongoose.Types.ObjectId;
  organizer: mongoose.Types.ObjectId;
  participants: IMeetingParticipant[];
  startTime: Date;
  endTime: Date;
  meetingLink: string;
  type: MeetingType;
  status: MeetingStatus;
  recurrence?: "none" | "daily" | "weekly" | "monthly";
  createdAt: Date;
  updatedAt: Date;
}

const MeetingParticipantSchema = new Schema<IMeetingParticipant>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { _id: false }
);

const MeetingSchema = new Schema<IMeeting>(
  {
    title: {
      type: String,
      required: [true, "Meeting title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [MeetingParticipantSchema],
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    meetingLink: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["quick", "scheduled"],
      default: "scheduled",
    },
    status: {
      type: String,
      enum: ["upcoming", "live", "ended", "cancelled"],
      default: "upcoming",
      index: true,
    },
    recurrence: {
      type: String,
      enum: ["none", "daily", "weekly", "monthly"],
      default: "none",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying meetings in a workspace ordered by start time
MeetingSchema.index({ workspace: 1, startTime: -1 });

const Meeting: Model<IMeeting> =
  mongoose.models.Meeting || mongoose.model<IMeeting>("Meeting", MeetingSchema);

export default Meeting;
