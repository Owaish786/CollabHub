import mongoose, { Document, Model, Schema } from "mongoose";

export interface IInvite extends Document {
  workspaceId: mongoose.Types.ObjectId;
  inviterId: mongoose.Types.ObjectId;
  email?: string; // Optional: If empty, it's a generic share link
  token: string;
  role: "admin" | "member" | "guest";
  expiresAt: Date;
  usedAt?: Date;
  status: "pending" | "used" | "expired";
  createdAt: Date;
  updatedAt: Date;
}

const InviteSchema = new Schema<IInvite>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    inviterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true, // For searching invites sent to a specific email
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["admin", "member", "guest"],
      default: "member",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "used", "expired"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Virtual property to dynamically check if expired
InviteSchema.virtual("isExpired").get(function () {
  return this.status === "expired" || Date.now() > this.expiresAt.getTime();
});

const Invite: Model<IInvite> =
  mongoose.models.Invite || mongoose.model<IInvite>("Invite", InviteSchema);

export default Invite;
