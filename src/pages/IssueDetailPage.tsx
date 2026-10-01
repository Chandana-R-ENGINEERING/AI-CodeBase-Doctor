import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  FileCode,
  Wrench,
  CheckCircle2,
  XCircle,
  Cpu,
  RefreshCw,
  Terminal,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { Issue } from '../../shared/types';

interface IssueDetailPageProps {
  issueId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const IssueDetailPage: React.FC<IssueDetailPageProps> = ({ issueId, onNavigate }) => {
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      const data = await api.getIssue(issueId);
      setIssue(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [issueId]);

  const handleGeneratePlan = async () => {
    try {
      setGenerating(true);
      setError(null);
      const plan = await api.generateRepairPlan(issueId);
      onNavigate('repair-plan', { planId: plan.id });
    } catch (e: any) {
      setError(e.message || 'Failed to generate repair plan');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await api.updateIssueStatus(issueId, status);
      await fetchIssue();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading || !issue) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500 font-mono">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-600" />
        Loading issue diagnostics...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => onNavigate('issues')}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Detected Issues</span>
      </button>

      {/* Main Issue Card */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
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
              <h1 className="text-xl font-bold text-zinc-100">{issue.title}</h1>
            </div>

            {/* Unboxed metadata row */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-400 font-mono">
              <span>Repo: {issue.repo_name}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Category: {issue.category}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Confidence: {issue.confidence}%</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="capitalize">{issue.verification_status}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="capitalize">Status: {issue.status}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleUpdateStatus('ignored')}
              className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Ignore
            </button>
            <button
              onClick={() => handleUpdateStatus('false_positive')}
              className="px-3 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              False Positive
            </button>
            <button
              onClick={handleGeneratePlan}
              disabled={generating}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>{generating ? 'Synthesizing Plan...' : 'Generate Repair Plan'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded bg-rose-950/40 border border-rose-800 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Detailed Sections */}
        <div className="space-y-4 border-t border-zinc-800/80 pt-4">
          <div>
            <h3 className="text-xs font-mono uppercase text-zinc-400 mb-1">Issue Explanation</h3>
            <p className="text-sm text-zinc-200 leading-relaxed bg-zinc-950 p-3 rounded border border-zinc-800">
              {issue.explanation}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase text-zinc-400 mb-1">Affected Location</h3>
            <div className="flex items-center gap-2 p-2.5 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>{issue.file_path}</span>
              {issue.line_number && <span className="text-zinc-500">(Line {issue.line_number})</span>}
            </div>
          </div>

          {issue.evidence && (
            <div>
              <h3 className="text-xs font-mono uppercase text-zinc-400 mb-1">Evidence / Faulty Code</h3>
              <div className="p-3 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs text-rose-300 overflow-x-auto whitespace-pre">
                {issue.evidence}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-mono uppercase text-zinc-400 mb-1">Recommended Solution</h3>
            <div className="p-3 rounded bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-300 leading-relaxed">
              {issue.suggested_fix}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
