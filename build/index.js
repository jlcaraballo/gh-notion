"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const client_1 = require("./services/client");
const token = core.getInput("GITHUB_TOKEN");
const notionApiKey = core.getInput("NOTION_SECRET");
const notionDatabase = core.getInput("NOTION_DATABASE");
const main = async () => {
    if (!token)
        throw new Error("Github token not found");
    if (!notionApiKey)
        throw new Error("Notion secret key nor found");
    if (!notionDatabase)
        throw new Error("Notion DATABASE ID not found");
    const notion = (0, client_1.instance)(notionApiKey);
    const octokit = github.getOctokit(token);
    const eventType = github.context.eventName;
    if (eventType === "push") {
        const push = github.context.payload;
        push.commits.forEach(async (commit) => {
            const code = commit.message.match(/#\w*/);
            if (!code || !code[0])
                return;
            const { results } = await (0, client_1.getIssue)(notion, notionDatabase, code[0].replace("#", ""));
            const [issue] = results;
            if (!issue)
                return;
            const { id: pageId } = issue;
            const page = await (0, client_1.getPage)(notion, pageId);
            const prop = page.properties["Git commits"];
            const porpBody = {
                commits: {
                    rich_text: [
                        ...prop.rich_text,
                        {
                            type: "text",
                            text: {
                                content: `${commit.message}\n`,
                                link: {
                                    url: commit.url,
                                },
                            },
                        },
                    ],
                },
            };
            await (0, client_1.updatePageProps)(notion, pageId, porpBody);
        });
    }
    if (eventType === "pull_request") {
        const { pull_request } = github.context.payload;
        const code = pull_request.title.match(/#\w*/);
        if (!code || !code[0])
            return;
        const { results } = await (0, client_1.getIssue)(notion, notionDatabase, code[0].replace("#", ""));
        const [issue] = results;
        if (!issue)
            return;
        const { id: pageId } = issue;
        const page = await (0, client_1.getPage)(notion, pageId);
        const prop = page.properties["Git PRs"];
        const title = `${pull_request.state === "closed" ? "✅ " : ""}#${pull_request.number}`;
        const porpBody = {
            prs: {
                rich_text: [
                    ...prop.rich_text,
                    {
                        type: "text",
                        text: {
                            content: prop.rich_text?.length ? `, ${title}` : `${title}`,
                            link: {
                                url: pull_request.url,
                            },
                        },
                    },
                ],
            },
        };
        await (0, client_1.updatePageProps)(notion, pageId, porpBody);
        // Add comment to pull request
        await octokit.rest.issues.createComment({
            ...github.context.repo,
            issue_number: pull_request.number,
            body: `Notion task: ${page.url}`,
        });
    }
};
exports.main = main;
(0, exports.main)()
    .then(() => { })
    .catch((err) => {
    console.log("ERROR", err);
    core.setFailed(err.message);
});
//# sourceMappingURL=index.js.map