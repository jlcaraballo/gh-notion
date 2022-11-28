import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  PullRequestEvent,
  PushEvent,
} from "@octokit/webhooks-definitions/schema";

import {
  getIssue,
  getPage,
  instance,
  updatePageProps,
} from "./services/client";

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
      const code = commit.message.match(/#\w*/);
      if (!code || !code[0]) return;

      const { results } = await getIssue(
        notion,
        notionDatabase,
        code[0].replace("#", "")
      );

      const [issue] = results;
      if (!issue) return;

      const { id: pageId } = issue;
      const page = await getPage(notion, pageId);

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
      await updatePageProps(notion, pageId, porpBody);
    });
  }

  if (eventType === "pull_request") {
    const { pull_request } = github.context.payload as PullRequestEvent;

    const code = pull_request.title.match(/#\w*/);
    if (!code || !code[0]) return;

    const { results } = await getIssue(
      notion,
      notionDatabase,
      code[0].replace("#", "")
    );

    const [issue] = results;
    if (!issue) return;

    const { id: pageId } = issue;
    const page = await getPage(notion, pageId);
    const prop = page.properties["Pull Requests"];

    if (!prop) return;

    const title = `${pull_request.state === "closed" ? "✅ " : ""}#${
      pull_request.number
    }`;

    const oldsPR = prop.rich_text.filter(
      (item: any) => item.text.url !== pull_request.url
    );

    const porpBody = {
      prs: {
        rich_text: [
          ...oldsPR,
          {
            type: "text",
            text: {
              content: prop.rich_text?.length ? `, ${title}` : `${title}`,
              link: {
                url: pull_request.url,
              },
            },
          },
        ],
      },
    };
    await updatePageProps(notion, pageId, porpBody);

    // Add comment to pull request
    await octokit.rest.issues.createComment({
      ...github.context.repo,
      issue_number: pull_request.number,
      body: `Notion task: ${page.url}`,
    });
  }
};

main()
  .then(() => {})
  .catch((err) => {
    console.log("ERROR", err);
    core.setFailed(err.message);
  });
