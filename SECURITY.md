# Security Model & Policy

AI Codebase Doctor operates under strict defensive engineering principles:

## 1. Production Branch Safety
- The agent NEVER executes `git push origin main` or `git push origin master`.
- All modifications are committed strictly to isolated branches formatted as `ai-codebase-doctor/fix/<issue-slug>`.
- Automated merging into production is strictly prohibited by code.

## 2. Command Allowlisting & Risk Classification
- Commands are screened before child process execution.
- Prohibited patterns include destructive filesystem mutations (`rm -rf /`, `rm -rf ..`), piping remote scripts to shells (`curl | sh`, `wget | bash`), and system tampering (`chmod -R 777 /`).
- Commands are restricted to verified developer toolchains (`npm`, `node`, `tsx`, `pytest`, `cargo`, `mvn`, `git`).

## 3. Secret Scrubbing & Data Masking
- All outputs are piped through regex filters that mask GitHub tokens (`ghp_***`), Gemini/Google API keys (`AIzaSy***`), Bearer tokens, and private keys.
- Secrets are never transmitted in prompt payloads to LLMs.

## 4. Execution Sandboxing
- Workspaces run in isolated directories under `os.tmpdir()/codebase-doctor-sandbox/run-<id>`.
- Subprocesses execute with clean, stripped environment variables and strict timeouts.
- Workspaces are purged upon completion or halting.
