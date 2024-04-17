import { findFilesWithExtension } from "../util";

test("adds 1 + 2 to equal 3", () => {
  expect(1 + 2).toBe(3);
});

test("find files", async () => {
  const files = await findFilesWithExtension(".github/scripts", "yml");
  expect(files.length).toBeGreaterThan(0);
});
