import * as github from "@actions/github";
import { Client } from "@notionhq/client";
import { PullRequest } from "@octokit/webhooks-definitions/schema";
import { getPageByCode } from "./getPageByCode";
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
  if (!code) return;

  const page = await getPageByCode(notion, notionDatabase, code);
  if (!page) return;

  const prop = page.properties["Pull Requests"];

  if (!prop || !prop.rich_text) return;

  const title = `${pull_request.state === "closed" ? "✅ " : ""} #${
    pull_request.number
  }: ${pull_request.title}`;

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
  await updatePageProps(notion, page.id, porpBody);

  console.log("Update Pull Requests in Notion");

  await octokit.rest.issues.createComment({
    ...github.context.repo,
    issue_number: pull_request.number,
    body: `Notion task: ${page.url}`,
  });

  console.log("comment added to pull request");
};
