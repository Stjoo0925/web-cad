# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

Web CAD On-Prem — a self-hosted CAD and point cloud platform with collaborative editing, DXF processing, and NAVER Maps integration.

---

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

---

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

---

## Testing Principles (TDD)

When fixing bugs:

1. Create GitHub issue FIRST
2. Write failing test that reproduces the bug
3. Fix the bug
4. Verify test passes
5. Commit with reference to issue

---

## Code Style

### Comment Language

All comments in source code must be written **only in Korean or English**.
Other languages (Japanese, Chinese, etc.) are strictly prohibited.

- Inline comments: Korean or English only
- JSDoc / TSDoc: Korean or English only
- TODO / FIXME / NOTE: English preferred, Korean allowed
- If a comment is found in another language during review or generation, rewrite it in English

```ts
// ✅ 올바른 예
// 사용자 인증 토큰 검증
const verified = verifyToken(token);

// ✅ Correct
// Validate user authentication token
const verified = verifyToken(token);

// ❌ 잘못된 예 (다른 언어 사용 금지)
// ユーザー認証トークンの検証
```

---

## TypeScript Migration

- Issue #55: JS→TS migration plan in progress
- Phase 1 complete: tsconfig.json created, @types installed
- Phase 2: Migrating server files (api-server.js → ts first)
- Strict mode enabled

---

## Release Engineer Agent

개발 완료 신호가 감지되면 아래 워크플로우를 자동으로 시작한다.
두 스킬(`github-workflow`, `dev-completion-flow`)을 순서대로 사용한다.

### Trigger Signals

다음 중 하나라도 감지되면 릴리즈 워크플로우를 시작한다:

- "개발 끝났어" / "작업 완료" / "finished" / "done with feature"
- git diff 또는 변경 파일 목록 붙여넣기 + 완료 맥락
- "PR 올려야 해" / "머지할게" / "릴리즈할게"
- "이제 뭐 해야 해?" + 기능/작업 완료 맥락

> 개발 **중** 코드 구현 요청(디버깅, 기능 추가 등)은 평소대로 응답하고 트리거하지 않는다.

### Workflow

```
STEP 1 — github-workflow 스킬
  ├── 1-1. GitHub Issue 생성 (이슈가 없는 경우)
  ├── 1-2. Commit Message (Conventional Commits)
  └── 1-3. Pull Request 본문

STEP 2 — dev-completion-flow 스킬
  ├── 2-1. Self-review 체크리스트 (PR 올리기 전)
  ├── 2-2. 리뷰어 리뷰 요청 메시지 (Slack용)
  ├── 2-3. QA 시나리오 시트
  └── 2-4. 릴리즈 노트 / CHANGELOG 항목
```

각 단계 완료 후 사용자 확인을 받고 다음으로 넘어간다.
사용자가 특정 단계만 요청하면 해당 단계만 생성한다.

### Project-Specific Rules

이 프로젝트의 맥락을 반영한 추가 규칙:

**커밋 scope 기준**

| 변경 경로                           | scope          |
| ----------------------------------- | -------------- |
| `apps/server/src/api*`              | `api`          |
| `apps/server/src/worker*`           | `worker`       |
| `apps/server/src/files*`            | `files`        |
| `packages/core/src/auth/`           | `auth`         |
| `packages/core/src/collaboration/`  | `collab`       |
| `packages/core/src/storage/`        | `storage`      |
| `packages/core/src/geometry/`       | `geometry`     |
| `packages/sdk-core/`                | `sdk`          |
| `packages/sdk-react/`               | `sdk-react`    |
| `tests/`                            | `test`         |
| `docker-compose.yml`, `Dockerfile*` | `infra`        |
| JS→TS 마이그레이션 파일             | `ts-migration` |

**버그 수정 PR — TDD 원칙 체크 (STEP 2-1에 자동 포함)**

```
- [ ] GitHub Issue가 먼저 생성되었는가?
- [ ] 버그를 재현하는 실패 테스트가 작성되었는가? (tests/ 확인)
- [ ] 커밋 footer에 이슈 번호가 연결되었는가? (Fixes #번호)
- [ ] npm test 전체 통과를 확인했는가? (170+ tests)
```

**TypeScript 마이그레이션 커밋 형식**

```
refactor(ts-migration): convert <filename>.js to TypeScript

Issue #55 — Phase <N>
- strict mode 호환 타입 추가
- import.meta.main 패턴 유지
```

**QA 시나리오 — 이 프로젝트 필수 포함 항목 (STEP 2-3)**

```
- [ ] 모든 서비스 /health/live 정상 응답 (api:4010, files:4011, health:4012)
- [ ] docker-compose up 후 db 연결 성공
- [ ] ES Module import 오류 없이 서버 기동
- [ ] WEB_CAD_STORAGE_ROOT_HOST 미설정 시 ./data 기본값 동작
- [ ] npm test 전체 통과
```

### Output Format

각 단계 산출물은 아래 형식으로 출력한다:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1-2 │ Commit Message
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

feat(collab): add real-time cursor sync for multi-user editing

...

✅ 완료. 다음 단계: STEP 1-3 PR 본문을 작성할까요?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
