import { Client } from "@notionhq/client";
import { getPageByCode } from "./getPageByCode";
import { updatePageProps } from "./services/client";

export const createBrachevent = async (
  notion: Client,
  notionDatabase: string,
  branchName: string
) => {
  const matchs = branchName.match(/#\w*/);
  const code = matchs && matchs[0];
  if (!code) return;

  const page = await getPageByCode(
    notion,
    notionDatabase,
    code.replace("_", " ")
  );
  if (!page) return;

  const propBranch = page.properties["Branch"];

  const oldBranchs = propBranch.rich_text.filter(
    (item: any) => !item.text?.content?.include(branchName)
  );

  const propsBody = {
    Branch: {
      rich_text: [
        ...oldBranchs,
        {
          type: "text",
          text: {
            content: oldBranchs?.length ? `, ${branchName}` : `${branchName}`,
          },
        },
      ],
    },
  };

  await updatePageProps(notion, page.id, propsBody);
};
