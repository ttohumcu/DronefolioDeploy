import { type User, type InsertUser, type MediaItem, type InsertMediaItem, type Setting, type InsertSetting, MediaType, users, mediaItems, settings } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updatePassword(username: string, newPassword: string): Promise<boolean>;
  
  getMediaItems(): Promise<MediaItem[]>;
  getMediaItemsByType(type: MediaType): Promise<MediaItem[]>;
  getMediaItemsByLocation(location: string): Promise<MediaItem[]>;
  createMediaItem(mediaItem: InsertMediaItem): Promise<MediaItem>;
  deleteMediaItem(id: string): Promise<boolean>;
  
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(setting: InsertSetting): Promise<Setting>;
  getSettings(): Promise<Setting[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private mediaItems: Map<string, MediaItem>;
  private settings: Map<string, Setting>;

  constructor() {
    this.users = new Map();
    this.mediaItems = new Map();
    this.settings = new Map();
    
    // Initialize default settings and admin user
    this.initializeDefaultSettings();
    this.initializeDefaultUser();
  }

  private async initializeDefaultSettings() {
    const defaultSettings = [
      { key: 'hero_image_url', value: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&h=1380' },
      { key: 'footer_image_url', value: 'https://images.unsplash.com/photo-1519817914152-22d216bb9170?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&h=600' },
      { key: 'twitter_url', value: 'https://x.com/yourprofile' },
      { key: 'youtube_url', value: 'https://youtube.com/yourchannel' },
      { key: 'personal_url', value: 'https://your-site.com' }
    ];

    for (const setting of defaultSettings) {
      const id = randomUUID();
      this.settings.set(setting.key, { id, ...setting });
    }
  }

  private async initializeDefaultUser() {
    // Create a default admin user for development
    const defaultUser: InsertUser = {
      username: "admin",
      password: "admin123"
    };
    
    const id = randomUUID();
    const user: User = { ...defaultUser, id };
    this.users.set(id, user);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updatePassword(username: string, newPassword: string): Promise<boolean> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      return false;
    }
    
    const updatedUser = { ...user, password: newPassword };
    this.users.set(user.id, updatedUser);
    return true;
  }

  async getMediaItems(): Promise<MediaItem[]> {
    return Array.from(this.mediaItems.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getMediaItemsByType(type: MediaType): Promise<MediaItem[]> {
    return Array.from(this.mediaItems.values())
      .filter(item => item.mediaType === type)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getMediaItemsByLocation(location: string): Promise<MediaItem[]> {
    return Array.from(this.mediaItems.values())
      .filter(item => item.location.toLowerCase().includes(location.toLowerCase()))
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createMediaItem(insertMediaItem: InsertMediaItem): Promise<MediaItem> {
    const id = randomUUID();
    const mediaItem: MediaItem = { 
      ...insertMediaItem, 
      id,
      source: insertMediaItem.source || "manual",
      createdAt: new Date(),
      thumbnailUrl: insertMediaItem.thumbnailUrl || null
    };
    this.mediaItems.set(id, mediaItem);
    return mediaItem;
  }

  async deleteMediaItem(id: string): Promise<boolean> {
    return this.mediaItems.delete(id);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    return this.settings.get(key);
  }

  async setSetting(insertSetting: InsertSetting): Promise<Setting> {
    const existing = this.settings.get(insertSetting.key);
    if (existing) {
      const updated = { ...existing, value: insertSetting.value };
      this.settings.set(insertSetting.key, updated);
      return updated;
    } else {
      const id = randomUUID();
      const setting: Setting = { id, ...insertSetting };
      this.settings.set(insertSetting.key, setting);
      return setting;
    }
  }

  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize default data on startup
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    // Check if admin user exists, if not create one
    const adminUser = await this.getUserByUsername("admin");
    if (!adminUser) {
      await this.createUser({
        username: "admin",
        password: "admin123"
      });
    }

    // Check if default settings exist, if not create them
    const existingSettings = await this.getSettings();
    if (existingSettings.length === 0) {
      const defaultSettings = [
        { key: 'hero_image_url', value: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&h=1380' },
        { key: 'footer_image_url', value: 'https://images.unsplash.com/photo-1519817914152-22d216bb9170?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&h=600' },
        { key: 'twitter_url', value: 'https://x.com/yourprofile' },
        { key: 'youtube_url', value: 'https://youtube.com/yourchannel' },
        { key: 'personal_url', value: 'https://your-site.com' }
      ];

      for (const setting of defaultSettings) {
        await this.setSetting(setting);
      }
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updatePassword(username: string, newPassword: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.username, username))
      .returning();
    return result.length > 0;
  }

  async getMediaItems(): Promise<MediaItem[]> {
    return await db.select().from(mediaItems).orderBy(mediaItems.createdAt);
  }

  async getMediaItemsByType(type: MediaType): Promise<MediaItem[]> {
    return await db.select().from(mediaItems)
      .where(eq(mediaItems.mediaType, type))
      .orderBy(mediaItems.createdAt);
  }

  async getMediaItemsByLocation(location: string): Promise<MediaItem[]> {
    // Using SQL ILIKE for case-insensitive search
    return await db.select().from(mediaItems)
      .where(sql`${mediaItems.location} ILIKE ${`%${location}%`}`)
      .orderBy(mediaItems.createdAt);
  }

  async createMediaItem(insertMediaItem: InsertMediaItem): Promise<MediaItem> {
    const [mediaItem] = await db.insert(mediaItems).values(insertMediaItem).returning();
    return mediaItem;
  }

  async deleteMediaItem(id: string): Promise<boolean> {
    const result = await db.delete(mediaItems).where(eq(mediaItems.id, id)).returning();
    return result.length > 0;
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting;
  }

  async setSetting(insertSetting: InsertSetting): Promise<Setting> {
    // Try to update first, if no rows affected then insert
    const [existing] = await db.select().from(settings).where(eq(settings.key, insertSetting.key));
    
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ value: insertSetting.value })
        .where(eq(settings.key, insertSetting.key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(settings).values(insertSetting).returning();
      return created;
    }
  }

  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }
}

export const storage = new DatabaseStorage();
