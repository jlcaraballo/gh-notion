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

  console.log("EVENT TYPE:", eventType);

  if (eventType === "push") {
    const push = github.context.payload as PushEvent;
    const branchName = push.ref.replace("refs/heads/", "");

    await createBrachEvent(notion, notionDatabase, branchName);

    push.commits.forEach(
      async (commit) => await createCommitEvent(notion, notionDatabase, commit)
    );

    if (push.ref.includes("refs/tags/")) {
      const octokit = github.getOctokit(token);

      const tag = push.ref.replace("refs/tags/", "");

      console.log("New tag created:", tag);

      const owner = github.context.repo.owner;
      const repo = github.context.repo.repo;

      const { data: pullRequest } = await octokit.rest.pulls.list({
        owner,
        repo,
        state: "closed",
        base: tag,
      });

      console.log("PULL REQUEST", JSON.stringify(pullRequest, null, 2));
    }
  }

  if (eventType === "pull_request") {
    const { pull_request } = github.context.payload as PullRequestEvent;
    await createPullRequestEvent(notion, notionDatabase, token, pull_request);
  }

  if (eventType === "release") {
    // TODO: move to another file
    const octokit = github.getOctokit(token);

    const owner = github.context.repo.owner;
    const release = github.context.payload.release;
    const repo = github.context.repo.repo;
    const releaseTag = release.tag_name;
    const releaseName = release.name;

    console.log("New release created:", releaseTag, releaseName);

    const { data: pullRequest } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "closed",
      base: releaseTag,
    });

    console.log("PULL REQUEST", JSON.stringify(pullRequest, null, 2));

    // TODO: by each pull request, find the issue and update
    // the version property with the release tag
  }
};

main()
  .then(() => undefined)
  .catch((err) => {
    console.log("ERROR", err);
    core.setFailed(err.message);
  });
