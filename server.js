/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Track online users per workspace: Map<workspaceId, Map<socketId, userInfo>>
const workspacePresence = new Map();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join a specific workspace room with user identity
    socket.on("join-workspace", (data) => {
      // Support both old format (string) and new format (object with user info)
      const workspaceId = typeof data === "string" ? data : data.workspaceId;
      const user = typeof data === "string" ? null : data.user;

      socket.join(`workspace-${workspaceId}`);

      // Track presence if user info is provided
      if (user) {
        if (!workspacePresence.has(workspaceId)) {
          workspacePresence.set(workspaceId, new Map());
        }
        const wsUsers = workspacePresence.get(workspaceId);
        wsUsers.set(socket.id, {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          color: user.color,
          page: user.page || "/",
          cursor: null,
          lastSeen: Date.now(),
        });

        // Broadcast updated presence to everyone in the workspace
        const presenceList = Array.from(wsUsers.entries()).map(([sid, u]) => ({
          socketId: sid,
          ...u,
        }));
        io.to(`workspace-${workspaceId}`).emit("presence-update", presenceList);
      }

      console.log(`Socket ${socket.id} joined workspace-${workspaceId}`);
    });

    // Leave a specific workspace room
    socket.on("leave-workspace", (workspaceId) => {
      socket.leave(`workspace-${workspaceId}`);

      // Remove from presence tracking
      if (workspacePresence.has(workspaceId)) {
        const wsUsers = workspacePresence.get(workspaceId);
        wsUsers.delete(socket.id);
        if (wsUsers.size === 0) {
          workspacePresence.delete(workspaceId);
        } else {
          const presenceList = Array.from(wsUsers.entries()).map(
            ([sid, u]) => ({ socketId: sid, ...u })
          );
          io.to(`workspace-${workspaceId}`).emit(
            "presence-update",
            presenceList
          );
        }
      }

      console.log(`Socket ${socket.id} left workspace-${workspaceId}`);
    });

    // Handle cursor movement — high-frequency, broadcast to others only
    socket.on("cursor-move", (data) => {
      const { workspaceId, x, y } = data;
      // Update stored cursor position
      if (workspacePresence.has(workspaceId)) {
        const wsUsers = workspacePresence.get(workspaceId);
        const userInfo = wsUsers.get(socket.id);
        if (userInfo) {
          userInfo.cursor = { x, y };
          userInfo.lastSeen = Date.now();
        }
      }
      // Broadcast cursor to everyone else in the workspace
      socket.to(`workspace-${workspaceId}`).emit("cursor-update", {
        socketId: socket.id,
        x,
        y,
      });
    });

    // Handle page navigation updates
    socket.on("page-update", (data) => {
      const { workspaceId, page } = data;
      if (workspacePresence.has(workspaceId)) {
        const wsUsers = workspacePresence.get(workspaceId);
        const userInfo = wsUsers.get(socket.id);
        if (userInfo) {
          userInfo.page = page;
          userInfo.lastSeen = Date.now();
        }
        const presenceList = Array.from(wsUsers.entries()).map(([sid, u]) => ({
          socketId: sid,
          ...u,
        }));
        io.to(`workspace-${workspaceId}`).emit("presence-update", presenceList);
      }
    });

    // Handle new chat messages
    socket.on("send-message", (data) => {
      const room = `workspace-${data.workspaceId}`;
      socket.to(room).emit("new-message", data.message);
    });

    // Handle task updates (create, update, delete, reorder)
    socket.on("tasks-updated", (data) => {
      const room = `workspace-${data.workspaceId}`;
      socket.to(room).emit("tasks-updated", data.tasks);
    });

    socket.on("disconnect", () => {
      // Clean up presence from all workspaces
      for (const [workspaceId, wsUsers] of workspacePresence.entries()) {
        if (wsUsers.has(socket.id)) {
          wsUsers.delete(socket.id);
          if (wsUsers.size === 0) {
            workspacePresence.delete(workspaceId);
          } else {
            const presenceList = Array.from(wsUsers.entries()).map(
              ([sid, u]) => ({ socketId: sid, ...u })
            );
            io.to(`workspace-${workspaceId}`).emit(
              "presence-update",
              presenceList
            );
          }
        }
      }
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
