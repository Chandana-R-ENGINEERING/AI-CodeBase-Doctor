import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCode,
  ShieldAlert,
  GitPullRequest,
  Copy,
  Check,
  Terminal,
  RefreshCw,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { DiffViewer } from '../components/DiffViewer';
import { WorkflowTimeline } from '../components/WorkflowTimeline';
import { TerminalOutput } from '../components/TerminalOutput';

interface AgentRunDetailPageProps {
  runId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const AgentRunDetailPage: React.FC<AgentRunDetailPageProps> = ({ runId, onNavigate }) => {
  const [run, setRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'diff' | 'validation' | 'impact' | 'pr'>('timeline');
  const [copiedPr, setCopiedPr] = useState(false);

  const fetchRun = async () => {
    try {
      const data = await api.getAgentRun(runId);
      setRun(data);
      if (data.status === 'PR_READY' || data.status === 'AWAITING_HUMAN_APPROVAL') {
        // If PR is ready, default to PR or diff tab if user hasn't switched
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRun();

    // Poll until run reaches terminal state: AWAITING_HUMAN_APPROVAL, STOPPED, or COMPLETED
    const interval = setInterval(() => {
      fetchRun();
    }, 2000);

    return () => clearInterval(interval);
  }, [runId]);

  const copyPrMarkdown = () => {
    if (run?.pull_request?.description) {
      navigator.clipboard.writeText(run.pull_request.description);
      setCopiedPr(true);
      setTimeout(() => setCopiedPr(false), 2000);
    }
  };

  if (loading && !run) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500 font-mono">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-600" />
        Connecting to autonomous agent run pipeline...
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="p-8 text-center text-xs text-rose-400 font-mono">
        Failed to load agent run: {error || 'Not found'}
      </div>
    );
  }

  const isComplete = run.status === 'AWAITING_HUMAN_APPROVAL' || run.status === 'COMPLETED';
  const isHalted = run.status === 'STOPPED';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner with Run State */}
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
              <span>{run.repo_name}</span>
              <span aria-hidden="true" className="text-zinc-600">/</span>
              <span className="text-emerald-400">Run #{run.id.slice(-6)}</span>
              {run.is_demo ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300">
                  DEMO RUN
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
                  LIVE GITHUB RUN
                </span>
              )}
            </div>

            <h1 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span>Target: {run.issue_title}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-400 font-mono mt-1">
              <span className="flex items-center gap-1 text-zinc-300">
                <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                {run.target_branch}
              </span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Base: {run.base_branch}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Attempt: {run.current_attempt}/{run.max_attempts}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
                isComplete
                  ? 'bg-sky-950/40 border-sky-800/60 text-sky-300'
                  : isHalted
                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 animate-pulse'
              }`}
            >
              <div className="h-2 w-2 rounded-full bg-current" />
              <span>{run.status}</span>
            </div>
          </div>
        </div>

        {/* HUMAN APPROVAL GATE BANNER (Section 14 & 15) */}
        {isComplete && (
          <div className="p-4 rounded-lg bg-sky-950/30 border border-sky-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-sky-200 block text-sm">
                  Autonomous Phase Complete: Ready for Human Approval
                </span>
                <p className="text-sky-300/80 mt-0.5">
                  All tests, type checks, and builds have validated successfully in the isolated sandbox. Pull Request #{run.pull_request?.pr_number || '101'} has been staged on <code className="font-mono text-sky-200">{run.target_branch}</code>. The agent will NEVER automatically merge changes into main.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('pr')}
                className="px-3 py-1.5 rounded bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold transition-colors shadow-xs"
              >
                Review Pull Request
              </button>
            </div>
          </div>
        )}

        {isHalted && (
          <div className="p-4 rounded-lg bg-rose-950/30 border border-rose-800/50 text-xs text-rose-300 flex items-start gap-2.5">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-rose-200 block text-sm">
                Execution Stopped: Maximum Attempts Exceeded
              </span>
              <p className="mt-0.5">{run.failure_reason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Segmented Control */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900/60 rounded-lg border border-zinc-800 w-fit">
        {[
          { id: 'timeline', label: `Agent Steps (${run.steps?.length || 0})` },
          { id: 'diff', label: `Code Diff (${run.changes?.length || 0})` },
          { id: 'validation', label: 'Sandbox Validation' },
          { id: 'impact', label: 'Impact Report' },
          { id: 'pr', label: 'Pull Request' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/20">
          <WorkflowTimeline currentState={run.status} steps={run.steps || []} />
        </div>
      )}

      {/* TAB 2: CODE DIFF */}
      {activeTab === 'diff' && (
        <div className="space-y-4">
          {run.changes && run.changes.length > 0 ? (
            run.changes.map((change: any) => (
              <DiffViewer
                key={change.id}
                filePath={change.file_path}
                originalContent={change.original_content}
                modifiedContent={change.modified_content}
                linesAdded={change.lines_added}
                linesRemoved={change.lines_removed}
              />
            ))
          ) : (
            <div className="p-8 text-center text-xs text-zinc-500 font-mono border border-zinc-800 rounded-lg">
              No code modifications applied yet. Awaiting Code Repair Agent turn.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VALIDATION DASHBOARD */}
      {activeTab === 'validation' && (
        <div className="space-y-4">
          {run.validation ? (
            <div className="space-y-4">
              {/* Validation Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded bg-zinc-900/40 border border-zinc-800">
                  <span className="text-zinc-400 uppercase text-[10px]">Test Suite</span>
                  <div className="text-lg font-bold text-emerald-400 mt-1">
                    {run.validation.tests_passed} / {run.validation.tests_total} Passed
                  </div>
                  <span className="text-[11px] text-zinc-400">0 regressions</span>
                </div>

                <div className="p-3.5 rounded bg-zinc-900/40 border border-zinc-800">
                  <span className="text-zinc-400 uppercase text-[10px]">Linter (ESLint)</span>
                  <div className="text-lg font-bold text-emerald-400 mt-1 uppercase">
                    {run.validation.lint_status}
                  </div>
                  <span className="text-[11px] text-zinc-400">0 errors</span>
                </div>

                <div className="p-3.5 rounded bg-zinc-900/40 border border-zinc-800">
                  <span className="text-zinc-400 uppercase text-[10px]">Type Check</span>
                  <div className="text-lg font-bold text-emerald-400 mt-1 uppercase">
                    {run.validation.typecheck_status}
                  </div>
                  <span className="text-[11px] text-zinc-400">TypeScript clean</span>
                </div>

                <div className="p-3.5 rounded bg-zinc-900/40 border border-zinc-800">
                  <span className="text-zinc-400 uppercase text-[10px]">Production Build</span>
                  <div className="text-lg font-bold text-emerald-400 mt-1 uppercase">
                    {run.validation.build_status}
                  </div>
                  <span className="text-[11px] text-zinc-400">dist/ compiled</span>
                </div>
              </div>

              {/* Execution Sandbox Terminal Logs */}
              {run.validation.command_outputs_json && (
                <div className="space-y-3">
                  <h3 className="text-xs font-mono uppercase text-zinc-400">Sandbox Command Execution Logs</h3>
                  {(() => {
                    try {
                      const outputs = JSON.parse(run.validation.command_outputs_json);
                      return (
                        <div className="space-y-3">
                          {outputs.test && <TerminalOutput title="npm test (Vitest / node:test)" output={outputs.test} />}
                          {outputs.lint && <TerminalOutput title="npm run lint" output={outputs.lint} maxHeight="160px" />}
                          {outputs.build && <TerminalOutput title="npm run build" output={outputs.build} maxHeight="160px" />}
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-zinc-500 font-mono border border-zinc-800 rounded-lg">
              Sandbox validation has not completed yet.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: IMPACT REPORT */}
      {activeTab === 'impact' && (
        <div className="space-y-4">
          {run.impact ? (
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-semibold text-zinc-100 text-sm">Automated Impact & Risk Assessment</h3>
                <span
                  className={`font-mono text-xs font-bold uppercase ${
                    run.impact.risk_level === 'low'
                      ? 'text-emerald-400'
                      : run.impact.risk_level === 'medium'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  Risk Level: {run.impact.risk_level}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-mono uppercase text-zinc-400 text-[10px]">Summary</span>
                  <p className="text-zinc-200 mt-1 leading-relaxed bg-zinc-950 p-3 rounded border border-zinc-800">
                    {run.impact.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="font-mono uppercase text-zinc-400 text-[10px]">Root Cause</span>
                    <p className="text-zinc-300 mt-1 bg-zinc-950 p-2.5 rounded border border-zinc-800">
                      {run.impact.root_cause}
                    </p>
                  </div>
                  <div>
                    <span className="font-mono uppercase text-zinc-400 text-[10px]">Changes Applied</span>
                    <p className="text-zinc-300 mt-1 bg-zinc-950 p-2.5 rounded border border-zinc-800">
                      {run.impact.changes_summary}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
                    <span className="font-mono uppercase text-zinc-400 text-[10px]">Security Impact</span>
                    <p className="text-zinc-300 mt-1 text-[11px]">{run.impact.security_impact}</p>
                  </div>
                  <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
                    <span className="font-mono uppercase text-zinc-400 text-[10px]">Performance Impact</span>
                    <p className="text-zinc-300 mt-1 text-[11px]">{run.impact.performance_impact}</p>
                  </div>
                  <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
                    <span className="font-mono uppercase text-zinc-400 text-[10px]">Compatibility</span>
                    <p className="text-zinc-300 mt-1 text-[11px]">{run.impact.compatibility_impact}</p>
                  </div>
                </div>

                <div>
                  <span className="font-mono uppercase text-zinc-400 text-[10px]">Rollback Plan</span>
                  <p className="text-zinc-300 mt-1 bg-zinc-950 p-2.5 rounded border border-zinc-800 font-mono text-[11px]">
                    {run.impact.rollback_plan}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-zinc-500 font-mono border border-zinc-800 rounded-lg">
              Impact assessment will be generated following validation pass.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PULL REQUEST */}
      {activeTab === 'pr' && (
        <div className="space-y-4">
          {run.pull_request ? (
            <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-mono text-zinc-400">
                      PR #{run.pull_request.pr_number} · Ready for Human Review
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-zinc-100 font-mono">
                    {run.pull_request.title}
                  </h2>
                  <div className="text-xs font-mono text-zinc-400">
                    Branch: <code className="text-emerald-400">{run.pull_request.branch}</code> → <code className="text-zinc-300">{run.pull_request.base_branch}</code>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyPrMarkdown}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                  >
                    {copiedPr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>{copiedPr ? 'Copied' : 'Copy PR Description'}</span>
                  </button>

                  {run.pull_request.pr_url && !run.is_demo ? (
                    <a
                      href={run.pull_request.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-colors"
                    >
                      <span>Open on GitHub</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <div className="px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-mono">
                      Staged in Demo Sandbox
                    </div>
                  )}
                </div>
              </div>

              {/* PR Description Preview */}
              <div className="space-y-2">
                <span className="font-mono text-xs text-zinc-400 uppercase">Pull Request Markdown Body</span>
                <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed select-text">
                  {run.pull_request.description}
                </div>
              </div>

              {/* Human Merge Warning */}
              <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
                <span>
                  Safety Enforced: AI Codebase Doctor never merges Pull Requests automatically. Merge requires your team review on GitHub.
                </span>
                <span className="font-mono text-emerald-400 font-bold shrink-0 ml-2">STOPPED AT GATE</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-zinc-500 font-mono border border-zinc-800 rounded-lg">
              Pull Request will be prepared after validation passes.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
