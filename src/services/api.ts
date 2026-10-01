import {
  Repository,
  Issue,
  RepairPlan,
  AgentRun,
  AgentStep,
  CodeChange,
  ValidationRun,
  ImpactReport,
  PullRequest,
  AuditLog,
  SystemStatus
} from '../../shared/types';

export interface DashboardStats {
  repositories_connected: number;
  issues_detected: number;
  issues_repaired: number;
  successful_repairs: number;
  failed_repairs: number;
  open_pull_requests: number;
  validation_success_rate: number;
}

export const api = {
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch('/api/system/status');
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async updateSettings(data: { githubToken?: string; aiApiKey?: string; aiModel?: string; aiProvider?: string }) {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async getStats(): Promise<DashboardStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async getRepositories(): Promise<Repository[]> {
    const res = await fetch('/api/repositories');
    if (!res.ok) throw new Error('Failed to fetch repositories');
    return res.json();
  },

  async getRepository(id: string): Promise<Repository & { recent_scans: any[]; issues_count: number; recent_runs: any[] }> {
    const res = await fetch(`/api/repositories/${id}`);
    if (!res.ok) throw new Error('Failed to fetch repository');
    return res.json();
  },

  async connectRepository(data: { repoUrl?: string; fullName?: string; token?: string }) {
    const res = await fetch('/api/repositories/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to connect repository');
    }
    return res.json();
  },

  async scanRepository(repoId: string, scanType: string = 'full') {
    const res = await fetch(`/api/repositories/${repoId}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scan_type: scanType })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Scan failed');
    }
    return res.json();
  },

  async getIssues(params?: { repoId?: string; category?: string; severity?: string; status?: string }): Promise<Issue[]> {
    const url = params?.repoId ? `/api/repositories/${params.repoId}/issues` : '/api/issues';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch issues');
    return res.json();
  },

  async getIssue(id: string): Promise<Issue & { repo_name: string; repo_full_name: string; is_demo: number }> {
    const res = await fetch(`/api/issues/${id}`);
    if (!res.ok) throw new Error('Failed to fetch issue');
    return res.json();
  },

  async updateIssueStatus(id: string, status: string) {
    const res = await fetch(`/api/issues/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update issue status');
    return res.json();
  },

  async generateRepairPlan(issueId: string): Promise<RepairPlan> {
    const res = await fetch(`/api/issues/${issueId}/repair-plan`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate repair plan');
    }
    return res.json();
  },

  async getRepairPlan(id: string): Promise<RepairPlan> {
    const res = await fetch(`/api/repair-plans/${id}`);
    if (!res.ok) throw new Error('Failed to fetch repair plan');
    return res.json();
  },

  async executeRepairPlan(planId: string): Promise<{ run_id: string }> {
    const res = await fetch(`/api/repair-plans/${planId}/execute`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to execute repair plan');
    }
    return res.json();
  },

  async getAgentRuns(): Promise<any[]> {
    const res = await fetch('/api/agent-runs');
    if (!res.ok) throw new Error('Failed to fetch agent runs');
    return res.json();
  },

  async getAgentRun(id: string): Promise<
    AgentRun & {
      issue_title: string;
      issue_severity: string;
      file_path: string;
      repo_name: string;
      repo_full_name: string;
      is_demo: number;
      steps: AgentStep[];
      changes: CodeChange[];
      validation: ValidationRun | null;
      impact: ImpactReport | null;
      pull_request: PullRequest | null;
    }
  > {
    const res = await fetch(`/api/agent-runs/${id}`);
    if (!res.ok) throw new Error('Failed to fetch agent run');
    return res.json();
  },

  async getPullRequests(): Promise<any[]> {
    const res = await fetch('/api/pull-requests');
    if (!res.ok) throw new Error('Failed to fetch pull requests');
    return res.json();
  },

  async getPullRequest(id: string): Promise<PullRequest & { repo_name: string; repo_full_name: string }> {
    const res = await fetch(`/api/pull-requests/${id}`);
    if (!res.ok) throw new Error('Failed to fetch pull request');
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/audit-logs');
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  }
};
