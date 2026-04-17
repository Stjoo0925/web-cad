import path from "node:path";
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";

function safeSegments(logicalPath) {
  const segments = logicalPath.split("/").filter(Boolean);
  for (const segment of segments) {
    if (segment === "." || segment === "..") {
      throw new Error(`Unsafe logical path: ${logicalPath}`);
    }
  }
  return segments;
}

export class LocalStorageService {
  constructor({ rootDir }) {
    this.rootDir = rootDir;
  }

  resolve(logicalPath) {
    return path.join(this.rootDir, ...safeSegments(logicalPath));
  }

  async ensureParent(logicalPath) {
    await mkdir(path.dirname(this.resolve(logicalPath)), { recursive: true });
  }

  async writeText(logicalPath, content) {
    await this.ensureParent(logicalPath);
    await writeFile(this.resolve(logicalPath), content, "utf8");
  }

  async readText(logicalPath) {
    return readFile(this.resolve(logicalPath), "utf8");
  }

  async writeJson(logicalPath, value) {
    await this.writeText(logicalPath, JSON.stringify(value, null, 2));
  }

  async readJson(logicalPath) {
    return JSON.parse(await this.readText(logicalPath));
  }

  async writeBuffer(logicalPath, content) {
    await this.ensureParent(logicalPath);
    await writeFile(this.resolve(logicalPath), content);
  }

  async readBuffer(logicalPath) {
    return readFile(this.resolve(logicalPath));
  }

  async exists(logicalPath) {
    try {
      await stat(this.resolve(logicalPath));
      return true;
    } catch {
      return false;
    }
  }

  async list(logicalDirectoryPath) {
    const targetPath = this.resolve(logicalDirectoryPath);
    try {
      return await readdir(targetPath);
    } catch (error) {
      if (error && error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async move(sourceLogicalPath, targetLogicalPath) {
    await this.ensureParent(targetLogicalPath);
    await rename(this.resolve(sourceLogicalPath), this.resolve(targetLogicalPath));
  }
}
