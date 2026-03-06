import {
  buildEmptyIssueBody,
  GITHUB_REPO_URL,
  MAX_GITHUB_ISSUE_URL_LENGTH,
} from '../constants/github';

export function buildExpiredCodeUrl(code: string): string {
  const params = new URLSearchParams({
    title: `[Code] Report expired: ${code}`,
    body: `The code \`${code}\` appears to be expired or no longer working.\n`,
    labels: 'codes',
  });
  return `${GITHUB_REPO_URL}/issues/new?${params.toString()}`;
}

interface BuildIssueUrlOptions {
  title: string;
  body: string;
  labels?: string;
}

export function buildIssueUrl({
  title,
  body,
  labels,
}: BuildIssueUrlOptions): string {
  const params = new URLSearchParams({
    title,
    body,
    ...(labels ? { labels } : {}),
  });
  return `${GITHUB_REPO_URL}/issues/new?${params.toString()}`;
}

interface BuildSuggestionIssueUrlsOptions {
  title: string;
  json: string;
  entityType: string;
  labels?: string;
}

export function buildSuggestionIssueUrls({
  title,
  json,
  entityType,
  labels,
}: BuildSuggestionIssueUrlsOptions): {
  issueUrl: string | null;
  emptyIssueUrl: string;
} {
  const body = `**Paste your JSON below:**\n\n\`\`\`json\n${json}\n\`\`\`\n`;
  const issueUrl = buildIssueUrl({ title, body, labels });
  const emptyIssueUrl = buildIssueUrl({
    title,
    body: buildEmptyIssueBody(entityType),
    labels,
  });

  return {
    issueUrl: issueUrl.length > MAX_GITHUB_ISSUE_URL_LENGTH ? null : issueUrl,
    emptyIssueUrl,
  };
}
