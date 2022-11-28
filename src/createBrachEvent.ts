import { Client } from "@notionhq/client";
import { getPageByCode } from "./getPageByCode";
import { updatePageProps } from "./services/client";

export const createBrachevent = async (
  notion: Client,
  notionDatabase: string,
  branchName: string
) => {
  const matchs = branchName.match(/#\w*/);
  const code = matchs && matchs[0];
  if (!code) return;

  const page = await getPageByCode(notion, notionDatabase, code);
  if (!page) return;

  const propBranch = page.properties["Branch"];

  const propsBody = {
    branches: {
      rich_text: [
        ...propBranch.rich_text,
        {
          type: "text",
          text: {
            content: propBranch.rich_text?.length
              ? `, ${branchName}`
              : `${branchName}`,
          },
        },
      ],
    },
  };

  await updatePageProps(notion, page.id, propsBody);
};
