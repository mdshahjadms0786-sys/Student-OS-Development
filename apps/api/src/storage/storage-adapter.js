import fs from "node:fs/promises";
import path from "node:path";

export class LocalStorageAdapter {
  constructor(baseDir = "./uploads") {
    this.baseDir = path.resolve(process.cwd(), baseDir);
  }

  _resolveSafePath(storageKey) {
    const safePath = path.resolve(this.baseDir, storageKey);
    const baseWithSep = this.baseDir.endsWith(path.sep)
      ? this.baseDir
      : this.baseDir + path.sep;
    if (safePath !== this.baseDir && !safePath.startsWith(baseWithSep)) {
      throw new Error("Invalid storage path");
    }
    return safePath;
  }

  async ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
  }

  async uploadFile(file, directory = "general") {
    const safeDir = this._resolveSafePath(directory);
    await this.ensureDir(safeDir);

    const safeTimestamp = Date.now();
    const cleanFilename = path
      .basename(file.filename)
      .replace(/[^a-zA-Z0-9.-]/g, "_");
    const storageKey = path.posix.join(
      directory.replace(/\\/g, "/"),
      `${safeTimestamp}-${cleanFilename}`
    );
    const fullPath = this._resolveSafePath(storageKey);

    await fs.writeFile(fullPath, file.buffer);

    return {
      storageKey,
      filename: file.filename,
      size: file.size,
      mimeType: file.mimeType,
      url: `/api/storage/${storageKey}`,
    };
  }

  async getFile(storageKey) {
    const fullPath = this._resolveSafePath(storageKey);
    return await fs.readFile(fullPath);
  }

  async deleteFile(storageKey) {
    const fullPath = this._resolveSafePath(storageKey);
    try {
      await fs.unlink(fullPath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

// Storage Factory
export function createStorageAdapter(driver, basePath = "./uploads") {
  switch (driver) {
    case "local":
      return new LocalStorageAdapter(basePath);
    case "s3":
    case "r2":
      // Architecture prepared for cloud storage drivers
      throw new Error(
        `Storage driver ${driver} requires production S3/R2 configuration`
      );
    default:
      return new LocalStorageAdapter(basePath);
  }
}
