# 온프렘 CAD + 포인트클라우드 SDK 구현 티켓 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 온프렘 로컬 서버와 React SDK 기반의 2D CAD + 포인트클라우드 편집 제품을 실제 운영 가능한 수준까지 완성한다.

**Architecture:** 서버는 문서, 협업, 파일, 작업 파이프라인을 담당하고, 호스트 웹은 React SDK를 통해 완성형 편집기를 삽입한다. 2D CAD 모드에서는 네이버 지도 배경을 지원하고, 점군 좌표계를 기준으로 DXF 엔티티를 편집하며, 협업은 엔티티 체크아웃 기반으로 제어한다.

**Tech Stack:** Node.js, React SDK, Canvas 2D, WebGL/Three.js, Web Workers, DXF serializer/parser, Docker Compose, 로컬 파일서버, JWT, WebSocket/SSE

---

## 현재 상태 요약

- 현재 워크스페이스에는 토큰 서비스, 좌표계 변환, DXF 스냅샷 생성, 로컬 스토리지 추상화, 업로드 워커, 기본 API 서버, 파일서버, SDK 클라이언트, React 래퍼, 네이버 지도 배경 설정까지 골격이 있다.
- 아직 실제 CAD 렌더러, 포인트클라우드 렌더러, DXF 파서, 협업 실시간 전송, 작업 명령 시스템, 상태 저장소, 브라우저 앱, 운영용 데이터베이스가 없다.
- 따라서 아래 티켓은 `현재 스캐폴드 -> 운영 가능한 제품`으로 가기 위한 실행 순서다.

## 운영 규칙

- 모든 기능 티켓은 반드시 TDD로 진행한다.
- 각 티켓은 `실패 테스트 작성 -> 실패 확인 -> 최소 구현 -> 통과 확인 -> 리팩터링` 순서를 지킨다.
- 기본 테스트 명령은 `npm test`다.
- 브라우저 UI가 들어가는 티켓은 별도 앱 테스트 명령을 추가한다.
- 한 티켓이 다른 티켓을 기다려야 하면 `선행 티켓`을 명시한다.

## 에픽 1. 개발 기반과 애플리케이션 셸

### TICKET-001: 프론트엔드 실제 실행 앱 추가
**목표:** SDK를 실제로 렌더링할 React 호스트 앱과 개발 서버를 만든다.
**선행 티켓:** 없음
**대상 파일:**
- 생성: `apps/web/package.json`
- 생성: `apps/web/index.html`
- 생성: `apps/web/src/main.jsx`
- 생성: `apps/web/src/App.jsx`
- 수정: `package.json`
**수용 기준:**
- `npm run dev:web` 또는 동등 명령으로 React 앱이 실행된다.
- `CadPointCloudEditor`가 실제 브라우저 화면에 렌더링된다.
- 서버 base URL, 토큰, 문서 ID를 주입할 수 있다.
**TDD 체크리스트:**
- [ ] 앱 엔트리포인트 존재 여부를 검증하는 테스트 작성
- [ ] 실행 스크립트가 없어서 실패하는지 확인
- [ ] 최소 Vite 또는 동등 개발 환경 추가
- [ ] 앱 실행 후 smoke test 통과 확인

### TICKET-002: 공통 UI 셸과 레이아웃 시스템 구축
**목표:** 툴바, 레이어 패널, 속성 패널, 상태바가 있는 편집기 레이아웃을 만든다.
**선행 티켓:** TICKET-001
**대상 파일:**
- 생성: `packages/sdk-react/src/layout/EditorShell.jsx`
- 생성: `packages/sdk-react/src/layout/editor-shell.css`
- 수정: `packages/sdk-react/src/CadPointCloudEditor.jsx`
**수용 기준:**
- 뷰포트, 좌우 패널, 하단 상태바가 분리된 레이아웃을 가진다.
- 2D/3D 모드에 따라 뷰포트 영역이 유지된다.
- 호스트 앱에서 최소 props만으로 렌더링 가능하다.
**TDD 체크리스트:**
- [ ] 레이아웃 주요 영역 존재 테스트 작성
- [ ] 테스트가 DOM 미구현으로 실패하는지 확인
- [ ] 최소 레이아웃 컴포넌트 구현
- [ ] 렌더링 테스트 통과 확인

### TICKET-003: 편집기 상태 저장소 도입
**목표:** 문서 상태, 선택, 도구, 뷰 상태를 관리하는 클라이언트 스토어를 만든다.
**선행 티켓:** TICKET-002
**대상 파일:**
- 생성: `packages/sdk-react/src/state/editor-store.js`
- 생성: `tests/editor-store.test.js`
**수용 기준:**
- 현재 도구, 선택 엔티티, 뷰 모드, 줌, 팬, 지도 활성 여부를 저장한다.
- 컴포넌트는 직접 prop drilling 없이 상태를 참조할 수 있다.
**TDD 체크리스트:**
- [ ] 스토어 초기 상태와 상태 전이 테스트 작성
- [ ] 실패 확인
- [ ] 최소 상태 저장소 구현
- [ ] 선택/도구/뷰 상태 테스트 통과 확인

## 에픽 2. 2D CAD 레이어와 네이버 지도 배경

### TICKET-004: Canvas 2D 기반 CAD 뷰포트 추가
**목표:** 그리드와 기본 엔티티를 그리는 2D CAD 캔버스 레이어를 만든다.
**선행 티켓:** TICKET-003
**대상 파일:**
- 생성: `packages/sdk-react/src/canvas/CadCanvasLayer.jsx`
- 생성: `packages/sdk-react/src/canvas/cad-canvas-renderer.js`
- 생성: `tests/cad-canvas-renderer.test.js`
- 수정: `packages/sdk-react/src/CadPointCloudEditor.jsx`
**수용 기준:**
- 그리드가 렌더링된다.
- POINT, LINE, POLYLINE 최소 엔티티를 표시할 수 있다.
- 줌과 팬 상태를 반영한다.
**TDD 체크리스트:**
- [ ] 렌더 명령 생성 테스트 작성
- [ ] 실패 확인
- [ ] 최소 그리드/엔티티 렌더러 구현
- [ ] 2D 엔티티 렌더 테스트 통과 확인

### TICKET-005: 네이버 지도와 CAD 뷰 상태 동기화
**목표:** 2D CAD 모드에서 지도 배경과 CAD 뷰포트가 같은 중심/줌 기준으로 움직이게 한다.
**선행 티켓:** TICKET-004
**대상 파일:**
- 생성: `packages/sdk-react/src/maps/naver-map-sync.js`
- 생성: `tests/naver-map-sync.test.js`
- 수정: `packages/sdk-react/src/maps/NaverMapBackground.jsx`
- 수정: `packages/sdk-react/src/CadPointCloudEditor.jsx`
**수용 기준:**
- 2D CAD 팬/줌이 지도 배경에 반영된다.
- 지도 이동 시 CAD 뷰 상태도 업데이트된다.
- 3D/포인트클라우드 모드에서는 지도 동기화가 꺼진다.
**TDD 체크리스트:**
- [ ] 뷰 상태 -> 지도 옵션 변환 테스트 작성
- [ ] 실패 확인
- [ ] 최소 동기화 모듈 구현
- [ ] 양방향 동기화 테스트 통과 확인

### TICKET-006: 지도 좌표와 현장 좌표 정합 규칙 구현
**목표:** 위경도 기반 네이버 지도와 현장 좌표계 사이의 기준점을 정의한다.
**선행 티켓:** TICKET-005
**대상 파일:**
- 생성: `packages/core/src/geometry/map-alignment.js`
- 생성: `tests/map-alignment.test.js`
**수용 기준:**
- 기준점 1개 이상으로 CAD 로컬 좌표와 지도 좌표를 연결할 수 있다.
- 문서별 정합 파라미터를 저장 가능하다.
- 정합 없는 문서는 지도 배경만 표시하고 도면 정합은 비활성화한다.
**TDD 체크리스트:**
- [ ] 기준점 기반 변환 테스트 작성
- [ ] 실패 확인
- [ ] 최소 정합 계산 구현
- [ ] 정합 파라미터 재사용 테스트 통과 확인

## 에픽 3. DXF 입출력과 엔티티 모델 고도화

### TICKET-007: DXF 파서 도입
**목표:** DXF 파일을 읽어 내부 엔티티 컬렉션으로 변환한다.
**선행 티켓:** TICKET-004
**대상 파일:**
- 생성: `packages/core/src/documents/dxf-parser.js`
- 생성: `tests/dxf-parser.test.js`
**수용 기준:**
- POINT, LINE, LWPOLYLINE, CIRCLE, ARC, TEXT를 읽을 수 있다.
- 지원하지 않는 엔티티는 경고로 남기고 문서를 깨뜨리지 않는다.
**TDD 체크리스트:**
- [ ] 샘플 DXF 입력 테스트 작성
- [ ] 실패 확인
- [ ] 최소 파서 구현
- [ ] 엔티티 유형별 파싱 테스트 통과 확인

### TICKET-008: DXF 기준 문서 로딩 API 추가
**목표:** DXF 업로드 후 문서가 엔티티 컬렉션과 스냅샷으로 초기화되도록 만든다.
**선행 티켓:** TICKET-007
**대상 파일:**
- 수정: `apps/server/src/api-server.js`
- 수정: `packages/core/src/documents/dxf-document-service.js`
- 생성: `tests/document-import-api.test.js`
**수용 기준:**
- DXF 파일 업로드 시 새 문서 생성이 가능하다.
- 업로드 직후 문서 조회에서 엔티티 수와 스냅샷이 확인된다.
- 사이드카에 원본 파일 참조와 초기 메타데이터가 기록된다.
**TDD 체크리스트:**
- [ ] DXF 업로드 API 테스트 작성
- [ ] 실패 확인
- [ ] 문서 초기화 로직 구현
- [ ] 업로드 후 문서 조회 테스트 통과 확인

### TICKET-009: 엔티티 명령 모델 추가
**목표:** 엔티티 생성/수정/삭제를 명령 객체로 표준화한다.
**선행 티켓:** TICKET-008
**대상 파일:**
- 생성: `packages/core/src/documents/entity-commands.js`
- 생성: `tests/entity-commands.test.js`
**수용 기준:**
- `create`, `update`, `delete` 명령이 공통 형식을 가진다.
- 협업 이벤트와 DXF 스냅샷 생성이 같은 명령 모델을 사용한다.
**TDD 체크리스트:**
- [ ] 명령 검증 테스트 작성
- [ ] 실패 확인
- [ ] 최소 명령 팩토리 구현
- [ ] create/update/delete 테스트 통과 확인

## 에픽 4. 포인트클라우드 파이프라인

### TICKET-010: XYZ/PTS 텍스트 파서 구현
**목표:** 간단한 점군 포맷을 읽어 positions/colors/bbox를 만든다.
**선행 티켓:** 없음
**대상 파일:**
- 생성: `packages/core/src/point-cloud/xyz-parser.js`
- 생성: `packages/core/src/point-cloud/pts-parser.js`
- 생성: `tests/point-cloud-text-parser.test.js`
**수용 기준:**
- XYZ, PTS 파일에서 좌표와 색상 정보를 추출한다.
- bbox, pointCount, origin 후보를 계산한다.
**TDD 체크리스트:**
- [ ] 샘플 XYZ/PTS 파서 테스트 작성
- [ ] 실패 확인
- [ ] 최소 파서 구현
- [ ] bbox/pointCount 테스트 통과 확인

### TICKET-011: LAS/LAZ 처리 워커 경계 구현
**목표:** LAS/LAZ 처리를 메인 스레드와 분리할 수 있는 워커 인터페이스를 만든다.
**선행 티켓:** TICKET-010
**대상 파일:**
- 생성: `packages/core/src/point-cloud/las-worker-client.js`
- 생성: `packages/core/src/point-cloud/las-worker-entry.js`
- 생성: `tests/las-worker-client.test.js`
**수용 기준:**
- 메인 코드에서 워커 요청/응답 계약을 사용할 수 있다.
- 실제 디코더 라이브러리 교체가 가능하도록 어댑터 구조를 가진다.
**TDD 체크리스트:**
- [ ] 워커 요청/응답 테스트 작성
- [ ] 실패 확인
- [ ] 최소 메시지 계약 구현
- [ ] 진행률/완료/오류 테스트 통과 확인

### TICKET-012: 포인트클라우드 메타데이터 저장 구조 확장
**목표:** 원본 파일, 파생 메타데이터, 렌더용 인덱스를 분리 저장한다.
**선행 티켓:** TICKET-010
**대상 파일:**
- 수정: `packages/core/src/workers/asset-ingest-worker.js`
- 생성: `packages/core/src/point-cloud/point-cloud-manifest.js`
- 생성: `tests/point-cloud-manifest.test.js`
**수용 기준:**
- 원본 참조, 포맷, bbox, pointCount, 색상 모드 가능 여부를 저장한다.
- 파일서버와 렌더러가 같은 메타데이터를 재사용할 수 있다.
**TDD 체크리스트:**
- [ ] 메타데이터 저장 테스트 작성
- [ ] 실패 확인
- [ ] 최소 매니페스트 구현
- [ ] 인덱스 메타데이터 테스트 통과 확인

### TICKET-013: WebGL/Three.js 포인트클라우드 레이어 구현
**목표:** 실제 점군을 렌더링하는 WebGL 레이어를 추가한다.
**선행 티켓:** TICKET-012
**대상 파일:**
- 생성: `packages/sdk-react/src/point-cloud/PointCloudLayer.jsx`
- 생성: `packages/sdk-react/src/point-cloud/point-cloud-scene.js`
- 생성: `tests/point-cloud-scene.test.js`
**수용 기준:**
- 최소 한 개 점군을 화면에 올릴 수 있다.
- point size, visibility, opacity, color mode를 반영한다.
- 2D CAD 모드와 3D 점군 모드 전환이 가능하다.
**TDD 체크리스트:**
- [ ] 씬 구성 테스트 작성
- [ ] 실패 확인
- [ ] 최소 Three.js 레이어 구현
- [ ] 레이어 옵션 테스트 통과 확인

## 에픽 5. CAD 편집 도구

### TICKET-014: 선택 도구와 히트 테스트
**목표:** 엔티티 클릭 선택과 다중 선택을 구현한다.
**선행 티켓:** TICKET-004, TICKET-009
**대상 파일:**
- 생성: `packages/sdk-react/src/tools/select-tool.js`
- 생성: `tests/select-tool.test.js`
- 수정: `packages/sdk-react/src/state/editor-store.js`
**수용 기준:**
- POINT, LINE, POLYLINE 선택 가능
- 선택 변경 이벤트가 호스트 앱으로 전달됨
- 현재 선택이 속성 패널과 연결됨
**TDD 체크리스트:**
- [ ] 히트 테스트 작성
- [ ] 실패 확인
- [ ] 최소 선택 로직 구현
- [ ] 단일/다중 선택 테스트 통과 확인

### TICKET-015: 선/폴리라인 작성 도구
**목표:** 현황 도면에서 가장 중요한 선형 엔티티 작성 기능을 구현한다.
**선행 티켓:** TICKET-014
**대상 파일:**
- 생성: `packages/sdk-react/src/tools/line-tool.js`
- 생성: `packages/sdk-react/src/tools/polyline-tool.js`
- 생성: `tests/draw-tools.test.js`
**수용 기준:**
- 클릭으로 LINE 생성 가능
- 연속 클릭으로 POLYLINE 생성 가능
- 생성 완료 시 문서 명령과 협업 이벤트가 발생함
**TDD 체크리스트:**
- [ ] LINE 작성 테스트 작성
- [ ] 실패 확인
- [ ] 최소 작성 도구 구현
- [ ] POLYLINE 작성 테스트 추가 및 통과 확인

### TICKET-016: 스냅 기능 구현
**목표:** 끝점, 중점, 교차점 스냅을 지원한다.
**선행 티켓:** TICKET-015
**대상 파일:**
- 생성: `packages/sdk-react/src/tools/snap-engine.js`
- 생성: `tests/snap-engine.test.js`
**수용 기준:**
- 끝점, 중점, 교차점 스냅 포인트를 계산한다.
- 스냅 마커가 SVG 오버레이에 표시된다.
**TDD 체크리스트:**
- [ ] 스냅 후보 계산 테스트 작성
- [ ] 실패 확인
- [ ] 최소 스냅 엔진 구현
- [ ] 스냅 우선순위 테스트 통과 확인

### TICKET-017: 속성 패널과 엔티티 수정
**목표:** 선택한 엔티티의 레이어, 좌표, 반지름, 텍스트 값을 수정한다.
**선행 티켓:** TICKET-014
**대상 파일:**
- 생성: `packages/sdk-react/src/panels/PropertiesPanel.jsx`
- 생성: `tests/properties-panel.test.js`
**수용 기준:**
- 선택 엔티티 타입별 필드가 보인다.
- 수정 시 update 명령이 생성되고 문서가 갱신된다.
**TDD 체크리스트:**
- [ ] 속성 편집 테스트 작성
- [ ] 실패 확인
- [ ] 최소 패널 구현
- [ ] 업데이트 테스트 통과 확인

## 에픽 6. 협업 실시간 전송

### TICKET-018: WebSocket 기반 협업 채널 추가
**목표:** SSE 대신 양방향 협업 채널을 만든다.
**선행 티켓:** TICKET-009
**대상 파일:**
- 생성: `apps/server/src/realtime-server.js`
- 생성: `packages/sdk-core/src/realtime-client.js`
- 생성: `tests/realtime-client.test.js`
**수용 기준:**
- checkout, draft, commit, cancel 이벤트를 양방향으로 주고받는다.
- 연결 재시도와 인증 토큰 전달을 지원한다.
**TDD 체크리스트:**
- [ ] 실시간 채널 계약 테스트 작성
- [ ] 실패 확인
- [ ] 최소 서버/클라이언트 구현
- [ ] 재연결 테스트 통과 확인

### TICKET-019: 프레즌스와 사용자 커서 표시
**목표:** 누가 어떤 문서를 보고 있는지와 현재 커서를 보여준다.
**선행 티켓:** TICKET-018
**대상 파일:**
- 생성: `packages/sdk-react/src/collaboration/presence-layer.jsx`
- 생성: `tests/presence-layer.test.js`
**수용 기준:**
- 접속 사용자 목록과 커서 위치가 문서별로 표시된다.
- 프레즌스 데이터는 DXF 원본이 아니라 협업 메타데이터 채널로만 저장된다.
**TDD 체크리스트:**
- [ ] 프레즌스 렌더 테스트 작성
- [ ] 실패 확인
- [ ] 최소 프레즌스 레이어 구현
- [ ] 사용자 입장/퇴장 테스트 통과 확인

### TICKET-020: 자동 체크아웃 UI와 충돌 처리 개선
**목표:** 다른 사용자가 점유한 엔티티를 명확히 표시하고, 편집 충돌 UX를 정리한다.
**선행 티켓:** TICKET-018
**대상 파일:**
- 수정: `packages/core/src/collaboration/session-manager.js`
- 생성: `packages/sdk-react/src/collaboration/checkout-indicator.jsx`
- 생성: `tests/checkout-indicator.test.js`
**수용 기준:**
- 점유된 엔티티는 화면에 별도 시각 상태로 표시된다.
- 점유 충돌 시 사용자 메시지가 제공된다.
- 같은 사용자의 재편집은 막지 않는다.
**TDD 체크리스트:**
- [ ] 충돌 UI 테스트 작성
- [ ] 실패 확인
- [ ] 최소 점유 상태 표시 구현
- [ ] 충돌 메시지 테스트 통과 확인

## 에픽 7. SDK 계약 완성

### TICKET-021: SDK 공개 API 정리
**목표:** host app이 의존할 공개 API를 명확히 정리한다.
**선행 티켓:** TICKET-017, TICKET-018
**대상 파일:**
- 수정: `packages/sdk-core/src/editor-sdk-client.js`
- 수정: `packages/sdk-react/src/index.js`
- 생성: `tests/sdk-public-api.test.js`
**수용 기준:**
- open, close, upload, setTool, zoomToFit, setSelection 같은 공개 메서드가 정리된다.
- 내부 구현 세부사항은 export되지 않는다.
**TDD 체크리스트:**
- [ ] 공개 API 테스트 작성
- [ ] 실패 확인
- [ ] 최소 API 정리 구현
- [ ] 호환성 테스트 통과 확인

### TICKET-022: 호스트 앱 이벤트 계약 문서화 및 샘플 앱 제공
**목표:** React 호스트 앱이 실제로 어떻게 붙는지 예제를 제공한다.
**선행 티켓:** TICKET-021
**대상 파일:**
- 생성: `apps/web/src/examples/HostIntegrationExample.jsx`
- 수정: `README.md`
- 생성: `tests/host-integration-example.test.js`
**수용 기준:**
- 문서 열림, 저장 상태, 선택 변경, 업로드 완료, 지도 오류 이벤트 예제가 있다.
- 호스트 앱이 토큰을 공급하는 흐름이 예제로 설명된다.
**TDD 체크리스트:**
- [ ] 샘플 앱 렌더 테스트 작성
- [ ] 실패 확인
- [ ] 최소 예제 구현
- [ ] 문서 링크와 테스트 통과 확인

## 추가 CAD 기능 우선순위

### v1 또는 베타 전 반드시 포함 권장

- 레이어 시스템
  - 레이어 생성/삭제/이름 변경
  - 현재 활성 레이어
  - 가시성 on/off
  - 잠금/해제
  - 레이어별 색상과 선가중치 최소 속성
  - 관련 이슈: `#26`
- 기본 선택/스냅/속성 편집
  - 단일/다중 선택
  - 끝점/중점/교차점 스냅
  - 엔티티 속성 수정
  - 관련 이슈: `#14`, `#16`, `#17`
- 선형 중심 작성 도구
  - LINE
  - POLYLINE
  - 관련 이슈: `#15`

### 베타 이후 권장

- 블록/심벌
  - 블록 정의
  - 블록 참조 삽입
  - 회전/스케일/기준점
  - 속성(Attribute)
  - 관련 이슈: `#27`
- 원/호/문자 편집 고도화
  - 현재 DXF 파서/시리얼라이저 범위를 실제 편집 도구까지 확장
  - 관련 티켓은 후속 분할 필요

### 운영 안정화 이후 권장

- 해치
- 고급 치수
- 리더/주석
- MText
- 스타일/치수 규칙/주석 스케일
- 관련 이슈: `#28`

## CAD 기능 진행 판단

- 레이어는 지금 추가 진행하는 것이 맞다.
  - 이유: DXF 호환성, 선택 필터링, 속성 관리, 실제 도면 운영에서 필수다.
- 블록은 코어 편집기와 협업 구조가 안정된 뒤 추가하는 것이 맞다.
  - 이유: DXF round-trip, 편집, 스냅, 협업 충돌 복잡도가 급격히 커진다.
- 해치와 고급 치수는 더 뒤로 미루는 것이 맞다.
  - 이유: 현황 도면 v1 핵심 흐름 대비 우선순위가 낮고 구현 비용이 크다.

## 에픽 8. 온프렘 운영 완성

### TICKET-023: 데이터베이스 도입과 메타데이터 분리
**목표:** 문서/세션/자산 메타데이터를 파일만이 아니라 DB에도 저장한다.
**선행 티켓:** TICKET-008, TICKET-018
**대상 파일:**
- 생성: `apps/server/src/db/`
- 수정: `docker-compose.yml`
- 생성: `tests/document-repository.test.js`
**수용 기준:**
- 문서 목록, 자산 목록, 세션 기록을 DB에서 조회 가능
- 파일 본문과 메타데이터 저장이 분리됨
**TDD 체크리스트:**
- [ ] 저장소 리포지토리 테스트 작성
- [ ] 실패 확인
- [ ] 최소 DB 계층 구현
- [ ] CRUD 테스트 통과 확인

### TICKET-024: 백업/복구 절차와 운영 스크립트 추가
**목표:** 파일 저장소와 메타데이터를 백업하고 복구하는 절차를 만든다.
**선행 티켓:** TICKET-023
**대상 파일:**
- 생성: `scripts/backup.ps1`
- 생성: `scripts/restore.ps1`
- 수정: `README.md`
**수용 기준:**
- 스토리지와 DB를 한 번에 백업할 수 있다.
- 새 서버에서 복구 절차를 문서만 보고 수행 가능하다.
**TDD 체크리스트:**
- [ ] 백업 파일 목록 테스트 작성
- [ ] 실패 확인
- [ ] 최소 스크립트 구현
- [ ] 복구 검증 테스트 통과 확인

### TICKET-025: Compose 운영 상태 점검 추가
**목표:** API, worker, files, DB 컨테이너의 헬스체크와 의존 관계를 추가한다.
**선행 티켓:** TICKET-023
**대상 파일:**
- 수정: `docker-compose.yml`
- 생성: `apps/server/src/health-server.js`
- 생성: `tests/health-endpoints.test.js`
**수용 기준:**
- 헬스체크 엔드포인트가 존재한다.
- Compose에서 서비스 상태를 확인할 수 있다.
- 초기 기동 순서가 문서화된다.
**TDD 체크리스트:**
- [ ] 헬스 엔드포인트 테스트 작성
- [ ] 실패 확인
- [ ] 최소 health 구현
- [ ] Compose 상태 점검 테스트 통과 확인

## 권장 실행 순서

- 1차 묶음: TICKET-001 ~ TICKET-006
- 2차 묶음: TICKET-007 ~ TICKET-013
- 3차 묶음: TICKET-014 ~ TICKET-020 + `#26`
- 4차 묶음: TICKET-021 ~ TICKET-025

## 릴리스 기준

- 알파: TICKET-001 ~ TICKET-013 완료
- 베타: TICKET-001 ~ TICKET-022 완료 + `#26`
- 운영 준비: TICKET-001 ~ TICKET-025 완료

## 범위 밖

- 모바일 앱
- 완전 오프라인 데스크톱 패키징
- 자유 병합형 CRDT 협업
- 블록 참조, 해치, 고급 치수 편집의 완전 지원
