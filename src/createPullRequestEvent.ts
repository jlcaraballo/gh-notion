import * as github from "@actions/github";
import { Client } from "@notionhq/client";
import { GetPageResponse } from "@notionhq/client/build/src/api-endpoints";
import { PullRequest } from "@octokit/webhooks-definitions/schema";

import { findIssues } from "./utils/getPage";
import { updatePageProps } from "./services/client";
import { getStatus } from "./utils/getStatus";

const NOTION_STATUS = getStatus();

const STATUS_GITHUB_TO_NOTION = {
  ...(NOTION_STATUS["DONE"] && { closed: NOTION_STATUS["DONE"] }),
  ...(NOTION_STATUS["REVIEW"] && { open: NOTION_STATUS["REVIEW"] }),
  ...(NOTION_STATUS["STAGED"] && { merged: NOTION_STATUS["STAGED"] }),
};

export const createPullRequestEvent = async (
  notion: Client,
  notionDatabase: string,
  token_github: string,
  pull_request: PullRequest
) => {
  const octokit = github.getOctokit(token_github);

  console.log("PULL REQUEST", pull_request.title);

  const matchs = pull_request.title.match(/#\w*/);
  const code = matchs && matchs[0];

  const branch = pull_request.head.ref;

  if (!code && !branch) return;

  const params = {
    code: code ?? undefined,
    branch: branch ?? undefined,
  };

  if (code) {
    console.log(`Find issue with code "${code}" ...`);
  }

  if (branch) {
    console.log(`Find issue with branch "${branch}" ...`);
  }

  const pages = await findIssues(notion, notionDatabase, params);
  if (!pages) {
    console.log("Issue page not found");
    return;
  }

  for (const page of pages) {
    await updateNotionPage(notion, page, pull_request);
  }

  // Add comment to pull request
  if (pull_request.state === "open") {
    const pagesBody = pages
      .map((page) => {
        if (!("properties" in page)) return;
        if (!("title" in page.properties["Task name"])) return;
        const pageName = page.properties["Task name"].title[0].plain_text;
        return `[${pageName}](${page.url})`;
      })
      .filter(Boolean)
      .join("\n");

    console.log("Adding comment to pull request...");

    await octokit.rest.issues.createComment({
      ...github.context.repo,
      issue_number: pull_request.number,
      body: pagesBody,
    });
    console.log("Comment added to pull request");
  }
};

const updateNotionPage = async (
  notion: Client,
  page: GetPageResponse,
  pull_request: PullRequest
) => {
  if (!("properties" in page)) return;
  console.log(`Issue page found: ${page.url}`);

  const prop = page.properties["Pull Requests"];

  if (!("rich_text" in prop)) return;

  if (!prop || !prop.rich_text) return;

  const title = `${pull_request.merged ? "✅ " : ""} #${pull_request.number}: ${
    pull_request.title
  }`;

  const oldsPR = prop.rich_text.filter(
    (item: any) => item.text?.link?.url !== pull_request.html_url
  );

  const pullRequestState = pull_request.merged ? "merged" : pull_request.state;
  const pullRequestStateCapitalized =
    pullRequestState.charAt(0).toUpperCase() + pullRequestState.slice(1);

  const propBody = {
    "Pull Requests": {
      rich_text: [
        ...oldsPR,
        {
          type: "text",
          text: {
            content: `${title} `,
            link: {
              url: pull_request.html_url,
            },
          },
          annotations: {
            bold: true,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: "default",
          },
        },
        {
          type: "text",
          text: {
            content: `(${pullRequestStateCapitalized})\n`,
            link: {
              url: pull_request.html_url,
            },
          },
          annotations: {
            bold: true,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
            color: "gray_background",
          },
        },
      ],
    },
    ...(STATUS_GITHUB_TO_NOTION[pullRequestState]
      ? {
          Status: {
            status: {
              name: STATUS_GITHUB_TO_NOTION[pullRequestState],
            },
          },
        }
      : {}),
  };

  console.log("Updating pull requests url in Notion...");

  await updatePageProps(notion, page.id, propBody);

  console.log("Pull Requests updated url in Notion");
};
