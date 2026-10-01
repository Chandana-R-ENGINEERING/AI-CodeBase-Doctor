import React from 'react';
import {
  ShieldAlert,
  Terminal,
  Play,
  GitPullRequest,
  CheckCircle2,
  Cpu,
  Lock,
  ArrowRight,
  GitBranch,
  Search,
  Wrench,
  CheckCheck
} from 'lucide-react';

interface LandingPageProps {
  onStartDemo: () => void;
  onConnectGitHub: () => void;
  onExplore: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartDemo,
  onConnectGitHub,
  onExplore
}) => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-400">
          <Terminal className="w-3.5 h-3.5" />
          <span>AUTONOMOUS SOFTWARE ENGINEERING AGENT</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-100 uppercase">
          AI CODEBASE DOCTOR
        </h1>

        <p className="text-xl font-medium text-emerald-400 tracking-wide">
          "Diagnose. Repair. Validate. Review."
        </p>

        <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
          Diagnose bugs, repair code, execute tests in sandboxed environments, and prepare GitHub Pull Requests — while keeping humans in control of production.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={onStartDemo}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Live Demo Workflow</span>
          </button>

          <button
            onClick={onConnectGitHub}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 font-semibold transition-colors cursor-pointer"
          >
            <GitBranch className="w-4 h-4 text-zinc-400" />
            <span>Connect GitHub Repository</span>
          </button>
        </div>

        {/* Safety Callout */}
        <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Strict Engineering Safety: AI never pushes directly to main and never automatically merges pull requests.
          </span>
        </div>
      </div>

      {/* 6-Step Workflow */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">The Autonomous Repair Flow</h2>
          <p className="text-sm text-zinc-400">
            From bug detection to sandbox validation and human review.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              title: 'Connect Repository',
              desc: 'Inspects project structure, languages, package manager, and test suites across Node.js, Python, Java, Go, Rust.',
              icon: Search
            },
            {
              step: '02',
              title: 'Diagnose & Trace',
              desc: 'Identifies bugs, null dereferences, security flaws, and breaking dependency changes with evidence lines.',
              icon: Cpu
            },
            {
              step: '03',
              title: 'Plan Surgical Repair',
              desc: 'Synthesizes minimal repair plan, identifies affected files, and specifies regression test requirements.',
              icon: Wrench
            },
            {
              step: '04',
              title: 'Isolated Branch & Patch',
              desc: 'Creates dedicated branch ai-codebase-doctor/fix/* and executes targeted code modifications.',
              icon: GitBranch
            },
            {
              step: '05',
              title: 'Sandboxed Validation',
              desc: 'Executes actual test runner (npm test, vitest, pytest), linting, and build commands in an isolated sandbox.',
              icon: CheckCheck
            },
            {
              step: '06',
              title: 'Human Review & Gate',
              desc: 'Prepares GitHub PR with complete impact report and halts. A human developer reviews and executes the merge.',
              icon: ShieldAlert
            }
          ].map(card => {
            const Icon = card.icon;
            return (
              <div
                key={card.step}
                className="p-5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded bg-zinc-800/80 border border-zinc-700/60 text-emerald-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-zinc-400">{card.step}</span>
                </div>
                <h3 className="font-semibold text-zinc-100 text-base">{card.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real vs Mock Principles */}
      <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-4">
        <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Real Engineering Agent · No Chatbots · No Mock Pretending</span>
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed">
          AI Codebase Doctor is designed as an autonomous multi-agent pipeline: Repository Analyzer, Issue Detector, Research Agent, Repair Planner, Code Repair Agent, Validation Agent, Impact Analysis Agent, and Pull Request Agent. Every command executed runs inside an isolated sandbox with sanitized environment variables and secret masking.
        </p>

        <div className="pt-2">
          <button
            onClick={onExplore}
            className="flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            <span>Enter Developer Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
