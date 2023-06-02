import * as github from "@actions/github";
import { Client } from "@notionhq/client";
import { PullRequest } from "@octokit/webhooks-definitions/schema";
import { findIssue } from "./getPage";
import { updatePageProps } from "./services/client";

export const createPullRequestEvent = async (
  notion: Client,
  notionDatabase: string,
  token_github: string,
  pull_request: PullRequest
) => {
  const octokit = github.getOctokit(token_github);

  const matchs = pull_request.title.match(/#\w*/);
  const code = matchs && matchs[0];

  const branch = pull_request.head.ref;
  if (!code && !branch) return;

  const params = {
    code: code ?? undefined,
    branch: branch ?? undefined,
  };

  console.log(`Find issue with code "${code}" and/or branch "${branch}" ...`);

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

  const porpBody = {
    "Pull Requests": {
      rich_text: [
        ...oldsPR,
        {
          type: "text",
          text: {
            content: `${title}\n`,
            link: {
              url: pull_request.html_url,
            },
          },
        },
      ],
    },
  };

  console.log("Updating pull requests url in Notion...");

  await updatePageProps(notion, page.id, porpBody);

  console.log("Pull Requests updated url in Notion");

  if (pull_request.state === "open") {
    await octokit.rest.issues.createComment({
      ...github.context.repo,
      issue_number: pull_request.number,
      body: `Notion task: ${page.url}`,
    });
    console.log("Comment added to pull request");
  }
};
