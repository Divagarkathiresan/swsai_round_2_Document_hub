import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { Document } from "../models/Document.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
  }
});

const pdfOnly = (_req, file, cb) => {
  if (file.mimetype !== "application/pdf") {
    cb(new Error("Only PDF files are allowed."));
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter: pdfOnly,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 20
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 }).limit(50);
    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

router.post("/upload", upload.array("documents", 20), async (req, res, next) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ message: "Please attach at least one PDF file." });
    }

    const uploadType = req.files.length > 1 ? "bulk" : "single";
    const payload = req.files.map((file) => ({
      originalName: file.originalname,
      storedName: file.filename,
      filePath: file.path,
      mimeType: file.mimetype,
      size: file.size,
      uploadType,
      status: "uploaded"
    }));

    const documents = await Document.insertMany(payload);
    res.status(201).json({
      message: `${documents.length} document${documents.length === 1 ? "" : "s"} uploaded successfully.`,
      documents
    });
  } catch (error) {
    next(error);
  }
});

export { router as documentsRouter };
