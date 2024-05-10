import { summary } from "@actions/core";
import { readFile } from "fs/promises";
import { dirname } from "path";
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
      const content = await readFile(file, "utf-8");
      const command = parse(content) as Command;
      command.location = dirname(file);
      this.logger.info(`Parsing ${file}`);
      validateConfig(command);
      commands.push(command);
    }

    this.commands = commands;
    return commands;
  }

  async documentCommands(): Promise<typeof summary> {
    this.logger.info("Generating documentation");
    const commands = await this.getCommands();
    let text = summary
      .addHeading("Commands")
      .addRaw(`There are ${commands.length} available commands`)
      .addEOL();
    for (const command of commands) {
      text = text.addHeading(command.name, 2);
      if (command.description) {
        text = text.addRaw(command.description).addEOL();
      }
      text = text
        .addEOL()
        .addDetails("File location", `<code>${command.location}</code>`)
        .addEOL();
      if (command.machine) {
        text = text.addHeading("Runs on").addList(command.machine);
      }
      if (command.timeout) {
        text = text
          .addHeading("Timeout", 4)
          .addRaw(`${command.timeout} seconds`)
          .addEOL();
      }

      text = text
        .addHeading("Command that runs", 4)
        .addCodeBlock(command.commandStart, "shell")
        .addEOL();
    }

    return text;
  }

  async parseComment(
    lines: string[],
  ): Promise<{ name: string; command: string }[]> {
    const commands = await this.getCommands();
    const outputs: { name: string; command: string }[] = [];
    for (const comment of lines) {
      // parse "/bot command"
      const [_, command] = comment.trim().split(" ");

      this.logger.info(`Searching for command '${command}'`);

      const matchingCommand = commands.findIndex(
        ({ name }) => name === command,
      );
      if (matchingCommand < 0) {
        throw new Error(
          `Command ${command} not found. ` +
            "Please see the documentation for valid commands",
        );
      }

      const matching = commands[matchingCommand];
      outputs.push({ name: matching.name, command: matching.commandStart });
    }

    return outputs;
  }
}
