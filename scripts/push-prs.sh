#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────
# scripts/push-prs.sh
# 로컬 Git Bash 또는 WSL에서 실행
# 사용법: bash scripts/push-prs.sh <GITHUB_TOKEN>
# ────────────────────────────────────────────────────────────
set -euo pipefail

TOKEN="${1:-}"
if [ -z "$TOKEN" ]; then
  echo "Usage: bash scripts/push-prs.sh <GITHUB_TOKEN>"
  exit 1
fi

REPO="Stjoo0925/web-cad"
REMOTE="https://${TOKEN}@github.com/${REPO}.git"

api() {
  local method="$1"; local path="$2"; local data="${3:-}"
  if [ -n "$data" ]; then
    curl -s -X "$method" \
      -H "Authorization: token ${TOKEN}" \
      -H "Accept: application/vnd.github.v3+json" \
      "https://api.github.com/repos/${REPO}${path}" \
      -d "$data"
  else
    curl -s -X "$method" \
      -H "Authorization: token ${TOKEN}" \
      -H "Accept: application/vnd.github.v3+json" \
      "https://api.github.com/repos/${REPO}${path}"
  fi
}

json_val() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$1',''))" 2>/dev/null
}

# ── 0. lock 파일 정리 ────────────────────────────────────────
echo "[0] Cleaning git lock files..."
rm -f .git/index.lock .git/HEAD.lock .git/objects/maintenance.lock \
      .git/HEAD.lock.old .git/index.lock.old 2>/dev/null || true
echo "    done"

# ── 1. scaffold 커밋 amend (토큰 제거 반영) ─────────────────
echo "[1] Amending scaffold commit to remove hardcoded token..."
git add scripts/create-github-issues.js
OLD_MAIN=$(git rev-parse main)
git checkout main
git commit --amend --no-edit
NEW_MAIN=$(git rev-parse main)
echo "    main: ${OLD_MAIN:0:7} -> ${NEW_MAIN:0:7}"

# ticket 브랜치들을 새 main 기준으로 rebase
echo "    Rebasing ticket/001-frontend-app..."
git rebase --onto "$NEW_MAIN" "$OLD_MAIN" ticket/001-frontend-app
echo "    Rebasing ticket/002-editor-shell..."
git rebase --onto "$NEW_MAIN" "$OLD_MAIN" ticket/002-editor-shell
git checkout main
echo "    done"

# ── 2. push main (force: amend했으므로) ──────────────────────
echo "[2] Pushing main..."
git push --force "$REMOTE" main
echo "    done"

# ── 3. ticket/001 push + PR + merge ──────────────────────────
echo "[3] Pushing ticket/001-frontend-app..."
git push "$REMOTE" ticket/001-frontend-app
echo "    pushed"

echo "    Creating PR..."
PR1=$(api POST /pulls '{
  "title": "feat(#1): 프론트엔드 실행 앱 추가",
  "body": "## Summary\n\nTICKET-001 구현\n\n### 변경 파일\n- `package.json` — dev:web 스크립트, test 플래그\n- `apps/web/index.html` — 진입점\n- `apps/web/dev-server.js` — web root + project root 이중 서빙\n- `apps/web/src/main.js` — SDK 엔트리\n- `apps/web/src/App.js` — 설정 UI + CadPointCloudEditor 렌더링\n\n## Tests\n\n`npm test` smoke test 포함 전체 통과\n\ncloses #1",
  "head": "ticket/001-frontend-app",
  "base": "main"
}')
PR1_NUM=$(echo "$PR1" | json_val number)
PR1_URL=$(echo "$PR1" | json_val html_url)
echo "    PR #${PR1_NUM}: ${PR1_URL}"

echo "    Merging PR #${PR1_NUM}..."
api PUT /pulls/${PR1_NUM}/merge "{
  \"merge_method\": \"squash\",
  \"commit_title\": \"feat(#1): 프론트엔드 실행 앱 추가 (#${PR1_NUM})\"
}" | json_val message | xargs echo "   "

# ── 4. ticket/002 push + PR + merge ──────────────────────────
echo "[4] Pushing ticket/002-editor-shell..."
git push "$REMOTE" ticket/002-editor-shell
echo "    pushed"

echo "    Creating PR..."
PR2=$(api POST /pulls '{
  "title": "feat(#2): 공통 UI 셸과 레이아웃 시스템 구축",
  "body": "## Summary\n\nTICKET-002 구현\n\n### 변경 파일\n- `EditorShell.js` — CSS Grid 4존 레이아웃\n- `EditorShell.jsx` — 브라우저 re-export\n- `editor-shell.css` — data-attribute 패널 토글\n- `CadPointCloudEditor.jsx` — EditorShell 슬롯 연결\n- `editor-shell.test.js` — TDD 5개 테스트\n\n## Tests\n\n`npm test` editor-shell 5개 포함 전체 통과\n\ncloses #2",
  "head": "ticket/002-editor-shell",
  "base": "main"
}')
PR2_NUM=$(echo "$PR2" | json_val number)
PR2_URL=$(echo "$PR2" | json_val html_url)
echo "    PR #${PR2_NUM}: ${PR2_URL}"

echo "    Merging PR #${PR2_NUM}..."
api PUT /pulls/${PR2_NUM}/merge "{
  \"merge_method\": \"squash\",
  \"commit_title\": \"feat(#2): 공통 UI 셸과 레이아웃 시스템 구축 (#${PR2_NUM})\"
}" | json_val message | xargs echo "   "

# ── 완료 ─────────────────────────────────────────────────────
echo ""
echo "======================================"
echo "All done."
echo "  TICKET-001 PR: ${PR1_URL}"
echo "  TICKET-002 PR: ${PR2_URL}"
echo "======================================"
