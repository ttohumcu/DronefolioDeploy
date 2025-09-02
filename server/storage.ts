import { type User, type InsertUser, type MediaItem, type InsertMediaItem, type Setting, type InsertSetting, MediaType } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
    
    // Initialize default settings
    this.initializeDefaultSettings();
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
      createdAt: new Date()
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

export const storage = new MemStorage();
