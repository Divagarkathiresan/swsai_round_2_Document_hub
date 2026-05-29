import express from "express";
import multer from "multer";
import crypto from "crypto";
import mongoose from "mongoose";
import { Document } from "../models/Document.js";
import { Notification } from "../models/Notification.js";

const router = express.Router();

const storage = multer.memoryStorage();

const pdfOnly = (_req, file, cb) => {
  const isPdf =
    file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
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

const getBucket = () =>
  new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "documentFiles"
  });

const uploadToGridFS = (file, docId) =>
  new Promise((resolve, reject) => {
    const bucket = getBucket();
    const uploadStream = bucket.openUploadStream(`${docId}.pdf`, {
      contentType: file.mimetype,
      metadata: {
        docId,
        originalName: file.originalname,
        size: file.size
      }
    });

    uploadStream.on("error", reject);
    uploadStream.on("finish", () => {
      resolve({
        _id: uploadStream.id
      });
    });
    uploadStream.end(file.buffer);
  });

router.get("/", async (_req, res, next) => {
  try {
    const documents = await Document.find().sort({ uploadDate: -1 }).limit(50);
    res.json({ documents });
  } catch (error) {
    next(error);
  }
});

router.get("/:docId/preview", async (req, res, next) => {
  try {
    const document = await Document.findOne({ docId: req.params.docId });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    if (!document.fileId) {
      return res.status(404).json({ message: "Stored file is not available for this document." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${document.name}"`);
    getBucket().openDownloadStream(document.fileId).pipe(res);
  } catch (error) {
    next(error);
  }
});

router.get("/:docId/download", async (req, res, next) => {
  try {
    const document = await Document.findOne({ docId: req.params.docId });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    if (!document.fileId) {
      return res.status(404).json({ message: "Stored file is not available for this document." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${document.name}"`);
    getBucket().openDownloadStream(document.fileId).pipe(res);
  } catch (error) {
    next(error);
  }
});

router.delete("/:docId", async (req, res, next) => {
  try {
    const document = await Document.findOneAndDelete({ docId: req.params.docId });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    try {
      await getBucket().delete(document.fileId);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    const notification = await Notification.create({
      type: "info",
      message: `${document.name} was deleted.`
    });

    // Emit deletion event to all connected clients
    global.io.emit("document-deleted", { 
      docId: document.docId,
      notification 
    });

    res.json({ message: "Document deleted successfully.", docId: document.docId, notification });
  } catch (error) {
    next(error);
  }
});

router.post("/upload", upload.array("documents", 20), async (req, res, next) => {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ message: "Please attach at least one PDF file." });
    }

    const uploadMode = req.files.length > 1 ? "bulk" : "single";
    const uploadedFiles = await Promise.all(
      req.files.map(async (file) => {
        const docId = crypto.randomUUID();
        const gridFile = await uploadToGridFS(file, docId);

        return {
          docId,
          fileId: gridFile._id,
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          uploadDate: new Date(),
          uploadMode
        };
      })
    );

    const documents = await Document.insertMany(uploadedFiles);

    const notification = await Notification.create({
      type: "success",
      message: `${documents.length} document${documents.length === 1 ? "" : "s"} uploaded successfully.`
    });

    // Emit upload event to all connected clients
    global.io.emit("documents-uploaded", {
      documents,
      notification,
      uploadMode
    });

    res.status(201).json({
      message: `${documents.length} document${documents.length === 1 ? "" : "s"} uploaded successfully.`,
      documents,
      notifications: [notification]
    });
  } catch (error) {
    next(error);
  }
});

export { router as documentsRouter };
