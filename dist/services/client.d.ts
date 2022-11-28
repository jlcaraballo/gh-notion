import { Client } from "@notionhq/client";
export declare const instance: (token: string) => Client;
export declare const getIssue: (notion: Client, database_id: string, code: string) => Promise<import("@notionhq/client/build/src/api-endpoints").QueryDatabaseResponse>;
export type PageProperty = {
    branches?: any;
    commits?: any;
    prs?: any;
};
export declare const getPage: (notion: Client, page_id: string) => Promise<any>;
export declare const updatePageProps: (notion: Client, page_id: string, props: PageProperty) => Promise<import("@notionhq/client/build/src/api-endpoints").UpdatePageResponse>;
