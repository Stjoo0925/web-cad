import path from "node:path";

export interface ResolveStorageRootOptions {
  rootDir?: string;
  storageRootEnv?: string;
  cwd?: string;
}

export function resolveStorageRoot({
  rootDir,
  storageRootEnv = process.env.WEB_CAD_STORAGE_ROOT_CONTAINER,
  cwd = process.cwd()
}: ResolveStorageRootOptions = {}): string {
  if (rootDir) {
    return rootDir;
  }

  if (storageRootEnv) {
    return storageRootEnv;
  }

  return path.resolve(cwd, "data");
}