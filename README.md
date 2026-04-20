# Web CAD On-Prem

**자체 호스팅 CAD 및 포인트클라우드 플랫폼** — 실시간 협업, DXF 처리, NAVER Maps 연동을 지원하는 온프레미스 솔루션입니다.

클라우드 의존 없이 완전한 데이터 소유권을 보장합니다.

---

## 개요

Web CAD On-Prem은 다음과 같은 기능을 제공합니다:

- **DXF 문서 관리** — CAD 도면 업로드, 파싱, 버전 관리, 협업
- **실시간 다중 사용자 편집** — 엔티티 단위 잠금과 라이브 미리보기 브로드캐스트
- **포인트클라우드 시각화** — GPU 가속 Three.js 기반 LAS/XYZ 렌더링
- **NAVER Maps 연동** — 측량용 지오레퍼런싱 위성 이미지 오버레이
- **백그라운드 워커 처리** — 비동기 에셋 수집, 썸네일 생성, 좌표 변환
- **RESTful API + SDK** — TypeScript SDK로 프레임워크 비종속 호스트 연동

---

## 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                   Docker Compose                     │
├──────────┬──────────┬───────────┬──────────────────┤
│   db     │   api    │   worker  │     files         │
│  :5432   │  :4010   │   :4013   │     :4011         │
│ Postgres │ Express  │  tsx loop │   static server   │
│   16     │   REST   │  ingest   │   storage root   │
└──────────┴──────────┴───────────┴──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │    web :3000     │
                    │ (Vite dev server)│
                    │ React + Tailwind │
                    └──────────────────┘
```

### 서비스

| 서비스 | 포트 | 설명 |
|--------|------|------|
| `db` | 5432 | PostgreSQL 16 Alpine — 문서 및 사용자 데이터 |
| `api` | 4010 | Express REST API — 인증, 문서, 협업 이벤트 |
| `worker` | 4013 | 백그라운드 수집 프로세서 — 30초 폴링 루프 |
| `files` | 4011 | 정적 파일 서버 — 스토리지 에셋 제공 |
| `health` | 4012 | Docker healthcheck용 서비스 상태 집계기 |
| `web` | 3000 | Vite 개발 서버 — React 데모 UI (운영: Nginx) |

---

## 빠른 시작

### 1. 클론 및 설정

```bash
git clone <repo>
cp .env.example .env
# .env 수정 — WEB_CAD_STORAGE_ROOT_HOST 및 DB 자격 증명 설정
```

### 2. 전체 서비스 시작

```bash
docker-compose up -d
```

상태 확인:

```bash
curl http://localhost:4010/health/live   # api
curl http://localhost:4011/health/live   # files
curl http://localhost:4012/health/live   # health
```

### 3. 개발 모드

```bash
npm test                 # 검증 스위트 실행 (170+ 테스트)
npm run start:api        # API 서버 시작 (포트 4010)
npm run start:worker     # 백그라운드 워커 시작
npm run start:files      # 파일 서버 시작 (포트 4011)
npm run dev:web          # Vite 개발 서버 시작 (포트 3000)
```

---

## 주요 패키지

```
apps/server/src/        API, 워커, 파일 서버 엔트리포인트
packages/core/src/      인증, 협업, 문서, 스토리지, 지오메트리 로직
packages/sdk-core/src/   호스트向け SDK 클라이언트 (바닐라 JS/TS)
packages/sdk-react/src/  React 연동 컴포넌트 (EditorShell, CadPointCloudEditor)
tests/                  node:test 검증 스위트
```

---

## SDK 연동

### React 컴포넌트

```jsx
import { CadPointCloudEditor } from "@web-cad/sdk-react";

function App() {
  return (
    <CadPointCloudEditor
      baseUrl="http://localhost:4010"
      token="your-jwt-token"
      documentId="survey-1"
      viewMode="2d-cad"
      mapProvider="naver"
      naverMapClientId={process.env.VITE_NAVER_MAP_CLIENT_ID}
      onDocumentOpened={(doc) => console.log("Opened:", doc.id)}
      onSelectionChange={(ids) => console.log("Selected:", ids)}
    />
  );
}
```

### 바닐라 JS SDK

```js
import { createEditorSdk } from "@web-cad/sdk-core";

const sdk = createEditorSdk({ baseUrl: "http://localhost:4010", token });

await sdk.open("survey-1");
sdk.subscribe("selection", (ids) => console.log(ids));
```

---

## 스토리지 설정

스토리지 경로는 환경변수로 설정 가능 — 하드코딩된 경로 없음.

| 환경변수 | 기본값 | 설명 |
|----------|--------|------|
| `WEB_CAD_STORAGE_ROOT_HOST` | `./data` | 호스트 머신 스토리지 루트 |
| `WEB_CAD_STORAGE_ROOT_CONTAINER` | `/app/storage` | 컨테이너 측 마운트 경로 |

```bash
# Linux/macOS
WEB_CAD_STORAGE_ROOT_HOST=./data

# Windows
WEB_CAD_STORAGE_ROOT_HOST=D:\web-cad-storage
```

모든 서비스(api, worker, files)가 동일한 스토리지 루트를 공유합니다. 경로를 변경하면 `.env`를 수정하고 컨테이너를 재생성하면 됩니다.

---

## NAVER Maps 연동

`mapProvider="naver"`와 NCP Client ID를 설정하면 2D CAD 모드에서 위성 이미지 배경을 활성화할 수 있습니다:

```jsx
<CadPointCloudEditor
  baseUrl="http://localhost:4010"
  documentId="survey-1"
  viewMode="2d-cad"
  mapProvider="naver"
  naverMapClientId="YOUR_NCP_CLIENT_ID"
  mapCenter={{ lat: 37.3595704, lng: 127.105399 }}
  mapZoom={16}
/>
```

지도 레이어는 `2d-cad` 모드에서만 활성화되며 NAVER Maps JS API v3 로딩 규칙을 따릅니다.

---

## 헬스 엔드포인트

모든 서비스는 Docker healthcheck 및 외부 모니터링을 위해 `/health/live`를 제공합니다:

```bash
curl http://localhost:4010/health/live   # api — 200 OK
curl http://localhost:4011/health/live   # files — 200 OK
curl http://localhost:4012/health/live   # health агрегатор — 200 OK
```

---

## 테스트

```bash
npm test
```

API, 협업, DXF 파싱, SDK, UI 컴포넌트, Docker Compose 설정 등을covers하는 전체 검증 스위트(~170 테스트)를 실행합니다.

---

## TypeScript 마이그레이션

현재 JS → TS 마이그레이션 진행 중 (이슈 #55). Phase 1–4 완료. Strict 모드 활성화.

---

## 라이선스

전매권 보호 — 모든 권리 보유.