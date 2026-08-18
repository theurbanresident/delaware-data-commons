const fallbackRepository = "https://github.com/theurbanresident/delaware-data-commons";

export const githubRepositoryUrl = (
  process.env.NEXT_PUBLIC_GITHUB_REPOSITORY_URL ?? fallbackRepository
).replace(/\/$/, "");

type IssueLinkOptions = {
  template: string;
  title: string;
};

export function githubIssueUrl({ template, title }: IssueLinkOptions) {
  const params = new URLSearchParams({ template, title });
  return `${githubRepositoryUrl}/issues/new?${params.toString()}`;
}

export function datasetIssueTitle(kind: string, title: string, id: string) {
  return `[${kind}] ${title} (${id})`;
}
