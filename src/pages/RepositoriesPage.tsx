import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Plus,
  GitBranch,
  Shield,
  Play,
  Terminal,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Repository } from '../../shared/types';

interface RepositoriesPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const RepositoriesPage: React.FC<RepositoriesPageProps> = ({ onNavigate }) => {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [repoInput, setRepoInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const fetchRepos = async () => {
    try {
      setLoading(true);
      const data = await api.getRepositories();
      setRepos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput) return;

    setConnecting(true);
    setConnectError(null);
    try {
      const res = await api.connectRepository({
        fullName: repoInput.includes('/') && !repoInput.includes('http') ? repoInput : undefined,
        repoUrl: repoInput.includes('http') ? repoInput : undefined,
        token: tokenInput || undefined
      });
      setShowConnectModal(false);
      setRepoInput('');
      setTokenInput('');
      await fetchRepos();
      onNavigate('repository-detail', { repoId: res.id });
    } catch (err: any) {
      setConnectError(err.message || 'Failed to connect repository');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Repositories</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Connected codebases monitored and repaired by AI Codebase Doctor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('repository-detail', { repoId: 'repo_demo_shop' })}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-amber-400" />
            <span>Open Demo Repository</span>
          </button>

          <button
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect GitHub Repo</span>
          </button>
        </div>
      </div>

      {/* Connect Repo Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-zinc-100">Connect GitHub Repository</h2>
              </div>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter a public or private GitHub repository (e.g., <code className="text-zinc-200 font-mono">owner/repo</code> or full URL). Provide a GitHub Personal Access Token to enable private access and direct Pull Request creation.
            </p>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  Repository Identifier or URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. facebook/react or https://github.com/my-org/my-app"
                  value={repoInput}
                  onChange={e => setRepoInput(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                  GitHub Personal Access Token (Optional for public, required for private/PR creation)
                </label>
                <input
                  type="password"
                  placeholder="ghp_••••••••••••••••••••••••"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Tokens are stored encrypted or in-memory session. Never logged or exposed to the model.
                </p>
              </div>

              {connectError && (
                <div className="p-3 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{connectError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 rounded text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting}
                  className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {connecting ? 'Validating Repository...' : 'Connect & Scan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repositories List */}
      <div className="space-y-4">
        {repos.map(repo => (
          <div
            key={repo.id}
            className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-semibold text-zinc-100 text-base">{repo.full_name}</h3>
                  {repo.is_demo ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 text-amber-300 font-semibold">
                      DEMO MODE
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 font-semibold">
                      LIVE REPOSITORY
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1">{repo.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigate('repository-detail', { repoId: repo.id })}
                  className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                >
                  Inspect Codebase
                </button>
                <button
                  onClick={() => onNavigate('repository-detail', { repoId: repo.id, tab: 'issues' })}
                  className="px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-colors"
                >
                  View Issues
                </button>
              </div>
            </div>

            {/* Clean metadata line */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 border-t border-zinc-800/60 pt-3 font-mono">
              <span className="text-zinc-300">{repo.language}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>{repo.framework}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Default Branch: {repo.default_branch}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Health Score: {repo.health_score}/100</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Test Runner: {repo.test_framework || 'node:test'}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Build: {repo.build_command || 'npm run build'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
