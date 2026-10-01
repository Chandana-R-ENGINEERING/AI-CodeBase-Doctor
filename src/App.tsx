import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { RepositoriesPage } from './pages/RepositoriesPage';
import { RepositoryDetailPage } from './pages/RepositoryDetailPage';
import { IssuesPage } from './pages/IssuesPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { RepairPlanPage } from './pages/RepairPlanPage';
import { AgentRunsPage } from './pages/AgentRunsPage';
import { AgentRunDetailPage } from './pages/AgentRunDetailPage';
import { ValidationDashboardPage } from './pages/ValidationDashboardPage';
import { PullRequestsPage } from './pages/PullRequestsPage';
import { ActivityAuditPage } from './pages/ActivityAuditPage';
import { SettingsPage } from './pages/SettingsPage';
import { api, DashboardStats } from './services/api';
import { SystemStatus } from '../shared/types';

export function App() {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const loadGlobalMeta = async () => {
    try {
      const [statusData, statsData] = await Promise.all([
        api.getSystemStatus(),
        api.getStats()
      ]);
      setSystemStatus(statusData);
      setStats(statsData);
    } catch (e) {
      console.warn('System status initialization notice:', e);
    }
  };

  useEffect(() => {
    loadGlobalMeta();
  }, [currentPage]);

  const handleNavigate = (page: string, params?: Record<string, any>) => {
    if (page === 'demo-run') {
      // Direct one-click launcher for the demo workflow
      handleLaunchDemo();
      return;
    }
    setCurrentPage(page);
    setPageParams(params || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLaunchDemo = async () => {
    try {
      // Find the cart issue in demo-shop
      const issues = await api.getIssues({ repoId: 'repo_demo_shop' });
      const targetIssue = issues.find(i => i.id === 'iss_cart_null_discount') || issues[0];
      if (targetIssue) {
        // Generate plan for it
        const plan = await api.generateRepairPlan(targetIssue.id);
        // Execute the plan
        const res = await api.executeRepairPlan(plan.id);
        // Navigate to the live run
        handleNavigate('agent-run-detail', { runId: res.run_id });
      } else {
        handleNavigate('repository-detail', { repoId: 'repo_demo_shop' });
      }
    } catch (err: any) {
      console.error('Demo launch error:', err);
      handleNavigate('issues');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navbar */}
      <Navbar
        status={systemStatus}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          openIssuesCount={stats?.issues_detected ?? 4}
          openPRsCount={stats?.open_pull_requests ?? 1}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-zinc-950">
          {currentPage === 'landing' && (
            <LandingPage
              onStartDemo={() => handleNavigate('demo-run')}
              onConnectGitHub={() => handleNavigate('repositories')}
              onExplore={() => handleNavigate('dashboard')}
            />
          )}

          {currentPage === 'dashboard' && (
            <DashboardPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'repositories' && (
            <RepositoriesPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'repository-detail' && (
            <RepositoryDetailPage
              repoId={pageParams.repoId || 'repo_demo_shop'}
              initialTab={pageParams.tab || 'overview'}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'issues' && (
            <IssuesPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'issue-detail' && (
            <IssueDetailPage
              issueId={pageParams.issueId || 'iss_cart_null_discount'}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'repair-plan' && (
            <RepairPlanPage
              planId={pageParams.planId}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'agent-runs' && (
            <AgentRunsPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'agent-run-detail' && (
            <AgentRunDetailPage
              runId={pageParams.runId}
              onNavigate={handleNavigate}
            />
          )}

          {currentPage === 'validation' && (
            <ValidationDashboardPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'pull-requests' && (
            <PullRequestsPage onNavigate={handleNavigate} />
          )}

          {currentPage === 'activity' && (
            <ActivityAuditPage />
          )}

          {currentPage === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
