import path from "node:path";

export function resolveStorageRoot({
  rootDir,
  storageRootEnv = process.env.WEB_CAD_STORAGE_ROOT_CONTAINER,
  cwd = process.cwd()
} = {}) {
  if (rootDir) {
    return rootDir;
  }

  if (storageRootEnv) {
    return storageRootEnv;
  }

  return path.resolve(cwd, "data");
}
