# AI Codebase Doctor REST API Specification

All endpoints are hosted under `/api`.

### System
- `GET /api/system/status`: Returns provider configuration, model, GitHub status, sandbox health.
- `POST /api/settings`: Updates AI provider, model, API keys, and GitHub credentials.
- `GET /api/stats`: Aggregate dashboard metrics (repos, issues, repairs, pass rate, open PRs).

### Repositories
- `GET /api/repositories`: Lists tracked repositories.
- `GET /api/repositories/:id`: Detailed repository metadata, scan history, issue count.
- `POST /api/repositories/connect`: Connects a GitHub repository.
- `POST /api/repositories/:id/scan`: Triggers Repository Analyzer scan (`full`, `bugs`, `dependencies`, `security`).

### Issues
- `GET /api/issues`: Lists all detected issues across repositories.
- `GET /api/repositories/:id/issues`: Filters issues for a specific repository.
- `GET /api/issues/:id`: Detailed issue view with file path, line, explanation, and evidence.
- `PATCH /api/issues/:id/status`: Updates status (`open`, `ignored`, `false_positive`).

### Repair Plans
- `POST /api/issues/:id/repair-plan`: Generates surgical repair strategy.
- `GET /api/repair-plans/:id`: Retrieves repair plan details.
- `POST /api/repair-plans/:id/execute`: Initiates autonomous agent execution pipeline.

### Agent Runs
- `GET /api/agent-runs`: Lists history of agent executions.
- `GET /api/agent-runs/:id`: Real-time run state, step logs, code diffs, validation outputs, impact report, and PR stage.

### Pull Requests
- `GET /api/pull-requests`: Lists all staged Pull Requests.
- `GET /api/pull-requests/:id`: Retrieves PR details and Markdown body.

### Observability
- `GET /api/audit-logs`: Retrieves complete audit logs with timestamps and shell commands.
