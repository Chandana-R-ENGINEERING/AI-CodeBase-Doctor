import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { orchestrator } from '../agents/Orchestrator.js';
import { aiProvider } from '../ai/provider.js';
import { githubService } from '../github/GitHubService.js';
import { sandboxService } from '../sandbox/SandboxService.js';

export const apiRouter = Router();

// ==========================================
// SYSTEM & SETTINGS
// ==========================================

apiRouter.get('/system/status', (req: Request, res: Response) => {
  const aiConfig = aiProvider.getConfig();
  const ghConfigured = githubService.isConfigured();

  res.json({
    ai_provider: aiConfig.provider,
    ai_configured: aiConfig.isConfigured,
    model: aiConfig.model,
    github_configured: ghConfigured,
    sandbox_status: 'active',
    safe_mode_enabled: true,
    db_status: 'connected'
  });
});

apiRouter.post('/settings', async (req: Request, res: Response) => {
  const { githubToken, aiApiKey, aiModel, aiProvider: providerName } = req.body;

  if (githubToken !== undefined) {
    githubService.setToken(githubToken);
    // Update user github_token in DB
    db.prepare('UPDATE users SET github_token = ? WHERE id = ?').run(
      githubToken || null,
      'usr_dev_default'
    );
  }

  if (aiApiKey !== undefined || aiModel || providerName) {
    aiProvider.updateConfig({
      ...(aiApiKey ? { apiKey: aiApiKey } : {}),
      ...(aiModel ? { model: aiModel } : {}),
      ...(providerName ? { provider: providerName } : {})
    });
  }

  orchestrator.logAudit({
    agentName: 'Human Approval Gate',
    action: 'Updated system security and integration credentials',
    status: 'info'
  });

  res.json({ success: true, status: aiProvider.getConfig() });
});

// ==========================================
// STATS & DASHBOARD
// ==========================================

apiRouter.get('/stats', (req: Request, res: Response) => {
  const reposCount: any = db.prepare('SELECT COUNT(*) as count FROM repositories').get();
  const issuesDetected: any = db.prepare('SELECT COUNT(*) as count FROM issues').get();
  const issuesRepaired: any = db.prepare("SELECT COUNT(*) as count FROM issues WHERE status = 'resolved' OR status = 'repairing'").get();
  const successfulRuns: any = db.prepare("SELECT COUNT(*) as count FROM agent_runs WHERE status = 'AWAITING_HUMAN_APPROVAL' OR status = 'COMPLETED'").get();
  const failedRuns: any = db.prepare("SELECT COUNT(*) as count FROM agent_runs WHERE status = 'STOPPED' OR status = 'VALIDATION_FAILED'").get();
  const openPRs: any = db.prepare("SELECT COUNT(*) as count FROM pull_requests WHERE status != 'closed'").get();

  const totalRuns = (successfulRuns?.count || 0) + (failedRuns?.count || 0);
  const passRate = totalRuns > 0 ? Math.round(((successfulRuns?.count || 0) / totalRuns) * 100) : 100;

  res.json({
    repositories_connected: reposCount?.count || 0,
    issues_detected: issuesDetected?.count || 0,
    issues_repaired: issuesRepaired?.count || 0,
    successful_repairs: successfulRuns?.count || 0,
    failed_repairs: failedRuns?.count || 0,
    open_pull_requests: openPRs?.count || 0,
    validation_success_rate: passRate
  });
});

// ==========================================
// REPOSITORIES
// ==========================================

apiRouter.get('/repositories', (req: Request, res: Response) => {
  const repos = db.prepare('SELECT * FROM repositories ORDER BY created_at DESC').all();
  res.json(repos);
});

apiRouter.get('/repositories/:id', (req: Request, res: Response) => {
  const repo = db.prepare('SELECT * FROM repositories WHERE id = ?').get(req.params.id);
  if (!repo) return res.status(404).json({ error: 'Repository not found' });

  const scans = db.prepare('SELECT * FROM repository_scans WHERE repository_id = ? ORDER BY started_at DESC LIMIT 5').all();
  const issues = db.prepare('SELECT * FROM issues WHERE repository_id = ? ORDER BY created_at DESC').all();
  const recentRuns = db.prepare('SELECT * FROM agent_runs WHERE repository_id = ? ORDER BY created_at DESC LIMIT 5').all();

  res.json({
    ...repo,
    recent_scans: scans,
    issues_count: issues.length,
    recent_runs: recentRuns
  });
});

apiRouter.post('/repositories/connect', async (req: Request, res: Response) => {
  const { repoUrl, fullName, token } = req.body;

  if (token) {
    githubService.setToken(token);
  }

  if (!fullName && !repoUrl) {
    return res.status(400).json({ error: 'Repository URL or full_name (owner/repo) is required.' });
  }

  let owner = '';
  let repoName = '';

  if (fullName) {
    [owner, repoName] = fullName.split('/');
  } else if (repoUrl) {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      owner = match[1];
      repoName = match[2].replace(/\.git$/, '');
    }
  }

  if (!owner || !repoName) {
    return res.status(400).json({ error: 'Invalid GitHub repository format. Expected owner/repo or https://github.com/owner/repo' });
  }

  try {
    let repoMeta: any = null;
    if (githubService.isConfigured()) {
      repoMeta = await githubService.getRepository(owner, repoName);
    }

    const id = `repo_${owner}_${repoName}`.replace(/[^a-zA-Z0-9_]/g, '_');
    const existing = db.prepare('SELECT id FROM repositories WHERE id = ?').get(id);

    if (existing) {
      return res.json({ id, message: 'Repository already connected' });
    }

    db.prepare(`
      INSERT INTO repositories (
        id, user_id, name, full_name, owner, description, default_branch, current_branch,
        language, framework, package_manager, file_count, dep_count, test_framework,
        build_command, health_score, is_demo, repo_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      id,
      'usr_dev_default',
      repoName,
      `${owner}/${repoName}`,
      owner,
      repoMeta?.description || 'Connected GitHub repository',
      repoMeta?.default_branch || 'main',
      repoMeta?.default_branch || 'main',
      repoMeta?.language || 'TypeScript',
      'Node.js',
      'npm',
      0,
      0,
      'Auto-detect',
      'Auto-detect',
      85,
      repoMeta?.html_url || `https://github.com/${owner}/${repoName}`
    );

    orchestrator.logAudit({
      repoId: id,
      agentName: 'Repository Analyzer Agent',
      action: `Connected repository ${owner}/${repoName}`,
      status: 'success'
    });

    res.json({ id, full_name: `${owner}/${repoName}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/repositories/:id/scan', async (req: Request, res: Response) => {
  const scanType = req.body.scan_type || 'full';
  try {
    const result = await orchestrator.scanRepository(req.params.id, scanType);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ISSUES
// ==========================================

apiRouter.get('/repositories/:id/issues', (req: Request, res: Response) => {
  const { category, severity, status } = req.query;
  let sql = 'SELECT * FROM issues WHERE repository_id = ?';
  const params: any[] = [req.params.id];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (severity) {
    sql += ' AND severity = ?';
    params.push(severity);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += " ORDER BY CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 WHEN 'LOW' THEN 4 ELSE 5 END, created_at DESC";

  const issues = db.prepare(sql).all(...params);
  res.json(issues);
});

apiRouter.get('/issues', (req: Request, res: Response) => {
  const issues = db.prepare(`
    SELECT issues.*, repositories.name as repo_name, repositories.full_name as repo_full_name, repositories.is_demo
    FROM issues
    JOIN repositories ON issues.repository_id = repositories.id
    ORDER BY CASE issues.severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 WHEN 'LOW' THEN 4 ELSE 5 END, issues.created_at DESC
  `).all();
  res.json(issues);
});

apiRouter.get('/issues/:id', (req: Request, res: Response) => {
  const issue = db.prepare(`
    SELECT issues.*, repositories.name as repo_name, repositories.full_name as repo_full_name, repositories.is_demo
    FROM issues
    JOIN repositories ON issues.repository_id = repositories.id
    WHERE issues.id = ?
  `).get(req.params.id);

  if (!issue) return res.status(404).json({ error: 'Issue not found' });
  res.json(issue);
});

apiRouter.patch('/issues/:id/status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (!['open', 'ignored', 'false_positive'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.prepare('UPDATE issues SET status = ?, updated_at = datetime("now") WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

// ==========================================
// REPAIR PLANS
// ==========================================

apiRouter.post('/issues/:id/repair-plan', async (req: Request, res: Response) => {
  try {
    const plan = await orchestrator.generateRepairPlan(req.params.id);
    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/repair-plans/:id', (req: Request, res: Response) => {
  const plan: any = db.prepare('SELECT * FROM repair_plans WHERE id = ?').get(req.params.id);
  if (!plan) return res.status(404).json({ error: 'Repair plan not found' });

  res.json({
    ...plan,
    files_affected: JSON.parse(plan.files_affected || '[]'),
    validation_commands: JSON.parse(plan.validation_commands || '[]'),
    steps: JSON.parse(plan.steps_json || '[]')
  });
});

apiRouter.post('/repair-plans/:id/execute', async (req: Request, res: Response) => {
  try {
    const runId = await orchestrator.executeRepairPlan(req.params.id);
    res.json({ run_id: runId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// AGENT RUNS & REALTIME OBSERVERS
// ==========================================

apiRouter.get('/agent-runs', (req: Request, res: Response) => {
  const runs = db.prepare(`
    SELECT agent_runs.*, issues.title as issue_title, issues.severity as issue_severity, repositories.name as repo_name, repositories.is_demo
    FROM agent_runs
    JOIN issues ON agent_runs.issue_id = issues.id
    JOIN repositories ON agent_runs.repository_id = repositories.id
    ORDER BY agent_runs.created_at DESC
  `).all();
  res.json(runs);
});

apiRouter.get('/agent-runs/:id', (req: Request, res: Response) => {
  const run: any = db.prepare(`
    SELECT agent_runs.*, issues.title as issue_title, issues.severity as issue_severity, issues.file_path,
           repositories.name as repo_name, repositories.full_name as repo_full_name, repositories.is_demo
    FROM agent_runs
    JOIN issues ON agent_runs.issue_id = issues.id
    JOIN repositories ON agent_runs.repository_id = repositories.id
    WHERE agent_runs.id = ?
  `).get(req.params.id);

  if (!run) return res.status(404).json({ error: 'Agent run not found' });

  const runId = req.params.id;
  const steps = db.prepare('SELECT * FROM agent_steps WHERE agent_run_id = ? ORDER BY created_at ASC').all(runId);
  const changes = db.prepare('SELECT * FROM code_changes WHERE agent_run_id = ?').all(runId);
  const validationRun: any = db.prepare('SELECT * FROM validation_runs WHERE agent_run_id = ? ORDER BY attempt_number DESC LIMIT 1').get(runId);
  let checks: any[] = [];
  if (validationRun) {
    checks = db.prepare('SELECT * FROM validation_results WHERE validation_run_id = ?').all(validationRun.id);
  }
  const impact = db.prepare('SELECT * FROM impact_reports WHERE agent_run_id = ?').get(runId);
  const pr = db.prepare('SELECT * FROM pull_requests WHERE agent_run_id = ?').get(runId);

  res.json({
    ...run,
    steps: steps.map((s: any) => ({
      ...s,
      details: s.details_json ? JSON.parse(s.details_json) : null
    })),
    changes,
    validation: validationRun ? { ...validationRun, checks } : null,
    impact,
    pull_request: pr
  });
});

// ==========================================
// PULL REQUESTS
// ==========================================

apiRouter.get('/pull-requests', (req: Request, res: Response) => {
  const prs = db.prepare(`
    SELECT pull_requests.*, repositories.name as repo_name, repositories.full_name as repo_full_name
    FROM pull_requests
    JOIN repositories ON pull_requests.repository_id = repositories.id
    ORDER BY pull_requests.created_at DESC
  `).all();
  res.json(prs);
});

apiRouter.get('/pull-requests/:id', (req: Request, res: Response) => {
  const pr = db.prepare(`
    SELECT pull_requests.*, repositories.name as repo_name, repositories.full_name as repo_full_name
    FROM pull_requests
    JOIN repositories ON pull_requests.repository_id = repositories.id
    WHERE pull_requests.id = ?
  `).get(req.params.id);

  if (!pr) return res.status(404).json({ error: 'Pull request not found' });
  res.json(pr);
});

// ==========================================
// AUDIT LOGS
// ==========================================

apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  const logs = db.prepare(`
    SELECT audit_logs.*, repositories.name as repo_name
    FROM audit_logs
    LEFT JOIN repositories ON audit_logs.repository_id = repositories.id
    ORDER BY audit_logs.created_at DESC
    LIMIT 100
  `).all();

  res.json(logs.map((l: any) => ({
    ...l,
    details: l.details_json ? JSON.parse(l.details_json) : null
  })));
});
