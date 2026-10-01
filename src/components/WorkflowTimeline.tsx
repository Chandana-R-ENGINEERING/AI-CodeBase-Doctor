import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, ShieldAlert, Cpu } from 'lucide-react';
import { AgentStep, AgentState } from '../../shared/types';

interface WorkflowTimelineProps {
  currentState: AgentState;
  steps: AgentStep[];
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ currentState, steps }) => {
  return (
    <div className="space-y-4">
      {/* State Machine Status Header */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-3 w-3">
            {currentState !== 'COMPLETED' && currentState !== 'STOPPED' && currentState !== 'AWAITING_HUMAN_APPROVAL' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </>
            ) : currentState === 'AWAITING_HUMAN_APPROVAL' ? (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-400"></span>
            ) : currentState === 'STOPPED' ? (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            ) : (
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-mono text-zinc-400">ACTIVE STATE</span>
            <span className="text-sm font-semibold tracking-wide text-zinc-100">{currentState}</span>
          </div>
        </div>

        {currentState === 'AWAITING_HUMAN_APPROVAL' && (
          <div className="flex items-center gap-2 text-xs text-sky-400 bg-sky-950/40 border border-sky-800/40 px-3 py-1.5 rounded">
            <ShieldAlert className="w-4 h-4" />
            <span>Autonomous run completed. Waiting for human merge authorization.</span>
          </div>
        )}
      </div>

      {/* Steps List */}
      <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
        {steps.map((step, idx) => {
          let icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 bg-zinc-950 rounded-full" />;
          let statusColor = 'text-zinc-300';

          if (step.status === 'in_progress') {
            icon = <Clock className="w-5 h-5 text-sky-400 animate-spin bg-zinc-950 rounded-full" />;
            statusColor = 'text-sky-300 font-medium';
          } else if (step.status === 'failure') {
            icon = <XCircle className="w-5 h-5 text-rose-400 bg-zinc-950 rounded-full" />;
            statusColor = 'text-rose-300';
          } else if (step.status === 'pending') {
            icon = <Clock className="w-5 h-5 text-zinc-600 bg-zinc-950 rounded-full" />;
            statusColor = 'text-zinc-500';
          }

          return (
            <div key={step.id || idx} className="relative group">
              {/* Dot Icon */}
              <div className="absolute -left-6 top-0.5">{icon}</div>

              {/* Step Content */}
              <div className="flex flex-col bg-zinc-900/40 p-3 rounded border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                      {step.agent_name}
                    </span>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span className="text-zinc-400 capitalize">{step.status}</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {new Date(step.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <p className={`text-sm ${statusColor}`}>{step.action}</p>

                {step.details && (
                  <div className="mt-2.5 p-2 bg-zinc-950/80 rounded border border-zinc-800 text-xs font-mono text-zinc-400 overflow-x-auto">
                    {Object.entries(step.details).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-zinc-400 select-none">{k}:</span>
                        <span className="text-zinc-300">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
