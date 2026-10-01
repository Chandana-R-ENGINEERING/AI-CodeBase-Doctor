export interface GitHubRepoItem {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
  language: string | null;
  updated_at: string;
}

export interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string; // base64 or decoded
  encoding: string;
}

export class GitHubService {
  private token: string | null = null;

  constructor() {
    this.token = process.env.GITHUB_TOKEN || null;
  }

  public setToken(token: string | null): void {
    this.token = token?.trim() || null;
  }

  public getToken(): string | null {
    return this.token;
  }

  public isConfigured(): boolean {
    return Boolean(this.token && this.token.length > 10);
  }

  private getHeaders(): Record<string, string> {
    if (!this.token) {
      throw new Error('GitHub integration not configured. Please supply a GitHub Personal Access Token or OAuth session in Settings.');
    }
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'AI-Codebase-Doctor/1.0'
    };
  }

  /**
   * Verify token validity and fetch authenticated user
   */
  public async getAuthenticatedUser(): Promise<any> {
    if (!this.isConfigured()) {
      return null;
    }
    const res = await fetch('https://api.github.com/user', {
      headers: this.getHeaders()
    });

    if (res.status === 401) {
      throw new Error('Invalid GitHub token or expired credentials.');
    }
    if (res.status === 403) {
      throw new Error('GitHub API rate limit exceeded or access forbidden.');
    }
    if (!res.ok) {
      throw new Error(`GitHub API error (${res.status}): ${await res.text()}`);
    }

    return await res.json();
  }

  /**
   * List repositories accessible to the user
   */
  public async listUserRepositories(): Promise<GitHubRepoItem[]> {
    if (!this.isConfigured()) {
      throw new Error('GitHub integration not configured.');
    }

    const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=30&affiliation=owner,collaborator', {
      headers: this.getHeaders()
    });

    if (!res.ok) {
      throw new Error(`Failed to list repositories: ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * Fetch repo details
   */
  public async getRepository(owner: string, repo: string): Promise<any> {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: this.getHeaders()
    });

    if (res.status === 404) {
      throw new Error(`Repository '${owner}/${repo}' not found or token lacks private repository access.`);
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch repository: ${await res.text()}`);
    }

    return await res.json();
  }

  /**
   * Fetch repository tree (recursive)
   */
  public async getTree(owner: string, repo: string, branch: string = 'main'): Promise<{ path: string; type: string; sha: string; size?: number }[]> {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
      headers: this.getHeaders()
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch tree for ${owner}/${repo}@${branch}: ${res.statusText}`);
    }

    const data = await res.json();
    return data.tree || [];
  }

  /**
   * Fetch single file content
   */
  public async getFileContent(owner: string, repo: string, path: string, branch?: string): Promise<{ content: string; sha: string }> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}${branch ? `?ref=${branch}` : ''}`;
    const res = await fetch(url, {
      headers: this.getHeaders()
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch file content for ${path}: ${res.statusText}`);
    }

    const data = await res.json();
    const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
    return { content: decoded, sha: data.sha };
  }

  /**
   * Create an isolated branch: ai-codebase-doctor/fix/<slug>
   * NEVER creates or modifies main branch.
   */
  public async createBranch(owner: string, repo: string, newBranchName: string, baseBranch: string = 'main'): Promise<any> {
    // 1. Get base branch commit SHA
    const baseRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, {
      headers: this.getHeaders()
    });

    if (!baseRefRes.ok) {
      throw new Error(`Base branch '${baseBranch}' not found: ${baseRefRes.statusText}`);
    }

    const baseData = await baseRefRes.json();
    const sha = baseData.object.sha;

    // 2. Create the new ref
    const createRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: `refs/heads/${newBranchName}`,
        sha
      })
    });

    if (!createRefRes.ok) {
      const errText = await createRefRes.text();
      // If branch already exists, that is okay
      if (createRefRes.status === 422 && errText.includes('Reference already exists')) {
        return { ref: `refs/heads/${newBranchName}`, sha, existing: true };
      }
      throw new Error(`Failed to create isolated branch '${newBranchName}': ${errText}`);
    }

    return await createRefRes.json();
  }

  /**
   * Commit a file change to the isolated branch
   */
  public async commitFileChange(params: {
    owner: string;
    repo: string;
    branch: string;
    path: string;
    newContent: string;
    message: string;
    originalSha?: string;
  }): Promise<any> {
    // Safety check: ensure branch is NOT main or master
    if (params.branch === 'main' || params.branch === 'master') {
      throw new Error('SAFETY VIOLATION: Refusing to push directly to production branch (main/master).');
    }

    let fileSha = params.originalSha;
    if (!fileSha) {
      try {
        const existing = await this.getFileContent(params.owner, params.repo, params.path, params.branch);
        fileSha = existing.sha;
      } catch {
        fileSha = undefined;
      }
    }

    const payload: any = {
      message: params.message,
      content: Buffer.from(params.newContent).toString('base64'),
      branch: params.branch
    };
    if (fileSha) {
      payload.sha = fileSha;
    }

    const res = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}/contents/${params.path}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Failed to commit file ${params.path}: ${await res.text()}`);
    }

    return await res.json();
  }

  /**
   * Create a GitHub Pull Request
   */
  public async createPullRequest(params: {
    owner: string;
    repo: string;
    title: string;
    head: string;
    base: string;
    body: string;
  }): Promise<{ pr_number: number; pr_url: string; html_url: string }> {
    const res = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}/pulls`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: params.title,
        head: params.head,
        base: params.base,
        body: params.body
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create Pull Request: ${err}`);
    }

    const data = await res.json();
    return {
      pr_number: data.number,
      pr_url: data.url,
      html_url: data.html_url
    };
  }
}

export const githubService = new GitHubService();
