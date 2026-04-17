/**
 * GitHub 이슈 + Projects v2 칸반 보드 자동 생성 스크립트
 * 실행: node scripts/create-github-issues.js
 */

import https from "node:https";

const OWNER = "Stjoo0925";
const REPO  = "web-cad";
const TOKEN = process.env.GITHUB_TOKEN;

// ── 칸반 컬럼 정의 (생성 순서 = 표시 순서) ─────────────────
const COLUMNS = ["Done", "In Progress", "Ready Now", "Next Up", "Blocked", "Later", "Backlog"];

// ── 이슈별 칸반 컬럼 매핑 ──────────────────────────────────
const ISSUE_STATUS = {
  1:  "Done",
  2:  "In Progress",
  3:  "Ready Now",
  4:  "Next Up",
  5:  "Next Up",
  6:  "Blocked",
  7:  "Next Up",
  8:  "Next Up",
  9:  "Next Up",
  10: "Later",
  11: "Blocked",
  12: "Later",
  13: "Later",
  14: "Later",
  15: "Later",
  16: "Later",
  17: "Later",
  18: "Blocked",
  19: "Later",
  20: "Later",
  21: "Later",
  22: "Later",
  23: "Later",
  24: "Later",
  25: "Later",
  26: "Later",
  27: "Backlog",
  28: "Backlog",
  29: "In Progress",  // 트래킹 이슈
};

// ── 라벨 정의 ─────────────────────────────────────────────
const LABELS = [
  { name: "epic:1-app-shell",     color: "0052cc", description: "에픽 1: 개발 기반과 애플리케이션 셸" },
  { name: "epic:2-cad-2d",        color: "1d76db", description: "에픽 2: 2D CAD 레이어와 네이버 지도" },
  { name: "epic:3-dxf",           color: "0075ca", description: "에픽 3: DXF 입출력과 엔티티 모델" },
  { name: "epic:4-pointcloud",    color: "e4e669", description: "에픽 4: 포인트클라우드 파이프라인" },
  { name: "epic:5-cad-tools",     color: "d93f0b", description: "에픽 5: CAD 편집 도구" },
  { name: "epic:6-collaboration", color: "e99695", description: "에픽 6: 협업 실시간 전송" },
  { name: "epic:7-sdk",           color: "c2e0c6", description: "에픽 7: SDK 계약 완성" },
  { name: "epic:8-ops",           color: "bfd4f2", description: "에픽 8: 온프렘 운영 완성" },
  { name: "wave:1",  color: "006b75", description: "Wave 1: 실행 가능한 브라우저 편집기 틀" },
  { name: "wave:2",  color: "006b75", description: "Wave 2: 2D CAD 기본 흐름" },
  { name: "wave:3",  color: "006b75", description: "Wave 3: 포인트클라우드 파이프라인" },
  { name: "wave:4",  color: "006b75", description: "Wave 4: 편집/협업 핵심" },
  { name: "wave:5",  color: "006b75", description: "Wave 5: SDK/운영 마감" },
  { name: "tdd",     color: "f9d0c4", description: "TDD 필수 티켓" },
  { name: "blocked", color: "b60205", description: "선행 티켓 대기 중" },
];

// ── 이슈 목록 ─────────────────────────────────────────────
const ISSUES = [
  {
    number: 1,
    title: "[TICKET-001] 프론트엔드 실제 실행 앱 추가",
    labels: ["epic:1-app-shell", "wave:1", "tdd"],
    body: `## 목표
SDK를 실제로 렌더링할 React 호스트 앱과 개발 서버를 만든다.

## 선행 티켓
없음

## 대상 파일
- 수정: \`apps/web/src/App.js\` — CadPointCloudEditor 연결
- 수정: \`apps/web/dev-server.js\` — web root + project root 이중 서빙
- 수정: \`package.json\` — --experimental-test-isolation=none 플래그 수정

## 수용 기준
- \`npm run dev:web\`으로 React 앱이 실행된다.
- \`CadPointCloudEditor\`가 실제 브라우저 화면에 렌더링된다.
- 서버 base URL, 토큰, 문서 ID를 주입할 수 있다.

## TDD 체크리스트
- [x] 앱 엔트리포인트 존재 여부를 검증하는 테스트 작성
- [x] dev:web 스크립트 존재 확인
- [x] smoke test 통과 (test #13)

## 완료 ✅ (2026-04-17)`
  },
  {
    number: 2,
    title: "[TICKET-002] 공통 UI 셸과 레이아웃 시스템 구축",
    labels: ["epic:1-app-shell", "wave:1", "tdd"],
    body: `## 목표
툴바, 레이어 패널, 속성 패널, 상태바가 있는 편집기 레이아웃을 만든다.

## 선행 티켓
#1

## 대상 파일
- 생성: \`packages/sdk-react/src/layout/EditorShell.jsx\`
- 생성: \`packages/sdk-react/src/layout/editor-shell.css\`
- 수정: \`packages/sdk-react/src/CadPointCloudEditor.jsx\`

## 수용 기준
- 뷰포트, 좌우 패널, 하단 상태바가 분리된 레이아웃을 가진다.
- 2D/3D 모드에 따라 뷰포트 영역이 유지된다.
- 호스트 앱에서 최소 props만으로 렌더링 가능하다.

## TDD 체크리스트
- [ ] 레이아웃 주요 영역 존재 테스트 작성
- [ ] 테스트가 DOM 미구현으로 실패하는지 확인
- [ ] 최소 레이아웃 컴포넌트 구현
- [ ] 렌더링 테스트 통과 확인`
  },
  {
    number: 3,
    title: "[TICKET-003] 편집기 상태 저장소 도입",
    labels: ["epic:1-app-shell", "wave:1", "tdd"],
    body: `## 목표
문서 상태, 선택, 도구, 뷰 상태를 관리하는 클라이언트 스토어를 만든다.

## 선행 티켓
#2

## 대상 파일
- 생성: \`packages/sdk-react/src/state/editor-store.js\`
- 생성: \`tests/editor-store.test.js\`

## 수용 기준
- 현재 도구, 선택 엔티티, 뷰 모드, 줌, 팬, 지도 활성 여부를 저장한다.
- 컴포넌트는 직접 prop drilling 없이 상태를 참조할 수 있다.

## TDD 체크리스트
- [ ] 스토어 초기 상태와 상태 전이 테스트 작성
- [ ] 실패 확인
- [ ] 최소 상태 저장소 구현
- [ ] 선택/도구/뷰 상태 테스트 통과 확인`
  },
  {
    number: 4,
    title: "[TICKET-004] Canvas 2D 기반 CAD 뷰포트 추가",
    labels: ["epic:2-cad-2d", "wave:2", "tdd"],
    body: `## 목표
그리드와 기본 엔티티를 그리는 2D CAD 캔버스 레이어를 만든다.

## 선행 티켓
#3

## 대상 파일
- 생성: \`packages/sdk-react/src/canvas/CadCanvasLayer.jsx\`
- 생성: \`packages/sdk-react/src/canvas/cad-canvas-renderer.js\`
- 생성: \`tests/cad-canvas-renderer.test.js\`
- 수정: \`packages/sdk-react/src/CadPointCloudEditor.jsx\`

## 수용 기준
- 그리드가 렌더링된다.
- POINT, LINE, POLYLINE 최소 엔티티를 표시할 수 있다.
- 줌과 팬 상태를 반영한다.

## TDD 체크리스트
- [ ] 렌더 명령 생성 테스트 작성
- [ ] 실패 확인
- [ ] 최소 그리드/엔티티 렌더러 구현
- [ ] 2D 엔티티 렌더 테스트 통과 확인`
  },
  {
    number: 5,
    title: "[TICKET-005] 네이버 지도와 CAD 뷰 상태 동기화",
    labels: ["epic:2-cad-2d", "wave:2", "tdd"],
    body: `## 목표
2D CAD 모드에서 지도 배경과 CAD 뷰포트가 같은 중심/줌 기준으로 움직이게 한다.

## 선행 티켓
#4

## 대상 파일
- 생성: \`packages/sdk-react/src/maps/naver-map-sync.js\`
- 생성: \`tests/naver-map-sync.test.js\`
- 수정: \`packages/sdk-react/src/maps/NaverMapBackground.jsx\`
- 수정: \`packages/sdk-react/src/CadPointCloudEditor.jsx\`

## 수용 기준
- 2D CAD 팬/줌이 지도 배경에 반영된다.
- 지도 이동 시 CAD 뷰 상태도 업데이트된다.
- 3D/포인트클라우드 모드에서는 지도 동기화가 꺼진다.

## TDD 체크리스트
- [ ] 뷰 상태 → 지도 옵션 변환 테스트 작성
- [ ] 실패 확인
- [ ] 최소 동기화 모듈 구현
- [ ] 양방향 동기화 테스트 통과 확인`
  },
  {
    number: 6,
    title: "[TICKET-006] 지도 좌표와 현장 좌표 정합 규칙 구현",
    labels: ["epic:2-cad-2d", "wave:2", "tdd", "blocked"],
    body: `## 목표
위경도 기반 네이버 지도와 현장 좌표계 사이의 기준점을 정의한다.

## 선행 티켓
#5 (+ DXF 로딩, 기본 뷰 상태 안정화 후)

## Blocked 사유
\`#4\`, \`#5\`, DXF 로딩, 기본 뷰 상태가 먼저 안정돼야 정합 파라미터 저장과 재적용을 검증할 수 있다.

## 대상 파일
- 생성: \`packages/core/src/geometry/map-alignment.js\`
- 생성: \`tests/map-alignment.test.js\`

## 수용 기준
- 기준점 1개 이상으로 CAD 로컬 좌표와 지도 좌표를 연결할 수 있다.
- 문서별 정합 파라미터를 저장 가능하다.
- 정합 없는 문서는 지도 배경만 표시하고 도면 정합은 비활성화한다.

## TDD 체크리스트
- [ ] 기준점 기반 변환 테스트 작성
- [ ] 실패 확인
- [ ] 최소 정합 계산 구현
- [ ] 정합 파라미터 재사용 테스트 통과 확인`
  },
  {
    number: 7,
    title: "[TICKET-007] DXF 파서 도입",
    labels: ["epic:3-dxf", "wave:2", "tdd"],
    body: `## 목표
DXF 파일을 읽어 내부 엔티티 컬렉션으로 변환한다.

## 선행 티켓
#4

## 대상 파일
- 생성: \`packages/core/src/documents/dxf-parser.js\`
- 생성: \`tests/dxf-parser.test.js\`

## 수용 기준
- POINT, LINE, LWPOLYLINE, CIRCLE, ARC, TEXT를 읽을 수 있다.
- 지원하지 않는 엔티티는 경고로 남기고 문서를 깨뜨리지 않는다.

## TDD 체크리스트
- [ ] 샘플 DXF 입력 테스트 작성
- [ ] 실패 확인
- [ ] 최소 파서 구현
- [ ] 엔티티 유형별 파싱 테스트 통과 확인`
  },
  {
    number: 8,
    title: "[TICKET-008] DXF 기준 문서 로딩 API 추가",
    labels: ["epic:3-dxf", "wave:2", "tdd"],
    body: `## 목표
DXF 업로드 후 문서가 엔티티 컬렉션과 스냅샷으로 초기화되도록 만든다.

## 선행 티켓
#7

## 대상 파일
- 수정: \`apps/server/src/api-server.js\`
- 수정: \`packages/core/src/documents/dxf-document-service.js\`
- 생성: \`tests/document-import-api.test.js\`

## 수용 기준
- DXF 파일 업로드 시 새 문서 생성이 가능하다.
- 업로드 직후 문서 조회에서 엔티티 수와 스냅샷이 확인된다.

## TDD 체크리스트
- [ ] DXF 업로드 API 테스트 작성
- [ ] 실패 확인
- [ ] 문서 초기화 로직 구현
- [ ] 업로드 후 문서 조회 테스트 통과 확인`
  },
  {
    number: 9,
    title: "[TICKET-009] 엔티티 명령 모델 추가",
    labels: ["epic:3-dxf", "wave:2", "tdd"],
    body: `## 목표
엔티티 생성/수정/삭제를 명령 객체로 표준화한다.

## 선행 티켓
#8

## 대상 파일
- 생성: \`packages/core/src/documents/entity-commands.js\`
- 생성: \`tests/entity-commands.test.js\`

## 수용 기준
- \`create\`, \`update\`, \`delete\` 명령이 공통 형식을 가진다.
- 협업 이벤트와 DXF 스냅샷 생성이 같은 명령 모델을 사용한다.

## TDD 체크리스트
- [ ] 명령 검증 테스트 작성
- [ ] 실패 확인
- [ ] 최소 명령 팩토리 구현
- [ ] create/update/delete 테스트 통과 확인`
  },
  {
    number: 10,
    title: "[TICKET-010] XYZ/PTS 텍스트 파서 구현",
    labels: ["epic:4-pointcloud", "wave:3", "tdd"],
    body: `## 목표
간단한 점군 포맷을 읽어 positions/colors/bbox를 만든다.

## 선행 티켓
없음 (독립 구현 가능)

## 대상 파일
- 생성: \`packages/core/src/point-cloud/xyz-parser.js\`
- 생성: \`packages/core/src/point-cloud/pts-parser.js\`
- 생성: \`tests/point-cloud-text-parser.test.js\`

## 수용 기준
- XYZ, PTS 파일에서 좌표와 색상 정보를 추출한다.
- bbox, pointCount, origin 후보를 계산한다.

## TDD 체크리스트
- [ ] 샘플 XYZ/PTS 파서 테스트 작성
- [ ] 실패 확인
- [ ] 최소 파서 구현
- [ ] bbox/pointCount 테스트 통과 확인`
  },
  {
    number: 11,
    title: "[TICKET-011] LAS/LAZ 처리 워커 경계 구현",
    labels: ["epic:4-pointcloud", "wave:3", "tdd", "blocked"],
    body: `## 목표
LAS/LAZ 처리를 메인 스레드와 분리할 수 있는 워커 인터페이스를 만든다.

## 선행 티켓
#10

## Blocked 사유
\`#10\` 텍스트 점군 파서와 렌더 경로가 먼저 필요하다.

## 대상 파일
- 생성: \`packages/core/src/point-cloud/las-worker-client.js\`
- 생성: \`packages/core/src/point-cloud/las-worker-entry.js\`
- 생성: \`tests/las-worker-client.test.js\`

## 수용 기준
- 메인 코드에서 워커 요청/응답 계약을 사용할 수 있다.
- 실제 디코더 라이브러리 교체가 가능하도록 어댑터 구조를 가진다.

## TDD 체크리스트
- [ ] 워커 요청/응답 테스트 작성
- [ ] 실패 확인
- [ ] 최소 메시지 계약 구현
- [ ] 진행률/완료/오류 테스트 통과 확인`
  },
  {
    number: 12,
    title: "[TICKET-012] 포인트클라우드 메타데이터 저장 구조 확장",
    labels: ["epic:4-pointcloud", "wave:3", "tdd"],
    body: `## 목표
원본 파일, 파생 메타데이터, 렌더용 인덱스를 분리 저장한다.

## 선행 티켓
#10

## 대상 파일
- 수정: \`packages/core/src/workers/asset-ingest-worker.js\`
- 생성: \`packages/core/src/point-cloud/point-cloud-manifest.js\`
- 생성: \`tests/point-cloud-manifest.test.js\`

## 수용 기준
- 원본 참조, 포맷, bbox, pointCount, 색상 모드 가능 여부를 저장한다.
- 파일서버와 렌더러가 같은 메타데이터를 재사용할 수 있다.

## TDD 체크리스트
- [ ] 메타데이터 저장 테스트 작성
- [ ] 실패 확인
- [ ] 최소 매니페스트 구현
- [ ] 인덱스 메타데이터 테스트 통과 확인`
  },
  {
    number: 13,
    title: "[TICKET-013] WebGL/Three.js 포인트클라우드 레이어 구현",
    labels: ["epic:4-pointcloud", "wave:3", "tdd"],
    body: `## 목표
실제 점군을 렌더링하는 WebGL 레이어를 추가한다.

## 선행 티켓
#12

## 대상 파일
- 생성: \`packages/sdk-react/src/point-cloud/PointCloudLayer.jsx\`
- 생성: \`packages/sdk-react/src/point-cloud/point-cloud-scene.js\`
- 생성: \`tests/point-cloud-scene.test.js\`

## 수용 기준
- 최소 한 개 점군을 화면에 올릴 수 있다.
- point size, visibility, opacity, color mode를 반영한다.
- 2D CAD 모드와 3D 점군 모드 전환이 가능하다.

## TDD 체크리스트
- [ ] 씬 구성 테스트 작성
- [ ] 실패 확인
- [ ] 최소 Three.js 레이어 구현
- [ ] 레이어 옵션 테스트 통과 확인`
  },
  {
    number: 14,
    title: "[TICKET-014] 선택 도구와 히트 테스트",
    labels: ["epic:5-cad-tools", "wave:4", "tdd"],
    body: `## 목표
엔티티 클릭 선택과 다중 선택을 구현한다.

## 선행 티켓
#4, #9

## 대상 파일
- 생성: \`packages/sdk-react/src/tools/select-tool.js\`
- 생성: \`tests/select-tool.test.js\`
- 수정: \`packages/sdk-react/src/state/editor-store.js\`

## 수용 기준
- POINT, LINE, POLYLINE 선택 가능
- 선택 변경 이벤트가 호스트 앱으로 전달됨
- 현재 선택이 속성 패널과 연결됨

## TDD 체크리스트
- [ ] 히트 테스트 작성
- [ ] 실패 확인
- [ ] 최소 선택 로직 구현
- [ ] 단일/다중 선택 테스트 통과 확인`
  },
  {
    number: 15,
    title: "[TICKET-015] 선/폴리라인 작성 도구",
    labels: ["epic:5-cad-tools", "wave:4", "tdd"],
    body: `## 목표
현황 도면에서 가장 중요한 선형 엔티티 작성 기능을 구현한다.

## 선행 티켓
#14

## 대상 파일
- 생성: \`packages/sdk-react/src/tools/line-tool.js\`
- 생성: \`packages/sdk-react/src/tools/polyline-tool.js\`
- 생성: \`tests/draw-tools.test.js\`

## 수용 기준
- 클릭으로 LINE 생성 가능
- 연속 클릭으로 POLYLINE 생성 가능
- 생성 완료 시 문서 명령과 협업 이벤트가 발생함

## TDD 체크리스트
- [ ] LINE 작성 테스트 작성
- [ ] 실패 확인
- [ ] 최소 작성 도구 구현
- [ ] POLYLINE 작성 테스트 추가 및 통과 확인`
  },
  {
    number: 16,
    title: "[TICKET-016] 스냅 기능 구현",
    labels: ["epic:5-cad-tools", "wave:4", "tdd"],
    body: `## 목표
끝점, 중점, 교차점 스냅을 지원한다.

## 선행 티켓
#15

## 대상 파일
- 생성: \`packages/sdk-react/src/tools/snap-engine.js\`
- 생성: \`tests/snap-engine.test.js\`

## 수용 기준
- 끝점, 중점, 교차점 스냅 포인트를 계산한다.
- 스냅 마커가 SVG 오버레이에 표시된다.

## TDD 체크리스트
- [ ] 스냅 후보 계산 테스트 작성
- [ ] 실패 확인
- [ ] 최소 스냅 엔진 구현
- [ ] 스냅 우선순위 테스트 통과 확인`
  },
  {
    number: 17,
    title: "[TICKET-017] 속성 패널과 엔티티 수정",
    labels: ["epic:5-cad-tools", "wave:4", "tdd"],
    body: `## 목표
선택한 엔티티의 레이어, 좌표, 반지름, 텍스트 값을 수정한다.

## 선행 티켓
#14

## 대상 파일
- 생성: \`packages/sdk-react/src/panels/PropertiesPanel.jsx\`
- 생성: \`tests/properties-panel.test.js\`

## 수용 기준
- 선택 엔티티 타입별 필드가 보인다.
- 수정 시 update 명령이 생성되고 문서가 갱신된다.

## TDD 체크리스트
- [ ] 속성 편집 테스트 작성
- [ ] 실패 확인
- [ ] 최소 패널 구현
- [ ] 업데이트 테스트 통과 확인`
  },
  {
    number: 18,
    title: "[TICKET-018] WebSocket 기반 협업 채널 추가",
    labels: ["epic:6-collaboration", "wave:4", "tdd", "blocked"],
    body: `## 목표
SSE 대신 양방향 협업 채널을 만든다.

## 선행 티켓
#9

## Blocked 사유
명령 모델(#9)과 클라이언트 상태 저장소(#3), 편집 도구 이벤트가 먼저 있어야 한다.

## 대상 파일
- 생성: \`apps/server/src/realtime-server.js\`
- 생성: \`packages/sdk-core/src/realtime-client.js\`
- 생성: \`tests/realtime-client.test.js\`

## 수용 기준
- checkout, draft, commit, cancel 이벤트를 양방향으로 주고받는다.
- 연결 재시도와 인증 토큰 전달을 지원한다.

## TDD 체크리스트
- [ ] 실시간 채널 계약 테스트 작성
- [ ] 실패 확인
- [ ] 최소 서버/클라이언트 구현
- [ ] 재연결 테스트 통과 확인`
  },
  {
    number: 19,
    title: "[TICKET-019] 프레즌스와 사용자 커서 표시",
    labels: ["epic:6-collaboration", "wave:4", "tdd"],
    body: `## 목표
누가 어떤 문서를 보고 있는지와 현재 커서를 보여준다.

## 선행 티켓
#18

## 대상 파일
- 생성: \`packages/sdk-react/src/collaboration/presence-layer.jsx\`
- 생성: \`tests/presence-layer.test.js\`

## 수용 기준
- 접속 사용자 목록과 커서 위치가 문서별로 표시된다.
- 프레즌스 데이터는 DXF 원본이 아니라 협업 메타데이터 채널로만 저장된다.

## TDD 체크리스트
- [ ] 프레즌스 렌더 테스트 작성
- [ ] 실패 확인
- [ ] 최소 프레즌스 레이어 구현
- [ ] 사용자 입장/퇴장 테스트 통과 확인`
  },
  {
    number: 20,
    title: "[TICKET-020] 자동 체크아웃 UI와 충돌 처리 개선",
    labels: ["epic:6-collaboration", "wave:4", "tdd"],
    body: `## 목표
다른 사용자가 점유한 엔티티를 명확히 표시하고, 편집 충돌 UX를 정리한다.

## 선행 티켓
#18

## 대상 파일
- 수정: \`packages/core/src/collaboration/session-manager.js\`
- 생성: \`packages/sdk-react/src/collaboration/checkout-indicator.jsx\`
- 생성: \`tests/checkout-indicator.test.js\`

## 수용 기준
- 점유된 엔티티는 화면에 별도 시각 상태로 표시된다.
- 점유 충돌 시 사용자 메시지가 제공된다.

## TDD 체크리스트
- [ ] 충돌 UI 테스트 작성
- [ ] 실패 확인
- [ ] 최소 점유 상태 표시 구현
- [ ] 충돌 메시지 테스트 통과 확인`
  },
  {
    number: 21,
    title: "[TICKET-021] SDK 공개 API 정리",
    labels: ["epic:7-sdk", "wave:5", "tdd"],
    body: `## 목표
host app이 의존할 공개 API를 명확히 정리한다.

## 선행 티켓
#17, #18

## 대상 파일
- 수정: \`packages/sdk-core/src/editor-sdk-client.js\`
- 수정: \`packages/sdk-react/src/index.js\`
- 생성: \`tests/sdk-public-api.test.js\`

## TDD 체크리스트
- [ ] 공개 API 테스트 작성
- [ ] 실패 확인
- [ ] 최소 API 정리 구현
- [ ] 호환성 테스트 통과 확인`
  },
  {
    number: 22,
    title: "[TICKET-022] 호스트 앱 이벤트 계약 문서화 및 샘플 앱 제공",
    labels: ["epic:7-sdk", "wave:5", "tdd"],
    body: `## 목표
React 호스트 앱이 실제로 어떻게 붙는지 예제를 제공한다.

## 선행 티켓
#21

## 대상 파일
- 생성: \`apps/web/src/examples/HostIntegrationExample.jsx\`
- 수정: \`README.md\`
- 생성: \`tests/host-integration-example.test.js\`

## TDD 체크리스트
- [ ] 샘플 앱 렌더 테스트 작성
- [ ] 최소 예제 구현
- [ ] 문서 링크와 테스트 통과 확인`
  },
  {
    number: 23,
    title: "[TICKET-023] 데이터베이스 도입과 메타데이터 분리",
    labels: ["epic:8-ops", "wave:5", "tdd"],
    body: `## 목표
문서/세션/자산 메타데이터를 파일만이 아니라 DB에도 저장한다.

## 선행 티켓
#8, #18

## 대상 파일
- 생성: \`apps/server/src/db/\`
- 수정: \`docker-compose.yml\`
- 생성: \`tests/document-repository.test.js\`

## TDD 체크리스트
- [ ] 저장소 리포지토리 테스트 작성
- [ ] 최소 DB 계층 구현
- [ ] CRUD 테스트 통과 확인`
  },
  {
    number: 24,
    title: "[TICKET-024] 백업/복구 절차와 운영 스크립트 추가",
    labels: ["epic:8-ops", "wave:5"],
    body: `## 목표
파일 저장소와 메타데이터를 백업하고 복구하는 절차를 만든다.

## 선행 티켓
#23

## 대상 파일
- 생성: \`scripts/backup.ps1\`
- 생성: \`scripts/restore.ps1\`
- 수정: \`README.md\``
  },
  {
    number: 25,
    title: "[TICKET-025] Compose 운영 상태 점검 추가",
    labels: ["epic:8-ops", "wave:5", "tdd"],
    body: `## 목표
API, worker, files, DB 컨테이너의 헬스체크와 의존 관계를 추가한다.

## 선행 티켓
#23

## 대상 파일
- 수정: \`docker-compose.yml\`
- 생성: \`apps/server/src/health-server.js\`
- 생성: \`tests/health-endpoints.test.js\``
  },
  {
    number: 26,
    title: "[TICKET-026] 레이어 시스템 고도화",
    labels: ["epic:5-cad-tools", "wave:4", "tdd"],
    body: `## 목표
레이어 생성/삭제/이름 변경, 가시성, 잠금, 색상/선가중치 속성을 지원한다.

## 선행 티켓
#14

## 대상 파일
- 생성: \`packages/core/src/documents/layer-manager.js\`
- 생성: \`packages/sdk-react/src/panels/LayersPanel.jsx\`
- 생성: \`tests/layer-manager.test.js\`

## 우선순위
v1 또는 베타 전 반드시 포함 권장

## TDD 체크리스트
- [ ] 레이어 CRUD 테스트 작성
- [ ] 최소 레이어 매니저 구현
- [ ] 가시성/잠금 상태 테스트 통과 확인`
  },
  {
    number: 27,
    title: "[TICKET-027] 블록 참조 및 심벌 라이브러리 지원",
    labels: ["epic:3-dxf"],
    body: `## 목표
블록 정의, 블록 참조 삽입, 회전/스케일/기준점, 속성(Attribute)을 지원한다.

## 우선순위
베타 이후 권장`
  },
  {
    number: 28,
    title: "[TICKET-028] 해치·고급 치수·주석 엔티티 확장",
    labels: ["epic:3-dxf"],
    body: `## 목표
해치, 고급 치수, 리더/주석, MText, 스타일/치수 규칙/주석 스케일을 지원한다.

## 우선순위
운영 안정화 이후 권장`
  },
  {
    number: 29,
    title: "[TRACKING] 온프렘 CAD SDK 전체 진행 트래킹",
    labels: [],
    body: `## 전체 릴리스 기준

| 단계 | 범위 | 조건 |
|---|---|---|
| 알파 | TICKET-001 ~ 013 | Wave 1~3 완료 |
| 베타 | TICKET-001 ~ 022 + #26 | Wave 1~4 완료 |
| 운영 준비 | TICKET-001 ~ 025 | Wave 1~5 완료 |

## Wave 진행 현황

### Wave 1 — 실행 가능한 브라우저 편집기 틀
- [x] #1 프론트엔드 실제 실행 앱 추가 ✅
- [ ] #2 공통 UI 셸과 레이아웃 시스템 구축
- [ ] #3 편집기 상태 저장소 도입

### Wave 2 — 2D CAD 기본 흐름
- [ ] #4 #5 #7 #8 #9

### Wave 3 — 포인트클라우드 파이프라인
- [ ] #10 #11 #12 #13

### Wave 4 — 편집/협업 핵심
- [ ] #14 #15 #16 #17 #18 #19 #20 #26

### Wave 5 — SDK/운영 마감
- [ ] #21 #22 #23 #24 #25`
  }
];

// ────────────────────────────────────────────────────────────
// HTTP 유틸
// ────────────────────────────────────────────────────────────
function restRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: "api.github.com",
      path,
      method,
      headers: {
        "Authorization": `token ${TOKEN}`,
        "User-Agent": "web-cad-issue-creator",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function graphql(query, variables = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });
    const req = https.request({
      hostname: "api.github.com",
      path: "/graphql",
      method: "POST",
      headers: {
        "Authorization": `bearer ${TOKEN}`,
        "User-Agent": "web-cad-issue-creator",
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    }, (res) => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch { resolve({ raw }); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ────────────────────────────────────────────────────────────
// 1. 라벨 생성
// ────────────────────────────────────────────────────────────
async function createLabels() {
  console.log("\n── 1단계: 라벨 생성");
  for (const label of LABELS) {
    const res = await restRequest("POST", `/repos/${OWNER}/${REPO}/labels`, label);
    if (res.status === 201)       console.log(`  ✅ ${label.name}`);
    else if (res.status === 422)  console.log(`  ⏭  이미 존재: ${label.name}`);
    else                          console.log(`  ⚠️  실패(${res.status}): ${label.name}`);
    await sleep(200);
  }
}

// ────────────────────────────────────────────────────────────
// 2. 이슈 생성
// ────────────────────────────────────────────────────────────
async function createIssues() {
  console.log("\n── 2단계: 이슈 생성");

  // 기존 이슈 조회
  const existing = new Map();
  let page = 1;
  while (true) {
    const res = await restRequest("GET", `/repos/${OWNER}/${REPO}/issues?state=all&per_page=100&page=${page}`);
    if (res.status !== 200 || !Array.isArray(res.body) || res.body.length === 0) break;
    for (const i of res.body) existing.set(i.title, i.number);
    page++;
    await sleep(150);
  }
  console.log(`  기존 이슈 ${existing.size}개 확인`);

  const createdNumbers = new Map(); // title → github issue number
  for (const issue of ISSUES) {
    if (existing.has(issue.title)) {
      console.log(`  ⏭  이미 존재 #${existing.get(issue.title)}: ${issue.title.slice(0, 50)}`);
      createdNumbers.set(issue.title, existing.get(issue.title));
      continue;
    }
    const res = await restRequest("POST", `/repos/${OWNER}/${REPO}/issues`, {
      title: issue.title,
      body: issue.body,
      labels: issue.labels || []
    });
    if (res.status === 201) {
      console.log(`  ✅ #${res.body.number}: ${issue.title.slice(0, 50)}`);
      createdNumbers.set(issue.title, res.body.number);
    } else {
      console.log(`  ❌ 실패(${res.status}): ${issue.title.slice(0, 50)}`);
    }
    await sleep(400);
  }
  return createdNumbers;
}

// ────────────────────────────────────────────────────────────
// 3. GitHub Projects v2 칸반 보드 생성
// ────────────────────────────────────────────────────────────
async function createProject(ownerNodeId) {
  console.log("\n── 3단계: GitHub Projects v2 생성");
  const res = await graphql(`
    mutation($ownerId: ID!, $title: String!) {
      createProjectV2(input: { ownerId: $ownerId, title: $title }) {
        projectV2 { id url number }
      }
    }`, { ownerId: ownerNodeId, title: "온프렘 CAD SDK 칸반" });

  if (res.errors) {
    console.log("  ❌ 프로젝트 생성 실패:", JSON.stringify(res.errors));
    return null;
  }
  const project = res.data.createProjectV2.projectV2;
  console.log(`  ✅ 프로젝트 생성: ${project.url}`);
  return project;
}

async function getExistingProject(ownerNodeId) {
  const res = await graphql(`
    query($login: String!) {
      user(login: $login) {
        projectsV2(first: 20) {
          nodes { id url number title }
        }
      }
    }`, { login: OWNER });

  const projects = res.data?.user?.projectsV2?.nodes ?? [];
  return projects.find(p => p.title === "온프렘 CAD SDK 칸반") ?? null;
}

// ────────────────────────────────────────────────────────────
// 4. Status 필드 옵션 구성
// ────────────────────────────────────────────────────────────
async function getStatusField(projectId) {
  const res = await graphql(`
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id name
                options { id name }
              }
            }
          }
        }
      }
    }`, { projectId });

  const fields = res.data?.node?.fields?.nodes ?? [];
  return fields.find(f => f.name === "Status") ?? null;
}

async function updateStatusOptions(projectId, statusFieldId, existingOptions) {
  console.log("\n── 4단계: Status 컬럼 구성");

  // 컬럼별 색상 매핑
  const COLUMN_COLOR = {
    "Done":        "GREEN",
    "In Progress": "BLUE",
    "Ready Now":   "PURPLE",
    "Next Up":     "YELLOW",
    "Blocked":     "RED",
    "Later":       "GRAY",
    "Backlog":     "GRAY",
  };

  const existingByName = Object.fromEntries(existingOptions.map(o => [o.name, o]));

  // COLUMNS 순서대로 전체 옵션 목록 구성 (기존 것 포함, 누락된 것 추가)
  const fullOptions = COLUMNS.map(col => ({
    name: col,
    color: COLUMN_COLOR[col] ?? "GRAY",
    description: ""
  }));

  // COLUMNS에 없는 기존 옵션도 뒤에 붙여 유지 (예: Todo 등 GitHub 기본값)
  for (const o of existingOptions) {
    if (!COLUMNS.includes(o.name)) {
      fullOptions.push({ name: o.name, color: "GRAY", description: "" });
    }
  }

  // updateProjectV2Field: fieldId만 받고 singleSelectOptions로 전체 교체
  const res = await graphql(`
    mutation($fieldId: ID!, $options: [ProjectV2SingleSelectFieldOptionInput!]!) {
      updateProjectV2Field(input: {
        fieldId: $fieldId,
        singleSelectOptions: $options
      }) {
        projectV2Field {
          ... on ProjectV2SingleSelectField {
            options { id name }
          }
        }
      }
    }`, { fieldId: statusFieldId, options: fullOptions });

  if (res.errors) {
    console.log("  ❌ Status 필드 업데이트 실패:", res.errors[0]?.message ?? "");
    // 실패해도 기존 옵션 맵 반환
    return Object.fromEntries(existingOptions.map(o => [o.name, o.id]));
  }

  const updatedOptions = res.data?.updateProjectV2Field?.projectV2Field?.options ?? [];
  for (const o of updatedOptions) console.log(`  ✅ ${o.name}`);
  return Object.fromEntries(updatedOptions.map(o => [o.name, o.id]));
}

// ────────────────────────────────────────────────────────────
// 5. 이슈를 프로젝트에 추가 + 상태 설정
// ────────────────────────────────────────────────────────────
async function getIssueNodeId(issueNumber) {
  const res = await graphql(`
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) { id }
      }
    }`, { owner: OWNER, repo: REPO, number: issueNumber });
  return res.data?.repository?.issue?.id ?? null;
}

async function addIssuesToProject(projectId, statusFieldId, optionIdMap, issueNumbers) {
  console.log("\n── 5단계: 이슈 → 프로젝트 추가 및 상태 설정");

  for (const [localNum, githubNum] of issueNumbers) {
    // localNum = 1~29 (ISSUE_STATUS 키), githubNum = 실제 GitHub 이슈 번호
    // ISSUE_STATUS 키는 1~29 숫자
    const ticketNum = ISSUES.findIndex(i => i.title === localNum) + 1;
    const targetCol = ISSUE_STATUS[ticketNum];
    if (!targetCol) continue;

    const optionId = optionIdMap[targetCol];
    if (!optionId) {
      console.log(`  ⚠️  컬럼 없음(${targetCol}) for #${githubNum}`);
      continue;
    }

    // 이슈 node ID 조회
    const issueNodeId = await getIssueNodeId(githubNum);
    if (!issueNodeId) { console.log(`  ⚠️  node ID 조회 실패 #${githubNum}`); continue; }

    // 프로젝트에 추가
    const addRes = await graphql(`
      mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
          item { id }
        }
      }`, { projectId, contentId: issueNodeId });

    if (addRes.errors) {
      console.log(`  ⚠️  추가 실패 #${githubNum}:`, addRes.errors[0]?.message ?? "");
      await sleep(200);
      continue;
    }

    const itemId = addRes.data?.addProjectV2ItemById?.item?.id;

    // 상태 설정
    const setRes = await graphql(`
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId,
          itemId: $itemId,
          fieldId: $fieldId,
          value: { singleSelectOptionId: $optionId }
        }) {
          projectV2Item { id }
        }
      }`, { projectId, itemId, fieldId: statusFieldId, optionId });

    if (setRes.errors) {
      console.log(`  ⚠️  상태 설정 실패 #${githubNum}:`, setRes.errors[0]?.message ?? "");
    } else {
      console.log(`  ✅ #${githubNum} → ${targetCol}`);
    }
    await sleep(300);
  }
}

// ────────────────────────────────────────────────────────────
// 메인
// ────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🚀 GitHub 이슈 + Projects v2 칸반 보드 생성 시작");
  console.log(`   대상: https://github.com/${OWNER}/${REPO}\n`);

  // 인증 확인 + user node ID 획득
  const authRes = await restRequest("GET", "/user");
  if (authRes.status !== 200) {
    console.error("❌ 인증 실패. TOKEN을 확인하세요."); process.exit(1);
  }
  console.log(`✅ 인증: ${authRes.body.login}`);

  const userRes = await graphql(`query($login:String!){user(login:$login){id}}`, { login: OWNER });
  const ownerNodeId = userRes.data?.user?.id;
  if (!ownerNodeId) { console.error("❌ user node ID 조회 실패"); process.exit(1); }

  // 1. 라벨
  await createLabels();

  // 2. 이슈 (title → githubIssueNumber 맵 반환)
  const issueNumberMap = await createIssues(); // Map<title, githubNum>

  // ISSUE_STATUS 는 1~29 순서 기반 → title 기반 맵으로 변환
  // issueNumbers: Map<ticketIndex(1~29), githubNum>
  const indexedMap = new Map();
  ISSUES.forEach((issue, idx) => {
    const githubNum = issueNumberMap.get(issue.title);
    if (githubNum) indexedMap.set(idx + 1, githubNum);
  });

  // 3. 프로젝트 생성 or 기존 조회
  let project = await getExistingProject(ownerNodeId);
  if (project) {
    console.log(`\n── 3단계: 프로젝트 이미 존재 → ${project.url}`);
  } else {
    project = await createProject(ownerNodeId);
    if (!project) { console.error("❌ 프로젝트 생성 실패"); process.exit(1); }
  }

  await sleep(1000);

  // 4. Status 필드 옵션
  const statusField = await getStatusField(project.id);
  if (!statusField) { console.error("❌ Status 필드를 찾을 수 없음"); process.exit(1); }

  const optionIdMap = await updateStatusOptions(project.id, statusField.id, statusField.options);

  // 5. 이슈 추가 + 상태 설정
  // addIssuesToProject 에서 indexedMap(ticketNum→githubNum) 사용
  // 내부에서 ISSUE_STATUS[ticketNum] 으로 컬럼 결정
  console.log("\n── 5단계: 이슈 → 프로젝트 추가 및 상태 설정");
  for (const [ticketNum, githubNum] of indexedMap) {
    const targetCol = ISSUE_STATUS[ticketNum];
    if (!targetCol) continue;
    const optionId = optionIdMap[targetCol];
    if (!optionId) { console.log(`  ⚠️  컬럼 없음(${targetCol}) for ticket #${ticketNum}`); continue; }

    const issueNodeId = await getIssueNodeId(githubNum);
    if (!issueNodeId) { console.log(`  ⚠️  node ID 없음 #${githubNum}`); continue; }

    const addRes = await graphql(`
      mutation($pid:ID!,$cid:ID!){
        addProjectV2ItemById(input:{projectId:$pid,contentId:$cid}){item{id}}
      }`, { pid: project.id, cid: issueNodeId });

    if (addRes.errors) {
      const msg = addRes.errors[0]?.message ?? "";
      if (!msg.includes("already")) console.log(`  ⚠️  추가 실패 #${githubNum}: ${msg}`);
      else console.log(`  ⏭  이미 추가됨 #${githubNum}`);
      await sleep(200); continue;
    }

    const itemId = addRes.data?.addProjectV2ItemById?.item?.id;
    const setRes = await graphql(`
      mutation($pid:ID!,$iid:ID!,$fid:ID!,$oid:String!){
        updateProjectV2ItemFieldValue(input:{
          projectId:$pid, itemId:$iid, fieldId:$fid,
          value:{singleSelectOptionId:$oid}
        }){projectV2Item{id}}
      }`, { pid: project.id, iid: itemId, fid: statusField.id, oid: optionId });

    if (setRes.errors) console.log(`  ⚠️  상태 실패 #${githubNum}: ${setRes.errors[0]?.message}`);
    else              console.log(`  ✅ #${githubNum} (ticket ${ticketNum}) → ${targetCol}`);
    await sleep(300);
  }

  console.log("\n✅ 완료!");
  console.log(`   이슈:    https://github.com/${OWNER}/${REPO}/issues`);
  console.log(`   프로젝트: ${project.url}`);
}

main().catch(err => { console.error("오류:", err); process.exit(1); });
