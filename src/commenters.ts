import { IssueCommentCreatedEvent } from "@octokit/webhooks-types";

import { ActionLogger, GitHubClient } from "./github/types";

export class Commenter {
  constructor(
    private readonly github: GitHubClient,
    private readonly repo: { owner: string; repo: string },
    private readonly comment: IssueCommentCreatedEvent,
    private readonly actionUrl: string,
    private readonly logger: ActionLogger,
  ) {}

  async commentError(): Promise<void> {
    this.logger.debug(`Reacting with -1 to ${this.comment.comment.id}`);
    await this.github.rest.reactions.createForIssueComment({
      ...this.repo,
      comment_id: this.comment.comment.id,
      content: "-1",
    });

    this.logger.debug(`Commenting action url to ${this.comment.comment.id}`);

    await this.github.rest.issues.createComment({
      ...this.repo,
      issue_number: this.comment.issue.number,
      body: `❌ Failed while parsing command. Find error in <a href="${this.actionUrl}">the logs</a>.`,
    });
  }

  async commentRun(): Promise<void> {
    this.logger.debug(`Reacting +1 to ${this.comment.comment.id}`);
    await this.github.rest.reactions.createForIssueComment({
      ...this.repo,
      comment_id: this.comment.comment.id,
      content: "+1",
    });

    this.logger.debug(`Commenting action url to ${this.comment.comment.id}`);

    await this.github.rest.issues.createComment({
      ...this.repo,
      issue_number: this.comment.issue.number,
      body: `Run has been triggered. Follow it in <a href="${this.actionUrl}">here</a>.`,
    });
  }
}
