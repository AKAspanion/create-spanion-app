#!/usr/bin/env node

import fs from "fs";
import path from "path";

export async function scanLongFiles({
  lineThreshold = 500,
  rootDir = ".",
}: { lineThreshold?: number; rootDir?: string } = {}): Promise<void> {
  function isTextFile(filePath: string): boolean {
    const binaryExts = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".webp",
      ".ico",
      ".ttf",
      ".woff",
      ".woff2",
      ".mp3",
      ".mp4",
      ".pdf",
      ".zip",
      ".tar",
      ".gz",
      ".exe",
      ".dll",
      ".so",
      ".dylib",
      ".bin",
      ".avif",
    ];
    return !binaryExts.includes(path.extname(filePath).toLowerCase());
  }

  function countLines(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      let lines = 0;
      const stream = fs.createReadStream(filePath);
      stream.on("error", reject);
      stream.on("data", (buf: Buffer) => {
        for (let i = 0; i < buf.length; ++i) {
          if (buf[i] === 10) lines++;
        }
      });
      stream.on("end", () => resolve(lines));
    });
  }

  async function findLongFiles(dir: string): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await findLongFiles(fullPath);
      } else if (entry.isFile() && isTextFile(fullPath)) {
        try {
          const lines = await countLines(fullPath);
          if (lines > lineThreshold) {
            console.log(`${fullPath} (${lines} lines)`);
          }
        } catch (err) {
          // Ignore unreadable files
        }
      }
    }
  }

  await findLongFiles(rootDir);
}

// CLI usage for direct execution (ts-node or compiled)
if (
  (process.argv[1] && process.argv[1].endsWith("long-files-scannner.ts")) ||
  process.argv[1]?.endsWith("long-files-scannner.js")
) {
  const threshold = parseInt(process.argv[2], 10) || 500;
  const dir = process.argv[3] || ".";
  scanLongFiles({ lineThreshold: threshold, rootDir: dir });
}
