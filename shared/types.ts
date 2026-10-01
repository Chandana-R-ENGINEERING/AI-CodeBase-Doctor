// Shared types for AI Codebase Doctor

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type ConfidenceLevel = 'confirmed' | 'likely' | 'potential';
export type IssueCategory = 'bug' | 'security' | 'dependency' | 'performance' | 'code_smell' | 'test_failure';
export type IssueStatus = 'open' | 'planning' | 'repairing' | 'resolved' | 'ignored' | 'false_positive';
export type RiskLevel = 'low' | 'medium' | 'high';

export type AgentState =
  | 'IDLE'
  | 'REPOSITORY_CONNECTED'
  | 'SCANNING'
  | 'ANALYZING'
  | 'ISSUES_FOUND'
  | 'PLAN_CREATED'
  | 'AWAITING_PLAN_APPROVAL'
  | 'BRANCH_CREATED'
  | 'REPAIRING'
  | 'VALIDATING'
  | 'VALIDATION_PASSED'
  | 'VALIDATION_FAILED'
  | 'ANALYZE_FAILURE'
  | 'IMPACT_ANALYSIS'
  | 'PR_READY'
  | 'AWAITING_HUMAN_APPROVAL'
  | 'COMPLETED'
  | 'STOPPED';

export type AgentName =
  | 'Repository Analyzer Agent'
  | 'Issue Detection Agent'
  | 'Research Agent'
  | 'Repair Planner Agent'
  | 'Code Repair Agent'
  | 'Validation Agent'
  | 'Impact Analysis Agent'
  | 'Pull Request Agent'
  | 'Human Approval Gate';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  github_connected: boolean;
  created_at: string;
}

export interface Repository {
  id: string;
  name: string;
  full_name: string;
  owner: string;
  description: string;
  default_branch: string;
  current_branch: string;
  language: string;
  framework: string;
  package_manager: string;
  file_count: number;
  dep_count: number;
  test_framework?: string;
  build_command?: string;
  health_score: number;
  is_demo: boolean;
  github_repo_id?: string;
  repo_url: string;
  last_scanned_at?: string;
  created_at: string;
}

export interface RepositoryScan {
  id: string;
  repository_id: string;
  branch: string;
  commit_hash: string;
  scan_type: 'full' | 'bugs' | 'dependencies' | 'security' | 'quality' | 'tests';
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  summary: string;
  files_scanned: number;
  issues_found_count: number;
  duration_ms: number;
  started_at: string;
  completed_at?: string;
}

export interface Issue {
  id: string;
  repository_id: string;
  scan_id?: string;
  title: string;
  category: IssueCategory;
  severity: Severity;
  confidence: number; // 0 - 100
  status: IssueStatus;
  verification_status: ConfidenceLevel;
  file_path: string;
  line_number?: number;
  explanation: string;
  evidence: string;
  suggested_fix: string;
  created_at: string;
  updated_at: string;
}

export interface RepairPlanStep {
  step_number: number;
  action: string;
  target_file?: string;
  description: string;
}

export interface RepairPlan {
  id: string;
  issue_id: string;
  repository_id: string;
  title: string;
  problem: string;
  root_cause: string;
  proposed_fix: string;
  files_affected: string[];
  validation_commands: string[];
  risk_level: RiskLevel;
  status: 'created' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
  steps: RepairPlanStep[];
  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: string;
  repository_id: string;
  issue_id: string;
  repair_plan_id: string;
  target_branch: string;
  base_branch: string;
  status: AgentState;
  current_attempt: number;
  max_attempts: number;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentStep {
  id: string;
  agent_run_id: string;
  agent_name: AgentName;
  action: string;
  status: 'pending' | 'in_progress' | 'success' | 'failure' | 'skipped';
  details?: Record<string, any>;
  duration_ms?: number;
  created_at: string;
}

export interface CodeChange {
  id: string;
  agent_run_id: string;
  file_path: string;
  original_content: string;
  modified_content: string;
  diff_patch: string;
  lines_added: number;
  lines_removed: number;
  created_at: string;
}

export interface ValidationCheck {
  id: string;
  check_type: 'test' | 'lint' | 'typecheck' | 'build' | 'security';
  check_name: string;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  output: string;
  duration_ms: number;
}

export interface ValidationRun {
  id: string;
  agent_run_id: string;
  attempt_number: number;
  status: 'running' | 'passed' | 'failed';
  tests_passed: number;
  tests_failed: number;
  tests_total: number;
  lint_status: 'passed' | 'failed' | 'skipped';
  typecheck_status: 'passed' | 'failed' | 'skipped';
  build_status: 'passed' | 'failed' | 'skipped';
  security_status: 'passed' | 'failed' | 'skipped';
  checks: ValidationCheck[];
  created_at: string;
}

export interface ImpactReport {
  id: string;
  agent_run_id: string;
  summary: string;
  root_cause: string;
  changes_summary: string;
  files_modified_count: number;
  lines_added: number;
  lines_removed: number;
  tests_added: number;
  tests_executed: number;
  dependencies_changed: string;
  security_impact: string;
  performance_impact: string;
  compatibility_impact: string;
  risk_level: RiskLevel;
  rollback_plan: string;
  created_at: string;
}

export interface PullRequest {
  id: string;
  repository_id: string;
  agent_run_id: string;
  title: string;
  description: string;
  branch: string;
  base_branch: string;
  pr_number?: number;
  pr_url?: string;
  status: 'draft' | 'ready_for_review' | 'open' | 'closed';
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  repository_id?: string;
  agent_name: string;
  action: string;
  command?: string;
  result_status: 'success' | 'failure' | 'warning' | 'info';
  details?: Record<string, any>;
  created_at: string;
}

export interface DependencyItem {
  name: string;
  current_version: string;
  target_version: string;
  is_outdated: boolean;
  has_vulnerability: boolean;
  breaking_changes: string;
  risk: RiskLevel;
  affected_files: string[];
  recommendation: string;
}

export interface SystemStatus {
  ai_provider: 'gemini' | 'openai' | 'anthropic' | 'mock';
  ai_configured: boolean;
  model: string;
  github_configured: boolean;
  sandbox_status: 'active' | 'restricted' | 'unavailable';
  safe_mode_enabled: boolean;
  db_status: 'connected';
}
