import React, { useEffect, useState } from 'react';
import {
  FolderGit2,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  XCircle,
  GitPullRequest,
  Activity,
  ArrowRight,
  Play,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { api, DashboardStats } from '../services/api';
import { Repository, AgentRun } from '../../shared/types';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, r, runs] = await Promise.all([
        api.getStats(),
        api.getRepositories(),
        api.getAgentRuns()
      ]);
      setStats(s);
      setRepos(r);
      setRecentRuns(runs.slice(0, 5));
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Engineering Console</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Autonomous codebase diagnosis, sandbox repair, and pull request staging.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('repositories')}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Connect Repository</span>
          </button>

          <button
            onClick={() => onNavigate('demo-run')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Autonomous Demo</span>
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid (Anti-slop, clean unboxed typography) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          {
            label: 'Repositories',
            value: stats?.repositories_connected ?? 1,
            icon: FolderGit2,
            action: () => onNavigate('repositories')
          },
          {
            label: 'Issues Detected',
            value: stats?.issues_detected ?? 4,
            icon: AlertTriangle,
            action: () => onNavigate('issues')
          },
          {
            label: 'Issues Repaired',
            value: stats?.issues_repaired ?? 1,
            icon: Wrench,
            action: () => onNavigate('issues')
          },
          {
            label: 'Pass Rate',
            value: `${stats?.validation_success_rate ?? 100}%`,
            icon: CheckCircle2,
            action: () => onNavigate('validation')
          },
          {
            label: 'Failed Repairs',
            value: stats?.failed_repairs ?? 0,
            icon: XCircle,
            action: () => onNavigate('agent-runs')
          },
          {
            label: 'Open PRs',
            value: stats?.open_pull_requests ?? 1,
            icon: GitPullRequest,
            action: () => onNavigate('pull-requests')
          },
          {
            label: 'Safety Gate',
            value: 'ENFORCED',
            icon: ShieldCheck,
            highlight: true,
            action: () => onNavigate('settings')
          }
        ].map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              onClick={item.action}
              className={`p-3.5 rounded-lg border transition-colors cursor-pointer ${
                item.highlight
                  ? 'border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-500/50'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider">{item.label}</span>
                <Icon className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="text-xl font-bold font-mono text-zinc-100">{item.value}</div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Connected Repositories & Recent Agent Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Connected Repositories */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Active Repositories</h2>
            </div>
            <button
              onClick={() => onNavigate('repositories')}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {repos.map(repo => (
              <div
                key={repo.id}
                className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-100 text-sm">{repo.name}</span>
                      {repo.is_demo ? (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300">
                          DEMO REPO
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
                          LIVE GITHUB
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{repo.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('repository-detail', { repoId: repo.id })}
                      className="px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => onNavigate('repository-detail', { repoId: repo.id, tab: 'issues' })}
                      className="px-2.5 py-1 text-xs rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium transition-colors"
                    >
                      Diagnose
                    </button>
                  </div>
                </div>

                {/* Metadata row without pill enclosure slop */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 border-t border-zinc-800/60 pt-2.5 font-mono">
                  <span>{repo.language}</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>{repo.framework}</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>Branch: {repo.current_branch}</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>Health: {repo.health_score}/100</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>{repo.test_framework || 'node:test'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Autonomous Agent Runs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-semibold text-zinc-200">Recent Agent Runs</h2>
            </div>
            <button
              onClick={() => onNavigate('agent-runs')}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {recentRuns.length === 0 ? (
              <div className="p-6 rounded-lg border border-zinc-800/80 bg-zinc-900/20 text-center text-xs text-zinc-400 space-y-3">
                <Terminal className="w-6 h-6 text-zinc-600 mx-auto" />
                <p>No agent runs yet. Trigger a repair plan on any detected issue to begin.</p>
                <button
                  onClick={() => onNavigate('demo-run')}
                  className="px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                >
                  Run Demo Cart Repair
                </button>
              </div>
            ) : (
              recentRuns.map(run => (
                <div
                  key={run.id}
                  onClick={() => onNavigate('agent-run-detail', { runId: run.id })}
                  className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-zinc-400">{run.repo_name}</span>
                    <span
                      className={`font-mono text-[11px] font-semibold ${
                        run.status === 'AWAITING_HUMAN_APPROVAL'
                          ? 'text-sky-400'
                          : run.status === 'STOPPED'
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {run.status}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-zinc-200 line-clamp-1">{run.issue_title}</p>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <span>Target: {run.target_branch}</span>
                    <span>{new Date(run.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
