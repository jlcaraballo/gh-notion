import { Client } from "@notionhq/client";
import { GetPageResponse } from "@notionhq/client/build/src/api-endpoints";

export const instance = (token: string) => new Client({ auth: token });

export const getIssue = async (
  notion: Client,
  database_id: string,
  { code, branch }: { code?: string; branch?: string }
) => {
  if (!code && !branch) throw new Error("You must pass code or branch");

  const filters = [];
  if (code) {
    filters.push({
      property: "Code",
      formula: {
        string: {
          equals: code || "",
        },
      },
    });
  }

  if (branch) {
    filters.push({
      property: "Branch",
      rich_text: {
        equals: branch || "",
      },
    });
  }

  return await notion.databases.query({
    database_id,
    filter: {
      or: filters,
    },
  });
};

export type PageProperty = {
  Branch?: any;
  Commits?: any;
  "Pull Requests"?: any;
};

export const getPage = async (
  notion: Client,
  page_id: string
): Promise<GetPageResponse> => {
  const page = await notion.pages.retrieve({
    page_id,
  });
  return page;
};

export const updatePageProps = async (
  notion: Client,
  page_id: string,
  properties: PageProperty
) => {
  return await notion.pages.update({
    page_id,
    properties,
  });
};
