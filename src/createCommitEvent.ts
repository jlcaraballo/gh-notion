import { Client } from "@notionhq/client";
import { Commit } from "@octokit/webhooks-definitions/schema";
import { getPageByCode } from "./getPageByCode";
import { updatePageProps } from "./services/client";

export const createCommitEvent = async (
  notion: Client,
  notionDatabase: string,
  commit: Commit
) => {
  const matchs = commit.message.match(/#\w*/);

  const code = matchs && matchs[0];
  if (!code) return;

  const page = await getPageByCode(notion, notionDatabase, code);
  if (!page) return;

  const propCommits = page.properties["Commits"];

  if (!propCommits) return;

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

  console.log("Update Commits in Notion");
};
