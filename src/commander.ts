import { summary } from "@actions/core";
import { readFile } from "fs/promises";
import path from "path";
import { parse } from "yaml";

import { ActionLogger } from "./github/types";
import { Command } from "./schema/command";
import { validateConfig } from "./schema/validator";
import { CommandError, findFilesWithExtension, ParameterError } from "./util";

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
      this.logger.info(`Parsing ${file}`);
      const command = parse(content) as Command;
      command.filename = path.basename(file, ".yml");
      command.location = path.dirname(file);
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
        .addRaw(`How to run: <code>/cmd ${command.filename}</code>`)
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
      // parse "/cmd command"
      const [_, command] = comment.trim().split(" ");

      this.logger.info(`Searching for command '${command}'`);

      const matchingCommand = commands.findIndex(
        ({ filename }) => filename === command,
      );
      if (matchingCommand < 0) {
        throw new Error(
          `Command ${command} not found. ` +
            "Please see the documentation for valid commands",
        );
      }

      const matching = commands[matchingCommand];
      const commandParameters = this.parseCommand(matching, comment);
      outputs.push({
        name: matching.name,
        command: `${matching.commandStart} ${commandParameters}`,
      });
    }

    return outputs;
  }

  private parseCommand(command: Command, lineContent: string): string {
    const params = lineContent.trim().replace("/bot ", "").split(" ");
    if (!command.parameters) {
      return "";
    }
    // The command is simply `/bot command`
    if (params.length < 1) {
      throw new Error(
        `Command ${lineContent} requires parameters for ${command.name} to work.` +
          "Please refer to the documentation.",
      );
    }
    // We extract the command "parameter" field
    const [_, parameter] = params;
    let paramIndex = command.parameters.findIndex(
      (param) => param.name === parameter,
    );
    if (paramIndex === -1) {
      paramIndex = command.parameters.findIndex(
        (param) => param.name === "default",
      );
      if (paramIndex === -1) {
        throw new CommandError(
          command,
          `Now parameter named ${parameter} nor a default value` +
            `Allowed options are ${JSON.stringify(command.parameters.map(({ name }) => name))}`,
        );
      }
    }

    const commandParameter = command.parameters[paramIndex];

    // From all the `--arg=value` we take the `arg` field (in between `--` and `=`)
    const regexToFindArgument = /--([^=]+)=/;
    const lineArguments = params.map(
      (text) => text.match(regexToFindArgument)?.[1],
    );

    const saneParams: string[] = [];

    for (const argument of commandParameter.args) {
      // We get the matching parameter
      const i = lineArguments.indexOf(argument.arg);

      if (i < 0) {
        if (argument.type === "one_of") {
          // We assign the first value
          saneParams.push(
            `--${argument.arg}=${(argument.input as string[])[0]}`,
          );
          continue;
        }

        throw new ParameterError(
          command,
          commandParameter,
          `No argument set for ${argument.arg}`,
        );
      } else {
        const userArg = params[i];
        const argValue = userArg.split("=")[1];

        const { type } = argument;
        switch (type) {
          case "one_of":
            if ((argument.input as string[]).indexOf(argValue) < 0) {
              throw new ParameterError(
                command,
                commandParameter,
                `Argument ${argValue} does not match allowed values ${JSON.stringify(argument.input)}`,
              );
            }
            break;
          case "regex":
            if (!argValue.match(argument.input as string)) {
              throw new ParameterError(
                command,
                commandParameter,
                `${argValue} does not match regex expression ${argument.input as string}`,
              );
            }
            break;
          case "string":
            // Do we need any checks here?
            break;
          default:
            throw new ParameterError(
              command,
              commandParameter,
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              `Type ${type} not handled`,
            );
        }

        saneParams.push(userArg);
      }
    }
    return saneParams.join(" ");
  }
}
