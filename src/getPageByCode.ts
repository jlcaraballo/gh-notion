import { Client } from "@notionhq/client";
import { getIssue, getPage } from "./services/client";

export const getPageByCode = async (
  notion: Client,
  notionDatabase: string,
  code: string
) => {
  const { results } = await getIssue(
    notion,
    notionDatabase,
    code.replace("#", "")
  );

  const [issue] = results;
  if (!issue) return;

  const { id: pageId } = issue;
  const page = await getPage(notion, pageId);

  return page;
};
