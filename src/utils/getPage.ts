import { Client } from "@notionhq/client";
import { getIssue, getPage } from "../services/client";
import { GetPageResponse } from "@notionhq/client/build/src/api-endpoints";

export const findIssues = async (
  notion: Client,
  notionDatabase: string,
  { code, branch }: { code?: string; branch?: string }
): Promise<GetPageResponse[] | undefined> => {
  const { results } = await getIssue(notion, notionDatabase, {
    code: code ? code.replace("#", "") : undefined,
    branch,
  });

  if (!results.length) return undefined;

  const pages = await Promise.all(
    results.map(async (issue) => {
      const { id: pageId } = issue;
      const page = await getPage(notion, pageId);
      return page;
    })
  );

  return pages;
};
