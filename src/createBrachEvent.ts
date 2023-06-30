import { Client } from "@notionhq/client";
import { GetPageResponse } from "@notionhq/client/build/src/api-endpoints";

import { findIssues } from "./utils/getPage";
import { updatePageProps } from "./services/client";

export const createBrachevent = async (
  notion: Client,
  notionDatabase: string,
  branchName: string
) => {
  const matchs = branchName.replace(/_/g, " ").match(/#\w*/);
  const code = matchs && matchs[0];
  if (!code) return;

  const pages = await findIssues(notion, notionDatabase, {
    code,
    branch: branchName,
  });
  if (!pages?.length) return;

  for (const page of pages) {
    await updateNotionPage(notion, page, branchName);
  }
};

const updateNotionPage = async (
  notion: Client,
  page: GetPageResponse,
  branchName: string
): Promise<void> => {
  if (!("properties" in page)) return;
  const propBranch = page.properties["Branch"];

  const status =
    "status" in page.properties["Status"]
      ? page.properties["Status"].status?.name
      : "";
  const isInTodo = status === "Not Started";

  if (!propBranch || !("rich_text" in propBranch)) return;

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
    ...(isInTodo && {
      Status: {
        status: {
          name: "In Progress",
        },
      },
    }),
  };

  console.log({ propsBody });

  await updatePageProps(notion, page.id, propsBody);

  console.log("Branch added in Notion");
};
