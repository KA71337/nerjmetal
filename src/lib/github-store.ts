/**
 * Minimal GitHub Contents API client used as the admin catalog's persistence
 * layer. Runs only inside server route handlers — GITHUB_TOKEN is never sent to
 * the browser.
 */
const API = "https://api.github.com";

export function githubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !owner || !repo) return null;
  return { token, owner, repo, branch };
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "nerj-metal-admin",
  };
}

type ContentsResponse = { sha?: string; content?: string };

/** Current file blob + commit sha (needed for conflict-safe updates). */
export async function getRemoteFile(path: string): Promise<{ content: string; sha: string } | null> {
  const config = githubConfig();
  if (!config) throw new Error("GitHub konfiqurasiyası yoxdur (GITHUB_TOKEN/GITHUB_OWNER/GITHUB_REPO)");
  const response = await fetch(
    `${API}/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(config.branch)}`,
    { headers: headers(config.token), cache: "no-store" },
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub GET ${response.status}`);
  const payload = await response.json() as ContentsResponse;
  if (!payload.content || !payload.sha) throw new Error("GitHub cavabı natamamdır");
  return {
    content: Buffer.from(payload.content, "base64").toString("utf8"),
    sha: payload.sha,
  };
}

export async function putRemoteFile(path: string, content: string, message: string, sha?: string) {
  const config = githubConfig();
  if (!config) throw new Error("GitHub konfiqurasiyası yoxdur (GITHUB_TOKEN/GITHUB_OWNER/GITHUB_REPO)");
  const response = await fetch(
    `${API}/repos/${config.owner}/${config.repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`,
    {
      method: "PUT",
      headers: headers(config.token),
      body: JSON.stringify({
        message,
        content: Buffer.from(content, "utf8").toString("base64"),
        branch: config.branch,
        ...(sha ? { sha } : {}),
      }),
    },
  );
  if (response.status === 409) throw Object.assign(new Error("Conflict"), { name: "ConflictError" });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GitHub PUT ${response.status}: ${detail.slice(0, 180)}`);
  }
  const payload = await response.json() as { commit?: { sha?: string; html_url?: string } };
  return { sha: payload.commit?.sha ?? "", url: payload.commit?.html_url ?? "" };
}
