"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePageProps = exports.getPage = exports.getIssue = exports.instance = void 0;
const client_1 = require("@notionhq/client");
const instance = (token) => new client_1.Client({ auth: token });
exports.instance = instance;
// axios.create({
//   baseURL: "https://api.notion.com/",
//   timeout: 15000,
//   headers: {
//     Authorization: `Bearer ${token}`,
//     accept: "application/json",
//     "Notion-Version": "2022-06-28",
//     "content-type": "application/json",
//   },
// });
const getIssue = async (notion, database_id, code) => {
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
exports.getIssue = getIssue;
const getPage = async (notion, page_id) => {
    const page = await notion.pages.retrieve({
        page_id,
    });
    return page;
};
exports.getPage = getPage;
const updatePageProps = async (notion, page_id, props) => {
    return await notion.pages.update({
        page_id,
        properties: {
            ...(props.branches ? { "Git branches": props.branches } : {}),
            ...(props.commits ? { "Git commits": props.commits } : {}),
            ...(props.prs ? { "Git PRs": props.prs } : {}),
        },
    });
};
exports.updatePageProps = updatePageProps;
//# sourceMappingURL=client.js.map