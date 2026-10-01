import React, { useState, useEffect } from 'react';
import { GitPullRequest, ExternalLink, Copy, Check, ShieldAlert, GitBranch } from 'lucide-react';
import { api } from '../services/api';
import { PullRequest } from '../../shared/types';

interface PullRequestsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const PullRequestsPage: React.FC<PullRequestsPageProps> = ({ onNavigate }) => {
  const [prs, setPrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPRs = async () => {
      try {
        setLoading(true);
        const data = await api.getPullRequests();
        setPrs(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPRs();
  }, []);

  const copyDesc = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Pull Requests</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Engineered Pull Requests prepared by AI Codebase Doctor awaiting human review.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-3 py-1.5 rounded">
          <ShieldAlert className="w-4 h-4" />
          <span>Strict Human Merge Approval Policy Active</span>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono">Loading pull requests...</div>
        ) : prs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono border border-zinc-800 rounded-lg">
            No pull requests staged yet. Execute a repair plan to generate a PR.
          </div>
        ) : (
          prs.map(pr => (
            <div
              key={pr.id}
              className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-xs text-zinc-400">
                      {pr.repo_name} · PR #{pr.pr_number}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/60 border border-sky-800/60 text-sky-300 font-semibold uppercase">
                      {pr.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-zinc-100">{pr.title}</h2>

                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">{pr.branch}</span>
                    <span>→</span>
                    <span className="text-zinc-300">{pr.base_branch}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyDesc(pr.id, pr.description)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                  >
                    {copiedId === pr.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                    <span>{copiedId === pr.id ? 'Copied' : 'Copy Description'}</span>
                  </button>

                  {pr.pr_url && !pr.is_demo ? (
                    <a
                      href={pr.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-colors"
                    >
                      <span>Open on GitHub</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <div className="px-3 py-1.5 rounded bg-zinc-800/80 text-zinc-400 text-xs font-mono">
                      Staged in Sandbox
                    </div>
                  )}
                </div>
              </div>

              {/* Description preview */}
              <div className="p-3.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed select-text max-h-48 overflow-y-auto">
                {pr.description}
              </div>

              {/* Review stop notice */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono border-t border-zinc-800/60 pt-2">
                <span>Staged at: {new Date(pr.created_at).toLocaleString()}</span>
                <span className="text-sky-400">Waiting for human developer approval</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
