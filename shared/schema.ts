import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const mediaItems = pgTable("media_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  location: text("location").notNull(),
  mediaType: text("media_type").notNull(), // '4K Photo', '180° Panorama', '360° Panorama', 'Video'
  url: text("url").notNull(), // For photos: image URL, for videos: YouTube URL
  thumbnailUrl: text("thumbnail_url"), // Low-resolution thumbnail for faster loading
  source: text("source").default("manual"), // 'manual', 'youtube_import'
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMediaItemSchema = createInsertSchema(mediaItems).pick({
  title: true,
  location: true,
  mediaType: true,
  url: true,
  thumbnailUrl: true,
  source: true,
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type MediaItem = typeof mediaItems.$inferSelect;
export type InsertMediaItem = z.infer<typeof insertMediaItemSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export enum MediaType {
  PHOTO_4K = 'Photo',
  PANORAMA_180 = '180° Panorama', 
  PANORAMA_360 = '360° Panorama',
  VIDEO = 'Video',
}
