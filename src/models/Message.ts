import mongoose, { Document, Model, Schema } from "mongoose";
import type { FileAttachment, Reaction } from "@/types";

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  channel: string;
  sender: mongoose.Types.ObjectId;
  content: string;
  attachments: FileAttachment[];
  reactions: Reaction[];
  replyTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    channel: {
      type: String,
      required: true,
      default: "general",
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    attachments: [
      {
        url: String,
        name: String,
        type: String,
        size: Number,
      },
    ],
    reactions: [
      {
        emoji: String,
        users: [{ type: Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching messages in a channel with pagination
MessageSchema.index({ workspace: 1, channel: 1, createdAt: -1 });

const Message: Model<IMessage> =
  mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
