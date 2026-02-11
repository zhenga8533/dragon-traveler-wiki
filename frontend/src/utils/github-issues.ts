import { GITHUB_REPO_URL } from '../constants';

export function buildExpiredCodeUrl(code: string): string {
  const params = new URLSearchParams({
    title: `[Code] Report expired: ${code}`,
    body: `The code \`${code}\` appears to be expired or no longer working.\n`,
    labels: 'codes',
  });
  return `${GITHUB_REPO_URL}/issues/new?${params.toString()}`;
}
