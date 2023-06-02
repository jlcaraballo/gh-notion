import { Client } from "@notionhq/client";
import { getIssue, getPage } from "./services/client";

export const findIssue = async (
  notion: Client,
  notionDatabase: string,
  { code, branch }: { code?: string; branch?: string }
) => {
  const { results } = await getIssue(notion, notionDatabase, {
    code: code ? code.replace("#", "") : undefined,
    branch,
  });

  const [issue] = results;
  if (!issue) return;

  const { id: pageId } = issue;
  const page = await getPage(notion, pageId);

  return page;
};
