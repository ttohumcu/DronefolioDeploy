import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

interface ThumbnailOptions {
  width: number;
  height: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

interface ThumbnailResult {
  thumbnailPath: string;
  thumbnailUrl: string;
  size: number;
}

export class ThumbnailService {
  private readonly thumbnailDir = "thumbnails";
  
  private getBaseUrl(): string {
    return process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  }

  constructor() {
    this.ensureThumbnailDirectory();
  }

  private async ensureThumbnailDirectory() {
    try {
      await fs.mkdir(this.thumbnailDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create thumbnail directory:", error);
    }
  }

  /**
   * Generate thumbnail from a local image file
   */
  async generateThumbnailFromFile(
    inputPath: string, 
    options: ThumbnailOptions = { width: 200, height: 200, quality: 60, format: 'jpeg' }
  ): Promise<ThumbnailResult> {
    const thumbnailId = randomUUID();
    const extension = options.format || 'jpeg';
    const thumbnailFilename = `${thumbnailId}.${extension}`;
    const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);

    try {
      const result = await sharp(inputPath)
        .resize(options.width, options.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ 
          quality: options.quality || 60,
          progressive: true,
          mozjpeg: true 
        })
        .toFile(thumbnailPath);

      return {
        thumbnailPath,
        thumbnailUrl: `${this.getBaseUrl()}/thumbnails/${thumbnailFilename}`,
        size: result.size
      };
    } catch (error) {
      console.error("Failed to generate thumbnail:", error);
      throw new Error(`Thumbnail generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate thumbnail from a URL (downloads the image first)
   */
  async generateThumbnailFromUrl(
    imageUrl: string, 
    options: ThumbnailOptions = { width: 200, height: 200, quality: 60, format: 'jpeg' }
  ): Promise<ThumbnailResult> {
    const tempId = randomUUID();
    const tempPath = path.join(this.thumbnailDir, `temp_${tempId}`);

    try {
      // Convert relative URLs to absolute URLs
      let fullUrl = imageUrl;
      if (imageUrl.startsWith('/')) {
        fullUrl = `${this.getBaseUrl()}${imageUrl}`;
      }

      // Download the image
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      await fs.writeFile(tempPath, buffer);

      // Generate thumbnail
      const result = await this.generateThumbnailFromFile(tempPath, options);

      // Clean up temp file
      await fs.unlink(tempPath).catch(() => {}); // Ignore cleanup errors

      return result;
    } catch (error) {
      // Clean up temp file on error
      await fs.unlink(tempPath).catch(() => {});
      console.error("Failed to generate thumbnail from URL:", error);
      throw new Error(`Thumbnail generation from URL failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate thumbnail from buffer data
   */
  async generateThumbnailFromBuffer(
    buffer: Buffer, 
    options: ThumbnailOptions = { width: 200, height: 200, quality: 60, format: 'jpeg' }
  ): Promise<ThumbnailResult> {
    const thumbnailId = randomUUID();
    const extension = options.format || 'jpeg';
    const thumbnailFilename = `${thumbnailId}.${extension}`;
    const thumbnailPath = path.join(this.thumbnailDir, thumbnailFilename);

    try {
      const result = await sharp(buffer)
        .resize(options.width, options.height, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ 
          quality: options.quality || 60,
          progressive: true,
          mozjpeg: true 
        })
        .toFile(thumbnailPath);

      return {
        thumbnailPath,
        thumbnailUrl: `${this.getBaseUrl()}/thumbnails/${thumbnailFilename}`,
        size: result.size
      };
    } catch (error) {
      console.error("Failed to generate thumbnail from buffer:", error);
      throw new Error(`Thumbnail generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate multiple thumbnail sizes
   */
  async generateMultipleThumbnails(
    source: string | Buffer,
    sizes: ThumbnailOptions[] = [
      { width: 150, height: 150, quality: 60, format: 'jpeg' }, // Small
      { width: 400, height: 300, quality: 80, format: 'jpeg' }, // Medium  
      { width: 800, height: 600, quality: 85, format: 'jpeg' }  // Large
    ]
  ): Promise<{ small?: ThumbnailResult; medium?: ThumbnailResult; large?: ThumbnailResult }> {
    const results: any = {};

    try {
      if (typeof source === 'string') {
        // URL (relative or absolute)
        if (source.startsWith('http') || source.startsWith('/')) {
          const [small, medium, large] = await Promise.all([
            this.generateThumbnailFromUrl(source, sizes[0]),
            this.generateThumbnailFromUrl(source, sizes[1]),
            this.generateThumbnailFromUrl(source, sizes[2])
          ]);
          results.small = small;
          results.medium = medium; 
          results.large = large;
        } else {
          // File path
          const [small, medium, large] = await Promise.all([
            this.generateThumbnailFromFile(source, sizes[0]),
            this.generateThumbnailFromFile(source, sizes[1]),
            this.generateThumbnailFromFile(source, sizes[2])
          ]);
          results.small = small;
          results.medium = medium;
          results.large = large;
        }
      } else {
        // Buffer
        const [small, medium, large] = await Promise.all([
          this.generateThumbnailFromBuffer(source, sizes[0]),
          this.generateThumbnailFromBuffer(source, sizes[1]),
          this.generateThumbnailFromBuffer(source, sizes[2])
        ]);
        results.small = small;
        results.medium = medium;
        results.large = large;
      }

      return results;
    } catch (error) {
      console.error("Failed to generate multiple thumbnails:", error);
      throw error;
    }
  }

  /**
   * Delete thumbnail files
   */
  async deleteThumbnail(thumbnailUrl: string): Promise<boolean> {
    try {
      const filename = path.basename(thumbnailUrl);
      const filePath = path.join(this.thumbnailDir, filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error("Failed to delete thumbnail:", error);
      return false;
    }
  }

  /**
   * Check if image URL is valid and processable
   */
  async validateImageUrl(imageUrl: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      return response.ok && contentType?.startsWith('image/') === true;
    } catch {
      return false;
    }
  }
}

export const thumbnailService = new ThumbnailService();