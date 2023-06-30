export enum EStatus {
  TODO = "TODO",
  PROGRESS = "PROGRESS",
  DONE = "DONE",
  REVIEW = "REVIEW",
  STAGED = "STAGED",
}

export const getStatus = (): { [x in EStatus]?: string } => {
  const statusMultiline = process.env.NOTION_STATUS;

  if (!statusMultiline?.length) return {};

  const status = statusMultiline
    .split("\n")
    .map((line) => {
      const [githubStatus, notionStatus] = line.split("=");
      return { [githubStatus]: notionStatus };
    })
    .reduce((acc, curr) => ({ ...acc, ...curr }), {});

  if (!status) return {};
  return status;
};
