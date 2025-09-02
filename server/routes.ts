import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMediaItemSchema, insertSettingSchema, MediaType } from "@shared/schema";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import { ObjectStorageService } from "./objectStorage";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // This endpoint is used to serve public assets.
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Image upload endpoint
  app.post("/api/upload-image", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const objectStorageService = new ObjectStorageService();
      const publicUrl = await objectStorageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.json({ url: publicUrl });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

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

  // AI analysis endpoint for photo title and location
  app.post("/api/ai/analyze-photo", async (req, res) => {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Convert relative URL to full URL if needed
      let fullImageUrl = imageUrl;
      if (imageUrl.startsWith('/public-objects/')) {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host || 'localhost:5000';
        fullImageUrl = `${protocol}://${host}${imageUrl}`;
      }

      // Fetch the image
      const imageResponse = await fetch(fullImageUrl);
      if (!imageResponse.ok) {
        return res.status(400).json({ error: "Could not fetch image from URL" });
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

      const prompt = `Analyze this drone photography image and provide:
1. A creative title that captures the essence of the shot (keep it under 50 characters)
2. The likely location or type of location shown (be specific if recognizable landmarks are visible, otherwise describe the general area type)

Please respond in JSON format like this:
{
  "title": "Your creative title here",
  "location": "Specific location or area description"
}

Focus on what makes this aerial perspective unique and interesting. For titles, consider the composition, lighting, subject matter, and mood. For locations, be as specific as possible based on visible landmarks, geography, or architectural features.`;

      const result = await model.generateContent([
        {
          inlineData: {
            data: imageBase64,
            mimeType: mimeType,
          },
        },
        prompt,
      ]);

      const response = await result.response;
      const text = response.text();
      
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }
        
        const analysisResult = JSON.parse(jsonMatch[0]);
        res.json(analysisResult);
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        console.error("AI response text:", text);
        res.status(500).json({ error: "Could not parse AI response" });
      }
    } catch (error) {
      console.error("Error analyzing photo with AI:", error);
      res.status(500).json({ error: "Failed to analyze photo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
