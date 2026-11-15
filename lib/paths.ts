import path from "path";

export function dataDir() {
  return process.env.DATA_DIR || process.cwd();
}

export function dbPath() {
  return path.join(dataDir(), "journal.db");
}

export function uploadDir() {
  return path.join(dataDir(), "uploads");
}
