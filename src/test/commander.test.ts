import { Commander } from "../commander";
import { generateCoreLogger } from "../util";

test("test command inside repository", async () => {
  const commander = new Commander(".github/scripts", generateCoreLogger());
  const commands = await commander.getCommands();
  expect(commands.length).toBeGreaterThan(0);
});
