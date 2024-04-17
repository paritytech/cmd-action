import { debug, error, info, warning } from "@actions/core";
import fs from "fs/promises";
import { resolve } from "path";

import { ActionLogger } from "./github/types";

export function generateCoreLogger(): ActionLogger {
  return { info, debug, warn: warning, error };
}

export async function findFilesWithExtension(
  dir: string,
  ext: string,
): Promise<string[]> {
  const files: string[] = [];
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      files.push(...(await findFilesWithExtension(res, ext)));
    } else if (res.endsWith(ext)) {
      files.push(res);
    }
  }

  return files;
}
