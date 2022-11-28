import { Client } from "@notionhq/client";

export const instance = (token: string) => new Client({ auth: token });

export const getIssue = async (
  notion: Client,
  database_id: string,
  code: string
) => {
  return await notion.databases.query({
    database_id,
    filter: {
      property: "ISSUE_CODE",
      formula: {
        string: {
          equals: code,
        },
      },
    },
  });
};

export type PageProperty = {
  branches?: any;
  commits?: any;
  prs?: any;
};

export const getPage = async (notion: Client, page_id: string) => {
  const page: any = await notion.pages.retrieve({
    page_id,
  });
  return page;
};

export const updatePageProps = async (
  notion: Client,
  page_id: string,
  props: PageProperty
) => {
  return await notion.pages.update({
    page_id,
    properties: {
      ...(props.branches ? { branches: props.branches } : {}),
      ...(props.commits ? { Commits: props.commits } : {}),
      ...(props.prs ? { "Pull Requests": props.prs } : {}),
    },
  });
};
