import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  PullRequestEvent,
  PushEvent,
} from "@octokit/webhooks-definitions/schema";

import { createBrachevent as createBrachEvent } from "./createBrachEvent";
import { createCommitEvent } from "./createCommitEvent";
import { createPullRequestEvent } from "./createPullRequestEvent";

import { instance } from "./services/client";

const token = core.getInput("GITHUB_TOKEN");
const notionApiKey = core.getInput("NOTION_SECRET");
const notionDatabase = core.getInput("NOTION_DATABASE");

export const main = async () => {
  if (!token) throw new Error("Github token not found");
  if (!notionApiKey) throw new Error("Notion secret key nor found");
  if (!notionDatabase) throw new Error("Notion DATABASE ID not found");

  const notion = instance(notionApiKey);

  const eventType = github.context.eventName;

  console.log({ action: github.context.action });

  if (eventType === "push") {
    const push = github.context.payload as PushEvent;
    const branchName = push.ref.replace("refs/heads/", "");

    await createBrachEvent(notion, notionDatabase, branchName);

    push.commits.forEach(
      async (commit) => await createCommitEvent(notion, notionDatabase, commit)
    );
  }

  if (eventType === "pull_request") {
    const { pull_request } = github.context.payload as PullRequestEvent;
    await createPullRequestEvent(notion, notionDatabase, token, pull_request);
  }
};

main()
  .then(() => {})
  .catch((err) => {
    console.log("ERROR", err);
    core.setFailed(err.message);
  });
