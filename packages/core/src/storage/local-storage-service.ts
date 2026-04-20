import path from "node:path";
import { mkdir, readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import type { ReadStream } from "node:fs";

function safeSegments(logicalPath: string): string[] {
  const segments = logicalPath.split("/").filter(Boolean);
  for (const segment of segments) {
    if (segment === "." || segment === "..") {
      throw new Error(`Unsafe logical path: ${logicalPath}`);
    }
  }
  return segments;
}

export interface LocalStorageServiceOptions {
  rootDir: string;
}

export class LocalStorageService {
  private readonly rootDir: string;

  constructor({ rootDir }: LocalStorageServiceOptions) {
    this.rootDir = rootDir;
  }

  resolve(logicalPath: string): string {
    return path.join(this.rootDir, ...safeSegments(logicalPath));
  }

  async ensureParent(logicalPath: string): Promise<void> {
    await mkdir(path.dirname(this.resolve(logicalPath)), { recursive: true });
  }

  async writeText(logicalPath: string, content: string): Promise<void> {
    await this.ensureParent(logicalPath);
    await writeFile(this.resolve(logicalPath), content, "utf8");
  }

  async readText(logicalPath: string): Promise<string> {
    return readFile(this.resolve(logicalPath), "utf8");
  }

  async writeJson(logicalPath: string, value: unknown): Promise<void> {
    await this.writeText(logicalPath, JSON.stringify(value, null, 2));
  }

  async readJson<T = unknown>(logicalPath: string): Promise<T> {
    return JSON.parse(await this.readText(logicalPath)) as T;
  }

  async writeBuffer(logicalPath: string, content: Buffer): Promise<void> {
    await this.ensureParent(logicalPath);
    await writeFile(this.resolve(logicalPath), content);
  }

  async readBuffer(logicalPath: string): Promise<Buffer> {
    return readFile(this.resolve(logicalPath));
  }

  async exists(logicalPath: string): Promise<boolean> {
    try {
      await stat(this.resolve(logicalPath));
      return true;
    } catch {
      return false;
    }
  }

  async list(logicalDirectoryPath: string): Promise<string[]> {
    const targetPath = this.resolve(logicalDirectoryPath);
    try {
      return await readdir(targetPath);
    } catch (error) {
      if (error && (error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async move(sourceLogicalPath: string, targetLogicalPath: string): Promise<void> {
    await this.ensureParent(targetLogicalPath);
    await rename(this.resolve(sourceLogicalPath), this.resolve(targetLogicalPath));
  }
}