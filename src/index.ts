import { getInput, setFailed, setOutput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Context } from "@actions/github/lib/context";
import { IssueCommentCreatedEvent } from "@octokit/webhooks-types";

import { Commander } from "./commander";
import { Commenter } from "./commenters";
import { generateCoreLogger } from "./util";

const getRepo = (ctx: Context) => {
  let repo = getInput("repo", { required: false });
  if (!repo) {
    repo = ctx.repo.repo;
  }

  let owner = getInput("owner", { required: false });
  if (!owner) {
    owner = ctx.repo.owner;
  }

  return { repo, owner };
};

const repo = getRepo(context);

setOutput("repo", `${repo.owner}/${repo.repo}`);
const scripts =
  getInput("commands-directory", { required: false }) ?? "./github/commands";

const logger = generateCoreLogger();
const commander = new Commander(scripts, logger);

// We always parse the commands and generate docs on comment or PRs
commander
  .getCommands()
  .then(async (commands) => {
    logger.info(
      `Found ${commands.length} valid commands: ${commands
        .map(({ name }) => name)
        .join(", ")}`,
    );
    await (await commander.documentCommands()).write();
  })
  .catch(setFailed);

// We parse commands only in the issue_comment event
if (context.payload.comment) {
  const token = getInput("GITHUB_TOKEN", { required: true });

  const event = context.payload as IssueCommentCreatedEvent;
  const commands: string[] = event.comment.body.trim().split("\n");

  const actionUrl = `${context.serverUrl}/${repo.owner}/${repo.repo}/actions/runs/${context.runId}`;
  const commenter = new Commenter(
    getOctokit(token),
    repo,
    event,
    actionUrl,
    logger,
  );

  commander
    .parseComment(commands)
    .then(async (output) => {
      setOutput("commands", output);
      await commenter.commentRun();
    })
    .catch(async (error) => {
      await commenter.commentError();
      setFailed(error as Error);
    });
}
