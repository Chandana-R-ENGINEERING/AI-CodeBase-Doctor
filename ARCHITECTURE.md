# AI Codebase Doctor Architecture

## System Overview

AI Codebase Doctor is designed as a decoupled, multi-tiered autonomous system:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 19 Frontend Console                       │
│  · Navigation · Diff Viewer · Workflow Timeline · Validation Dashboard │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Express Full-Stack Server (Node 22)                 │
│  · API Routers · Settings · Observability Audits · Static Asset Host   │
└─────────────────┬──────────────────┬─────────────────┬─────────────────┘
                  │                  │                 │
┌─────────────────▼────────┐ ┌───────▼────────┐ ┌──────▼─────────────────┐
│     Orchestrator &       │ │ Isolated Shell │ │   node:sqlite Database │
│   Multi-Agent Pipeline   │ │ Sandbox Engine │ │ (13 Relational Tables) │
└─────────────────┬────────┘ └────────────────┘ └────────────────────────┘
                  │
┌─────────────────▼──────────────────────────────────────────────────────┐
│                    AI Provider Abstraction Layer                       │
│  · Google Gemini (@google/genai) · Extensible Providers · Fallbacks    │
└────────────────────────────────────────────────────────────────────────┘
```

## Relational Database Schema (`node:sqlite`)

1. `users`: Developer user records, GitHub authentication credentials.
2. `repositories`: Tracked repositories (language, framework, health score, demo flag).
3. `repository_scans`: Scan runs (commit hash, files scanned, duration).
4. `issues`: Detected bugs, security risks, line numbers, evidence, confidence scores.
5. `repair_plans`: Structured problem/root cause definitions, planned steps, affected files.
6. `agent_runs`: State machine tracking per issue (`BRANCH_CREATED`, `VALIDATING`, etc.).
7. `agent_steps`: Granular actions performed by individual agents with execution durations.
8. `code_changes`: Before/after file contents and unified diff patches.
9. `validation_runs`: Aggregate test pass/fail counts, lint, typecheck, build statuses.
10. `validation_results`: Specific check outputs and durations.
11. `impact_reports`: Blast radius, security impact, performance impact, rollback plans.
12. `pull_requests`: Staged PR records, titles, bodies, target branches, URLs.
13. `audit_logs`: Observability logs with commands and exit statuses.
