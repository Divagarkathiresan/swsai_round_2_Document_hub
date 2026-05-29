import "dotenv/config";
import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./src/config/db.js";
import { documentsRouter } from "./src/routes/documents.js";

const app = express();
const port = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "uploads");
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map((origin) => origin.trim());

fs.mkdirSync(uploadDir, { recursive: true });

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

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Unable to start server", error);
    process.exit(1);
  });
