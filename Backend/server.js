import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./src/config/db.js";
import { documentsRouter } from "./src/routes/documents.js";
import { notificationsRouter } from "./src/routes/notifications.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      const allowedOriginsList = (process.env.CLIENT_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000")
        .split(",")
        .map((o) => o.trim());

      if (!origin || allowedOriginsList.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
  }
});

const port = process.env.PORT || 5001;

// Make io instance globally accessible
global.io = io;

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS."));
    }
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/documents", documentsRouter);
app.use("/api/notifications", notificationsRouter);

app.use((error, _req, res, _next) => {
  console.error(error);

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Each PDF must be 25MB or smaller." });
  }

  if (error.code === "LIMIT_FILE_COUNT") {
    return res.status(413).json({ message: "You can upload up to 20 PDFs at once." });
  }

  res.status(400).json({ message: error.message || "Something went wrong." });
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

connectDB()
  .then(() => {
    httpServer.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Unable to start server", error);
    process.exit(1);
  });
