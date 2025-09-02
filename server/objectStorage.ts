import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";
import sharp from "sharp";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// The object storage client is used to interact with the object storage service.
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
  constructor() {}

  // Gets the public object search paths.
  getPublicObjectSearchPaths(): Array<string> {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr
          .split(",")
          .map((path) => path.trim())
          .filter((path) => path.length > 0)
      )
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
          "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
      );
    }
    return paths;
  }

  // Gets the private object directory.
  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    if (!dir) {
      throw new Error(
        "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
          "tool and set PRIVATE_OBJECT_DIR env var."
      );
    }
    return dir;
  }

  // Upload a file to object storage and return the public URL
  async uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    const publicPaths = this.getPublicObjectSearchPaths();
    if (publicPaths.length === 0) {
      throw new Error("No public object search paths configured");
    }

    // Use the first public path for uploads
    const publicPath = publicPaths[0];
    const { bucketName, objectName: basePath } = parseObjectPath(publicPath);
    
    // Generate unique filename
    const timestamp = Date.now();
    const uuid = randomUUID();
    const extension = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${timestamp}-${uuid}.${extension}`;
    const fullObjectPath = `${basePath}/${uniqueFileName}`;

    const bucket = objectStorageClient.bucket(bucketName);
    const fileObj = bucket.file(fullObjectPath);

    // Upload the file
    await fileObj.save(file, {
      metadata: {
        contentType: mimeType,
      },
    });

    // Return the public URL
    return `/public-objects/${uniqueFileName}`;
  }

  // Upload image with thumbnail generation for progressive loading
  async uploadImageWithThumbnail(file: Buffer, fileName: string, mimeType: string): Promise<{fullUrl: string, thumbnailUrl: string}> {
    const publicPaths = this.getPublicObjectSearchPaths();
    if (publicPaths.length === 0) {
      throw new Error("No public object search paths configured");
    }

    // Use the first public path for uploads
    const publicPath = publicPaths[0];
    const { bucketName, objectName: basePath } = parseObjectPath(publicPath);
    
    // Generate unique filename
    const timestamp = Date.now();
    const uuid = randomUUID();
    const extension = fileName.split('.').pop() || 'jpg';
    const baseFileName = `${timestamp}-${uuid}`;
    const fullFileName = `${baseFileName}.${extension}`;
    const thumbnailFileName = `${baseFileName}_thumb.${extension}`;

    const bucket = objectStorageClient.bucket(bucketName);

    // Upload original full-resolution image
    const fullFileObj = bucket.file(`${basePath}/${fullFileName}`);
    await fullFileObj.save(file, {
      metadata: {
        contentType: mimeType,
      },
    });

    // Generate and upload thumbnail (300px width, maintain aspect ratio)
    const thumbnailBuffer = await sharp(file)
      .resize(300, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbnailFileObj = bucket.file(`${basePath}/${thumbnailFileName}`);
    await thumbnailFileObj.save(thumbnailBuffer, {
      metadata: {
        contentType: 'image/jpeg',
      },
    });

    return {
      fullUrl: `/public-objects/${fullFileName}`,
      thumbnailUrl: `/public-objects/${thumbnailFileName}`
    };
  }

  // Search for a public object from the search paths.
  async searchPublicObject(filePath: string): Promise<File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;

      // Full path format: /<bucket_name>/<object_name>
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      // Check if file exists
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }

    return null;
  }

  // Downloads an object to the response.
  async downloadObject(file: File, res: Response, cacheTtlSec: number = 3600) {
    try {
      // Get file metadata
      const [metadata] = await file.getMetadata();
      
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      // Stream the file to the response
      const stream = file.createReadStream();

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  const pathParts = path.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }

  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");

  return {
    bucketName,
    objectName,
  };
}