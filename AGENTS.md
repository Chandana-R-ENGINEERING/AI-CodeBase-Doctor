# Multi-Agent Architecture

AI Codebase Doctor decomposes software engineering tasks across 9 specialized logical agents:

### 1. Repository Analyzer Agent
- Inspects filesystem or remote git trees.
- Detects programming language, framework (Express, Next.js, Django, Spring, FastAPI), package managers (npm, pnpm, pip, cargo, maven), and test runners (Vitest, Jest, node:test, pytest).
- Detects entry points and critical services.

### 2. Issue Detection Agent
- Inspects source code with AST and heuristic evidence.
- Flags null pointer exceptions, unhandled Promise rejections, resource leaks, ReDoS vulnerabilities, and breaking dependencies.
- Assigns severity (CRITICAL, HIGH, MEDIUM, LOW, INFO) and confidence (0-100%).

### 3. Research Agent
- Researches package versions and evaluates CVE advisories.
- Detects deprecated methods and provides upgrade pathways.

### 4. Repair Planner Agent
- Identifies the root cause.
- Formulates a conservative repair plan without altering architectural boundaries.
- Identifies which files to patch and required regression test assertions.

### 5. Code Repair Agent
- Applies surgical diffs to affected files.
- Adheres to existing code style, imports, and indentation.
- Adds regression unit test assertions.

### 6. Validation Agent
- Runs test suites inside the execution sandbox (`npm test`, `pytest`, `cargo test`).
- Analyzes console outputs, stack traces, and exit codes.
- Determines whether the repair succeeded or requires an iterative patch attempt (up to 3 attempts).

### 7. Impact Analysis Agent
- Evaluates modified files, added/removed lines, and side-effects.
- Analyzes security, performance, and API backward-compatibility.
- Generates a concrete rollback procedure.

### 8. Pull Request Agent
- Generates descriptive GitHub PR titles following conventional commit specifications (`fix: handle null promo code`).
- Formats Markdown PR descriptions including: Problem, Root Cause, Changes Made, Validation, Potential Risks, Testing.

### 9. Human Approval Gate
- Enforces an immutable boundary: autonomous execution halts once the PR is ready.
- Prohibits automated merges into production branches.
