import { z } from "zod";

// ============================================
// Auth Validators
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// ============================================
// Workspace Validators
// ============================================

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Workspace name is required")
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be less than 60 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be less than 60 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  role: z.enum(["admin", "member", "guest"], {
    message: "Invalid role",
  }),
});

// ============================================
// Task Validators
// ============================================

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z.string().trim().optional(),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  status: z.enum(["todo", "in-progress", "review", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assignees: z.array(z.string()).optional(),
  deadline: z.string().datetime().optional(),
  labels: z.array(z.string()).optional(),
});

// ============================================
// Document Validators
// ============================================

export const createDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .max(200, "Title must be less than 200 characters")
    .optional(),
  workspaceId: z.string().min(1, "Workspace ID is required"),
});

// ============================================
// Chat Validators
// ============================================

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(5000, "Message too long"),
  channel: z.string().trim().min(1, "Channel is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  replyTo: z.string().optional(),
});

// ============================================
// Type exports from validators
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
