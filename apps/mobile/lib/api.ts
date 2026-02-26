import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync("jwt");
}

export async function api<T>(
  path: string,
  options: RequestInit & { body?: object } = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : options.body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || err.message || "Request failed");
  }
  return res.json();
}

export const auth = {
  startOAuth: (redirect_uri?: string) =>
    api<{ auth_url: string; code_verifier: string; state: string }>(
      `/auth/github/start${redirect_uri ? `?redirect_uri=${encodeURIComponent(redirect_uri)}` : ""}`
    ),
  callback: (code: string, code_verifier: string, state: string, redirect_uri?: string) =>
    api<{ access_token: string; expires_in: number }>("/auth/github/callback", {
      method: "POST",
      body: { code, code_verifier, state, redirect_uri },
    }),
};

export const user = {
  me: () => api<{ id: number; login: string; avatar_url?: string }>("/me"),
};

export const repos = {
  list: () => api<Repo[]>("/repos"),
  branches: (owner: string, repo: string) =>
    api<Branch[]>(`/repos/${owner}/${repo}/branches`),
  createBranch: (owner: string, repo: string, name: string, from_ref = "HEAD") =>
    api<{ ref: string; sha: string }>(`/repos/${owner}/${repo}/branches`, {
      method: "POST",
      body: { name, from_ref },
    }),
  tree: (owner: string, repo: string, ref?: string) =>
    api<TreeResponse>(`/repos/${owner}/${repo}/tree${ref ? `?ref=${ref}` : ""}`),
  file: (owner: string, repo: string, path: string, ref?: string) =>
    api<{ content: string; path: string }>(
      `/repos/${owner}/${repo}/file?path=${encodeURIComponent(path)}${ref ? `&ref=${ref}` : ""}`
    ),
};

export const agent = {
  patch: (params: {
    owner: string;
    repo: string;
    branch: string;
    user_goal: string;
    selected_files: string[];
    extra_instructions?: string;
    claude_api_key: string;
  }) =>
    api<AgentPatchResponse>("/agent/patch", {
      method: "POST",
      body: params,
    }),
};

export const patchApi = {
  validate: (owner: string, repo: string, branch: string, patch: string) =>
    api<ValidatePatchResponse>("/patch/validate", {
      method: "POST",
      body: { owner, repo, branch, patch },
    }),
};

export const git = {
  applyAndCommit: (params: {
    owner: string;
    repo: string;
    branch: string;
    patch: string;
    commit_message: string;
  }) =>
    api<{ commit_sha: string; branch: string }>("/git/apply-and-commit", {
      method: "POST",
      body: params,
    }),
  createPR: (params: {
    owner: string;
    repo: string;
    head: string;
    base?: string;
    title: string;
    body?: string;
  }) =>
    api<{ pr_url: string; pr_number: number }>("/git/pr", {
      method: "POST",
      body: params,
    }),
};

export interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  owner: { login: string; avatar_url?: string };
}

export interface Branch {
  name: string;
  sha: string;
}

export interface TreeEntry {
  path: string;
  type: "blob" | "tree";
  sha?: string;
}

export interface TreeResponse {
  sha: string;
  tree: TreeEntry[];
  truncated: boolean;
}

export interface AgentPatchResponse {
  plan: string[];
  patch: string;
  summary: string;
  files_changed: string[];
}

export interface ValidatePatchResponse {
  valid: boolean;
  message?: string;
  file_changes: { path: string; additions: number; deletions: number; hunks: unknown[] }[];
}
