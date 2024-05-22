import { Commander } from "../commander";
import { generateCoreLogger } from "../util";

test("test command inside repository", async () => {
  const commander = new Commander(".github/scripts", generateCoreLogger());
  const commands = await commander.getCommands();
  expect(commands.length).toBeGreaterThan(0);
});

test("test command with output", async () => {
  const commander = new Commander(".github/scripts", generateCoreLogger());
  const parsedCommand = await commander.parseComment([
    "/cmd example --chain=westend",
  ]);
  expect(parsedCommand[0].command).toEqual(
    'echo "Hello World" --chain=westend',
  );
});
