## 저격 홀덤 웹 애플리케이션 아키텍처 설계

### 1. 문서 개요

이 문서는 "저격 홀덤 웹" 프로젝트의 전체 시스템 아키텍처를 정의합니다. 프로젝트 관련 문서들(`prd.md`, `db-schema.md`, `erd.md`, `fsm.md`, `functional-specification.md` 등)을 기반으로 주요 구성 요소, 기술 스택, 데이터 흐름, 배포 전략 및 주요 고려 사항들을 설명합니다.

### 2. 아키텍처 목표 및 원칙

*   **실시간 동기화**: 모든 플레이어에게 지연 시간이 낮은 게임 상태 업데이트를 제공합니다.
*   **서버 권위적(Server-Authoritative)**: 게임 로직의 핵심은 서버에서 처리하여 일관성을 유지하고 부정행위를 방지합니다.
*   **상태 기반 관리**: XState를 활용하여 명확하고 견고한 게임 흐름 및 상태 관리를 구현합니다.
*   **확장성 및 유지보수성**: Supabase 및 Vercel과 같은 관리형 서비스를 활용하여 인프라 관리 부담을 줄이고, 모듈식 설계를 통해 기능 확장을 용이하게 합니다.
*   **보안**: 사용자 데이터와 게임 상태를 안전하게 보호합니다.

### 3. 기술 스택 요약

| 계층         | 기술 스택                                       | 주요 역할/근거 (`prd.md` 기반)                                  |
|--------------|-------------------------------------------------|-----------------------------------------------------------------|
| **프론트엔드**   | Next.js (App Router), TypeScript, Tailwind CSS | CSR/SSR 혼합, 빠른 DX, PWA 대응, UI 렌더링, 사용자 상호작용 처리     |
| **상태 관리 (클라이언트)** | XState (또는 Zustand)                            | UI 상태 및 사용자 입력에 따른 로컬 FSM 관리, 서버 FSM과의 연동        |
| **백엔드 (서버 로직)** | Supabase Edge Functions (TypeScript)             | 서버 권위적 FSM 실행, API 로직, 비즈니스 규칙 처리                     |
| **실시간 통신** | Supabase Realtime (Channels, Presence)          | WebSocket 기반 게임 상태 브로드캐스트, 플레이어 접속 상태 추적         |
| **데이터베이스**  | Supabase PostgreSQL + Prisma ORM                 | 영구 데이터 저장 (사용자, 게임, 라운드, 베팅 등), 유형 안전 쿼리, 트랜잭션 |
| **인증**       | Supabase Auth (Magic Link, JWT)                 | 사용자 식별, 세션 관리, API 및 실시간 채널 접근 제어                 |
| **배포/CI**    | Vercel (Edge Functions), GitHub Actions          | Next.js 최적화, 자동 배포, PR 기반 테스트                           |
| **테스트/품질**  | Playwright (E2E), Vitest, ESLint, Prettier      | 멀티 브라우저 및 실시간 시나리오 검증, 코드 품질 유지                  |
| **보안 (DB)**  | Supabase Row Level Security (RLS)               | 데이터베이스 레벨에서의 세밀한 접근 제어                               |
| **분석**       | Supabase Analytics 또는 PostHog (고려)           | 사용자 행동 및 게임 KPI 추적                                     |

### 4. 고수준 아키텍처 다이어그램 (텍스트 기반)

```
+---------------------+      +-------------------------+      +-----------------------+
|   사용자 (브라우저)   |<---->|    프론트엔드 (Next.js)   |<---->|   Vercel (호스팅)     |
| (PC, 모바일 웹)     |      | (UI, 클라이언트 FSM)    |      +-----------------------+
+---------------------+      +-------------------------+
                                     ^  |
                                     |  | (HTTPS, WSS)
                                     |  v
+-----------------------------------------------------------------------------------+
|                                  백엔드 (Supabase)                                  |
+-----------------------+      +-----------------------+      +-----------------------+
| Supabase Edge Functions|<---->| Supabase Realtime     |<---->| Supabase PostgreSQL   |
| (서버 FSM, API, Prisma)|      | (Channels, Presence)  |      | (DB, RLS)             |
+-----------------------+      +-----------------------+      +-----------------------+
         ^                                                               |
         |                                                               |
         +-----------------------+---------------------------------------+
                                 |
                       +-----------------------+
                       |    Supabase Auth      |
                       | (인증, JWT, MagicLink)|
                       +-----------------------+
```

**상호작용 흐름:**

1.  **사용자**: 브라우저를 통해 프론트엔드 애플리케이션과 상호작용합니다.
2.  **프론트엔드 (Next.js on Vercel)**: UI를 렌더링하고, 사용자 입력을 받아 클라이언트 측 FSM으로 처리하거나 Supabase Realtime을 통해 백엔드로 전달합니다. 게임 상태 업데이트를 실시간으로 수신하여 UI를 갱신합니다.
3.  **Supabase Auth**: 사용자 등록 및 로그인을 처리하고 JWT를 발급하여 후속 요청을 인증합니다.
4.  **Supabase Edge Functions**: 서버 권위적인 게임 로직(FSM 실행), 데이터 유효성 검사, Prisma를 통한 데이터베이스 작업을 수행합니다.
5.  **Supabase Realtime**: 프론트엔드와 백엔드(Edge Functions) 간의 양방향 실시간 메시징을 담당합니다. 게임 상태 변경 사항을 채널을 통해 모든 관련 클라이언트에 브로드캐스트하고, 플레이어 접속 상태(Presence)를 관리합니다.
6.  **Supabase PostgreSQL**: 모든 영구 데이터(사용자 정보, 게임 방, 라운드, 패, 베팅, 저격 등)를 저장합니다. RLS를 통해 데이터 접근을 제어합니다.

### 5. 컴포넌트 상세 설계

#### 5.1. 프론트엔드 (클라이언트)

*   **역할**: 사용자 인터페이스 제공, 사용자 입력 처리, 로컬 UI 상태 관리, 서버와의 실시간 통신.
*   **기술**: Next.js (App Router), TypeScript, Tailwind CSS.
*   **상태 관리**:
    *   XState를 사용하여 UI 상호작용 및 로컬 상태(예: 입력 필드 값, 모달 표시 여부)를 관리할 수 있습니다.
    *   서버에서 수신하는 실시간 게임 상태는 별도의 스토어(예: Zustand, React Context) 또는 XState 컨텍스트 내에서 관리될 수 있습니다.
*   **주요 기능**:
    *   닉네임 입력 및 방 생성/참가 UI (`FN-001`, `FN-003`, `FN-004`, `FN-027`).
    *   게임 로비 UI (플레이어 목록, 방 정보, 게임 시작 버튼) (`FN-005`, `FN-008`).
    *   게임 보드 UI (개인 카드, 공유 카드, 칩, 팟, 플레이어 액션 버튼 등) (`FN-028`).
    *   베팅, 저격 등 사용자 액션 입력 처리.
    *   실시간 게임 상태 업데이트 수신 및 UI 반영 (`FN-010`).
    *   게임 종료 화면 표시 (`FN-029`).

#### 5.2. 백엔드 (서버 사이드 로직)

##### 5.2.1. Supabase Edge Functions

*   **역할**: 핵심 게임 로직 실행(서버 권위적 FSM), API 엔드포인트(개념적, 주로 Prisma 직접 호출), 데이터베이스 작업 처리.
*   **기술**: TypeScript, XState (FSM 실행), Prisma ORM.
*   **서버 권위적 FSM**:
    *   각 활성 게임 방마다 서버 측 FSM 인스턴스가 관리될 수 있습니다 (메모리 내 또는 상태 저장 메커니즘 활용).
    *   클라이언트로부터 받은 액션(예: `PLACE_BET`, `DECLARE_SNIPE`)을 FSM 이벤트로 변환하여 처리합니다.
    *   FSM 액션 내에서 `context`를 업데이트하고, `persist` 액션을 통해 Prisma를 사용하여 DB에 상태를 저장하며, `broadcast` 액션을 통해 Supabase Realtime으로 결과를 전송합니다. (`docs/fsm.md`, `docs/functional-specification.md` 참조)
*   **데이터 유효성 검사**: 모든 클라이언트 입력은 서버에서 다시 한번 유효성을 검사합니다.
*   **트랜잭션 관리**: Prisma를 사용하여 여러 DB 작업을 하나의 트랜잭션으로 묶어 데이터 정합성을 보장합니다 (예: `FN-020` 정산 처리).

##### 5.2.2. API 엔드포인트 (개념적)

`functional-specification.md`에 언급된 API 엔드포인트들은 주로 다음과 같은 기능을 수행하며, Supabase Edge Functions 내에서 Prisma Client를 직접 호출하는 형태로 구현될 수 있습니다.

*   `POST /api/rooms` (`FN-003`): 새 게임 방 생성.
*   `POST /api/rooms/{room_code}/join` (`FN-004`): 기존 방 참가 (유효성 검사).
*   기타 관리자용 엔드포인트 (`FN-009` 강제 종료 - 현재 최소 기능에서는 제외 가능).

#### 5.3. 실시간 서비스 (Supabase Realtime)

*   **역할**: 클라이언트와 서버 간의 저지연 양방향 통신, 게임 상태 브로드캐스트, 플레이어 접속 상태(Presence) 관리.
*   **기술**: Supabase Realtime (Phoenix Channels 기반).
*   **채널 (Channels)**:
    *   각 게임 방마다 고유한 채널이 생성됩니다 (예: `room:<roomId>`).
    *   클라이언트는 자신이 속한 방의 채널을 구독합니다.
    *   서버(Edge Function 내 FSM)는 이 채널을 통해 게임 상태 업데이트(카드 분배, 베팅 결과, 저격, 팟 변경, 플레이어 상태 변경 등)를 브로드캐스트합니다 (`FN-010`).
*   **프레즌스 (Presence)**:
    *   플레이어가 채널에 연결/해제될 때 프레즌스 이벤트를 통해 접속 상태를 추적합니다 (`FN-011`).
    *   이는 `PLAYER_DISCONNECT_IN_GAME` (`FN-024`)과 같은 FSM 이벤트를 트리거하여 게임 로직에 반영될 수 있습니다.

#### 5.4. 데이터베이스 (Supabase PostgreSQL + Prisma)

*   **역할**: 모든 영구 데이터 저장 및 관리.
*   **기술**: PostgreSQL, Prisma ORM.
*   **스키마**: `docs/db-schema.md` 및 `docs/erd.md`에 정의된 테이블 및 관계.
    *   `Users`, `GameRooms`, `GameParticipants`, `GameRounds`, `PlayerHands`, `SharedCards`, `FinalHandCompositionCards`, `Bets`, `Snipes` 및 상태 조회 테이블 (`RoomStatuses`, `PlayerStatuses`, `GamePhases`, `HandRanks`).
*   **데이터 접근**: 서버 측 로직(Edge Functions)에서 Prisma ORM을 통해 타입-세이프하게 접근합니다.
*   **보안**: Supabase Row Level Security (RLS)를 사용하여 인증된 사용자 및 역할에 따라 데이터 접근을 세밀하게 제어합니다. 예를 들어, 플레이어는 자신의 개인 카드 정보만 조회할 수 있도록 설정합니다.

#### 5.5. 인증 (Supabase Auth)

*   **역할**: 사용자 신원 확인, 세션 관리, JWT 발급.
*   **기술**: Supabase Auth (Magic Link 선호, OAuth 추가 가능).
*   **흐름 (`FN-001` 기반)**:
    1.  사용자가 닉네임 입력 (신규 시) 또는 로그인 시도.
    2.  Magic Link 방식의 경우 이메일로 인증 링크 발송.
    3.  사용자가 링크를 클릭하여 인증 완료.
    4.  Supabase Auth가 JWT 토큰을 발급.
    5.  클라이언트는 이 JWT를 저장하고, 이후 API 요청 및 실시간 채널 연결 시 인증 헤더에 포함하여 전송.
    6.  백엔드(Edge Functions, Realtime RLS)는 JWT를 검증하여 사용자 권한을 확인.

### 6. 주요 데이터 흐름 예시

#### 6.1. 게임 방 생성 및 참여

1.  **사용자 A (호스트)**: 프론트엔드에서 [방 만들기] 클릭.
2.  **프론트엔드**: 인증된 사용자 정보와 함께 백엔드(Edge Function)로 방 생성 요청.
3.  **Edge Function**:
    *   고유 `room_code` 생성.
    *   `GameRooms` 테이블에 새 방 정보 저장 (호스트 ID, 상태 'WAITING' 등).
    *   `GameParticipants` 테이블에 호스트를 첫 번째 참여자로 추가 (기본 칩 할당).
    *   방 정보(ID, 코드) 반환.
4.  **프론트엔드**: 반환된 정보로 로비 UI로 이동. Supabase Realtime 채널 구독.
5.  **사용자 B (참가자)**: 프론트엔드에서 `room_code` 입력 후 [방 참가하기] 클릭.
6.  **프론트엔드**: 인증된 사용자 정보와 `room_code`를 백엔드로 전송.
7.  **Edge Function**:
    *   `room_code` 유효성, 방 상태('WAITING'), 최대 인원, 이미 참여 중인지 등을 검사.
    *   통과 시 `GameParticipants` 테이블에 사용자 B 추가.
    *   성공/실패 응답.
8.  **프론트엔드 (사용자 B)**: 성공 시 로비 UI로 이동. 채널 구독.
9.  **Supabase Realtime**: 사용자 A, B의 로비 UI에 새로운 참여자 정보 브로드캐스트 (`PLAYER_JOIN` 이벤트에 따름).

#### 6.2. 베팅 처리 (예: `PLACE_BET`)

1.  **사용자 (현재 턴 플레이어)**: 프론트엔드에서 베팅 금액 입력 후 [베팅] 버튼 클릭.
2.  **프론트엔드**: 로컬 유효성 검사 후, `PLACE_BET` 액션과 페이로드({ playerId, amount })를 해당 게임 방의 Supabase Realtime 채널을 통해 서버로 전송.
3.  **Edge Function (서버 FSM)**:
    *   채널에서 `PLACE_BET` 메시지 수신.
    *   해당 방의 FSM 인스턴스에 이벤트 전달.
    *   FSM `guard` (`isBetValidForCurrentPlayer`) 실행 (턴, 칩, 베팅 규칙 검증).
    *   `guard` 통과 시 FSM `action` 실행:
        *   `processBet`: FSM 컨텍스트 업데이트 (플레이어 칩, 팟, 현재 베팅 상태).
        *   `persistBet`: Prisma를 사용하여 `Bets`, `GameParticipants.chips`, `GameRounds.pot_chips` DB 업데이트 (트랜잭션).
        *   `broadcastPlayerBet`: Supabase Realtime을 통해 모든 클라이언트에 베팅 정보(베팅한 플레이어, 금액, 업데이트된 팟 등) 및 다음 턴 플레이어 정보 브로드캐스트.
        *   `setNextPlayerTurnForBetting`: FSM 컨텍스트의 다음 턴 플레이어 업데이트.
4.  **프론트엔드 (모든 플레이어)**: 브로드캐스트된 메시지 수신.
    *   UI 업데이트 (칩 변화, 팟 변화, 다음 턴 표시).
    *   자신의 턴이 되면 액션 버튼 활성화.

### 7. 배포 아키텍처

*   **프론트엔드 (Next.js)**: Vercel에 배포. Vercel은 GitHub 저장소와 연동되어 CI/CD 파이프라인을 통해 자동 배포 지원 (main 브랜치 푸시 또는 PR 병합 시).
*   **백엔드 로직 (Edge Functions)**: Vercel Edge Functions 또는 Supabase Edge Functions에 배포. `prd.md`는 Vercel을 명시했으므로, Next.js API 라우트 또는 별도 Edge Function으로 배포될 수 있습니다.
*   **Supabase 서비스**: Supabase 클라우드에서 호스팅되는 관리형 서비스 사용 (Auth, Database, Realtime).

### 8. 확장성 및 성능

*   **Supabase**: 관리형 서비스로서 트래픽 증가에 따른 자동 확장 기능을 제공합니다. 데이터베이스 연결 풀링, 읽기 전용 복제본(필요시 고급 플랜) 등을 활용할 수 있습니다.
*   **Vercel**: 전 세계 CDN을 통해 정적 에셋을 빠르게 제공하며, Edge Functions는 사용자에게 가까운 리전에서 실행되어 지연 시간을 줄입니다.
*   **애플리케이션 레벨**:
    *   FSM 로직 최적화.
    *   데이터베이스 쿼리 최적화 (Prisma를 통한 효율적 쿼리 작성, 인덱싱 - `erd.md` 권장 사항 참조).
    *   실시간 메시지 페이로드 최소화.
    *   프론트엔드 렌더링 최적화 (React.memo, useMemo, useCallback 등 활용).

### 9. 보안 고려 사항

*   **인증**: Supabase Auth를 통해 모든 사용자 접근을 인증합니다. JWT를 사용하여 세션을 관리하고 API 및 실시간 채널 접근을 보호합니다.
*   **권한 부여**:
    *   Supabase Row Level Security (RLS)를 사용하여 데이터베이스 레벨에서 데이터 접근을 엄격히 제어합니다. (예: 사용자는 자신의 정보만 수정 가능, 게임 참여자만 해당 게임 데이터 접근 가능).
    *   서버 측 로직(Edge Functions)에서 사용자 역할 및 컨텍스트에 따른 추가적인 권한 검사를 수행합니다.
*   **입력 유효성 검사**: 모든 클라이언트 입력은 프론트엔드와 백엔드 양쪽에서 철저히 검증하여 XSS, SQL Injection 등의 공격을 방지합니다.
*   **데이터 전송**: HTTPS 및 WSS (WebSocket Secure)를 사용하여 모든 통신을 암호화합니다.
*   **환경 변수 관리**: API 키, 데이터베이스 연결 문자열 등 민감 정보는 환경 변수를 통해 안전하게 관리합니다 (Vercel, Supabase 설정 활용).

### 10. 로깅 및 모니터링

*   **프론트엔드 로깅**: 브라우저 개발자 콘솔 및 필요시 Sentry와 같은 오류 추적 서비스 연동.
*   **백엔드 로깅 (Edge Functions)**: Vercel 또는 Supabase의 함수 로그 기능을 활용하여 실행 기록, 오류 등을 모니터링합니다.
*   **데이터베이스 로깅**: Supabase PostgreSQL 로그 활용.
*   **분석**: Supabase Analytics 또는 PostHog (`prd.md` 제안)를 사용하여 주요 게임 이벤트, 사용자 행동, 시스템 성능 KPI를 추적하고 분석하여 서비스 개선에 활용합니다. FSM 전환, 베팅 패턴, 저격 성공률 등을 주요 지표로 삼을 수 있습니다.

이 아키텍처 문서는 프로젝트의 현재 이해를 바탕으로 작성되었으며, 개발 진행 및 추가 요구사항에 따라 변경될 수 있습니다. 