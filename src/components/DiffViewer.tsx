import React, { useState } from 'react';
import { Check, Copy, FileCode, Columns, AlignJustify } from 'lucide-react';

interface DiffViewerProps {
  filePath: string;
  originalContent: string;
  modifiedContent: string;
  diffPatch?: string;
  linesAdded?: number;
  linesRemoved?: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  filePath,
  originalContent,
  modifiedContent,
  linesAdded = 0,
  linesRemoved = 0
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(modifiedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const origLines = originalContent ? originalContent.split('\n') : [];
  const modLines = modifiedContent ? modifiedContent.split('\n') : [];
  const maxLines = Math.max(origLines.length, modLines.length);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden font-mono text-xs">
      {/* File Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 text-zinc-300">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-zinc-400" />
          <span className="font-semibold text-zinc-100">{filePath}</span>
          <div className="flex items-center gap-2 text-zinc-400 ml-2">
            <span className="text-emerald-400 font-medium">+{linesAdded}</span>
            <span aria-hidden="true">/</span>
            <span className="text-rose-400 font-medium">-{linesRemoved}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Control for View Mode */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded border border-zinc-800">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'split' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Side-by-side Diff"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'unified' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Unified Diff"
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span>Unified</span>
            </button>
          </div>

          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code diff lines */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        {viewMode === 'split' ? (
          <table className="w-full text-left border-collapse select-text">
            <thead>
              <tr className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800/80 text-[11px]">
                <th className="w-12 px-2 py-1 text-right text-zinc-500 font-normal">#</th>
                <th className="w-[calc(50%-3rem)] px-3 py-1 font-medium">Original (Before)</th>
                <th className="w-12 px-2 py-1 text-right text-zinc-500 font-normal border-l border-zinc-800/60">#</th>
                <th className="w-[calc(50%-3rem)] px-3 py-1 font-medium">Doctor Patch (After)</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxLines }).map((_, idx) => {
                const orig = origLines[idx];
                const mod = modLines[idx];
                const isDifferent = orig !== mod;
                const isAdded = orig === undefined && mod !== undefined;
                const isRemoved = orig !== undefined && mod === undefined;

                return (
                  <tr key={idx} className="hover:bg-zinc-900/40 transition-colors font-mono leading-relaxed">
                    {/* Left: Original */}
                    <td className="px-2 py-0.5 text-right text-zinc-600 select-none bg-zinc-950/80 text-[11px]">
                      {orig !== undefined ? idx + 1 : ''}
                    </td>
                    <td
                      className={`px-3 py-0.5 whitespace-pre ${
                        isDifferent && orig !== undefined
                          ? 'bg-rose-950/30 text-rose-300'
                          : isRemoved
                          ? 'bg-rose-950/40 text-rose-300'
                          : 'text-zinc-300'
                      }`}
                    >
                      {orig !== undefined ? orig : ''}
                    </td>

                    {/* Right: Modified */}
                    <td className="px-2 py-0.5 text-right text-zinc-600 select-none bg-zinc-950/80 border-l border-zinc-800/60 text-[11px]">
                      {mod !== undefined ? idx + 1 : ''}
                    </td>
                    <td
                      className={`px-3 py-0.5 whitespace-pre ${
                        isDifferent && mod !== undefined
                          ? 'bg-emerald-950/30 text-emerald-300'
                          : isAdded
                          ? 'bg-emerald-950/40 text-emerald-300'
                          : 'text-zinc-300'
                      }`}
                    >
                      {mod !== undefined ? mod : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* Unified View */
          <div className="p-3 font-mono leading-relaxed">
            {modLines.map((line, idx) => {
              const origLine = origLines[idx];
              const isDiff = origLine !== line;
              return (
                <div
                  key={idx}
                  className={`flex items-start px-2 py-0.5 rounded-sm ${
                    isDiff ? 'bg-emerald-950/30 text-emerald-300' : 'text-zinc-300'
                  }`}
                >
                  <span className="w-10 text-right pr-4 text-zinc-600 select-none text-[11px]">{idx + 1}</span>
                  <span className="w-4 select-none text-zinc-500 font-bold">{isDiff ? '+' : ' '}</span>
                  <span className="whitespace-pre flex-1">{line}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
