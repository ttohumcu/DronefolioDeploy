import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMediaItemSchema, insertSettingSchema, MediaType } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all media items
  app.get("/api/media", async (req, res) => {
    try {
      const items = await storage.getMediaItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching media items:", error);
      res.status(500).json({ error: "Failed to fetch media items" });
    }
  });

  // Get media items by type
  app.get("/api/media/type/:type", async (req, res) => {
    try {
      const { type } = req.params;
      if (!Object.values(MediaType).includes(type as MediaType)) {
        return res.status(400).json({ error: "Invalid media type" });
      }
      const items = await storage.getMediaItemsByType(type as MediaType);
      res.json(items);
    } catch (error) {
      console.error("Error fetching media items by type:", error);
      res.status(500).json({ error: "Failed to fetch media items" });
    }
  });

  // Get media items by location
  app.get("/api/media/location/:location", async (req, res) => {
    try {
      const { location } = req.params;
      const items = await storage.getMediaItemsByLocation(location);
      res.json(items);
    } catch (error) {
      console.error("Error fetching media items by location:", error);
      res.status(500).json({ error: "Failed to fetch media items" });
    }
  });

  // Create new media item
  app.post("/api/media", async (req, res) => {
    try {
      const validatedData = insertMediaItemSchema.parse(req.body);
      const item = await storage.createMediaItem(validatedData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating media item:", error);
      res.status(500).json({ error: "Failed to create media item" });
    }
  });

  // Delete media item
  app.delete("/api/media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteMediaItem(id);
      if (success) {
        res.json({ message: "Media item deleted successfully" });
      } else {
        res.status(404).json({ error: "Media item not found" });
      }
    } catch (error) {
      console.error("Error deleting media item:", error);
      res.status(500).json({ error: "Failed to delete media item" });
    }
  });

  // Get all settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Get specific setting
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSetting(key);
      if (setting) {
        res.json(setting);
      } else {
        res.status(404).json({ error: "Setting not found" });
      }
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  // Update setting
  app.put("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSettingSchema.parse(req.body);
      const setting = await storage.setSetting(validatedData);
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // Search media items
  app.get("/api/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Search query required" });
      }

      const allItems = await storage.getMediaItems();
      const filtered = allItems.filter(item => 
        item.title.toLowerCase().includes(q.toLowerCase()) ||
        item.location.toLowerCase().includes(q.toLowerCase())
      );
      
      res.json(filtered);
    } catch (error) {
      console.error("Error searching media items:", error);
      res.status(500).json({ error: "Failed to search media items" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
