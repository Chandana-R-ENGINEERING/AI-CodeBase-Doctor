import { exec, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';

const execPromise = promisify(exec);

export interface CommandValidationResult {
  allowed: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKED';
  reason?: string;
  sanitizedCommand: string;
}

export interface ExecutionResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timestamp: string;
  maskedOutput: string;
}

export class SandboxService {
  private sandboxRoot: string;

  constructor() {
    this.sandboxRoot = path.join(os.tmpdir(), 'codebase-doctor-sandbox');
    if (!fs.existsSync(this.sandboxRoot)) {
      fs.mkdirSync(this.sandboxRoot, { recursive: true });
    }
  }

  /**
   * Secret masking utility to prevent API keys, tokens, and credentials from leaking.
   */
  public maskSecrets(content: string): string {
    if (!content) return '';
    return content
      // GitHub Tokens
      .replace(/gh[pousr]_[A-Za-z0-9_]{36,255}/g, '[MASKED_GITHUB_TOKEN]')
      // Google / Gemini API Keys
      .replace(/AIzaSy[A-Za-z0-9_-]{33}/g, '[MASKED_GEMINI_API_KEY]')
      // Generic Bearer tokens
      .replace(/Bearer\s+[A-Za-z0-9_\-\.]{20,}/gi, 'Bearer [MASKED_AUTH_TOKEN]')
      // Password or secret env vars
      .replace(/(?:password|secret|token|api_key|apikey)=([^\s&]+)/gi, '$1=[MASKED_CREDENTIAL]')
      // Private Keys
      .replace(/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC )?PRIVATE KEY-----/g, '[MASKED_PRIVATE_KEY]');
  }

  /**
   * Validates commands against a strict security policy.
   * Prohibits arbitrary destructive commands like rm -rf, curl/wget piping, altering system files.
   */
  public validateCommand(command: string): CommandValidationResult {
    const trimmed = command.trim();

    // Explicit blocked patterns
    const dangerousPatterns = [
      /rm\s+-rf\s+[\/\~]/i,
      /\brm\s+-rf\s+\.\./i,
      /curl.*\|\s*(?:bash|sh)/i,
      /wget.*\|\s*(?:bash|sh)/i,
      /\bdd\s+if=/i,
      /\bmkfs\b/i,
      /\bshutdown\b/i,
      /\breboot\b/i,
      />\s*\/dev\/(?:sd|hd|nvme)/i,
      /\bchmod\s+-R\s+777\s+\//i,
      /\bchown\s+-R.*root/i,
      /:(){ :|:& };:/, // fork bomb
      /\benv\b/i,
      /\bprintenv\b/i,
      /\bcat\s+.*(?:\.env|id_rsa|credentials)/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmed)) {
        return {
          allowed: false,
          riskLevel: 'BLOCKED',
          reason: `Command matched prohibited security pattern: ${pattern.toString()}`,
          sanitizedCommand: trimmed
        };
      }
    }

    // Allowed command prefixes for developer environments
    const allowedPrefixes = [
      'npm', 'npx', 'yarn', 'pnpm', 'node', 'tsx',
      'pytest', 'python', 'python3', 'pip', 'poetry', 'ruff', 'mypy',
      'mvn', 'gradle', './gradlew',
      'cmake', 'ctest', 'make',
      'go',
      'cargo', 'rustc',
      'git',
      'echo', 'cat', 'ls', 'pwd', 'tsc', 'vitest', 'jest', 'eslint'
    ];

    const firstToken = trimmed.split(/\s+/)[0]?.replace(/^\.\//, '');
    const isAllowedPrefix = allowedPrefixes.some(prefix => trimmed.startsWith(prefix) || firstToken === prefix);

    if (!isAllowedPrefix) {
      return {
        allowed: false,
        riskLevel: 'HIGH',
        reason: `Command '${firstToken}' is not in the allowed developer toolchain allowlist.`,
        sanitizedCommand: trimmed
      };
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (trimmed.includes('install') || trimmed.includes('add') || trimmed.includes('upgrade')) {
      riskLevel = 'MEDIUM';
    }
    if (trimmed.includes('git checkout') || trimmed.includes('git reset') || trimmed.includes('clean')) {
      riskLevel = 'MEDIUM';
    }

    return {
      allowed: true,
      riskLevel,
      sanitizedCommand: trimmed
    };
  }

  /**
   * Creates an isolated working directory for an agent run
   */
  public createRunWorkspace(runId: string): string {
    const workspacePath = path.join(this.sandboxRoot, `run-${runId}`);
    if (!fs.existsSync(workspacePath)) {
      fs.mkdirSync(workspacePath, { recursive: true });
    }
    return workspacePath;
  }

  /**
   * Cleans up an isolated working directory
   */
  public cleanupWorkspace(runId: string): void {
    const workspacePath = path.join(this.sandboxRoot, `run-${runId}`);
    if (fs.existsSync(workspacePath)) {
      try {
        fs.rmSync(workspacePath, { recursive: true, force: true });
      } catch (e) {
        console.warn(`Sandbox cleanup notice: ${e}`);
      }
    }
  }

  /**
   * Executes a command within the isolated sandbox with timeout and secret scrubbing
   */
  public async executeInSandbox(
    command: string,
    cwd?: string,
    timeoutMs: number = 30000
  ): Promise<ExecutionResult> {
    const validation = this.validateCommand(command);
    const start = Date.now();
    const timestamp = new Date().toISOString();

    if (!validation.allowed) {
      return {
        command,
        exitCode: 126,
        stdout: '',
        stderr: `Security Exception: ${validation.reason}`,
        durationMs: 0,
        timestamp,
        maskedOutput: `[SECURITY INTERVENTION] Command rejected: ${validation.reason}`
      };
    }

    const workingDir = cwd || this.sandboxRoot;

    try {
      // Execute with stripped sensitive environment variables
      const cleanEnv = {
        PATH: process.env.PATH,
        NODE_ENV: 'test',
        HOME: os.tmpdir(),
        LANG: 'en_US.UTF-8'
      };

      const { stdout, stderr } = await execPromise(validation.sanitizedCommand, {
        cwd: workingDir,
        timeout: timeoutMs,
        maxBuffer: 5 * 1024 * 1024,
        env: cleanEnv
      });

      const durationMs = Date.now() - start;
      const combined = (stdout || '') + (stderr ? `\n${stderr}` : '');
      const maskedOutput = this.maskSecrets(combined);

      return {
        command: validation.sanitizedCommand,
        exitCode: 0,
        stdout: this.maskSecrets(stdout),
        stderr: this.maskSecrets(stderr),
        durationMs,
        timestamp,
        maskedOutput
      };
    } catch (err: any) {
      const durationMs = Date.now() - start;
      const stdout = err.stdout ? String(err.stdout) : '';
      const stderr = err.stderr ? String(err.stderr) : err.message;
      const combined = `${stdout}\n${stderr}`;

      return {
        command: validation.sanitizedCommand,
        exitCode: err.code || 1,
        stdout: this.maskSecrets(stdout),
        stderr: this.maskSecrets(stderr),
        durationMs,
        timestamp,
        maskedOutput: this.maskSecrets(combined)
      };
    }
  }
}

export const sandboxService = new SandboxService();
