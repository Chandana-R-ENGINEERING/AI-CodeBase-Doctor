import React, { useRef, useEffect } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

interface TerminalOutputProps {
  title?: string;
  output: string;
  maxHeight?: string;
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({
  title = 'Execution Sandbox Terminal',
  output,
  maxHeight = '320px'
}) => {
  const [copied, setCopied] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [output]);

  const copyLogs = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800 text-zinc-300">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-zinc-200">{title}</span>
        </div>
        <button
          onClick={copyLogs}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors text-[11px]"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
          <span>{copied ? 'Copied' : 'Copy Logs'}</span>
        </button>
      </div>

      <div
        ref={containerRef}
        style={{ maxHeight }}
        className="p-3 overflow-y-auto space-y-1 font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed select-text"
      >
        {output ? (
          output.split('\n').map((line, idx) => {
            let color = 'text-zinc-300';
            if (line.includes('✓') || line.includes('passed') || line.includes('Pass')) {
              color = 'text-emerald-400';
            } else if (line.includes('✖') || line.includes('failed') || line.includes('Error')) {
              color = 'text-rose-400';
            } else if (line.includes('[SECURITY') || line.includes('warn')) {
              color = 'text-amber-400';
            } else if (line.startsWith('#') || line.startsWith('===')) {
              color = 'text-sky-400 font-semibold';
            }

            return (
              <div key={idx} className={color}>
                {line}
              </div>
            );
          })
        ) : (
          <span className="text-zinc-600 italic">No console output recorded.</span>
        )}
      </div>
    </div>
  );
};
