# 저격 홀덤 Web - PRD

## 목차

1. 제품 개요
2. 벤치마킹 서비스 및 근거
3. 핵심 기능 - 규격
4. 제안 기능
5. 사용자 페르소나와 활용 시나리오
6. 기술 스택 제안

---

## 1. 제품 개요

저격 홀덤 Web은 넷플릭스 예능 〈데블스 플랜〉에 등장한 '저격 홀덤'을 실시간 멀티플레이 웹 게임으로 구현하는 프로젝트입니다.

- **목표**: 어디서나 브라우저만으로 게임에 즉시 참여하고, 실시간으로 카드·칩·저격 정보를 동기화하며 승부를 즐길 수 있는 서비스 제공
- **플레이 방식**: 2 ~ 6명의 플레이어가 턴별로 베팅·저격·쇼다운을 거쳐 칩을 획득, 칩 75개로 생존 확정 후 최종 승자를 가림 (게임 규칙은 `game-rule.md` 참조)
- **차별점**
  1. 저격 시스템 – 족보+최고 숫자를 선언해 상대를 강등시키는 독특한 메타
  2. 간소화된 카드 세트 – 1-10 숫자·4세트로 룰 진입 장벽 축소
  3. 생존 확정 + 탈락 구조 – 배틀로얄처럼 긴장감 유지

---

## 2. 벤치마킹 서비스 및 근거

| 서비스 | 참조 포인트 | 적용 근거 |
|--------|-------------|-----------|
| Zynga Poker | 실시간 소켓 기반 동기화, 캐주얼 UI, 소셜 기능 | 수백만 동접을 실현한 실시간 소켓 구조와 '친구 초대–칩 선물' 메커니즘은 유사 규모 확장 시 참고가치가 높음 |
| Supabase Realtime 데모 게임 | Next.js + Supabase Realtime로 만든 F2P 브라우저 멀티게임 사례 | 동일 스택에서 Presence·Broadcast·DB trigger로 플레이어 상태를 즉시 반영한 구현 패턴을 검증 가능 |
| Hearthstone (Blizzard) | 매치메이킹 풀과 클라이언트-서버 결정권 분리 | 서버 단일 진실원칙(SoT)을 유지하며 클라이언트는 UI 연출만 담당하는 구조는 부정행위 방지와 유지보수 용이성에 기여 |

---

## 3. 핵심 기능 - 규격

| 카테고리 | 세부 기능 | 주요 규격 |
|----------|----------|-----------|
| 실시간 동기화 | • 플레이어 입장/퇴장 Presence<br>• 카드 분배/베팅/저격/칩 이동 Broadcast<br>• 로비에서 방 생성/참여인원/상태 Broadcast | Supabase Realtime 채널(PHOENIX) 사용, ≤ 150 ms 지연 목표 |
| 게임 상태머신 | • `Lobby` (플레이어 참여/대기) → `GameInProgress` (`ReadyToStartRound` → `DealingPersonalCards` (개인카드 2장) → `DealingSharedCards1` (공유카드 2장) →  `Betting1` → `DealingSharedCards2` (추가 공유카드 2장) → `Betting2` → `Sniping` → `Showdown` → `Settlement`) → `GameEnded` | XState(Stately) 활용, 클라이언트·서버 공통 정의 (`fsm.md` 참조) |
| 베팅 시스템 | • 최소/최대 베팅 한도 (게임 규칙 따름, `game-rule.md` 참조)<br>• 베팅 플로 확인용 UI 토스트 | 칩 정수형, 오버·언더플로 보호 (`story-board.md` 베팅 UI 참조) |
| 조합 계산 | • 6장(공유 4+개인 2) 중 최상 족보 자동 판단 | 서버-사이드 TypeScript 라이브러리로 결정, 결과만 클라이언트에 전송 (`game-rule.md` 족보 순위 참조) |
| 저격 로직 | • 특정 족보(예: "7 풀하우스")를 지정하여 저격 선언<br>• 저격 시 족보와 해당 족보의 가장 높은 숫자를 함께 선언 (예: 7 풀하우스는 '7'을, 8 스트레이트는 '8'을 선언)<br>• 저격된 족보는 쇼다운 시 최하위로 간주 | 서버에서 유효성 검증 후 상태머신에 반영 (`fsm.md`, `game-rule.md` 참조) |
| 생존/탈락 처리 | • 75칩 이상 → 생존 확정 트리거<br>• 잔여 칩 분배 (생존 확정자가 남은 칩을 다른 플레이어에게 분배, 칩 0개인 플레이어에게 최소 1개 분배 - `game-rule.md` 규칙 11, `story-board.md` UI 참조) | 트랜잭션성 보장(Prisma + PostgreSQL, `db-schema.md` 참조) |

---

## 4. 제안 기능(플러스 알파)

| 기능 | 기대 효과 |
|------|-----------|
| 관전(Observer) 모드 | 탈락자·또는 대기 사용자의 이탈 방지, 스트리밍 소재 제공 (`story-board.md` 참조) |
| 랭킹·통계 대시보드 | 개발자층 사용자에게 데이터 리텐션 포인트 ▲ |
| 배지/칭호 시스템 | 저격 횟수·연승 등 메타 목표 부여, 재방문 유도 |
| AI 튜토리얼 봇 | 룰 학습 진입 장벽↓ (LLM + rule-based) (`Users.is_ai_bot` 필드 `db-schema.md`에 반영) |
| 모바일 PWA | 설치 없이 홈 화면 실행, 푸시 알림으로 복귀율↑ |

---

## 5. 사용자 페르소나와 활용 시나리오

### ① '경쟁을 즐기는 29세 프론트엔드 개발자'

- **상황**: 점심시간 팀원과 짧은 대전
- **행동**: 사내 Wi-Fi로 방 생성 → URL 공유 → 10분 미니 라운드
- **니즈**: 짧은 러닝타임, 실시간 반응성, 코드처럼 예측 가능한 룰 (상세 사용자 흐름은 `story-board.md` 참조)

### ② '스트리머 지망 24세 백엔드 개발자'

- **상황**: 야간 방송 콘텐츠로 시청자 참여 이벤트
- **행동**: 공개 방 생성 → 관전 모드 온 → 디스코드 음성·캡처 송출
- **니즈**: 웹캠 오버레이 적합 UI, 관전자 지연 최소화, 채팅 연동 (상세 사용자 흐름은 `story-board.md` 참조)

---

## 6. 기술 스택 제안

| 계층 | 선택 스택 | 선택 이유 |
|------|----------|-----------|
| 프론트엔드 | Next.js (App Router) + TypeScript + Tailwind CSS | CSR/SSR 혼합, 빠른 DX, PWA 대응 |
| 상태 관리 | XState(또는 zustand) | 명시적 상태 머신으로 게임 단계 추적, 디버깅 용이 (`fsm.md`에 XState 기반 설계) |
| 실시간 통신 | Supabase Realtime(Channel) | 서버리스 Postgres 트리거, Presence·Broadcast 내장, 관리 오버헤드↓ |
| 데이터베이스 | Supabase PostgreSQL + Prisma ORM | 유형 안전 쿼리, 트랜잭션 지원, 서버리스 스케일 (`db-schema.md`, `erd.md` 참조) |
| 배포/CI | Vercel (Edge Functions) + GitHub Actions | Next.js 최적화, preview URL, PR 기반 테스트 |
| 테스트/품질 | Playwright E2E, Vitest, ESLint, Prettier | 멀티 브라우저·실시간 시나리오 검증 |
| 보안 | Supabase Row Level Security, JWT Auth (Magic Link) | 토큰 기반 소켓 권한 제어 |
| 분석 | Supabase Analytics 또는 PostHog | 칩 경제·저격 성공률 등 KPI 추적 |

---

상세 DB 스키마, ERD, 상태 머신 설계, 사용자 스토리보드는 각각 `docs/db-schema.md`, `docs/erd.md`, `docs/fsm.md`, `docs/story-board.md` 문서를 참조하십시오. 이들 문서를 바탕으로 기능 우선순위와 일정(로드맵)을 확정할 것을 권장합니다.