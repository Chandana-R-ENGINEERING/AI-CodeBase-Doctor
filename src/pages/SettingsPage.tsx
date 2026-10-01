import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Sparkles, GitBranch, Terminal, Save, Check, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { SystemStatus } from '../../shared/types';

export const SettingsPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form states
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'anthropic'>('gemini');
  const [aiModel, setAiModel] = useState('gemini-3.1-pro-preview');
  const [aiApiKey, setAiApiKey] = useState('');
  const [githubToken, setGithubToken] = useState('');

  const loadSettings = async () => {
    try {
      setLoading(true);
      const s = await api.getSystemStatus();
      setStatus(s);
      setAiProvider(s.ai_provider as any || 'gemini');
      setAiModel(s.model || 'gemini-3.1-pro-preview');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings({
        aiProvider,
        aiModel,
        aiApiKey: aiApiKey || undefined,
        githubToken: githubToken || undefined
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await loadSettings();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">System & Agent Settings</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure AI reasoning models, GitHub integration, and sandbox security parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* AI Provider Card */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="text-sm font-semibold text-zinc-100">AI Model & Reasoning Layer</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                Provider
              </label>
              <select
                value={aiProvider}
                onChange={e => setAiProvider(e.target.value as any)}
                className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700"
              >
                <option value="gemini">Google Gemini (@google/genai SDK)</option>
                <option value="openai">OpenAI Architecture (Configurable)</option>
                <option value="anthropic">Anthropic Architecture (Configurable)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
                Target Model
              </label>
              <select
                value={aiModel}
                onChange={e => setAiModel(e.target.value)}
                className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-700"
              >
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Recommended: Advanced Reasoning & Coding)</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash (High Speed Diagnosis)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
              Custom AI API Key (Optional if server environment GEMINI_API_KEY is active)
            </label>
            <input
              type="password"
              placeholder="AIzaSy••••••••••••••••••••••••••••"
              value={aiApiKey}
              onChange={e => setAiApiKey(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
            />
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-500 font-mono">
              <span>Status:</span>
              {status?.ai_configured ? (
                <span className="text-emerald-400">Configured and Active</span>
              ) : (
                <span className="text-amber-400">Deterministic Fallback / Key Pending</span>
              )}
            </div>
          </div>
        </div>

        {/* GitHub Integration Card */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <GitBranch className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-100">GitHub Authentication</h2>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-zinc-400 mb-1">
              GitHub Personal Access Token (repo, workflow, pull_requests scopes)
            </label>
            <input
              type="password"
              placeholder="ghp_••••••••••••••••••••••••••••••••••••"
              value={githubToken}
              onChange={e => setGithubToken(e.target.value)}
              className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
            />
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-500 font-mono">
              <span>Connection:</span>
              {status?.github_configured ? (
                <span className="text-emerald-400">Live GitHub Connected</span>
              ) : (
                <span className="text-amber-400">Demo Mode Active (Live GitHub Unset)</span>
              )}
            </div>
          </div>
        </div>

        {/* Security & Sandbox Policies */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Autonomous Safety Controls</h2>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between p-3 rounded bg-zinc-950 border border-zinc-800">
              <div>
                <span className="text-zinc-200 font-semibold block">Production Direct Push Prevention</span>
                <span className="text-zinc-500 text-[11px]">Strictly prohibits git push to main / master</span>
              </div>
              <span className="text-emerald-400 font-bold">ENFORCED</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded bg-zinc-950 border border-zinc-800">
              <div>
                <span className="text-zinc-200 font-semibold block">Automatic Pull Request Merge Prohibition</span>
                <span className="text-zinc-500 text-[11px]">All changes stop at Pull Request; human review required</span>
              </div>
              <span className="text-emerald-400 font-bold">ENFORCED</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded bg-zinc-950 border border-zinc-800">
              <div>
                <span className="text-zinc-200 font-semibold block">Shell Command Risk Allowlist & Secret Masking</span>
                <span className="text-zinc-500 text-[11px]">Rejects destructive bash commands and masks API credentials</span>
              </div>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
              <Check className="w-4 h-4" />
              <span>Settings successfully saved</span>
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
