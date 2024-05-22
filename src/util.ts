import { debug, error, info, warning } from "@actions/core";
import fs from "fs/promises";
import { resolve } from "path";

import { ActionLogger } from "./github/types";
import { Command, Parameter } from "./schema/command";

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

export class CommandError extends Error {
  constructor(command: Command, message: string) {
    const msg = `Error with '${command.name}': ${message}`;
    super(msg);
    this.message = msg;
  }
}

export class ParameterError extends Error {
  constructor(command: Command, parameter: Parameter, message: string) {
    const msg = `Error with ${command.name}'s parameter '${parameter.name}': ${message}`;
    super(msg);
    this.message = msg;
  }
}
