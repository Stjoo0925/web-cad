<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-17 | Updated: 2026-04-17 -->

# scripts

## Purpose
Utility scripts for CI/CD and GitHub automation.

## Key Files

| File | Description |
|------|-------------|
| `push-prs.sh` | Bash script — amends scaffold commit, rebases ticket branches, pushes main, creates and squash-merges two PRs via GitHub API |
| `create-github-issues.js` | Node.js script — creates GitHub issues programmatically |

## For AI Agents

### push-prs.sh Usage
```bash
bash scripts/push-prs.sh <GITHUB_TOKEN>
```
This script:
1. Cleans git lock files
2. Amends scaffold commit (removes hardcoded token)
3. Rebases `ticket/001-frontend-app` and `ticket/002-editor-shell` onto new main
4. Force-pushes main
5. Pushes each ticket branch, creates PR, and squash-merges

Requires: `bash`, `python3` (for JSON parsing), `curl` (GitHub API).

### GitHub API Format
Uses `https://api.github.com/repos/Stjoo0925/web-cad` with `Accept: application/vnd.github.v3+json`.

<!-- MANUAL: -->