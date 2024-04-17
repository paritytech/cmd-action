import { getInput, info, setFailed, setOutput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Context } from "@actions/github/lib/context";
import { PullRequest } from "@octokit/webhooks-types";

import { Commander } from "./commander";
import { PullRequestApi } from "./github/pullRequest";
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

// Handle both pull_request and pull_request_target
if (context.eventName.includes("pull_request")) {
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
}

const token = getInput("GITHUB_TOKEN", { required: true });
if (context.payload.pull_request) {
  const api = new PullRequestApi(getOctokit(token), generateCoreLogger());
  const author = api.getPrAuthor(context.payload.pull_request as PullRequest);
  info("Author of the PR is " + author);
}
