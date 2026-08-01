<div align="center">

# 🚀 CollabHub

### **The Modern Team Collaboration Platform**

A full-stack, real-time collaboration platform built with **Next.js 16**, **MongoDB**, and **Socket.IO** — featuring AI-powered project management, Kanban boards, team chat, collaborative documents, and cloud file storage.

[![CI/CD Pipeline](https://github.com/Owaish786/CollabHub/actions/workflows/ci.yml/badge.svg)](https://github.com/Owaish786/CollabHub/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=flat-square&logo=socket.io)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Architecture](#-architecture) · [API Reference](#-api-reference) · [Deployment](#-deployment) · [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [AI Features](#-ai-features-ghost-ai)
- [Real-Time Engine](#-real-time-engine)
- [Database Models](#-database-models)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🏢 Workspaces
- Create and manage team workspaces with custom colors and icons
- Role-based access control: **Owner**, **Admin**, **Member**, **Guest**
- Invite team members via secure invitation links with token-based authentication
- Workspace settings with member management and role editing

### 📋 Kanban Task Management
- Drag-and-drop Kanban board with **4 columns**: Todo → In Progress → Review → Done
- Rich task cards with priority levels (Low, Medium, High, Urgent), deadlines, assignees, labels, subtasks, cover colors, and comments
- Task modal with full detail editing, subtask checklists, and threaded comments
- Real-time task synchronization across all connected team members via WebSocket

### 💬 Real-Time Team Chat
- Multi-channel messaging system with **General**, **Announcements**, and **Random** channels
- Instant message delivery powered by Socket.IO
- Emoji picker for expressive communication
- Integrated AI controls (Ghost AI Scan & Weekly Digest) directly in the chat interface

### 📄 Collaborative Documents
- Rich-text document editor powered by **TipTap** (ProseMirror-based)
- Full formatting toolbar: bold, italic, strikethrough, headings (H1–H3), bullet lists, ordered lists, blockquotes, code blocks, horizontal rules
- Character count tracking
- Per-workspace document organization with create, edit, and delete

### ☁️ Cloud File Storage (Drive)
- File upload and management powered by **AWS S3**
- Drag-and-drop file upload interface with progress indicators
- File type detection with visual icons (images, PDFs, archives, etc.)
- Download and search functionality across workspace files
- Real-time file upload notifications to all workspace members

### 🤖 AI Features (Ghost AI)
- **Ghost AI Scan** — Analyzes chat conversations and autonomously creates tasks, assigns team members, and sets deadlines based on discussion context
- **AI Task Breakdown** — Automatically decomposes high-level tasks into 4–6 actionable subtasks
- **Weekly Digest** — Generates an AI-powered summary of workspace activity including task stats, blockers, overdue items, and team morale
- Powered by **Groq** (Llama 3) for blazing-fast inference

### 👥 Live Presence & Collaboration
- Real-time user presence indicators showing who's online in a workspace
- Live cursor tracking across pages
- Page-awareness showing which section each team member is viewing
- Automatic cleanup on disconnect

### 🔐 Authentication & Security
- Multi-provider auth via **NextAuth.js v5**: Google OAuth, GitHub OAuth, and Email/Password credentials
- Secure password hashing with **bcrypt**
- JWT-based session management (30-day expiry)
- Login notification emails via SMTP
- Input validation with **Zod** schemas

### 🎨 Premium UI/UX
- Modern, responsive design built with **Tailwind CSS v4** and **shadcn/ui**
- Glassmorphism effects, ambient backgrounds, and smooth micro-animations
- Dark mode support via **next-themes**
- Toast notifications via **Sonner**
- Fully responsive from mobile to desktop

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Frontend** | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) |
| **State** | [Zustand](https://github.com/pmndrs/zustand) |
| **Rich Text Editor** | [TipTap](https://tiptap.dev/) (ProseMirror) |
| **Drag & Drop** | [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) via [Mongoose 9](https://mongoosejs.com/) |
| **Authentication** | [NextAuth.js v5](https://authjs.dev/) (Google, GitHub, Credentials) |
| **Real-Time** | [Socket.IO 4.8](https://socket.io/) (Custom Node.js server) |
| **File Storage** | [AWS S3](https://aws.amazon.com/s3/) via [@aws-sdk/client-s3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/) |
| **AI / LLM** | [Groq](https://groq.com/) (Llama 3) via [groq-sdk](https://www.npmjs.com/package/groq-sdk) |
| **Validation** | [Zod 4](https://zod.dev/) |
| **Email** | [Nodemailer](https://nodemailer.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Containerization** | [Docker](https://www.docker.com/) + Docker Compose |
| **CI/CD** | [GitHub Actions](https://github.com/features/actions) → Docker Hub |
| **Testing** | [Vitest](https://vitest.dev/) (Unit) + [Playwright](https://playwright.dev/) (E2E) |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Dashboard│ │  Tasks   │ │   Chat   │ │   Docs   │ │ Drive  │ │
│  │  (SSR)   │ │ (Kanban) │ │(Realtime)│ │ (TipTap) │ │  (S3)  │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │
│       │             │            │             │           │      │
│       └─────────────┴────────┬───┴─────────────┴───────────┘      │
│                              │                                    │
│                      Socket.IO Client                             │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │   Custom Node.js    │
                    │   Server (server.js)│
                    │                     │
                    │  ┌───────────────┐  │
                    │  │  Socket.IO    │  │
                    │  │  (Presence,   │  │
                    │  │   Chat, DnD)  │  │
                    │  └───────────────┘  │
                    │  ┌───────────────┐  │
                    │  │  Next.js App  │  │
                    │  │  (API Routes) │  │
                    │  └───────┬───────┘  │
                    └──────────┼──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
     ┌────────▼───────┐ ┌─────▼──────┐ ┌───────▼──────┐
     │  MongoDB Atlas  │ │  AWS S3    │ │  Groq API    │
     │  (Data Layer)   │ │  (Files)   │ │  (AI/LLM)    │
     └────────────────┘ └────────────┘ └──────────────┘
```

### Key Design Decisions

- **Custom Node.js HTTP server** wraps Next.js to co-locate Socket.IO on the same port (no separate WebSocket service needed)
- **Server-Side Rendering (SSR)** for authenticated pages (dashboard, workspace overview, documents list) for SEO and fast first paint
- **Client-Side Rendering** for highly interactive pages (Kanban board, Chat, Drive) with real-time WebSocket updates
- **Mongoose ODM** with compound indexes for performant workspace-scoped queries
- **JWT sessions** (not database sessions) for stateless, horizontally scalable auth

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- **MongoDB Atlas** account ([free tier](https://www.mongodb.com/cloud/atlas/register))
- **AWS S3** bucket (for file storage)
- **Groq** API key ([free tier](https://console.groq.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/Owaish786/CollabHub.git
cd CollabHub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials (see [Environment Variables](#-environment-variables) below).

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

### 5. Build for Production

```bash
npm run build
npm start
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root with the following variables:

| Variable | Required | Description |
|---|:---:|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `AUTH_SECRET` | ✅ | NextAuth secret (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ | App URL (e.g., `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth client secret |
| `GITHUB_ID` | ❌ | GitHub OAuth client ID |
| `GITHUB_SECRET` | ❌ | GitHub OAuth client secret |
| `AWS_ACCESS_KEY_ID` | ❌ | AWS S3 access key (for file storage) |
| `AWS_SECRET_ACCESS_KEY` | ❌ | AWS S3 secret key |
| `AWS_REGION` | ❌ | AWS region (e.g., `us-east-1`) |
| `AWS_S3_BUCKET` | ❌ | S3 bucket name |
| `GROQ_API_KEY` | ❌ | Groq API key (for AI features) |
| `SMTP_HOST` | ❌ | SMTP host for email notifications |
| `SMTP_PORT` | ❌ | SMTP port (typically `587`) |
| `SMTP_USER` | ❌ | SMTP username/email |
| `SMTP_PASSWORD` | ❌ | SMTP app password |
| `EMAIL_FROM` | ❌ | Sender email address |

> **Note:** The app runs with just `MONGODB_URI`, `AUTH_SECRET`, and `NEXTAUTH_URL`. Other features activate when their respective keys are configured.

---

## 📁 Project Structure

```
CollabHub/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI/CD pipeline
├── __tests__/
│   ├── api/
│   │   └── validators.test.ts        # Input validation tests
│   └── components/                   # Component tests
├── e2e/
│   ├── auth.spec.ts                  # Auth flow E2E tests
│   └── generic.spec.ts               # General E2E tests
├── public/                           # Static assets
├── server.js                         # Custom Node.js server (Socket.IO + Next.js)
├── src/
│   ├── app/
│   │   ├── (auth)/                   # Auth route group (login, register)
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── breakdown/        # POST — AI task decomposition
│   │   │   │   ├── digest/           # POST — Weekly digest generation
│   │   │   │   └── ghost/            # POST — Ghost AI conversation scanner
│   │   │   ├── auth/                 # NextAuth handlers + registration
│   │   │   ├── chat/                 # GET/POST — Messages CRUD
│   │   │   ├── documents/            # GET/POST/PUT/DELETE — Documents CRUD
│   │   │   ├── files/                # GET — File download/streaming
│   │   │   ├── invites/              # Workspace invitation management
│   │   │   ├── profile/              # User profile management
│   │   │   ├── tasks/                # GET/POST/PUT/DELETE — Tasks CRUD + reorder
│   │   │   ├── upload/               # POST — S3 file upload
│   │   │   └── workspaces/           # Workspace CRUD + file listing + invites
│   │   ├── dashboard/                # Main dashboard (SSR)
│   │   ├── invite/[token]/           # Invitation acceptance page
│   │   ├── profile/                  # User profile page
│   │   ├── workspace/[workspaceId]/
│   │   │   ├── chat/                 # Real-time team chat
│   │   │   ├── documents/            # Document list + editor
│   │   │   ├── drive/                # Cloud file manager
│   │   │   ├── settings/             # Workspace settings & members
│   │   │   ├── tasks/                # Kanban task board
│   │   │   ├── layout.tsx            # Workspace layout (sidebar)
│   │   │   └── page.tsx              # Workspace overview
│   │   ├── globals.css               # Global styles + design tokens
│   │   ├── layout.tsx                # Root layout (providers)
│   │   └── page.tsx                  # Landing page
│   ├── components/
│   │   ├── features/
│   │   │   ├── auth/                 # Auth components (sign-out button)
│   │   │   ├── documents/            # NewDocButton, RichEditor
│   │   │   ├── presence/             # CursorOverlay, PresenceBar
│   │   │   ├── tasks/                # KanbanBoard, TaskModal
│   │   │   └── workspace/            # CreateWorkspaceForm, InviteMembersModal
│   │   ├── layout/                   # ClientWorkspaceLayout, WorkspaceSidebar
│   │   ├── providers/                # SessionProvider, SocketProvider, ThemeProvider
│   │   ├── shared/                   # Reusable shared components
│   │   └── ui/                       # shadcn/ui primitives
│   ├── hooks/
│   │   └── usePresence.ts            # Real-time presence hook
│   ├── lib/
│   │   ├── auth.ts                   # NextAuth configuration
│   │   ├── config.ts                 # App configuration
│   │   ├── db.ts                     # MongoDB connection singleton
│   │   ├── email.ts                  # Email service (login notifications)
│   │   ├── utils.ts                  # Utility functions (cn)
│   │   └── validators.ts             # Zod validation schemas
│   ├── models/
│   │   ├── Activity.ts               # Activity log model
│   │   ├── Document.ts               # Document model
│   │   ├── File.ts                   # File metadata model
│   │   ├── Invite.ts                 # Invitation model
│   │   ├── Message.ts                # Chat message model
│   │   ├── Task.ts                   # Task model (Kanban)
│   │   ├── User.ts                   # User model
│   │   └── Workspace.ts              # Workspace model
│   ├── services/                     # Business logic services
│   └── types/                        # TypeScript type definitions
├── Dockerfile                        # Multi-stage Docker build
├── docker-compose.yml                # Docker Compose configuration
├── vitest.config.ts                  # Vitest configuration
├── playwright.config.ts              # Playwright E2E configuration
├── next.config.ts                    # Next.js configuration
└── tsconfig.json                     # TypeScript configuration
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user (email/password) |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth.js auth handlers |
| `GET` | `/api/auth/status` | Check authentication status |

### Workspaces

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/workspaces` | List user's workspaces |
| `POST` | `/api/workspaces` | Create a new workspace |
| `GET` | `/api/workspaces/[id]` | Get workspace details |
| `PUT` | `/api/workspaces/[id]` | Update workspace settings |
| `DELETE` | `/api/workspaces/[id]` | Delete a workspace |
| `GET` | `/api/workspaces/[id]/files` | List workspace files |
| `POST` | `/api/workspaces/[id]/invites` | Generate invitation link |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks?workspace=ID` | List tasks for a workspace |
| `POST` | `/api/tasks` | Create a new task |
| `PUT` | `/api/tasks/[id]` | Update a task |
| `DELETE` | `/api/tasks/[id]` | Delete a task |
| `POST` | `/api/tasks/[id]/comments` | Add a comment to a task |
| `PUT` | `/api/tasks/reorder` | Reorder tasks (drag & drop) |

### Chat

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/chat?workspace=ID&channel=NAME` | Fetch messages |
| `POST` | `/api/chat` | Send a message |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/documents?workspace=ID` | List documents |
| `POST` | `/api/documents` | Create a document |
| `GET` | `/api/documents/[id]` | Get document content |
| `PUT` | `/api/documents/[id]` | Update document |
| `DELETE` | `/api/documents/[id]` | Delete document |

### AI

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/ghost` | Ghost AI — Scan chat for tasks |
| `POST` | `/api/ai/breakdown` | AI Task Breakdown — Decompose a task |
| `POST` | `/api/ai/digest` | Weekly Digest — Generate activity summary |

### Files

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload a file to S3 |
| `GET` | `/api/files/[fileId]` | Download/stream a file |

---

## 🤖 AI Features (Ghost AI)

CollabHub integrates AI-powered project management features powered by **Groq** (running Llama 3 at inference speeds of ~500 tokens/sec).

### Ghost AI Scan
Triggered from the chat interface, Ghost AI reads the last 15 messages in a channel and:
1. Identifies commitments, action items, and requests
2. Creates tasks on the Kanban board with appropriate titles, descriptions, priorities, and deadlines
3. Auto-assigns tasks to the team member who committed to the work
4. Posts a summary message in the chat with all created tasks

### AI Task Breakdown
When creating or editing a task, the AI can automatically decompose it into 4–6 actionable subtasks, each expressed as a clear action item.

### Weekly Digest
Generates a comprehensive workspace activity report including:
- Tasks completed, created, and in-progress
- Message activity and active member count
- Overdue task alerts
- Motivational closing summary

---

## ⚡ Real-Time Engine

CollabHub uses a custom Node.js HTTP server (`server.js`) that co-hosts both **Next.js** and **Socket.IO** on the same port.

### WebSocket Events

| Event | Direction | Description |
|---|---|---|
| `join-workspace` | Client → Server | Join a workspace room with user identity |
| `leave-workspace` | Client → Server | Leave a workspace room |
| `send-message` | Client → Server | Send a chat message |
| `new-message` | Server → Client | Broadcast new message to room |
| `tasks-updated` | Bidirectional | Sync task changes across clients |
| `file-uploaded` | Client → Server | Notify workspace of new file |
| `new-file` | Server → Client | Broadcast new file to room |
| `cursor-move` | Client → Server | Send cursor position |
| `cursor-update` | Server → Client | Broadcast cursor to others |
| `page-update` | Client → Server | Update which page user is viewing |
| `presence-update` | Server → Client | Broadcast presence list |

### Presence System

The server maintains an in-memory `Map<workspaceId, Map<socketId, UserInfo>>` that tracks:
- User identity (name, email, avatar)
- Assigned color for cursor/avatar
- Current page being viewed
- Cursor position (x, y)
- Last seen timestamp
- Automatic cleanup on socket disconnect

---

## 🗃 Database Models

### User
| Field | Type | Description |
|---|---|---|
| `name` | String | Display name |
| `email` | String | Unique email (lowercase) |
| `hashedPassword` | String | bcrypt hash (credentials auth) |
| `image` | String | Profile image URL |
| `authProvider` | String | `credentials`, `google`, `github` |

### Workspace
| Field | Type | Description |
|---|---|---|
| `name` | String | Workspace name (2–60 chars) |
| `slug` | String | Auto-generated URL-safe slug |
| `description` | String | Optional description (max 500) |
| `owner` | ObjectId → User | Workspace creator |
| `members` | Array | `[{ user, role, joinedAt }]` |
| `settings` | Object | `{ color, icon }` |

### Task
| Field | Type | Description |
|---|---|---|
| `title` | String | Task title (max 200) |
| `description` | String | Rich text description |
| `status` | Enum | `todo`, `in-progress`, `review`, `done` |
| `priority` | Enum | `low`, `medium`, `high`, `urgent` |
| `assignees` | [ObjectId → User] | Assigned team members |
| `deadline` | Date | Optional due date |
| `subtasks` | Array | `[{ id, text, completed }]` |
| `comments` | Array | `[{ user, text, createdAt }]` |
| `labels` | [String] | Custom labels |
| `coverColor` | String | Card background color |
| `order` | Number | Sort position within status column |

### Message
| Field | Type | Description |
|---|---|---|
| `workspace` | ObjectId → Workspace | Parent workspace |
| `channel` | String | Channel name |
| `sender` | ObjectId → User | Message author |
| `content` | String | Message text |

### Document
| Field | Type | Description |
|---|---|---|
| `workspace` | ObjectId → Workspace | Parent workspace |
| `title` | String | Document title |
| `content` | String | Rich text content (HTML) |
| `createdBy` | ObjectId → User | Document author |

---

## 🧪 Testing

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Watch mode
npm run test:watch
```

### End-to-End Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e
```

### Test Structure
```
__tests__/
├── api/
│   └── validators.test.ts    # Zod schema validation tests
└── components/                # Component rendering tests

e2e/
├── auth.spec.ts               # Authentication flow tests
└── generic.spec.ts            # General navigation tests
```

---

## 🐳 Deployment

### Docker (Recommended)

#### Build and run locally:

```bash
# Build the image
docker build -t collabhub .

# Run with environment variables
docker run -d \
  --name collabhub \
  -p 80:3000 \
  --env-file .env.local \
  collabhub
```

#### Using Docker Compose:

```bash
docker-compose up -d
```

### AWS EC2 Deployment

```bash
# 1. SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ip

# 2. Pull the latest image from Docker Hub
docker pull oki786/collabhub:latest

# 3. Run the container
docker run -d \
  --name collabhub \
  -p 80:3000 \
  --env-file .env.local \
  --restart unless-stopped \
  oki786/collabhub:latest
```

### Manual Deployment

```bash
npm run build
npm start
```

The production server starts on port `3000` (configurable via `PORT` env var).

---

## 🔄 CI/CD Pipeline

The project uses **GitHub Actions** for continuous integration and deployment:

```
Push to main → Lint → Test → Build Docker Image → Push to Docker Hub
```

### Pipeline Steps:

1. **Checkout** — Clone the repository
2. **Setup Node.js 20** — Install Node.js with npm cache
3. **Install Dependencies** — `npm ci --legacy-peer-deps`
4. **Lint** — Run ESLint
5. **Test** — Run Vitest unit tests
6. **Build & Push** — Build Docker image and push to Docker Hub (main branch only)

### Required GitHub Secrets:
| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Coding Standards

- Use **TypeScript** for all new code
- Follow the existing project structure (features in `components/features/`, API routes in `app/api/`)
- Validate all inputs with **Zod** schemas
- Write tests for new API routes and components
- Use **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, etc.)

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [Owaish Khalak](https://github.com/Owaish786)**

⭐ Star this repo if you found it useful!

</div>
