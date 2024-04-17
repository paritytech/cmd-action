import { parse } from "yaml";

import { ActionLogger } from "./github/types";
import { Command } from "./schema/command";
import { validateConfig } from "./schema/validator";
import { findFilesWithExtension } from "./util";

/** The 'commander' of the command actions */
export class Commander {
  private commands?: Command[];
  constructor(
    private readonly scriptsDiretory: string,
    private readonly logger: ActionLogger,
  ) {}

  /** Get all the commands from a specific directory and validates them */
  async getCommands(): Promise<Command[]> {
    if (this.commands) {
      return this.commands;
    }
    const files = await findFilesWithExtension(this.scriptsDiretory, "yml");
    const commands: Command[] = [];
    for (const file of files) {
      const command = parse(file) as Command;
      this.logger.info(`Parsing ${file}`);
      validateConfig(command);
      commands.push(command);
    }

    this.commands = commands;
    return commands;
  }
}
