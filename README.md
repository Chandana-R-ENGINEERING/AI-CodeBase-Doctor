# AI Codebase Doctor
> **"Diagnose. Repair. Validate. Review."**
> *Your autonomous software engineer for safer code changes.*

AI Codebase Doctor is an autonomous AI coding agent for software repositories. It connects to real GitHub repositories or sandboxed workspaces, inspects the codebase architecture, identifies software bugs and vulnerabilities, generates targeted surgical repair plans, applies fixes in an isolated sandbox, executes automated tests/lint/build checks, generates impact reports, and stages a GitHub Pull Request for human review.

**CRITICAL SAFETY LAW**: AI Codebase Doctor **NEVER** automatically pushes directly to production branches or merges Pull Requests. The autonomous workflow halts at the **Human Approval Gate**, ensuring full human developer agency over production deployments.

---

## Key Features

1. **Autonomous Multi-Agent Architecture**:
   - **Repository Analyzer Agent**: Detects language, framework, dependencies, package manager, and test suites.
   - **Issue Detection Agent**: Evidence-based code scanning for null pointer exceptions, unhandled rejections, ReDoS vulnerabilities, and breaking dependencies.
   - **Research Agent**: Cross-references package versions, deprecations, and breaking changes.
   - **Repair Planner Agent**: Formulates minimal, surgical repair plans without unnecessary refactoring.
   - **Code Repair Agent**: Applies targeted patches and adds regression test assertions.
   - **Validation Agent**: Executes `npm test`, `npm run lint`, and `npm run build` inside an isolated sandbox with command validation.
   - **Impact Analysis Agent**: Evaluates blast radius, security, performance, and generates a concrete rollback plan.
   - **Pull Request Agent**: Synthesizes engineering PR descriptions formatted with Problem, Root Cause, Changes Made, Validation, and Testing.
   - **Human Approval Gate**: Stops autonomous execution and requires human review.

2. **Sandboxed Command Execution**:
   - Command allowlist & risk classifier (blocks destructive shell operations like `rm -rf /`, `curl | bash`, etc.).
   - Automatic secret scrubbing (masks GitHub tokens, API keys, and environment secrets).
   - Isolated temporary workspaces with CPU and timeout enforcement.

3. **Multi-Ecosystem Detection**:
   - JavaScript / TypeScript (`package.json`, Vitest, Jest, node:test)
   - Python (`requirements.txt`, `pyproject.toml`, pytest, ruff, mypy)
   - Java (`pom.xml`, `build.gradle`, Maven, Gradle)
   - Go (`go.mod`, `go test`)
   - Rust (`Cargo.toml`, `cargo test`, `cargo check`)
   - C++ (`CMakeLists.txt`, `ctest`)

4. **Live vs. Demo Mode**:
   - **Demo Mode**: Built-in `demo-shop` e-commerce repository with real TypeScript source code, regression tests, and an intentional promo discount null reference bug. Runs real tests in child process sandboxes!
   - **Live GitHub Mode**: Connect real repositories with personal access tokens to fetch real trees, analyze with Gemini AI, create isolated branches, and submit real PRs.

---

## Agent State Machine

```
IDLE
  ↓
REPOSITORY_CONNECTED
  ↓
SCANNING
  ↓
ANALYZING
  ↓
ISSUES_FOUND
  ↓
PLAN_CREATED
  ↓
AWAITING_PLAN_APPROVAL (Human approves plan)
  ↓
BRANCH_CREATED (ai-codebase-doctor/fix/*)
  ↓
REPAIRING
  ↓
VALIDATING (Sandbox npm test / lint / build)
  ↓
[VALIDATION_PASSED] ──→ IMPACT_ANALYSIS ──→ PR_READY ──→ AWAITING_HUMAN_APPROVAL (STOP! NO AUTO-MERGE)
       │
[VALIDATION_FAILED] ──→ ANALYZE_FAILURE ──→ REPAIRING (Max 3 auto attempts)
       │ (if > 3 attempts)
       └───→ STOPPED (Request human intervention)
```

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
- **Backend**: Node.js, Express, `node:sqlite` relational database, `child_process` Sandbox
- **AI Reasoning**: Google Gemini API (`@google/genai` SDK, supporting `gemini-3.1-pro-preview` & `gemini-3.8-flash`)
- **Version Control**: GitHub REST API integration with branch safety

---

## Local Setup & Development

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server
npm run dev

# 3. Build for production
npm run build
npm start
```
