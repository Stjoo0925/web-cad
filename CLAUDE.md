# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web CAD On-Prem — a self-hosted CAD and point cloud platform with collaborative editing, DXF processing, and NAVER Maps integration.

## Commands

```bash
npm test                    # Run all tests (node:test)
npm run start:api           # Start API server (port 4010)
npm run start:worker        # Start background worker
npm run start:files         # Start file server (port 4011)
npm run dev:web             # Start web dev server

docker-compose up -d        # Start all services
docker-compose ps           # Check service status
docker-compose logs -f      # View logs
```

## Architecture

### Services (Docker Compose)
- **db** (5432): PostgreSQL 16 Alpine
- **api** (4010): REST API server — auth, documents, collaboration
- **worker** (4013): Background ingest processor — continuous loop, 30s intervals
- **files** (4011): Static file server for storage assets
- **health** (4012): Service health aggregator
- **web** (3000): Vite dev server for React demo UI

### Key Paths
- `apps/server/src/`: API, worker, file-server entrypoints
- `packages/core/src/`: Auth, collaboration, document, storage, geometry, worker logic
- `packages/sdk-core/src/`: Host-facing SDK client
- `packages/sdk-react/src/`: React integration component
- `tests/`: node:test verification suite (170+ tests)

### Health Endpoints
All services expose `/health/live` for Docker healthcheck.

### ES Module Project
- `"type": "module"` in package.json — use `import`/`export`, not `require`/`module.exports`
- Use `import.meta.main` instead of `require.main === module`
- Health server and worker converted to continuous running services (not batch jobs)

### Storage Configuration
- `WEB_CAD_STORAGE_ROOT_HOST`: host machine storage root
- `WEB_CAD_STORAGE_ROOT_CONTAINER`: container-side mount path
- Both default to `./data:/app/storage` if unset

## Testing Principles (TDD)

When fixing bugs:
1. Create GitHub issue FIRST
2. Write failing test that reproduces the bug
3. Fix the bug
4. Verify test passes
5. Commit with reference to issue

## TypeScript Migration

- Issue #55: JS→TS migration plan in progress
- Phase 1 complete: tsconfig.json created, @types installed
- Phase 2: Migrating server files (api-server.js → ts first)
- Strict mode enabled
