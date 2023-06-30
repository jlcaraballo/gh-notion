import { Client } from "@notionhq/client";
import { GetPageResponse } from "@notionhq/client/build/src/api-endpoints";
import { Commit } from "@octokit/webhooks-definitions/schema";

import { findIssues } from "./utils/getPage";
import { updatePageProps } from "./services/client";

export const createCommitEvent = async (
  notion: Client,
  notionDatabase: string,
  commit: Commit
) => {
  const matchs = commit.message.match(/#\w*/);

  const code = matchs && matchs[0];
  if (!code) return;

  const pages = await findIssues(notion, notionDatabase, { code });
  if (!pages) return;
  for (const page of pages) {
    await updateNotionPage(notion, page, commit);
  }
};

const updateNotionPage = async (
  notion: Client,
  page: GetPageResponse,
  commit: Commit
): Promise<void> => {
  if (!("properties" in page)) return;
  const propCommits = page.properties["Commits"];

  if (!propCommits || !("rich_text" in propCommits)) return;

  const porpBody = {
    Commits: {
      rich_text: [
        ...propCommits.rich_text,
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

  console.log("Commits added in Notion");
};
