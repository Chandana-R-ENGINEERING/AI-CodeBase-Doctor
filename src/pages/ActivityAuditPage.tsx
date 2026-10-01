import React, { useState, useEffect } from 'react';
import { History, Terminal, Cpu, CheckCircle2, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../../shared/types';

export const ActivityAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Activity & Audit Logs</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Complete observability trail: agent executions, shell commands, and security validations.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono border border-zinc-800 rounded-lg">
            No audit records logged yet.
          </div>
        ) : (
          logs.map(log => (
            <div
              key={log.id}
              className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 font-mono text-xs space-y-2 hover:border-zinc-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-zinc-200">{log.agent_name}</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span
                    className={`text-[10px] uppercase font-bold ${
                      log.result_status === 'success'
                        ? 'text-emerald-400'
                        : log.result_status === 'failure'
                        ? 'text-rose-400'
                        : log.result_status === 'warning'
                        ? 'text-amber-400'
                        : 'text-sky-400'
                    }`}
                  >
                    [{log.result_status}]
                  </span>
                </div>
                <span className="text-zinc-500 text-[11px]">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>

              <p className="text-zinc-300 font-sans text-xs">{log.action}</p>

              {log.command && (
                <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-400 text-[11px] overflow-x-auto flex items-center gap-2">
                  <Terminal className="w-3 h-3 text-zinc-500 shrink-0" />
                  <span className="text-emerald-400 select-none">$</span>
                  <span className="text-zinc-300 select-text">{log.command}</span>
                </div>
              )}

              {log.details && (
                <div className="p-2 rounded bg-zinc-950/60 border border-zinc-900 text-zinc-500 text-[11px]">
                  {JSON.stringify(log.details)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
