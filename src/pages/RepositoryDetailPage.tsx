import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  RefreshCw,
  Search,
  Shield,
  Package,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCode,
  ArrowRight,
  ExternalLink,
  Cpu,
  Layers,
  Terminal
} from 'lucide-react';
import { api } from '../services/api';
import { Repository, Issue, AgentRun } from '../../shared/types';

interface RepositoryDetailPageProps {
  repoId: string;
  initialTab?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const RepositoryDetailPage: React.FC<RepositoryDetailPageProps> = ({
  repoId,
  initialTab = 'overview',
  onNavigate
}) => {
  const [repo, setRepo] = useState<any>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const loadRepo = async () => {
    try {
      setLoading(true);
      const [r, iss, allRuns] = await Promise.all([
        api.getRepository(repoId),
        api.getIssues({ repoId }),
        api.getAgentRuns()
      ]);
      setRepo(r);
      setIssues(iss);
      setRuns(allRuns.filter(x => x.repository_id === repoId));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepo();
  }, [repoId]);

  const handleScan = async (scanType: string = 'full') => {
    try {
      setScanning(true);
      setScanMessage(`Repository Analyzer Agent running ${scanType} inspection...`);
      const result = await api.scanRepository(repoId, scanType);
      setScanMessage(`Scan completed: ${result.issuesCount} issues identified.`);
      await loadRepo();
    } catch (err: any) {
      setScanMessage(`Scan error: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  if (loading || !repo) {
    return (
      <div className="p-8 text-center text-xs text-zinc-400 font-mono">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-500" />
        Loading repository metadata and tree...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <FolderGit2 className="w-6 h-6 text-emerald-400" />
              <h1 className="text-xl font-bold text-zinc-100">{repo.full_name}</h1>
              {repo.is_demo ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/80 text-amber-300 font-semibold">
                  DEMO MODE
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 font-semibold">
                  LIVE REPO
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl">{repo.description}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleScan('full')}
              disabled={scanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{scanning ? 'Scanning Codebase...' : 'Analyze Repository'}</span>
            </button>

            <button
              onClick={() => handleScan('bugs')}
              disabled={scanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Find Bugs</span>
            </button>

            <button
              onClick={() => handleScan('dependencies')}
              disabled={scanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Check Dependencies</span>
            </button>

            <button
              onClick={() => handleScan('security')}
              disabled={scanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Run Security Scan</span>
            </button>
          </div>
        </div>

        {scanMessage && (
          <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}

        {/* Clean Metadata Line */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 border-t border-zinc-800/60 pt-3 font-mono">
          <span className="text-zinc-200 font-semibold">{repo.language}</span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>{repo.framework}</span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>Pkg: {repo.package_manager}</span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>Branch: {repo.current_branch}</span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>Health: {repo.health_score}/100</span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>Runner: {repo.test_framework || 'node:test'}</span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>Build: {repo.build_command || 'npm run build'}</span>
        </div>
      </div>

      {/* Tabs navigation: Functional segmented control */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900/60 rounded-lg border border-zinc-800 w-fit">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'issues', label: `Issues (${issues.length})` },
          { id: 'dependencies', label: 'Dependencies' },
          { id: 'security', label: 'Security' },
          { id: 'tests', label: 'Test Suite' },
          { id: 'agent-runs', label: `Agent Runs (${runs.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/20 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-200">Repository Structure & Entry Points</h2>
              <div className="p-3 bg-zinc-950 rounded border border-zinc-800 font-mono text-xs text-zinc-300 space-y-1">
                <div>├── package.json</div>
                <div>├── src/</div>
                <div>│   ├── services/</div>
                <div>│   │   ├── cartService.ts (Target for discount null check)</div>
                <div>│   │   ├── checkoutService.ts</div>
                <div>│   │   └── catalogService.ts</div>
                <div>│   └── types/index.ts</div>
                <div>└── test/</div>
                <div>    └── cart.test.mjs (Regression Test Suite)</div>
              </div>
            </div>

            <div className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/20 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-200">Health Breakdown</h2>
              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded bg-zinc-900/50 border border-zinc-800">
                  <div className="text-zinc-400">Code Quality</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">88%</div>
                </div>
                <div className="p-3 rounded bg-zinc-900/50 border border-zinc-800">
                  <div className="text-zinc-400">Test Coverage</div>
                  <div className="text-lg font-bold text-sky-400 mt-1">79%</div>
                </div>
                <div className="p-3 rounded bg-zinc-900/50 border border-zinc-800">
                  <div className="text-zinc-400">Security Score</div>
                  <div className="text-lg font-bold text-amber-400 mt-1">74%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/20 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-200">Recent Scans</h2>
              <div className="space-y-2">
                {repo.recent_scans && repo.recent_scans.length > 0 ? (
                  repo.recent_scans.map((s: any) => (
                    <div key={s.id} className="p-2.5 rounded bg-zinc-950/60 border border-zinc-800 text-xs">
                      <div className="flex items-center justify-between text-zinc-400 font-mono">
                        <span className="uppercase">{s.scan_type}</span>
                        <span>{new Date(s.started_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-zinc-300 mt-1 line-clamp-1">{s.summary}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-zinc-400">No previous scan history.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ISSUES */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">Detected Issues & Vulnerabilities</h2>
            <span className="text-xs font-mono text-zinc-400">{issues.length} active items</span>
          </div>

          <div className="space-y-3">
            {issues.map(issue => (
              <div
                key={issue.id}
                className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-mono font-bold ${
                          issue.severity === 'CRITICAL'
                            ? 'text-rose-400'
                            : issue.severity === 'HIGH'
                            ? 'text-rose-300'
                            : issue.severity === 'MEDIUM'
                            ? 'text-amber-400'
                            : 'text-sky-400'
                        }`}
                      >
                        [{issue.severity}]
                      </span>
                      <h3 className="font-semibold text-zinc-100 text-sm">{issue.title}</h3>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1.5">{issue.explanation}</p>
                  </div>

                  <button
                    onClick={() => onNavigate('issue-detail', { issueId: issue.id })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-colors shrink-0"
                  >
                    <span>Repair Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Evidence snippet */}
                {issue.evidence && (
                  <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80 font-mono text-xs text-zinc-300 overflow-x-auto">
                    <span className="text-zinc-400 select-none">// Evidence: </span>
                    {issue.evidence}
                  </div>
                )}

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 border-t border-zinc-800/60 pt-2 font-mono">
                  <span>File: {issue.file_path}{issue.line_number ? `:${issue.line_number}` : ''}</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>Confidence: {issue.confidence}%</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span className="capitalize">{issue.verification_status}</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span className="capitalize">Status: {issue.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DEPENDENCIES */}
      {activeTab === 'dependencies' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200">Dependency Intelligence</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Analyzes dependencies for outdated packages, breaking changes, and CVE advisories. Safe migration recommendations require explicit user approval.
            </p>

            <div className="border border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 text-[11px]">
                  <tr>
                    <th className="px-3 py-2">Package</th>
                    <th className="px-3 py-2">Current</th>
                    <th className="px-3 py-2">Recommended</th>
                    <th className="px-3 py-2">Breaking Changes</th>
                    <th className="px-3 py-2">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  <tr>
                    <td className="px-3 py-2 font-semibold text-zinc-100">express</td>
                    <td className="px-3 py-2 text-rose-300 font-mono">^4.18.1</td>
                    <td className="px-3 py-2 text-emerald-300 font-mono">^4.21.2</td>
                    <td className="px-3 py-2 text-zinc-400">Path traversal patch, non-breaking</td>
                    <td className="px-3 py-2 text-emerald-400 font-bold">LOW</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-zinc-100">zod</td>
                    <td className="px-3 py-2 font-mono">^3.23.8</td>
                    <td className="px-3 py-2 font-mono text-zinc-400">^3.23.8 (Latest)</td>
                    <td className="px-3 py-2 text-zinc-400">Up to date</td>
                    <td className="px-3 py-2 text-zinc-500">NONE</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-semibold text-zinc-100">typescript</td>
                    <td className="px-3 py-2 font-mono">^5.4.5</td>
                    <td className="px-3 py-2 text-sky-300 font-mono">^5.5.4</td>
                    <td className="px-3 py-2 text-zinc-400">Inferred type predicates</td>
                    <td className="px-3 py-2 text-emerald-400 font-bold">LOW</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200">Security & Secret Screening</h2>
            <p className="text-xs text-zinc-400">
              Scans for unsanitized inputs, command injections, and exposed credentials. Discovered secrets are masked automatically.
            </p>

            <div className="space-y-2">
              <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-rose-400 font-bold">[CRITICAL] Unsanitized Dynamic RegExp</span>
                  <span className="text-zinc-500">catalogService.ts:18</span>
                </div>
                <p className="text-zinc-400 text-xs">
                  Raw user search string passed into new RegExp without escaping. Vulnerable to ReDoS backtracking.
                </p>
              </div>

              <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400">
                ✓ No exposed API keys or tokens found. All credentials masked in logs.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TESTS */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-200">Automated Test Suites</h2>
            <p className="text-xs text-zinc-400">
              Test runner detected: <code className="font-mono text-zinc-200">{repo.test_framework || 'node:test'}</code>
            </p>

            <div className="p-3 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-2">
              <div className="text-zinc-300 font-semibold">Test File: test/cart.test.mjs</div>
              <div className="text-zinc-400 pl-3 border-l border-zinc-800 space-y-1">
                <div>✓ calculateSubtotal calculates items correctly</div>
                <div>✓ calculateDiscount applies 20% discount correctly with valid promo</div>
                <div>✖ calculateDiscount handles null promo (Throws TypeError without patch)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AGENT RUNS */}
      {activeTab === 'agent-runs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">Agent Runs for {repo.name}</h2>
          </div>

          <div className="space-y-3">
            {runs.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                No agent runs on this repository yet. Click on an issue to start a repair.
              </div>
            ) : (
              runs.map(run => (
                <div
                  key={run.id}
                  onClick={() => onNavigate('agent-run-detail', { runId: run.id })}
                  className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-zinc-300 font-medium">{run.issue_title}</span>
                    <span className="font-mono text-sky-400 font-semibold">{run.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                    <span>Branch: {run.target_branch}</span>
                    <span aria-hidden="true">·</span>
                    <span>Attempt {run.current_attempt}/{run.max_attempts}</span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(run.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
