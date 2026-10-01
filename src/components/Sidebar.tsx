import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  AlertCircle,
  PlayCircle,
  CheckCircle2,
  GitPullRequest,
  History,
  Settings,
  HelpCircle,
  Flame
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  openIssuesCount?: number;
  openPRsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  openIssuesCount = 0,
  openPRsCount = 0
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'landing', label: 'Product Tour', icon: Flame },
    { id: 'repositories', label: 'Repositories', icon: FolderGit2 },
    { id: 'issues', label: 'Detected Issues', icon: AlertCircle, count: openIssuesCount },
    { id: 'agent-runs', label: 'Agent Runs', icon: PlayCircle },
    { id: 'validation', label: 'Validation Hub', icon: CheckCircle2 },
    { id: 'pull-requests', label: 'Pull Requests', icon: GitPullRequest, count: openPRsCount },
    { id: 'activity', label: 'Activity & Audit', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0 select-none">
      <div className="p-4 flex-1 space-y-1">
        <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 px-3 py-2">
          Autonomous Console
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors text-left ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100 font-medium border border-zinc-700/80'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-[11px] font-mono text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Safety Policy Reminder Footer */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/80 text-[11px] text-zinc-400 space-y-1.5">
        <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Autonomous Boundary</span>
        </div>
        <p className="text-zinc-400 leading-normal">
          AI creates isolated branches and prepares PRs. Production merge strictly requires human review.
        </p>
      </div>
    </aside>
  );
};
