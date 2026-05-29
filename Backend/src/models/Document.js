import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    docId: {
      type: String,
      unique: true,
      required: true
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    uploadMode: {
      type: String,
      enum: ["single", "bulk"],
      default: "single",
      required: true
    }
  },
  {
    versionKey: false
  }
);

export const Document = mongoose.model("Document", documentSchema);
