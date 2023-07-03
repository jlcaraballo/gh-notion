import { Client } from "@notionhq/client";
import { GetPageResponse } from "@notionhq/client/build/src/api-endpoints";

import { findIssues } from "./utils/getPage";
import { updatePageProps } from "./services/client";
import { getStatus } from "./utils/getStatus";

const NOTION_STATUS = getStatus();

export const createBrachevent = async (
  notion: Client,
  notionDatabase: string,
  branchName: string
) => {
  const matchs = branchName.replace(/_/g, " ").match(/#\w*/);
  const code = matchs && matchs[0];
  if (!code && !branchName) return;

  const pages = await findIssues(notion, notionDatabase, {
    code: code ?? undefined,
    branch: branchName ?? undefined,
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
  const isInTodo = status === NOTION_STATUS["TODO"];

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
            content: `${branchName}`,
          },
        },
        {
          type: "text",
          text: {
            content: "\n",
          },
        },
      ],
    },
    ...(isInTodo &&
      NOTION_STATUS["PROGRESS"] && {
        Status: {
          status: {
            name: NOTION_STATUS["PROGRESS"],
          },
        },
      }),
  };

  console.log({ propsBody });

  await updatePageProps(notion, page.id, propsBody);

  console.log("Branch added in Notion");
};
