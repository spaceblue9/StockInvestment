import fs from "fs";
import path from "path";

export const DATA_DIR = process.env.STOCKINVEST_DATA_DIR
  || (process.env.VERCEL ? path.join("/tmp", "stockinvestment-data") : path.join(process.cwd(), "data"));
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
export const OUTPUT_DIR = path.join(DATA_DIR, "outputs");
export const BACKUP_DIR = path.join(DATA_DIR, "backups");

export function ensureDataDirs() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export function outputPath(filename) {
  return path.join(OUTPUT_DIR, filename);
}
