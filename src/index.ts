import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  CreateEvent,
  PullRequestEvent,
  PushEvent,
} from "@octokit/webhooks-definitions/schema";
import { getPageByCode } from "./getPageByCode";

import { instance, updatePageProps } from "./services/client";

const token = core.getInput("GITHUB_TOKEN");
const notionApiKey = core.getInput("NOTION_SECRET");
const notionDatabase = core.getInput("NOTION_DATABASE");

export const main = async () => {
  if (!token) throw new Error("Github token not found");
  if (!notionApiKey) throw new Error("Notion secret key nor found");
  if (!notionDatabase) throw new Error("Notion DATABASE ID not found");

  const notion = instance(notionApiKey);

  const octokit = github.getOctokit(token);

  const eventType = github.context.eventName;

  if (eventType === "push") {
    const push = github.context.payload as PushEvent;
    push.commits.forEach(async (commit) => {
      const matchs = commit.message.match(/#\w*/);
      const code = matchs && matchs[0];
      if (!code) return;

      const page = await getPageByCode(notion, notionDatabase, code);
      if (!page) return;

      const prop = page.properties["Commits"];

      if (!prop) return;

      const porpBody = {
        commits: {
          rich_text: [
            ...prop.rich_text,
            {
              type: "text",
              text: {
                content: `${commit.message}\n`,
                link: {
                  url: commit.url,
                },
              },
            },
          ],
        },
      };
      await updatePageProps(notion, page.id, porpBody);
    });
  }

  if (eventType === "pull_request") {
    const { pull_request } = github.context.payload as PullRequestEvent;

    const matchs = pull_request.title.match(/#\w*/);
    const code = matchs && matchs[0];
    if (!code) return;

    const page = await getPageByCode(notion, notionDatabase, code);
    if (!page) return;

    const prop = page.properties["Pull Requests"];

    if (!prop || !prop.rich_text) return;

    const title = `${pull_request.state === "closed" ? "✅ " : ""}#${
      pull_request.number
    }`;

    const oldsPR = prop.rich_text.filter(
      (item: any) => item.text?.link?.url !== pull_request.html_url
    );

    const porpBody = {
      prs: {
        rich_text: [
          ...oldsPR,
          {
            type: "text",
            text: {
              content: oldsPR?.length ? `, ${title}` : `${title}`,
              link: {
                url: pull_request.html_url,
              },
            },
          },
        ],
      },
    };
    await updatePageProps(notion, page.id, porpBody);

    await octokit.rest.issues.createComment({
      ...github.context.repo,
      issue_number: pull_request.number,
      body: `Notion task: ${page.url}`,
    });
  }

  if (eventType === "create") {
    const { ref } = github.context.payload as CreateEvent;
    const branchName = ref.split("/").at(-1) || "";

    const matchs = branchName.match(/#\w*/);
    const code = matchs && matchs[0];
    if (!code) return;

    const page = await getPageByCode(notion, notionDatabase, code);
    if (!page) return;

    const prop = page.properties["Branch"];

    if (!prop || !prop.rich_text) return;

    const porpBody = {
      branches: {
        rich_text: [
          ...prop.rich_text,
          {
            type: "text",
            text: {
              content: prop.rich_text?.length
                ? `, ${branchName}`
                : `${branchName}`,
            },
          },
        ],
      },
    };
    await updatePageProps(notion, page.id, porpBody);
  }
};

main()
  .then(() => {})
  .catch((err) => {
    console.log("ERROR", err);
    core.setFailed(err.message);
  });
