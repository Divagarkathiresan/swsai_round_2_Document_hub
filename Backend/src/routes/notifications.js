import express from "express";
import { Notification } from "../models/Notification.js";

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { message, type = "info" } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Notification message is required." });
    }

    const notification = await Notification.create({ message, type });
    
    // Emit to all connected clients
    global.io.emit("notification-created", notification);
    
    res.status(201).json({ notification });
  } catch (error) {
    next(error);
  }
});

router.patch("/read", async (_req, res, next) => {
  try {
    await Notification.updateMany({ read: false }, { $set: { read: true } });
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
    
    // Emit to all connected clients
    global.io.emit("notifications-marked-read", { success: true });
    
    res.json({ message: "Notifications marked as read.", notifications });
  } catch (error) {
    next(error);
  }
});

router.delete("/", async (_req, res, next) => {
  try {
    await Notification.deleteMany({});
    
    // Emit to all connected clients
    global.io.emit("notifications-cleared", { success: true });
    
    res.json({ message: "Notifications cleared." });
  } catch (error) {
    next(error);
  }
});

export { router as notificationsRouter };
