import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  Shield,
  FileCode,
  CheckCircle2,
  Wrench
} from 'lucide-react';
import { api } from '../services/api';
import { Issue, Severity, IssueCategory } from '../../shared/types';

interface IssuesPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const IssuesPage: React.FC<IssuesPageProps> = ({ onNavigate }) => {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const data = await api.getIssues();
      setIssues(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.updateIssueStatus(id, newStatus);
      await fetchIssues();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSeverity = selectedSeverity === 'ALL' || issue.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'ALL' || issue.category === selectedCategory;
    const matchesSearch =
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.file_path.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Detected Issues</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Automated code diagnostics, security flaws, and regression risks.
          </p>
        </div>

        <div className="text-xs font-mono text-zinc-400">
          Total: <span className="text-zinc-200 font-bold">{issues.length}</span> issues identified
        </div>
      </div>

      {/* Filter Bar (Segmented button controls) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-900/40 rounded-lg border border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Severity selector */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded border border-zinc-800 text-xs font-mono">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  selectedSeverity === sev
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Category selector */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded border border-zinc-800 text-xs font-mono">
            {['ALL', 'bug', 'security', 'dependency'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded transition-colors capitalize ${
                  selectedCategory === cat
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search file or issue..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-mono"
          />
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono">
            No issues match current filters.
          </div>
        ) : (
          filteredIssues.map(issue => (
            <div
              key={issue.id}
              className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold ${
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
                  <p className="text-xs text-zinc-400 max-w-4xl">{issue.explanation}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleUpdateStatus(issue.id, 'ignored')}
                    className="px-2.5 py-1 text-xs rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    Ignore
                  </button>
                  <button
                    onClick={() => onNavigate('issue-detail', { issueId: issue.id })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Generate Repair Plan</span>
                  </button>
                </div>
              </div>

              {/* Evidence Code Box */}
              {issue.evidence && (
                <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto">
                  <span className="text-zinc-500 select-none">// Evidence: </span>
                  {issue.evidence}
                </div>
              )}

              {/* Clean metadata without pill slop */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 border-t border-zinc-800/60 pt-2.5 font-mono">
                <span className="text-zinc-300">{issue.repo_name || 'demo-shop'}</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>{issue.file_path}{issue.line_number ? `:${issue.line_number}` : ''}</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span>Confidence: {issue.confidence}%</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="capitalize">{issue.verification_status}</span>
                <span aria-hidden="true" className="text-zinc-600">·</span>
                <span className="capitalize">Status: {issue.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
