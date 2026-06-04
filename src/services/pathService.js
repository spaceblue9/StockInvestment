import fs from "fs";
import path from "path";

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
export const OUTPUT_DIR = path.join(DATA_DIR, "outputs");

export function ensureDataDirs() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

export function outputPath(filename) {
  return path.join(OUTPUT_DIR, filename);
}
