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

    // Join a specific workspace room
    socket.on("join-workspace", (workspaceId) => {
      socket.join(`workspace-${workspaceId}`);
      console.log(`Socket ${socket.id} joined workspace-${workspaceId}`);
    });

    // Leave a specific workspace room
    socket.on("leave-workspace", (workspaceId) => {
      socket.leave(`workspace-${workspaceId}`);
      console.log(`Socket ${socket.id} left workspace-${workspaceId}`);
    });

    // Handle new chat messages
    socket.on("send-message", (data) => {
      // Broadcast to everyone in the workspace including the sender,
      // or we can broadcast to everyone EXCEPT the sender.
      // Usually, it's easier to just let the sender handle optimistic UI,
      // and broadcast to others. But for simplicity, we can broadcast to everyone
      // and the client can ignore duplicates based on message ID.
      // Or we can use `socket.to(room).emit` which broadcasts to everyone EXCEPT the sender.
      const room = `workspace-${data.workspaceId}`;
      socket.to(room).emit("new-message", data.message);
    });

    // Handle task updates (create, update, delete, reorder)
    socket.on("tasks-updated", (data) => {
      const room = `workspace-${data.workspaceId}`;
      socket.to(room).emit("tasks-updated", data.tasks); // can be full list or single
    });

    socket.on("disconnect", () => {
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
