// ============================================
// Shared TypeScript Types
// ============================================

export type Role = "owner" | "admin" | "member" | "guest";

export type TaskStatus = "todo" | "in-progress" | "review" | "done";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type ActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "commented"
  | "assigned"
  | "moved"
  | "joined"
  | "left";

export type ActivityTargetType =
  | "document"
  | "task"
  | "board"
  | "member"
  | "workspace"
  | "message";

export interface WorkspaceMember {
  user: string;
  role: Role;
  joinedAt: Date;
}

export interface TaskComment {
  user: string;
  text: string;
  createdAt: Date;
}

export interface FileAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface Reaction {
  emoji: string;
  users: string[];
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// Session / Auth Types
// ============================================

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}
