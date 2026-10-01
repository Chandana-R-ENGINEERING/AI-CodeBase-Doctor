import React, { useState, useEffect } from 'react';
import { PlayCircle, GitBranch, ArrowRight, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface AgentRunsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AgentRunsPage: React.FC<AgentRunsPageProps> = ({ onNavigate }) => {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const data = await api.getAgentRuns();
      setRuns(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Agent Runs</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Complete autonomous diagnosis and repair executions.
          </p>
        </div>

        <button
          onClick={fetchRuns}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono">Loading agent runs...</div>
        ) : runs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono border border-zinc-800 rounded-lg">
            No agent runs initiated yet.
          </div>
        ) : (
          runs.map(run => (
            <div
              key={run.id}
              onClick={() => onNavigate('agent-run-detail', { runId: run.id })}
              className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors cursor-pointer space-y-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200">{run.issue_title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {run.repo_name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs font-bold uppercase ${
                      run.status === 'AWAITING_HUMAN_APPROVAL'
                        ? 'text-sky-400'
                        : run.status === 'STOPPED'
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {run.status}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono border-t border-zinc-800/60 pt-2">
                <span className="flex items-center gap-1 text-zinc-300">
                  <GitBranch className="w-3 h-3 text-emerald-400" />
                  {run.target_branch}
                </span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>Attempt: {run.current_attempt}/{run.max_attempts}</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>{new Date(run.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
