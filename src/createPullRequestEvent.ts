import * as github from "@actions/github";
import { Client } from "@notionhq/client";
import { PullRequest } from "@octokit/webhooks-definitions/schema";

import { findIssue } from "./getPage";
import { updatePageProps } from "./services/client";

const STATUS_GITHUB_TO_NOTION = {
  open: "In review",
  merged: "Staged",
  closed: "Done",
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

  console.log({ code, branch });

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

  const page = await findIssue(notion, notionDatabase, params);
  if (!page) {
    console.log("Issue page not found");
    return;
  }

  console.log(`Issue page found: ${page.url}`);

  const prop = page.properties["Pull Requests"];

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
        ...(oldsPR.length > 0
          ? [{ type: "text", text: { content: "\n" } }]
          : []),
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
            content: `(${pullRequestStateCapitalized})`,
            link: {
              url: pull_request.html_url,
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
        },
      ],
    },
    ...(STATUS_GITHUB_TO_NOTION[pullRequestState]
      ? { Status: STATUS_GITHUB_TO_NOTION[pullRequestState] }
      : {}),
  };

  console.log("Updating pull requests url in Notion...");

  await updatePageProps(notion, page.id, propBody);

  console.log("Pull Requests updated url in Notion");

  if (pull_request.state === "open") {
    const pageName = page.properties["Task name"].title[0].plain_text;

    console.log("Adding comment to pull request...");

    await octokit.rest.issues.createComment({
      ...github.context.repo,
      issue_number: pull_request.number,
      body: `Notion task: [${pageName}](${page.url})]`,
    });
    console.log("Comment added to pull request");
  }
};
