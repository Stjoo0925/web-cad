# web-cad

## 목적

Node.js API 서버, DXF 스냅샷 서비스, 엔티티 체크아웃 협업 관리자, 프레임워크 독립적 SDK 클라이언트 및 React 에디터 컴포넌트를 포함한 온프레미스 CAD 및 포인트 클라우드 협업 플랫폼입니다.

## 주요 파일

| 파일                    | 설명                                                        |
| ----------------------- | ----------------------------------------------------------- |
| `Dockerfile`            | 컨테이너화된 배포를 위한 Node 24 Alpine 이미지              |
| `docker-compose.yml`    | 3개 서비스 스택: api (포트 4010), worker, files (포트 4011) |
| `package.json`          | 프로젝트 매니페스트 (워크스페이스 구조 사용)                |
| `.env` / `.env.example` | 환경 변수 설정                                              |
| `README.md`             | 프로젝트 개요 및 빠른 시작 가이드                           |

## 하위 디렉토리

| 디렉토리                  | 용도                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `apps/server/src/`        | 온프레미스 API, 워커 및 파일 서버 엔트리포인트 (`apps/server/src/AGENTS.md` 참조)     |
| `packages/core/src/`      | 인증, 협업, 문서, 저장소, 기하학, 워커 로직 (`packages/core/src/AGENTS.md` 참조)      |
| `packages/sdk-core/src/`  | 브라우저 통합을 위한 호스트용 SDK 클라이언트 (`packages/sdk-core/src/AGENTS.md` 참조) |
| `packages/sdk-react/src/` | React 통합 컴포넌트 (`packages/sdk-react/src/AGENTS.md` 참조)                         |
| `tests/`                  | `node:test`를 사용한 Node.js 테스트 스위트                                            |
| `docs/superpowers/plans/` | 에이전틱 칸반 및 온프레미스 CAD SDK 티켓 계획                                         |
| `scripts/`                | 유틸리티 스크립트 (GitHub PR 자동화, GitHub 이슈 생성)                                |
| `data/`                   | 온프레미스 저장소 루트 (Git 무시됨, Docker를 통해 마운트)                             |

## AI 에이전트를 위한 지침

### 저장소 설정

저장소 루트는 `WEB_CAD_STORAGE_ROOT_HOST` (호스트 경로) 및 `WEB_CAD_STORAGE_ROOT_CONTAINER` (컨테이너 마운트)를 통해 설정 가능합니다. 기본값은 호스트의 `./data`, 컨테이너의 `/app/storage`입니다.

### Docker 배포

세 개의 서비스가 볼륨 마운트를 통해 동일한 저장소 루트를 공유합니다:

- **api**: 포트 4010의 Node HTTP 서버 — 토큰, 문서, 엔티티 협업 관리
- **worker**: 보류 중인 에셋 반입 매니페스트 처리
- **files**: 포트 4011의 정적 파일 서버 — DXF 및 포인트 클라우드 파일 제공

### 로컬 실행

```bash
npm test
npm run start:api      # node apps/server/src/api-server.js
npm run start:worker
npm run start:files
```

## 의존성

### 외부 서비스

- Node.js 24 (Alpine 기반 Docker 이미지)
- NAVER Maps JavaScript API v3 (선택 사항: 2D CAD 배경 레이어)

## 🚨 개발 필수 지침

본 프로젝트에 참여하는 모든 에이전트 및 개발자는 아래의 **3대 원칙**과 **7단계 프로세스**를 엄격히 준수해야 합니다.

### 1. 3대 개발 원칙

1. **언어 규정**: 모든 소스 코드 내 **주석** 및 Git **커밋 메시지**는 반드시 **한글**로 작성합니다.
2. **칸반 중심**: `docs/superpowers/plans/`에 정의된 티켓 및 칸반 보드 순서에 의해서만 개발을 진행합니다.
3. **엄격한 TDD**: `node:test`를 사용하여 구현 전 테스트를 먼저 작성합니다. 오류 발생 시 해당 오류를 재현하는 테스트를 추가하여 "잠금(Lock-in)" 처리 후 해결합니다.

### 2. 표준 개발 프로세스 (7단계)

모든 작업은 반드시 다음 순서를 따릅니다:

1. **티켓 확인**: `docs/superpowers/plans/`에서 작업할 티켓의 요구사항을 분석합니다.
2. **기능 테스트 준비**: 구현할 기능에 대한 실패하는 테스트 코드를 먼저 작성합니다 (TDD).
3. **개발**: 테스트를 통과하기 위한 실제 비즈니스 로직을 구현합니다.
4. **브랜치 변경**: 작업 내용에 맞는 기능 브랜치(feature/...)로 전환합니다.
5. **커밋**: 작업 내용을 **한글**로 명확히 작성하여 커밋합니다.
6. **PR (Pull Request)**: 변경 사항을 검토받기 위한 PR을 생성합니다.
7. **다음 티켓 확인**: 칸반 보드로 돌아가 다음 우선순위 티켓을 확인합니다.
