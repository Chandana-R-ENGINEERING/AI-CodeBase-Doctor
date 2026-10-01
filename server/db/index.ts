import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'codebase_doctor.db');
export const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Initialize tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      avatar_url TEXT,
      github_token TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS repositories (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      full_name TEXT NOT NULL,
      owner TEXT NOT NULL,
      description TEXT,
      default_branch TEXT NOT NULL DEFAULT 'main',
      current_branch TEXT NOT NULL DEFAULT 'main',
      language TEXT NOT NULL,
      framework TEXT NOT NULL,
      package_manager TEXT NOT NULL,
      file_count INTEGER NOT NULL DEFAULT 0,
      dep_count INTEGER NOT NULL DEFAULT 0,
      test_framework TEXT,
      build_command TEXT,
      health_score INTEGER NOT NULL DEFAULT 85,
      is_demo INTEGER NOT NULL DEFAULT 0,
      github_repo_id TEXT,
      repo_url TEXT NOT NULL,
      last_scanned_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS repository_scans (
      id TEXT PRIMARY KEY,
      repository_id TEXT NOT NULL,
      branch TEXT NOT NULL,
      commit_hash TEXT NOT NULL,
      scan_type TEXT NOT NULL,
      status TEXT NOT NULL,
      summary TEXT,
      files_scanned INTEGER NOT NULL DEFAULT 0,
      issues_found_count INTEGER NOT NULL DEFAULT 0,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      repository_id TEXT NOT NULL,
      scan_id TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      confidence INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      verification_status TEXT NOT NULL DEFAULT 'likely',
      file_path TEXT NOT NULL,
      line_number INTEGER,
      explanation TEXT NOT NULL,
      evidence TEXT NOT NULL,
      suggested_fix TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
      FOREIGN KEY (scan_id) REFERENCES repository_scans(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS repair_plans (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL,
      repository_id TEXT NOT NULL,
      title TEXT NOT NULL,
      problem TEXT NOT NULL,
      root_cause TEXT NOT NULL,
      proposed_fix TEXT NOT NULL,
      files_affected TEXT NOT NULL, -- JSON array
      validation_commands TEXT NOT NULL, -- JSON array
      risk_level TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'created',
      steps_json TEXT NOT NULL, -- JSON array
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      repository_id TEXT NOT NULL,
      issue_id TEXT NOT NULL,
      repair_plan_id TEXT NOT NULL,
      target_branch TEXT NOT NULL,
      base_branch TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'IDLE',
      current_attempt INTEGER NOT NULL DEFAULT 1,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      failure_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
      FOREIGN KEY (repair_plan_id) REFERENCES repair_plans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agent_steps (
      id TEXT PRIMARY KEY,
      agent_run_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      details_json TEXT,
      duration_ms INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (agent_run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS code_changes (
      id TEXT PRIMARY KEY,
      agent_run_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      original_content TEXT NOT NULL,
      modified_content TEXT NOT NULL,
      diff_patch TEXT NOT NULL,
      lines_added INTEGER NOT NULL DEFAULT 0,
      lines_removed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (agent_run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS validation_runs (
      id TEXT PRIMARY KEY,
      agent_run_id TEXT NOT NULL,
      attempt_number INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL,
      tests_passed INTEGER NOT NULL DEFAULT 0,
      tests_failed INTEGER NOT NULL DEFAULT 0,
      tests_total INTEGER NOT NULL DEFAULT 0,
      lint_status TEXT NOT NULL DEFAULT 'skipped',
      typecheck_status TEXT NOT NULL DEFAULT 'skipped',
      build_status TEXT NOT NULL DEFAULT 'skipped',
      security_status TEXT NOT NULL DEFAULT 'skipped',
      command_outputs_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (agent_run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS validation_results (
      id TEXT PRIMARY KEY,
      validation_run_id TEXT NOT NULL,
      check_type TEXT NOT NULL,
      check_name TEXT NOT NULL,
      status TEXT NOT NULL,
      output TEXT NOT NULL,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (validation_run_id) REFERENCES validation_runs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS impact_reports (
      id TEXT PRIMARY KEY,
      agent_run_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      root_cause TEXT NOT NULL,
      changes_summary TEXT NOT NULL,
      files_modified_count INTEGER NOT NULL DEFAULT 0,
      lines_added INTEGER NOT NULL DEFAULT 0,
      lines_removed INTEGER NOT NULL DEFAULT 0,
      tests_added INTEGER NOT NULL DEFAULT 0,
      tests_executed INTEGER NOT NULL DEFAULT 0,
      dependencies_changed TEXT,
      security_impact TEXT,
      performance_impact TEXT,
      compatibility_impact TEXT,
      risk_level TEXT NOT NULL,
      rollback_plan TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (agent_run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pull_requests (
      id TEXT PRIMARY KEY,
      repository_id TEXT NOT NULL,
      agent_run_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      branch TEXT NOT NULL,
      base_branch TEXT NOT NULL,
      pr_number INTEGER,
      pr_url TEXT,
      status TEXT NOT NULL DEFAULT 'ready_for_review',
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (repository_id) REFERENCES repositories(id) ON DELETE CASCADE,
      FOREIGN KEY (agent_run_id) REFERENCES agent_runs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      repository_id TEXT,
      agent_name TEXT NOT NULL,
      action TEXT NOT NULL,
      command TEXT,
      result_status TEXT NOT NULL,
      details_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  // Ensure default developer user exists
  const checkUser = db.prepare('SELECT id FROM users WHERE id = ?').get('usr_dev_default');
  if (!checkUser) {
    db.prepare(`
      INSERT INTO users (id, username, email, avatar_url, github_token)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'usr_dev_default',
      'developer',
      'developer@codebasedoctor.ai',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
      null
    );
  }

  // Ensure Demo Repo "demo-shop" exists
  const checkRepo = db.prepare('SELECT id FROM repositories WHERE id = ?').get('repo_demo_shop');
  if (!checkRepo) {
    db.prepare(`
      INSERT INTO repositories (
        id, user_id, name, full_name, owner, description,
        default_branch, current_branch, language, framework,
        package_manager, file_count, dep_count, test_framework,
        build_command, health_score, is_demo, repo_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'repo_demo_shop',
      'usr_dev_default',
      'demo-shop',
      'demo/demo-shop',
      'demo-organization',
      'E-commerce shopping cart & checkout service with intentional edge-case bugs and regression test suite.',
      'main',
      'main',
      'TypeScript',
      'Node.js / Express',
      'npm',
      24,
      12,
      'Vitest',
      'npm run build',
      78,
      1,
      'https://github.com/demo-organization/demo-shop'
    );

    // Seed realistic issues in demo-shop
    const issue1Id = 'iss_cart_null_discount';
    db.prepare(`
      INSERT INTO issues (
        id, repository_id, title, category, severity, confidence,
        status, verification_status, file_path, line_number,
        explanation, evidence, suggested_fix
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      issue1Id,
      'repo_demo_shop',
      'Unchecked null promo code causes TypeError during discount computation',
      'bug',
      'HIGH',
      94,
      'open',
      'confirmed',
      'src/services/cartService.ts',
      42,
      'The calculateDiscount function accesses promo.discountPercent without verifying if the promo code lookup returned a valid PromoCode object or null.',
      'const discount = (total * promo.discountPercent) / 100; // TypeError: Cannot read properties of null (reading "discountPercent")',
      'Add null check for promo: if (!promo || typeof promo.discountPercent !== "number") return 0; with optional fallback to standard error logging.'
    );

    const issue2Id = 'iss_checkout_address_unvalidated';
    db.prepare(`
      INSERT INTO issues (
        id, repository_id, title, category, severity, confidence,
        status, verification_status, file_path, line_number,
        explanation, evidence, suggested_fix
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      issue2Id,
      'repo_demo_shop',
      'Potential unhandled rejection when shipping address object is undefined',
      'bug',
      'HIGH',
      89,
      'open',
      'confirmed',
      'src/services/checkoutService.ts',
      29,
      'checkoutOrder accesses order.shippingAddress.country directly without validating the shippingAddress payload, throwing an unhandled exception for digital items without shipping.',
      'const taxRate = getTaxRateByCountry(order.shippingAddress.country);',
      'Verify order.shippingAddress presence, fallback to order.billingAddress or default tax rate when physical shipping is not required.'
    );

    const issue3Id = 'iss_sql_escape_cart';
    db.prepare(`
      INSERT INTO issues (
        id, repository_id, title, category, severity, confidence,
        status, verification_status, file_path, line_number,
        explanation, evidence, suggested_fix
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      issue3Id,
      'repo_demo_shop',
      'Unsanitized user search parameter in catalog filter',
      'security',
      'CRITICAL',
      92,
      'open',
      'confirmed',
      'src/services/catalogService.ts',
      18,
      'The product query concatenates raw user query input directly into a dynamic regex filter without escaping special regex characters, enabling ReDoS attacks.',
      'new RegExp(rawQuery, "i"); // Vulnerable to catastrophic backtracking',
      'Use regex escape helper or parameterized string search instead of unsanitized RegExp construction.'
    );

    const issue4Id = 'iss_dep_express_outdated';
    db.prepare(`
      INSERT INTO issues (
        id, repository_id, title, category, severity, confidence,
        status, verification_status, file_path, line_number,
        explanation, evidence, suggested_fix
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      issue4Id,
      'repo_demo_shop',
      'Express dependency version contains deprecations and known path traversal caveats',
      'dependency',
      'MEDIUM',
      88,
      'open',
      'likely',
      'package.json',
      14,
      'Installed express@4.18.1 has known CVE-2024-43796 caveats in routing utilities. Version 4.21.2+ resolves the vulnerability.',
      '"express": "^4.18.1"',
      'Upgrade express to ^4.21.2 and verify middleware signature compatibility.'
    );

    // Add initial audit log
    db.prepare(`
      INSERT INTO audit_logs (id, repository_id, agent_name, action, command, result_status, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'log_init_seed',
      'repo_demo_shop',
      'Repository Analyzer Agent',
      'Repository initialized with demo-shop inspection',
      'git clone demo/demo-shop && vitest run',
      'info',
      JSON.stringify({ repo: 'demo-shop', files: 24, tests_found: 18 })
    );
  }
}
