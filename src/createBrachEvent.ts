import { Client } from "@notionhq/client";
import { findIssue } from "./getPage";
import { updatePageProps } from "./services/client";

export const createBrachevent = async (
  notion: Client,
  notionDatabase: string,
  branchName: string
) => {
  const matchs = branchName.replace(/_/g, " ").match(/#\w*/);
  const code = matchs && matchs[0];
  if (!code) return;

  const page = await findIssue(notion, notionDatabase, { code });
  if (!page) return;

  const propBranch = page.properties["Branch"];

  if (!propBranch) return;

  const oldBranchs = propBranch.rich_text.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => !item.text?.content?.includes(branchName)
  );

  const propsBody = {
    Branch: {
      rich_text: [
        ...oldBranchs,
        {
          type: "text",
          text: {
            content: `${branchName}\n`,
          },
        },
      ],
    },
  };
  console.log({ propsBody });

  await updatePageProps(notion, page.id, propsBody);

  console.log("Branch added in Notion");
};
