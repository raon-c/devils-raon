 ## 기능 정의 문서: 저격 홀덤 웹

## 1. 문서 개요

*   **제품 미션**: "데블스 플랜"에 등장한 "저격 홀덤"을 실시간 브라우저 기반 멀티플레이어 웹 게임으로 구현하여, 사용자가 어디서든 독특한 "저격" 메커니즘과 매력적인 게임플레이를 즐길 수 있도록 하는 것입니다.
*   **기능 도메인 / 모듈**:
    *   사용자 계정 관리 (Auth)
    *   게임 방 관리 (Lobby)
    *   핵심 게임 로직 (GamePlay)
    *   실시간 통신 (Realtime)
    *   사용자 인터페이스 및 경험 (UI/UX)
*   **도메인 → 기능 수 요약**:
    *   사용자 계정 관리: 1
    *   게임 방 관리: 7
    *   핵심 게임 로직: 15
    *   실시간 통신: 3 (교차 기능, 다른 기능에도 통합됨)
    *   사용자 인터페이스 및 경험: 3 (상위 수준 UI 액션, 세부 UI는 다른 기능의 일부)

## 2. 기능 정의 시트

---
### 도메인: 사용자 계정 관리 (Auth)
---

### `FN-001`: 사용자 등록/로그인 (개념)
*   **목적 / 가치**: 사용자가 게임을 플레이하고 진행 상황을 추적할 수 있는 영구적인 ID를 갖도록 합니다.
*   **범위 / 모듈**: Auth / 사용자 계정 관리
*   **주요 행위자**: 사용자
*   **트리거**: 사용자가 처음 사이트를 방문하거나 로그인을 시도할 때.
*   **입력**:
    *   `username`: `VARCHAR(255)` (신규 등록 시 또는 표시용)
    *   (암묵적) Supabase Auth 메커니즘 (예: Magic Link, OAuth)
*   **처리 로직**:
    1.  사용자가 닉네임을 제공합니다 (또는 시스템이 제안).
    2.  Supabase Auth가 실제 인증을 처리합니다 (예: Magic Link 이메일 발송).
    3.  인증 성공 시, `Users` 테이블에서 사용자 레코드가 생성/조회됩니다.
    4.  `is_ai_bot`은 기본적으로 `FALSE`로 설정됩니다. (이 필드는 AI 튜토리얼 봇 기능 제거 후에도 다른 용도로 사용될 수 있음을 참고)
*   **출력**:
    *   사용자가 인증됩니다.
    *   세션이 설정됩니다 (JWT).
    *   사용자가 메인 화면으로 리디렉션됩니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   `username`은 `UNIQUE`이고 `NOT NULL`이어야 합니다.
*   **오류 처리 및 예외 케이스**:
    *   이미 사용 중인 사용자 이름입니다.
    *   인증 실패.
*   **데이터 모델 접점**:
    *   `Users`: CREATE (신규 등록 시), READ (로그인 시).
    *   `auth.users` (Supabase 내부): CREATE, READ.
*   **API 엔드포인트 / 메서드**:
    *   (개념적) Supabase Auth 엔드포인트.
*   **권한 / 보안**:
    *   세션 관리를 위한 JWT.
    *   `Users` 테이블에 대한 Supabase Row Level Security.
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**:
    *   `story-board.md`: 1.1. 메인 화면 (초기 접속) - 닉네임 입력 필드.
*   **의존성**: Supabase Auth 서비스.
*   **수락 기준**:
    *   사용자는 고유한 사용자 이름으로 계정을 만들 수 있습니다.
    *   사용자는 기존 계정으로 로그인할 수 있습니다.
    *   `Users` 테이블의 사용자 `id`는 `auth.users.id`와 연결됩니다.
*   **코드 포인터**:
    *   `docs/db-schema.md`: 테이블 `Users`.
    *   `docs/prd.md`: 보안 (JWT Auth, Magic Link).
    *   `docs/story-board.md`: 1.1. 메인 화면 (초기 접속).

---
### 도메인: 게임 방 관리 (Lobby)
---

### `FN-003`: 게임 방 생성
*   **목적 / 가치**: 사용자가 새로운 저격 홀덤 게임을 호스트할 수 있도록 합니다.
*   **범위 / 모듈**: Lobby / 게임 방 관리
*   **주요 행위자**: 사용자 (호스트)
*   **트리거**: 사용자가 메인 화면에서 [방 만들기] 버튼을 클릭합니다.
*   **입력**: (암묵적) 사용자의 인증된 ID.
*   **처리 로직**:
    1.  클라이언트가 새 게임 방 생성을 요청합니다.
    2.  서버가 고유한 `room_code`를 생성합니다.
    3.  서버가 `GameRooms` 테이블에 새 레코드를 생성합니다.
        *   `host_id`는 요청한 사용자의 ID로 설정됩니다.
        *   `status` (`room_status_id`를 통해)는 'WAITING'으로 기본 설정됩니다.
        *   `max_players`는 기본 6명으로 설정됩니다 (2-6명 설정 가능).
        *   `is_public`은 기본 `TRUE`로 설정됩니다.
    4.  서버가 `room_code`와 `room_id`를 클라이언트에 반환합니다.
    5.  호스트가 자동으로 방에 참여합니다 (호스트에 대한 `FN-005` 로직 트리거).
*   **출력**:
    *   데이터베이스에 새 게임 방이 생성됩니다.
    *   클라이언트가 새 방의 게임 로비 UI로 이동합니다.
    *   호스트에 대한 `PLAYER_JOIN` 이벤트가 발생합니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   `room_code`는 `UNIQUE`여야 합니다.
    *   `host_id`는 유효한 `Users.id`여야 합니다.
    *   사용자는 한 번에 하나의 방만 호스트할 수 있습니다 (`GameRooms.host_id`는 `UNIQUE` 제약 조건 필요 - `erd.md` 참고).
*   **오류 처리 및 예외 케이스**:
    *   고유한 방 코드 생성 실패 (가능성 매우 낮음).
    *   방 생성 중 데이터베이스 오류.
*   **데이터 모델 접점**:
    *   `GameRooms`: CREATE.
    *   `RoomStatuses`: READ (`status` 연결용).
    *   `Users`: READ (`host_id` 유효성 검사용).
*   **API 엔드포인트 / 메서드**: (개념적) `POST /api/rooms`
*   **권한 / 보안**: 인증된 사용자만 가능.
*   **성능 / SLA 참고**: 방 생성은 거의 즉시 이루어져야 합니다.
*   **UX 참조**: `story-board.md`: 1.2. 방 만들기.
*   **의존성**: 사용자 인증 (`FN-001`).
*   **수락 기준**:
    *   사용자가 성공적으로 새 게임 방을 만들 수 있습니다.
    *   방을 만든 사용자가 호스트로 설정됩니다.
    *   고유한 방 코드가 생성되어 표시됩니다.
    *   호스트가 자동으로 로비의 참가자로 추가됩니다.
*   **코드 포인터**:
    *   `docs/db-schema.md`: 테이블 `GameRooms`.
    *   `docs/erd.md`: 엔티티 `GameRooms`, 관계 `Users |o--|| GameRooms`.
    *   `docs/story-board.md`: 1.2. 방 만들기.
    *   `docs/fsm.md`: 로비 상태, `assignRoomInfo` (FSM 인스턴스에 대한 개념).

---

### `FN-004`: 게임 방 참가
*   **목적 / 가치**: 사용자가 방 코드를 사용하여 기존 게임 방에 참가할 수 있도록 합니다.
*   **범위 / 모듈**: Lobby / 게임 방 관리
*   **주요 행위자**: 사용자 (플레이어)
*   **트리거**: 사용자가 방 코드를 입력하고 [방 참가하기] 버튼을 클릭합니다.
*   **입력**:
    *   `room_code`: `VARCHAR(8)`
    *   (암묵적) 사용자의 인증된 ID.
*   **처리 로직**:
    1.  클라이언트가 `room_code`를 서버로 전송합니다.
    2.  서버가 `GameRooms` 테이블에서 `room_code`의 유효성을 검사합니다.
    3.  서버가 방이 가득 차지 않았는지 확인합니다 (`GameParticipants` 수 < `GameRooms.max_players`).
    4.  서버가 방 상태가 참가를 허용하는지 확인합니다 (예: `WAITING`).
    5.  서버가 사용자가 이미 이 방에 참여 중인지 확인합니다 (`GameParticipants.user_id`가 `room_id`에 대해 고유한지).
    6.  모든 검사를 통과하면 사용자가 방에 참여합니다 (`FN-005` 로직 트리거).
*   **출력**:
    *   사용자가 성공적으로 방에 참가하고 게임 로비 UI로 이동합니다.
    *   방이 유효하지 않거나, 가득 찼거나, 사용자가 참가할 수 없는 경우 오류 메시지가 표시됩니다.
    *   참가하는 플레이어에 대한 `PLAYER_JOIN` 이벤트가 발생합니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   방은 존재해야 하며 참가 가능한 상태여야 합니다.
    *   방은 가득 차지 않아야 합니다.
    *   사용자는 한 번에 하나의 방에만 참여할 수 있습니다 (`GameParticipants.user_id`는 `UNIQUE` 제약 조건 필요 - `erd.md` 참고).
*   **오류 처리 및 예외 케이스**:
    *   "존재하지 않는 방입니다." (잘못된 방 코드).
    *   "방이 가득 찼습니다." (방 인원 초과).
    *   "이미 참여 중인 방입니다."
    *   "게임이 이미 시작되어 참여할 수 없습니다."
*   **데이터 모델 접점**:
    *   `GameRooms`: READ.
    *   `GameParticipants`: READ (인원 및 기존 사용자 확인용).
*   **API 엔드포인트 / 메서드**: (개념적) `POST /api/rooms/{room_code}/join`
*   **권한 / 보안**: 인증된 사용자만 가능.
*   **성능 / SLA 참고**: 방 참가 유효성 검사는 빨라야 합니다.
*   **UX 참조**: `story-board.md`: 1.3. 방 참가하기.
*   **의존성**: 사용자 인증 (`FN-001`).
*   **수락 기준**:
    *   사용자가 올바른 방 코드를 사용하여 유효하고 가득 차지 않은 방에 참가할 수 있습니다.
    *   잘못되거나 가득 찬 방에는 적절한 메시지와 함께 참가가 방지됩니다.
    *   사용자가 로비의 참가자로 추가됩니다.
*   **코드 포인터**:
    *   `docs/db-schema.md`: 테이블 `GameRooms`, `GameParticipants`.
    *   `docs/erd.md`: 엔티티 `GameRooms`, `GameParticipants`.
    *   `docs/story-board.md`: 1.3. 방 참가하기.
    *   `docs/fsm.md`: 로비 상태, `PLAYER_JOIN` 이벤트, `canPlayerJoin` 가드.

---

### `FN-005`: 플레이어 로비 입장 (플레이어 참가 처리)
*   **목적 / 가치**: 호스트든 참가자든 플레이어가 로비에 나타나는 과정을 관리합니다.
*   **범위 / 모듈**: Lobby / 게임 방 관리
*   **주요 행위자**: 사용자 (호스트, 플레이어), 시스템
*   **트리거**: 성공적인 방 생성 (`FN-003`) 또는 성공적인 방 참가 (`FN-004`). FSM 이벤트: `PLAYER_JOIN`.
*   **입력**:
    *   `roomId`: `UUID`
    *   `userId`: `UUID`
    *   `username`: `VARCHAR`
*   **처리 로직**: (FSM `PLAYER_JOIN` 이벤트 액션에 해당)
    1.  FSM `canPlayerJoin` 가드:
        *   방이 가득 차지 않았는지 확인 (`players.length < maxPlayers`).
        *   사용자가 이미 방에 참여 중인지 확인.
    2.  가드 통과 시:
        *   `GameParticipants` 레코드 생성:
            *   `room_id`, `user_id` 설정.
            *   `chips`는 기본 60으로 설정.
            *   `status` (`player_status_id`를 통해)는 'ACTIVE' (또는 로비 특정 상태)로 기본 설정.
            *   `turn_order`는 초기에 null.
        *   FSM `context.players`에 플레이어 추가.
        *   방의 모든 클라이언트에 방 업데이트 브로드캐스트 (`FN-010`).
*   **출력**:
    *   플레이어가 해당 방의 `GameParticipants` 테이블에 추가됩니다.
    *   모든 연결된 클라이언트의 로비 UI 참가자 목록에 플레이어가 나타납니다.
    *   FSM 컨텍스트가 업데이트됩니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   `GameParticipants`에 `UNIQUE (room_id, user_id)` 제약 조건.
*   **오류 처리 및 예외 케이스**: (`canPlayerJoin` 가드 및 업스트림 기능에서 처리됨).
*   **데이터 모델 접점**:
    *   `GameParticipants`: CREATE.
    *   `PlayerStatuses`: READ.
    *   `Users`: READ.
*   **API 엔드포인트 / 메서드**: 해당 없음 (다른 기능에 의해 트리거되는 내부 FSM 로직, 실시간 이벤트).
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: `story-board.md`: 1.4. 게임 대기방 (로비 UI) - 플레이어 목록.
*   **의존성**: `FN-003`, `FN-004`, `FN-010`.
*   **수락 기준**:
    *   새 참가자가 `GameParticipants`에 정확하게 기록됩니다.
    *   새 참가자가 FSM 컨텍스트에 추가됩니다.
    *   방의 모든 플레이어의 로비 UI가 새 참가자를 표시하도록 업데이트됩니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: 로비 상태, `PLAYER_JOIN` 이벤트, `canPlayerJoin` 가드, `addPlayerToContext` 액션.
    *   `docs/db-schema.md`: 테이블 `GameParticipants`.

---

### `FN-006`: 플레이어 로비/게임 퇴장
*   **목적 / 가치**: 플레이어가 게임 방을 나가거나 연결이 끊겼을 때 해당 플레이어의 퇴장을 처리합니다.
*   **범위 / 모듈**: Lobby / 게임 방 관리
*   **주요 행위자**: 사용자 (호스트, 플레이어), 시스템
*   **트리거**:
    *   사용자가 로비 또는 게임 중 [나가기] 버튼 클릭.
    *   플레이어 연결 끊김 (`PLAYER_DISCONNECT_IN_GAME` FSM 이벤트).
    *   FSM 이벤트: `PLAYER_LEAVE`.
*   **처리 로직**: (FSM `PLAYER_LEAVE` 및 `PLAYER_DISCONNECT_IN_GAME` 이벤트 액션에 해당)
    1.  FSM `context.players`에서 플레이어 제거.
    2.  `GameParticipants` 레코드 업데이트:
        *   `status` (`player_status_id`를 통해)를 'LEFT'로 설정하거나 게임 단계에 따라 처리 (예: 게임 중이면 `ELIMINATED`).
        *   또는, 로비에서 나가는 경우 `GameParticipants` 레코드 DELETE.
    3.  나가는 플레이어가 호스트였던 경우:
        *   `assignNewHostIfNeeded`: 다른 플레이어를 호스트로 승격 (예: 가장 먼저 참여한 플레이어).
        *   다른 플레이어가 없으면 방 닫기/삭제 고려.
    4.  남아있는 클라이언트에 방 업데이트 브로드캐스트 (`FN-010`).
    5.  게임 중 연결 끊김인 경우, `checkForGameEndCondition` 실행 가능성.
*   **출력**:
    *   플레이어가 FSM 컨텍스트 및 UI 참가자 목록에서 제거됩니다.
    *   `GameParticipants`에서 플레이어 상태가 업데이트되거나 레코드가 제거됩니다.
    *   필요한 경우 새 호스트가 지정됩니다.
    *   방이 닫힐 수 있습니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   호스트가 나가면 다른 플레이어가 남아있는 경우 새 호스트가 지정되어야 합니다.
    *   마지막 플레이어가 나가면 방은 닫히거나 보관되어야 합니다.
*   **오류 처리 및 예외 케이스**:
    *   존재하지 않는 방에서 나가려고 시도 (UI가 정확하다면 발생 가능성 낮음).
*   **데이터 모델 접점**:
    *   `GameParticipants`: UPDATE 또는 DELETE.
    *   `GameRooms`: UPDATE (새 `host_id`, 또는 `status`를 'EMPTY'/'CLOSED'로), 또는 DELETE.
*   **API 엔드포인트 / 메서드**: (개념적) `POST /api/rooms/{room_id}/leave` 또는 실시간 이벤트.
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: `story-board.md`: 1.4. 게임 대기방 (로비 UI) - [나가기] 버튼.
*   **의존성**: `FN-010`.
*   **수락 기준**:
    *   플레이어가 성공적으로 로비/게임에서 제거됩니다.
    *   방의 다른 플레이어들이 업데이트된 참가자 목록을 봅니다.
    *   호스트가 나가면 새 호스트가 정확하게 지정됩니다.
    *   마지막 플레이어가 나가면 방이 적절하게 처리됩니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: 로비 상태, `PLAYER_LEAVE` 이벤트, `removePlayerFromContext`, `assignNewHostIfNeeded` 액션. GameInProgress `PLAYER_DISCONNECT_IN_GAME` 이벤트.
    *   `docs/db-schema.md`: 테이블 `GameParticipants`, `GameRooms`.

---

### `FN-007`: 게임 시작
*   **목적 / 가치**: 로비에 있는 모든 참여 플레이어들을 위해 저격 홀덤 게임을 시작합니다.
*   **범위 / 모듈**: Lobby / 게임 방 관리
*   **주요 행위자**: 사용자 (호스트)
*   **트리거**: 호스트가 게임 로비에서 [게임 시작] 버튼을 클릭합니다. FSM 이벤트: `START_GAME`.
*   **입력**: (FSM 컨텍스트에서) `players` 목록, `roomId`.
*   **처리 로직**: (FSM `START_GAME` 이벤트 액션에 해당)
    1.  FSM `canStartGame` 가드: 최소 플레이어 수가 충족되었는지 확인 (예: >= 2).
    2.  가드 통과 시:
        *   `initializeGameContext` 액션:
            *   `currentRoundNumber = 0` 설정 (또는 첫 라운드가 즉시 시작되면 1).
            *   덱 셔플 (`context.deck`).
            *   플레이어 턴 순서 결정 (컨텍스트의 각 플레이어에 대한 `turnOrder`).
            *   각 플레이어에게 초기 칩 (`initialChips` = 60) 할당 (컨텍스트).
            *   플레이어 칩 기반으로 `maxBet` 설정.
        *   `persistInitialGameSetup` 액션:
            *   `GameRooms.status` (`room_status_id`를 통해)를 'PLAYING'으로 업데이트.
            *   각 참가자의 `GameParticipants.turn_order` 업데이트.
            *   `GameParticipants.chips` 업데이트 (컨텍스트에 이미 설정됨, DB 일관성 보장).
        *   방의 모든 클라이언트에 `GAME_START` 이벤트 브로드캐스트 (`FN-010`).
        *   FSM을 `GameInProgress`로 전환 (초기 상태: `ReadyToStartRound`).
*   **출력**:
    *   게임 상태가 로비에서 GameInProgress로 전환됩니다.
    *   방의 모든 플레이어가 게임 인터페이스로 이동합니다.
    *   초기 게임 설정 (덱, 턴 순서, 칩)이 FSM 컨텍스트 및 DB에 저장됩니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   시작하려면 최소 2명의 플레이어가 필요합니다 (`fsm.md` 가드에 따름, `prd.md`는 2-6명 지정).
    *   호스트만 게임을 시작할 수 있습니다.
*   **오류 처리 및 예외 케이스**:
    *   플레이어 수가 부족한 상태에서 시작 시도 (UI에서 방지해야 하며, FSM 가드가 포착).
*   **데이터 모델 접점**:
    *   `GameRooms`: UPDATE (`status`, 나중에 `current_round_id`).
    *   `GameParticipants`: UPDATE (`turn_order`, `chips`).
*   **API 엔드포인트 / 메서드**: 해당 없음 (FSM 내부 로직, 실시간 이벤트).
*   **권한 / 보안**: 호스트 전용 액션.
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: `story-board.md`: 1.4. 게임 대기방 (로비 UI) - [게임 시작] 버튼.
*   **의존성**: `FN-005`, `FN-010`, `FN-012` (`ReadyToStartRound`가 다음 논리적 단계).
*   **수락 기준**:
    *   호스트가 충분한 플레이어와 함께 시작하면 게임이 성공적으로 시작됩니다.
    *   게임 방 상태가 'PLAYING'으로 업데이트됩니다.
    *   플레이어의 초기 칩과 턴 순서가 설정됩니다.
    *   모든 플레이어가 게임 보기로 전환됩니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: 로비 상태, `START_GAME` 이벤트, `canStartGame` 가드, `initializeGameContext`, `persistInitialGameSetup`, `broadcastGameStart` 액션.
    *   `docs/db-schema.md`: 테이블 `GameRooms`, `GameParticipants`.

---

### `FN-008`: 로비에 방 정보 표시
*   **목적 / 가치**: 로비에 있는 사용자에게 방 및 참가자에 대한 주요 정보를 보여줍니다.
*   **범위 / 모듈**: Lobby / 게임 방 관리
*   **주요 행위자**: 사용자 (호스트, 플레이어)
*   **트리거**: 사용자가 로비에 입장 (`FN-005`). 플레이어 참가/퇴장 (`FN-005`, `FN-006`).
*   **입력**: (FSM 컨텍스트 또는 실시간 브로드캐스트에서) `roomCode`, `players` 목록 (`username`, 호스트 상태 포함).
*   **처리 로직**:
    1.  클라이언트 UI가 방 및 플레이어 데이터를 수신합니다.
    2.  UI 렌더링:
        *   방 코드.
        *   현재 플레이어 목록 (호스트 표시).
        *   [게임 시작] 버튼 (호스트에게만 표시).
        *   [나가기] 버튼.
*   **출력**: 현재 방 상태를 표시하는 업데이트된 로비 UI.
*   **비즈니스 규칙 및 제약 조건**: 해당 없음
*   **오류 처리 및 예외 케이스**: 해당 없음
*   **데이터 모델 접점**: 해당 없음 (표시 전용).
*   **API 엔드포인트 / 메서드**: 해당 없음 (FSM 컨텍스트 / 실시간 업데이트 기반 UI 렌더링).
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 데이터 변경 시 UI 업데이트는 즉시 이루어져야 합니다.
*   **UX 참조**: `story-board.md`: 1.4. 게임 대기방 (로비 UI).
*   **의존성**: 실시간 업데이트 (`FN-010`).
*   **수락 기준**:
    *   방 코드가 정확하게 표시됩니다.
    *   참가자 목록이 정확하고 실시간으로 업데이트됩니다.
    *   호스트가 명확하게 식별됩니다.
    *   호스트 특정 컨트롤은 호스트에게만 표시됩니다.
*   **코드 포인터**:
    *   `docs/story-board.md`: 1.4. 게임 대기방 (로비 UI).
    *   `docs/fsm.md`: 로비 상태 `context` (데이터용), `broadcastRoomUpdate` 액션.

---

### `FN-009`: 게임 강제 종료 (개념)
*   **목적 / 가치**: 관리자 (또는 특정 조건 하의 호스트)가 진행 중인 게임을 조기에 종료할 수 있도록 합니다.
*   **범위 / 모듈**: 게임 방 관리
*   **주요 행위자**: 시스템 관리자, 사용자 (호스트 - 잠재적)
*   **트리거**: 관리자 액션 또는 특정 호스트 액션 (구현된 경우). FSM 이벤트: `FORCE_END_GAME`.
*   **입력**: `roomId`: `UUID`.
*   **처리 로직**: (FSM `FORCE_END_GAME` 이벤트에 해당)
    1.  FSM을 `GameEnded` 상태로 전환합니다.
    2.  `setGameAsFinished` 액션 실행:
        *   `GameRooms.status` (`room_status_id`를 통해)를 'FINISHED' 또는 'ABORTED'로 업데이트.
        *   강제 종료 이유를 기록할 수 있습니다 (선택 사항).
        *   해당되는 경우 칩 분배 처리 (예: 베팅 반환 또는 특정 규칙). FSM에 자세히 설명되어 있지 않음.
    3.  모든 플레이어에게 게임 종료를 브로드캐스트합니다.
*   **출력**:
    *   게임이 종료됩니다.
    *   플레이어에게 알림이 가고 게임 오버 화면이나 로비로 이동될 수 있습니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   일반적으로 관리자 역할로 제한되지만, 특정 게임 규칙이 호스트의 조기 종료를 허용할 수 있습니다.
*   **오류 처리 및 예외 케이스**: 존재하지 않거나 이미 종료된 게임을 강제 종료하려고 시도.
*   **데이터 모델 접점**: `GameRooms`: UPDATE (`status`). `GameRounds`: UPDATE (해당되는 경우).
*   **API 엔드포인트 / 메서드**: (개념적) `POST /api/admin/rooms/{room_id}/force-end`
*   **권한 / 보안**: 관리자 역할 또는 특정 호스트 권한.
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: 해당 없음 (호스트용이 아니라면 일반적으로 플레이어 UI 기능 아님).
*   **의존성**: `FN-023` (게임 종료 상태 처리).
*   **수락 기준**:
    *   권한 있는 엔티티가 게임을 강제로 종료할 수 있습니다.
    *   데이터베이스에서 게임 상태가 올바르게 업데이트됩니다.
    *   플레이어에게 적절하게 알림이 갑니다.
*   **코드 포인터**: `docs/fsm.md`: GameInProgress 상태, `FORCE_END_GAME` 이벤트, `setGameAsFinished` 액션.

---
### 도메인: 실시간 통신 (Realtime)
---

### `FN-010`: 방/게임 업데이트 브로드캐스트 (Supabase Realtime)
*   **목적 / 가치**: 방에 있는 모든 플레이어가 로비 또는 게임의 최신 상태와 동기화되도록 유지합니다.
*   **범위 / 모듈**: Realtime / 교차 기능
*   **주요 행위자**: 시스템 (FSM 액션)
*   **트리거**: `PLAYER_JOIN`, `PLAYER_LEAVE`, `START_GAME`, `PLACE_BET`, 카드 분배 등 다양한 FSM 액션.
*   **입력**: 이벤트 유형, 페이로드 (예: 업데이트된 플레이어 목록, 새로 분배된 카드, 베팅 금액).
*   **처리 로직**:
    1.  FSM 액션 (예: `broadcastRoomUpdate`, `broadcastGameStart`, `broadcastPlayerBet`)이 트리거됩니다.
    2.  시스템이 Supabase Realtime (Channels)을 사용하여 특정 `roomId`에 연결된 모든 클라이언트에 메시지를 보냅니다.
    3.  메시지에는 이벤트 유형과 관련 데이터 페이로드가 포함됩니다.
    4.  클라이언트 측 실시간 리스너가 메시지를 수신합니다.
    5.  수신된 이벤트 및 페이로드에 따라 클라이언트 UI가 업데이트됩니다.
*   **출력**: 방의 클라이언트에 실시간 메시지가 브로드캐스트됩니다. 클라이언트 UI가 업데이트됩니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   ≤ 150ms 지연 시간 목표 (`prd.md`).
    *   민감한 정보 (예: 다른 플레이어의 개인 카드)는 모든 플레이어에게 공개될 의도가 아니라면 직접 브로드캐스트해서는 안 됩니다.
*   **오류 처리 및 예외 케이스**:
    *   클라이언트 연결 끊김/재연결 처리 (Supabase Presence 도움).
    *   네트워크 지연.
*   **데이터 모델 접점**: 해당 없음 (통신 계층, 데이터는 FSM 컨텍스트/DB에서 가져옴).
*   **API 엔드포인트 / 메서드**: Supabase Realtime Channel 통신.
*   **권한 / 보안**: 채널 구독은 JWT 인증 및 `roomId`와 연결될 가능성이 높습니다.
*   **성능 / SLA 참고**: 게임 응답성에 중요합니다. 메시지 크기를 최적화해야 합니다.
*   **UX 참조**: `story-board.md`에 설명된 모든 실시간 UI 업데이트.
*   **의존성**: Supabase Realtime 인프라. 상태 변경 브로드캐스팅이 필요한 모든 기능.
*   **수락 기준**:
    *   플레이어 액션 및 게임 이벤트가 모든 연결된 플레이어에게 실시간으로 반영됩니다.
    *   로비 업데이트 (참가/퇴장)가 즉시 표시됩니다.
    *   게임 진행 (카드 분배, 베팅, 쇼다운)이 동기화됩니다.
*   **코드 포인터**:
    *   `docs/prd.md`: 실시간 동기화, Supabase Realtime 채널.
    *   `docs/fsm.md`: 다양한 `broadcast...` 액션.

---

### `FN-011`: 플레이어 접속 상태 추적 (Supabase Realtime Presence)
*   **목적 / 가치**: 어떤 사용자가 현재 온라인 상태이고 특정 게임 방 또는 애플리케이션에 연결되어 있는지 파악합니다.
*   **범위 / 모듈**: Realtime / 교차 기능
*   **주요 행위자**: 시스템
*   **트리거**: 사용자가 방의 Supabase Realtime 채널에 연결/연결 해제할 때.
*   **입력**: 사용자의 세션/연결 상태.
*   **처리 로직**:
    1.  클라이언트가 방 특정 채널에 실시간 연결을 설정합니다.
    2.  Supabase Presence가 해당 채널에 연결된 클라이언트를 추적합니다.
    3.  시스템 (또는 다른 클라이언트)이 해당 채널의 Presence 이벤트 (join/leave)를 구독할 수 있습니다.
    4.  이는 `PLAYER_DISCONNECT_IN_GAME`과 같은 FSM 이벤트를 트리거하거나 UI 표시기를 업데이트할 수 있습니다.
*   **출력**:
    *   채널/방에 있는 활성 사용자 목록 (실시간).
    *   사용자가 채널에 참가하거나 나갈 때 발생하는 이벤트.
*   **비즈니스 규칙 및 제약 조건**: 해당 없음
*   **오류 처리 및 예외 케이스**: 갑작스러운 연결 끊김, 네트워크 문제.
*   **데이터 모델 접점**: 해당 없음 (실시간 상태).
*   **API 엔드포인트 / 메서드**: Supabase Realtime Presence API.
*   **권한 / 보안**: 채널 접근은 JWT로 제어될 가능성이 높습니다.
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: 로비 플레이어 목록 (`story-board.md`: 1.4). 플레이어 연결 상태에 대한 게임 내 표시기.
*   **의존성**: Supabase Realtime 인프라.
*   **수락 기준**:
    *   시스템이 게임 방에 연결된 플레이어를 정확하게 추적할 수 있습니다.
    *   플레이어 연결 끊김이 감지되고 적절한 게임 로직을 트리거할 수 있습니다.
*   **코드 포인터**:
    *   `docs/prd.md`: 실시간 동기화 - 플레이어 입장/퇴장 Presence.
    *   `docs/fsm.md`: `PLAYER_DISCONNECT_IN_GAME` 이벤트.

---
### 도메인: 핵심 게임 로직 (GamePlay)
---

### `FN-012`: 새 라운드 초기화 (ReadyToStartRound)
*   **목적 / 가치**: 새 저격 홀덤 라운드 시작을 위한 게임 상태를 설정합니다.
*   **범위 / 모듈**: GamePlay / 핵심 게임 로직
*   **주요 행위자**: 시스템 (FSM)
*   **트리거**: 게임 시작 (`FN-007`), 또는 게임이 끝나지 않은 경우 이전 라운드의 `Settlement` 단계 완료. FSM 상태: `ReadyToStartRound`.
*   **입력**: (FSM 컨텍스트에서) `currentRoundNumber`, `players` 목록, `initialChips`.
*   **처리 로직**: (FSM `ReadyToStartRound` 진입 액션에 해당)
    1.  `incrementRoundNumber`: `context.currentRoundNumber` 증가.
    2.  `resetRoundContext`:
        *   덱 셔플 (`context.deck`).
        *   플레이어의 `context.sharedCards`, `context.personalCards` 초기화.
        *   `context.potChips = 0`으로 재설정.
        *   플레이어 라운드별 상태 재설정 (예: `isSniped`, `finalHand`, `hasDeclaredSnipe`).
    3.  `determinePlayerTurnOrderForRound`: (동적인 경우) 새 라운드의 턴 순서 결정. (게임 규칙: 랜덤 시작 후 시계 방향. FSM: "랜덤 또는 이전 라운드 기반").
    4.  `collectAnte`:
        *   각 'ACTIVE' 플레이어가 팟에 칩 1개씩 기여.
        *   `player.chips`와 `context.potChips` 업데이트.
    5.  `persistNewRoundStart`:
        *   DB에 새 `GameRounds` 레코드 생성:
            *   `room_id`, `round_number`.
            *   `phase` (`game_phase_id`를 통해) 'READY' 또는 초기 단계로 설정.
            *   `pot_chips`는 `context.potChips`에서 설정.
        *   `GameRooms.current_round_id`를 새 `GameRounds.id`로 업데이트.
    6.  `broadcastRoundStart`: 클라이언트에 새 라운드 시작 알림 (`FN-010`).
    7.  다음 상태로 전환 (예: `DealingPersonalCards`).
*   **출력**:
    *   FSM 컨텍스트 및 DB에 새 라운드가 초기화됩니다.
    *   앤티가 수집됩니다. 덱이 셔플됩니다.
    *   클라이언트에 라운드 시작이 통지됩니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   앤티는 활성 플레이어당 칩 1개 (`game-rule.md`: 4).
    *   `GameRounds`에 `UNIQUE (room_id, round_number)`.
*   **오류 처리 및 예외 케이스**: 앤티에 대한 칩 부족 (플레이어가 이전에 탈락했을 수 있음).
*   **데이터 모델 접점**:
    *   `GameRounds`: CREATE.
    *   `GameRooms`: UPDATE (`current_round_id`).
    *   `GameParticipants`: UPDATE (`chips`).
    *   `GamePhases`: READ.
*   **API 엔드포인트 / 메서드**: 해당 없음 (FSM 내부 로직).
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: `story-board.md`: 2.1. 라운드 시작 및 카드 분배 - "라운드 N 시작" 알림.
*   **의존성**: `FN-010`.
*   **수락 기준**:
    *   라운드 번호가 증가합니다.
    *   덱이 셔플되어 준비됩니다.
    *   모든 활성 플레이어로부터 앤티가 수집되고 팟이 업데이트됩니다.
    *   새 `GameRounds` 레코드가 생성됩니다.
    *   플레이어들이 카드 분배 준비가 됩니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: `ReadyToStartRound` 상태 및 해당 진입 액션.
    *   `docs/db-schema.md`: 테이블 `GameRounds`.
    *   `docs/game-rule.md`: 규칙 4 (앤티).

---

### `FN-013`: 개인 카드 분배
*   **목적 / 가치**: 라운드 시작 시 각 활성 플레이어에게 비공개 카드 2장을 분배합니다.
*   **범위 / 모듈**: GamePlay / 핵심 게임 로직
*   **주요 행위자**: 시스템 (FSM)
*   **트리거**: `ReadyToStartRound`에서 전환 (또는 FSM 버전에 따른 중간 카드 분배 상태). FSM 상태: `DealingPersonalCards` (또는 `fsm.md` v5에서 개인 카드를 처리하는 경우 `DealingSharedCards1`).
*   **입력**: (FSM 컨텍스트에서) `deck`, `activePlayers` 목록.
*   **처리 로직**: (FSM `DealingPersonalCards` 진입 액션 (`fsm.md` v5), 주석에 따르면 이전에는 `DealingSharedCards1`이었음)
    1.  `dealPersonalCardsToPlayers`: 각 'ACTIVE' 플레이어에 대해:
        *   `context.deck`에서 카드 2장 뽑기.
        *   FSM 컨텍스트에서 `player.personalCards`에 이 카드들을 할당.
    2.  `persistPlayerHands`:
        *   각 플레이어에 대해 DB에 `PlayerHands` 레코드 생성/업데이트:
            *   `round_id`, `participant_id`.
            *   `personal_card_1`, `personal_card_2`에 뽑은 카드 값 저장.
    3.  `broadcastPersonalCardsDealt`: 각 플레이어에게 자신의 카드 정보 알림. 다른 플레이어는 카드 뒷면을 봄 (`FN-010`).
    4.  다음 상태로 전환 (예: 커뮤니티 카드를 위한 `DealingSharedCards1`).
*   **출력**:
    *   각 활성 플레이어가 개인 카드 2장을 받습니다 (FSM 컨텍스트 및 DB).
    *   플레이어 UI가 업데이트되어 자신의 개인 카드를 표시합니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   카드는 셔플된 덱에서 분배됩니다.
    *   개인 카드는 각 플레이어에게 비공개입니다.
    *   `personal_card_1`과 `personal_card_2`는 표준 덱에서 비복원 추출 시 달라야 합니다 (암묵적). 카드 값 1-10.
    *   `PlayerHands`에 `UNIQUE (round_id, participant_id)`.
*   **오류 처리 및 예외 케이스**: 덱에 카드 부족 (40장 카드와 최대 6명 플레이어로는 발생하지 않아야 함).
*   **데이터 모델 접점**:
    *   `PlayerHands`: CREATE 또는 UPDATE.
    *   `GameRounds`: READ (`round_id`용).
    *   `GameParticipants`: READ (`participant_id`용).
*   **API 엔드포인트 / 메서드**: 해당 없음 (FSM 내부 로직).
*   **권한 / 보안**: 개인 카드 데이터는 해당 플레이어에게만 전송됩니다.
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: `story-board.md`: 2.1. 라운드 시작 및 카드 분배 - 자신의 개인 카드 2장 표시.
*   **의존성**: `FN-012` (라운드 초기화), `FN-010`.
*   **수락 기준**:
    *   각 활성 플레이어에게 덱에서 고유한 카드 2장이 분배됩니다.
    *   개인 카드가 `PlayerHands` 테이블에 기록됩니다.
    *   각 플레이어는 자신의 개인 카드를 볼 수 있고, 다른 플레이어는 카드 뒷면을 봅니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: `DealingPersonalCards` 상태 (`fsm.md` v5 규칙 기반 수정 참고: "이 상태가 이제 첫 번째 공유 카드 공개를 담당"은 *이전* 이름에 대한 주석이며, 이제 `dealPersonalCardsToPlayers`가 여기서 발생함을 의미). 이 상태는 이전에 `DealingSharedCards1`으로 명명되었고 개인 카드를 처리했습니다.
    *   `docs/db-schema.md`: 테이블 `PlayerHands`.
    *   `docs/game-rule.md`: 규칙 4 (개인 카드).

---

### `FN-014`: 첫 번째 공유/커뮤니티 카드 공개
*   **목적 / 가치**: 모든 플레이어가 사용할 수 있는 첫 번째 커뮤니티 카드 세트를 공개합니다.
*   **범위 / 모듈**: GamePlay / 핵심 게임 로직
*   **주요 행위자**: 시스템 (FSM)
*   **트리거**: 개인 카드 분배 완료. FSM 상태: `DealingSharedCards1` (`fsm.md` v5, `namu-wiki.md` 일관성을 위한 재정렬 수정 이전에는 `DealingPersonalCards`였음).
*   **입력**: (FSM 컨텍스트에서) `deck`, `currentRoundId`.
*   **처리 로직**: (FSM `DealingSharedCards1` 진입 액션 (`fsm.md` v5 - 이 상태는 이제 *첫 번째 공유 카드*용))
    1.  `dealFirstSharedCards`: `context.deck`에서 카드 2장 뽑기.
    2.  이 카드들을 `context.sharedCards`에 추가.
    3.  `persistSharedCardsUpdate`:
        *   각 공유 카드에 대해 DB에 `SharedCards` 레코드 생성:
            *   `round_id`, `card_value`, `deal_order` (이 단계에서는 1과 2).
    4.  `broadcastSharedCardsUpdate`: 공개된 공유 카드를 모든 클라이언트에 알림 (`FN-010`).
    5.  `Betting1` 상태로 전환.
*   **출력**:
    *   공유 카드 2장이 공개되어 FSM 컨텍스트 및 DB에 저장됩니다.
    *   모든 플레이어의 UI가 이 공유 카드를 표시하도록 업데이트됩니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   이 단계에서 공유 카드 2장이 공개됩니다 (`game-rule.md`: 5).
    *   카드 값 1-10.
*   **오류 처리 및 예외 케이스**: 덱에 카드 부족.
*   **데이터 모델 접점**:
    *   `SharedCards`: CREATE.
    *   `GameRounds`: READ (`round_id`용).
*   **API 엔드포인트 / 메서드**: 해당 없음 (FSM 내부 로직).
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: `story-board.md`: 2.1. 라운드 시작 및 카드 분배 - 공유 카드 영역.
*   **의존성**: `FN-013` (개인 카드 분배), `FN-010`.
*   **수락 기준**:
    *   덱에서 공유 카드 2장이 뽑혀 모든 플레이어에게 공개됩니다.
    *   공유 카드가 `SharedCards` 테이블에 기록됩니다.
    *   모든 플레이어의 UI가 새 공유 카드로 업데이트됩니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: `DealingSharedCards1` 상태 (`fsm.md` v5에 따라 이 상태는 이제 첫 2장의 공유 카드 공개를 처리).
    *   `docs/db-schema.md`: `GameRounds.shared_card_1`을 참조했으며, `erd.md`에 따라 이제 `SharedCards` 테이블임.
    *   `docs/erd.md`: 테이블 `SharedCards`.
    *   `docs/game-rule.md`: 규칙 5.

---

### `FN-015`: 베팅 라운드 진행 (Betting1 & Betting2)
*   **목적 / 가치**: 플레이어가 자신의 패와 게임 상황에 따라 칩을 베팅하여 팟을 늘릴 수 있도록 합니다.
*   **범위 / 모듈**: GamePlay / 핵심 게임 로직
*   **주요 행위자**: 사용자 (플레이어), 시스템 (FSM)
*   **트리거**: `Betting1` 또는 `Betting2` FSM 상태 진입. 플레이어 액션 (베팅, 콜, 폴드, 체크, 레이즈).
*   **입력**:
    *   플레이어 액션: `type` (`PLACE_BET`, `FOLD`), `playerId`, `amount` (`PLACE_BET`용).
    *   (FSM 컨텍스트에서): `currentPlayerTurn`, `activeBettors`, `bettingOrder`, `minBet`, `maxBet`, `lastBetAmount`.
*   **처리 로직**:
    1.  **베팅 라운드 설정** (상태 진입 시: `Betting1`, `Betting2`):
        *   `context.currentBettingRound` 설정 (예: 'BETTING_1').
        *   `activeBettors` 식별 (라운드에 남아있는 플레이어).
        *   `bettingOrder` 결정.
        *   `minBet`, `maxBet` 계산 (규칙 5: "칩이 가장 적은 플레이어의 칩의 수보다 많이 진행할 수 없다").
        *   `lastBetAmount = 0`, `betsInCurrentPhase = []` 재설정.
        *   `setNextPlayerTurnForBetting`.
        *   `broadcastBettingPhaseStart`.
    2.  **플레이어 액션** (`PLACE_BET` 또는 `FOLD` 이벤트):
        *   가드 `isBetValidForCurrentPlayer`: 플레이어 턴인지, 베팅 금액이 유효한지, 플레이어가 충분한 칩을 가지고 있는지 확인.
        *   `PLACE_BET`인 경우 (베팅, 콜, 레이즈, 체크는 베팅 0 또는 `lastBetAmount`와 일치):
            *   `processBet`: `player.chips`에서 `amount` 차감, `context.potChips`에 추가, `context.betsInCurrentPhase`에 기록, `context.lastBetAmount` 업데이트.
            *   `persistBet`: DB에 `Bets` 레코드 생성. `GameParticipants.chips`, `GameRounds.pot_chips` 업데이트.
            *   `broadcastPlayerBet`.
        *   `FOLD`인 경우:
            *   `processFold`: `context.activeBettors`에서 플레이어 제거. 해당되는 경우 `player.status` 업데이트 (FSM은 `activeBettors` 목록 사용).
            *   `broadcastPlayerFold`.
        *   `setNextPlayerTurnForBetting`.
    3.  **베팅 라운드 완료 확인** (`always` 전환):
        *   가드 `isBettingRoundComplete`: 모든 `activeBettors`가 현재 베팅 라운드에서 행동했는지 (베팅 금액 일치 또는 폴드).
        *   완료 시: `finalizeBettingRoundActions`, 다음 게임 단계로 전환 (`DealingSharedCards2` 또는 `Sniping`).
        *   가드 `onlyOnePlayerLeftInBetting`: 한 명의 플레이어만 남으면 해당 플레이어가 팟을 가져감. `Settlement`로 전환. `assignPotToLastPlayer`.
*   **출력**:
    *   플레이어 베팅이 처리되고 컨텍스트 및 DB에서 칩이 업데이트됩니다.
    *   팟 크기가 업데이트됩니다.
    *   게임이 다음 플레이어 턴 또는 다음 단계로 진행됩니다.
    *   베팅 액션, 칩 수, 팟으로 UI가 업데이트됩니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   베팅 순서를 따릅니다.
    *   베팅 금액은 `minBet`/`maxBet` 및 플레이어 칩 잔액 내여야 합니다.
    *   `game-rule.md` #5의 `maxBet` 규칙.
    *   `CHECK` 제약 조건 `Bets.bet_phase IN ('BETTING_1', 'BETTING_2')` (`db-schema.md`).
*   **오류 처리 및 예외 케이스**:
    *   잘못된 베팅 금액. 플레이어 턴이 아님. 칩 부족.
    *   플레이어가 자신의 턴에 연결 끊김.
*   **데이터 모델 접점**:
    *   `Bets`: CREATE.
    *   `GameParticipants`: UPDATE (`chips`).
    *   `GameRounds`: UPDATE (`pot_chips`).
    *   `GamePhases`: READ (`Bets` 테이블의 `bet_phase_id`용).
*   **API 엔드포인트 / 메서드**: 해당 없음 (FSM 내부 로직, 플레이어 액션에 대한 실시간 이벤트).
*   **권한 / 보안**: 플레이어는 자신의 턴에만 행동할 수 있습니다.
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: `story-board.md`: 2.2. 베팅 라운드 - 베팅 옵션 버튼, 금액 입력.
*   **의존성**: `FN-010`.
*   **수락 기준**:
    *   플레이어는 게임 규칙 및 턴 순서에 따라 베팅, 콜, 레이즈, 체크 또는 폴드할 수 있습니다.
    *   칩 수와 팟 크기가 정확하게 업데이트됩니다.
    *   모든 활성 플레이어가 현재 베팅과 일치하거나 폴드하면 베팅 라운드가 종료됩니다.
    *   한 명의 플레이어만 남으면 해당 플레이어가 팟을 가져가고 라운드가 종료됩니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: `Betting1`, `Betting2` 상태, 관련 액션 및 가드.
    *   `docs/db-schema.md`: 테이블 `Bets`.
    *   `docs/game-rule.md`: 규칙 5, 6.

---

### `FN-016`: 두 번째 공유/커뮤니티 카드 공개
*   **목적 / 가치**: 최종 커뮤니티 카드 세트를 공개하여 총 4장의 공유 카드를 완성합니다.
*   **범위 / 모듈**: GamePlay / 핵심 게임 로직
*   **주요 행위자**: 시스템 (FSM)
*   **트리거**: `Betting1` 완료. FSM 상태: `DealingSharedCards2`.
*   **입력**: (FSM 컨텍스트에서) `deck`, `currentRoundId`, `sharedCards` (기존).
*   **처리 로직**: (FSM `DealingSharedCards2` 진입 액션)
    1.  `dealSecondSharedCards`: `context.deck`에서 카드 2장 더 뽑기.
    2.  이 카드들을 `context.sharedCards`에 추가 (총 4장).
    3.  `persistSharedCardsUpdate`:
        *   각 새 공유 카드에 대해 DB에 `SharedCards` 레코드 생성:
            *   `round_id`, `card_value`, `deal_order` (이 단계에서는 3과 4).
    4.  `broadcastSharedCardsUpdate`: 새로 공개된 공유 카드를 모든 클라이언트에 알림 (`FN-010`).
    5.  `Betting2` 상태로 전환.
*   **출력**:
    *   추가 공유 카드 2장이 공개되어 총 4장의 공유 카드가 사용 가능하게 됩니다.
    *   FSM 컨텍스트 및 DB에 저장됩니다.
    *   모든 플레이어의 UI가 업데이트됩니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   추가 공유 카드 2장이 공개됩니다 (`game-rule.md`: 6).
*   **오류 처리 및 예외 케이스**: 덱에 카드 부족.
*   **데이터 모델 접점**:
    *   `SharedCards`: CREATE.
    *   `GameRounds`: READ (`round_id`용).
*   **API 엔드포인트 / 메서드**: 해당 없음 (FSM 내부 로직).
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: `story-board.md`: 2.3. 추가 공유 카드 공개.
*   **의존성**: `FN-015` (Betting1), `FN-010`.
*   **수락 기준**:
    *   추가 공유 카드 2장이 뽑혀 공개되어 총 4장이 됩니다.
    *   새 공유 카드가 `SharedCards` 테이블에 기록됩니다.
    *   모든 플레이어의 UI가 업데이트됩니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: `DealingSharedCards2` 상태.
    *   `docs/db-schema.md`: `GameRounds.shared_card_2`를 참조했으며, 이제 `SharedCards` 테이블임.
    *   `docs/erd.md`: 테이블 `SharedCards`.
    *   `docs/game-rule.md`: 규칙 6.

---

### `FN-017`: 저격 라운드 진행
*   **목적 / 가치**: 플레이어가 상대방의 잠재적인 패를 "저격"할 수 있도록 하는 게임의 핵심 메커니즘입니다.
*   **범위 / 모듈**: GamePlay / 핵심 게임 로직
*   **주요 행위자**: 사용자 (플레이어), 시스템 (FSM)
*   **트리거**: `Betting2` 완료. FSM 상태: `Sniping`. 플레이어 액션 (저격 선언, 패스).
*   **입력**:
    *   플레이어 액션: `type` (`DECLARE_SNIPE`, `PASS_SNIPE`), `sniperId`, `declaredRank`, `declaredHighCard`.
    *   (FSM 컨텍스트에서): `currentPlayerTurn` (저격용), `snipingOrder`, `snipesInCurrentRound`.
*   **처리 로직**:
    1.  **저격 라운드 설정** (상태 진입 시):
        *   `context.snipesInCurrentRound = []` 초기화.
        *   `context.snipingOrder` 결정 (`Betting2` 참여 플레이어, 선 플레이어부터 - `fsm.md`).
        *   `context.currentSniper`를 `snipingOrder`의 첫 번째 플레이어로 설정.
        *   모든 플레이어의 `player.hasDeclaredSnipe` 재설정.
        *   `broadcastSnipingPhaseStart`.
    2.  **플레이어 액션** (`DECLARE_SNIPE` 또는 `PASS_SNIPE` 이벤트):
        *   가드 `isSnipeValidForCurrentPlayer`: 턴인지, 플레이어가 아직 저격하지 않았는지 확인.
        *   `DECLARE_SNIPE`인 경우:
            *   `processSnipeDeclaration`: 저격 세부 정보를 `context.snipesInCurrentRound`에 추가. `player.hasDeclaredSnipe = true` 설정.
            *   `persistSnipe`: DB에 `Snipes` 레코드 생성 (`sniper_id`, `round_id`, `declared_rank_id`, `declared_high_card`).
            *   `broadcastPlayerSnipeDeclaration`.
        *   `PASS_SNIPE`인 경우:
            *   플레이어가 저격을 포기. `player.hasDeclaredSnipe = true` 설정 (또는 행동을 취했음을 나타내는 유사한 방식).
            *   `broadcastPlayerPassSnipe`.
        *   `setNextPlayerTurnForSniping`.
    3.  **저격 라운드 완료 확인** (`always` 전환):
        *   가드 `isSnipingRoundComplete`: `snipingOrder`의 모든 플레이어가 행동 완료.
        *   완료 시, `Showdown`으로 전환.
*   **출력**:
    *   플레이어 저격 선언이 FSM 컨텍스트 및 DB에 기록됩니다.
    *   저격 선언 또는 패스로 UI가 업데이트됩니다.
    *   게임이 다음 저격자 또는 쇼다운으로 진행됩니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   플레이어는 패 족보와 해당 족보의 가장 높은 카드를 선언합니다 (`game-rule.md`: 8).
    *   풀하우스 선언 예외 (`game-rule.md`: 8).
    *   각 플레이어는 라운드당 한 번 저격할 수 있습니다.
*   **오류 처리 및 예외 케이스**: 잘못된 저격 선언. 플레이어 턴이 아님.
*   **데이터 모델 접점**:
    *   `Snipes`: CREATE.
    *   `GameRounds`: READ.
    *   `GameParticipants`: READ.
    *   `HandRanks`: READ (`declared_rank_id` 연결용).
*   **API 엔드포인트 / 메서드**: 해당 없음 (FSM 내부 로직, 플레이어 액션에 대한 실시간 이벤트).
*   **권한 / 보안**: 플레이어는 자신의 턴에만 행동할 수 있습니다.
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: `story-board.md`: 2.4. 저격 라운드 - 저격하기/패스 버튼, 저격 UI 모달.
*   **의존성**: `FN-010`.
*   **수락 기준**:
    *   플레이어는 턴 순서에 따라 저격을 선언하거나 패스할 수 있습니다.
    *   저격 선언이 정확하게 기록됩니다.
    *   모든 활성 플레이어가 저격 행동을 완료하면 저격 라운드가 종료됩니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: `Sniping` 상태, 관련 액션 및 가드.
    *   `docs/db-schema.md`: 테이블 `Snipes`.
    *   `docs/game-rule.md`: 규칙 8, 9.

---

### `FN-018`: 쇼다운 및 승자 결정
*   **목적 / 가치**: 모든 카드를 공개하고, 저격을 적용하며, 패 순위 및 동점자 규칙에 따라 라운드 승자를 결정합니다.
*   **범위 / 모듈**: GamePlay / 핵심 게임 로직
*   **주요 행위자**: 시스템 (FSM)
*   **트리거**: `Sniping` 라운드 완료. FSM 상태: `Showdown`.
*   **입력**: (FSM 컨텍스트에서) `players` (`personalCards`, `status` 포함), `sharedCards`, `snipesInCurrentRound`.
*   **처리 로직**: (FSM `Showdown` 진입 액션)
    1.  `revealAllPersonalCards`: 모든 활성 플레이어의 개인 카드를 컨텍스트에 공개적으로 표시 (브로드캐스트용).
    2.  `calculateAllPlayerHands`: 각 'ACTIVE' 플레이어에 대해:
        *   개인 카드 2장 + 공유 카드 4장 결합.
        *   최상의 5장 카드 패 순위 결정 (`HandRanks` enum/테이블).
        *   컨텍스트에 `player.finalHand = { rank, cards, highCard }` 저장.
        *   `PlayerHands.id`에 대해 `FinalHandCompositionCards`에 구성 카드 저장.
    3.  `applySnipes`:
        *   `context.snipesInCurrentRound` 반복.
        *   각 저격에 대해 모든 활성 플레이어의 `finalHand` 확인.
        *   플레이어의 `finalHand.rank` 및 `finalHand.highCard`가 `snipe.declaredRank` 및 `snipe.declaredHighCard`와 일치하면:
            *   `player.isSniped = true` 설정.
            *   `snipe.is_successful = true` 표시.
    4.  `determineRoundWinner`:
        *   `isSniped === false`인 'ACTIVE' 플레이어들의 `finalHand` 비교.
        *   여러 명인 경우 동점자 규칙 적용 (`game-rule.md`: 10).
        *   여전히 동점이거나 모든 저격당한 플레이어가 저격당하지 않은 플레이어보다 더 나은 패를 가진 경우 (가능성 낮음), 저격당한 플레이어 고려.
        *   `context.roundWinner` (플레이어 ID) 또는 `context.isDraw = true` 설정.
    5.  `persistShowdownResults`:
        *   DB의 `PlayerHands` 업데이트: `hand_rank_id` (`HandRanks` 연결), `is_sniped`.
        *   DB의 `Snipes` 업데이트: `is_successful`.
        *   DB의 `GameRounds` 업데이트: `winner_participant_id`, `is_draw`.
    6.  `broadcastShowdownResults`: 모든 카드/패/저격/승자 정보를 클라이언트에 전송 (`FN-010`).
    7.  `Settlement`로 전환.
*   **출력**:
    *   라운드 승자 또는 무승부가 결정됩니다.
    *   모든 패와 저격 결과가 공개됩니다.
    *   결과가 FSM 컨텍스트 및 DB에 저장됩니다.
    *   클라이언트 UI가 쇼다운 세부 정보로 업데이트됩니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   패 순위는 `game-rule.md`: 7을 따릅니다.
    *   저격당한 패는 최하위로 간주됩니다 (`game-rule.md`: 9).
    *   `game-rule.md`: 10의 동점자 규칙을 엄격히 따라야 합니다.
*   **오류 처리 및 예외 케이스**: 복잡한 동점자 시나리오. 모든 플레이어가 저격당함.
*   **데이터 모델 접점**:
    *   `PlayerHands`: UPDATE (`hand_rank_id`, `is_sniped`).
    *   `FinalHandCompositionCards`: CREATE.
    *   `Snipes`: UPDATE (`is_successful`).
    *   `GameRounds`: UPDATE (`winner_participant_id`, `is_draw`).
    *   `HandRanks`: READ.
*   **API 엔드포인트 / 메서드**: 해당 없음 (FSM 내부 로직).
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 패 계산 로직은 효율적이어야 합니다.
*   **UX 참조**: `story-board.md`: 2.5. 쇼다운 - 카드 공개, 족보 표시, 저격 결과, 승자 표시.
*   **의존성**: `FN-010`, 패 순위 유틸리티.
*   **수락 기준**:
    *   모든 플레이어의 최종 패가 정확하게 계산되어 표시됩니다.
    *   저격이 정확하게 적용되어 영향을 받는 패의 순위가 낮아집니다.
    *   모든 동점자 규칙을 포함하여 게임 규칙에 따라 라운드 승자가 결정됩니다.
    *   무승부 조건이 정확하게 식별됩니다.
    *   모든 결과가 데이터베이스에 저장됩니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: `Showdown` 상태 및 해당 진입 액션. ("저격당한 족보는 최하위"가 중요).
    *   `docs/db-schema.md`: 테이블 `PlayerHands`, `Snipes`, `GameRounds`.
    *   `docs/erd.md`: 테이블 `PlayerHands`, `FinalHandCompositionCards`, `HandRanks`.
    *   `docs/game-rule.md`: 규칙 7, 9, 10.

---

### `FN-019`: 플레이어 패 순위 계산
*   **목적 / 가치**: 플레이어의 개인 카드와 공유 커뮤니티 카드를 고려하여 가능한 최상의 포커 패를 결정합니다.
*   **범위 / 모듈**: GamePlay / 핵심 게임 로직 (유틸리티)
*   **주요 행위자**: 시스템 (쇼다운 중 FSM)
*   **트리거**: `Showdown` 상태 중 `calculateAllPlayerHands` 액션에 의해 호출됨.
*   **입력**:
    *   `personal_cards`: 정수 2개 배열.
    *   `shared_cards`: 정수 4개 배열.
*   **처리 로직**:
    1.  6장의 카드 (개인 2 + 공유 4)를 결합합니다.
    2.  이 6장에서 가능한 모든 5장 카드 조합을 평가합니다.
    3.  각 조합에 대해 포커 패 순위(포카드, 풀하우스 등, 하이카드까지)를 결정합니다.
    4.  모든 조합 중에서 가능한 가장 높은 순위를 식별합니다.
    5.  해당 최고 순위를 구성하는 특정 카드와 동점자 처리를 위한 주요 높은 카드를 결정합니다.
    6.  (`erd.md`에 따라) 최종 패를 구성하는 5장의 카드를 `FinalHandCompositionCards`에 저장합니다.
*   **출력**:
    *   `finalHand`: 객체 `{ rank: HandRank, cards: number[5], highCard: number }`.
*   **비즈니스 규칙 및 제약 조건**:
    *   `game-rule.md`: 7에 정의된 패 순위 (포카드 > 풀하우스 > 스트레이트 > 트리플 > 투페어 > 원페어 > 하이카드).
    *   카드는 1-10까지의 숫자입니다.
*   **오류 처리 및 예외 케이스**: 해당 없음 (유효한 카드 입력 가정).
*   **데이터 모델 접점**:
    *   `FinalHandCompositionCards`: CREATE (간접적으로, `FN-018`을 통해).
    *   `HandRanks`: READ (순위 이름을 ID에 매핑하기 위해).
*   **API 엔드포인트 / 메서드**: 해당 없음 (내부 유틸리티 함수).
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 쇼다운 중 모든 활성 플레이어에 대해 실행되므로 효율적이어야 합니다. 플레이어당 6C5 = 6개의 조합을 확인합니다.
*   **UX 참조**: 해당 없음
*   **의존성**: 없음
*   **수락 기준**:
    *   6장의 카드에서 정의된 순위에 따라 최상의 5장 카드 패를 정확하게 식별합니다.
    *   패를 구성하는 카드와 동점자 처리를 위한 높은 카드를 정확하게 식별합니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: `Showdown`의 `calculateAllPlayerHands` 액션.
    *   `docs/game-rule.md`: 규칙 7 (족보 종류).
    *   `docs/prd.md`: 핵심 기능 - 조합 계산 (서버-사이드 TypeScript 라이브러리).

---

### `FN-020`: 라운드 정산 (팟 분배, 생존/탈락 처리)
*   **목적 / 가치**: 승자에게 팟을 분배하고, 플레이어 칩을 업데이트하며, 플레이어 생존 또는 탈락 여부를 확인합니다.
*   **범위 / 모듈**: GamePlay / 핵심 게임 로직
*   **주요 행위자**: 시스템 (FSM)
*   **트리거**: `Showdown` 완료, 또는 베팅 라운드 결과 단일 플레이어만 남은 경우. FSM 상태: `Settlement`.
*   **입력**: (FSM 컨텍스트에서) `roundWinner`, `isDraw`, `potChips`, `players`, `survivalChips`.
*   **처리 로직**: (FSM `Settlement` 진입 액션)
    1.  `distributePotToWinner`:
        *   `roundWinner`가 존재하고 `isDraw`가 false이면: `roundWinner.chips`에 `potChips` 추가.
        *   `isDraw`가 true이면: `game-rule.md`: 10에 따라 동점자 간에 `potChips` 분배 (균등 분배, 나머지는 턴 순서가 빠른 순).
    2.  `persistChipChanges`: 영향을 받는 플레이어에 대해 DB의 `GameParticipants.chips` 업데이트.
    3.  `checkPlayerSurvivalAndElimination`: 각 플레이어에 대해:
        *   `player.chips >= survivalChips` (75) 이고 `player.status === 'ACTIVE'`이면:
            *   `player.status = 'SURVIVED'` 설정.
            *   `player.chips`에서 `survivalChips` (75) 차감 (`game-rule.md`: 11 - "75개를 지불하고"). *이 차감이 중요하며 종종 누락됨.*
            *   DB에서 `GameParticipants.status` (`player_status_id`를 통해)를 'SURVIVED'로, `survived_at` 업데이트.
            *   `handleSurvivorChipDistribution` (`FN-021`) 트리거.
        *   `player.chips <= 0` 이고 `player.status !== 'SURVIVED'`이면:
            *   `player.status = 'ELIMINATED'` 설정.
            *   DB에서 `GameParticipants.status`를 'ELIMINATED'로, `eliminated_at` 업데이트.
    4.  `updateUserStatistics` (선택 사항, 향후).
    5.  `broadcastSettlementUpdate`: 클라이언트에 칩 변경, 생존, 탈락 알림 (`FN-010`).
    6.  `checkForGameEndCondition`: 게임 종료 여부 확인 (`FN-022`).
    7.  `GameEnded` 또는 `ReadyToStartRound`로 전환.
*   **출력**:
    *   팟이 분배됩니다. 플레이어 칩이 컨텍스트 및 DB에서 업데이트됩니다.
    *   조건을 충족하는 플레이어는 SURVIVED 또는 ELIMINATED로 표시됩니다.
    *   클라이언트 UI가 업데이트됩니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   생존 비용: 75칩 (`game-rule.md`: 11).
    *   탈락: 0칩 및 생존하지 못함.
    *   무승부 팟 분배 규칙 (`game-rule.md`: 10).
*   **오류 처리 및 예외 케이스**: 한 라운드에 여러 생존자 발생. 모든 플레이어 동시 탈락.
*   **데이터 모델 접점**:
    *   `GameParticipants`: UPDATE (`chips`, `status`, `survived_at`, `eliminated_at`).
    *   `PlayerStatuses`: READ.
*   **API 엔드포인트 / 메서드**: 해당 없음 (FSM 내부 로직).
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: `story-board.md`: 2.6. 정산 및 생존/탈락 처리.
*   **의존성**: `FN-010`, `FN-021`, `FN-022`.
*   **수락 기준**:
    *   팟이 승자에게 정확하게 분배되거나 무승부 시 분할됩니다.
    *   플레이어 칩 수가 FSM 컨텍스트 및 DB에서 업데이트됩니다.
    *   생존 조건을 충족하는 플레이어는 75칩을 지불하고 'SURVIVED'로 표시됩니다.
    *   0칩 (그리고 생존하지 못한) 플레이어는 'ELIMINATED'로 표시됩니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: `Settlement` 상태 및 해당 진입 액션.
    *   `docs/db-schema.md`: 테이블 `GameParticipants`.
    *   `docs/game-rule.md`: 규칙 10, 11, 12.

---

### `FN-021`: 생존자 칩 분배 처리
*   **목적 / 가치**: 생존을 확정한 플레이어가 초과 칩 (생존 비용 75칩 지불 후 남은 칩)을 다른 플레이어에게 분배할 수 있도록 합니다.
*   **범위 / 모듈**: GamePlay / 핵심 게임 로직
*   **주요 행위자**: 사용자 (생존한 플레이어), 시스템 (FSM)
*   **트리거**: 플레이어가 `Settlement` 단계에서 'SURVIVED' 상태가 되고 생존 비용 75칩 지불 후 칩이 0보다 큰 경우. FSM 액션: `handleSurvivorChipDistribution`.
*   **입력**:
    *   `survivorId`: 생존한 플레이어의 `UUID`.
    *   `excessChips`: `INTEGER` (생존을 위해 75칩 지불 후 남은 칩).
    *   (UI/플레이어로부터) 분배 계획: `{ recipientId: UUID, amount: INTEGER }` 배열.
    *   (FSM 컨텍스트에서) 다른 `players` 목록.
*   **처리 로직**: (FSM `Settlement`의 `handleSurvivorChipDistribution` 액션)
    1.  컨텍스트에서 생존한 플레이어의 `chips`는 이미 생존을 위해 75칩을 지불한 *후의* 금액을 반영합니다. 이 `chips` 금액이 `excessChips`입니다.
    2.  생존한 플레이어에게 이 `excessChips`를 분배할 UI가 제공됩니다.
    3.  플레이어가 분배 계획을 제출합니다.
    4.  시스템이 계획을 검증합니다:
        *   총 분배 금액은 `excessChips`와 같아야 합니다.
        *   0칩을 가진 플레이어는 선택된 경우 최소 1칩을 받아야 합니다 (`game-rule.md`: 11).
    5.  유효한 경우:
        *   생존자의 `chips` 업데이트 (컨텍스트에서 0으로 설정, 모든 초과분 전달).
        *   컨텍스트에서 수신자 플레이어의 `chips` 업데이트.
        *   `persistChipChanges`: DB에서 생존자 및 수신자의 `GameParticipants.chips` 업데이트.
    6.  칩 업데이트 브로드캐스트.
*   **출력**:
    *   생존자의 초과 칩이 다른 플레이어에게 분배됩니다.
    *   FSM 컨텍스트 및 DB에서 칩 수가 업데이트됩니다.
    *   칩 변경 사항을 반영하여 UI가 업데이트됩니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   생존한 플레이어는 생존을 위해 75칩을 지불한 *후* 남은 칩을 분배합니다.
    *   0칩 플레이어에게 분배하는 경우, 선택 시 최소 1칩을 주어야 합니다.
    *   총 분배 금액은 생존자의 초과 칩과 일치해야 합니다.
*   **오류 처리 및 예외 케이스**: 플레이어의 잘못된 분배 계획. 생존자가 분배 전에 연결 끊김.
*   **데이터 모델 접점**: `GameParticipants`: UPDATE (`chips`).
*   **API 엔드포인트 / 메서드**: 해당 없음 (FSM 내부 로직, 플레이어 분배 선택에 대한 실시간 이벤트).
*   **권한 / 보안**: 생존한 플레이어만 자신의 초과 칩 분배를 결정할 수 있습니다.
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: `story-board.md`: 2.6. 정산 - 남은 칩 분배 UI.
*   **의존성**: `FN-020` (이것을 트리거함).
*   **수락 기준**:
    *   생존한 플레이어는 자신의 초과 칩 (75칩 지불 후)을 분배할 수 있습니다.
    *   분배는 선택된 경우 0칩 플레이어에게 최소 1칩을 주는 규칙을 준수합니다.
    *   모든 칩 변경 사항이 컨텍스트 및 DB에 정확하게 반영됩니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: `Settlement`의 `handleSurvivorChipDistribution` 액션.
    *   `docs/game-rule.md`: 규칙 11 (남은 칩이 있다면...).
    *   `docs/prd.md`: 생존/탈락 처리 - 잔여 칩 분배.

---

### `FN-022`: 게임 종료 조건 확인
*   **목적 / 가치**: 플레이어 상태에 따라 전체 게임이 종료되어야 하는지 결정합니다.
*   **범위 / 모듈**: GamePlay / 핵심 게임 로직
*   **주요 행위자**: 시스템 (FSM)
*   **트리거**: `Settlement` 단계 마지막에 호출됨. FSM 가드: `isGameOver`.
*   **입력**: (FSM 컨텍스트에서) `players` 목록 (`status` 포함).
*   **처리 로직**: (FSM `Settlement`의 `isGameOver` 가드)
    1.  `status === 'ACTIVE'`인 플레이어 수 계산.
    2.  `status === 'SURVIVED'`인 플레이어 수 계산.
    3.  게임 종료 조건:
        *   `activePlayers <= 1` (FSM 로직: 0 또는 1일 수 있으며, 마지막 활성 플레이어 한 명이 남았거나 모두 해결되었음을 의미).
        *   또는 `activePlayers === 0 && survivedPlayers > 0` (남아있는 모든 플레이어가 생존).
        *   (특정 조건 고려, 예: 5명 플레이어 중 4명 생존 시 마지막 한 명은 암묵적으로 탈락).
        *   (해당되는 경우 최대 생존자 수 고려, 명시되지 않음).
*   **출력**: 불리언 (`true`이면 게임 종료, `false`이면 계속).
*   **비즈니스 규칙 및 제약 조건**:
    *   단일 승자 (마지막 활성/생존자)가 명확해지거나 모든 플레이어가 생존 또는 탈락하면 게임이 종료됩니다.
    *   "마지막까지 생존하지 못하고 남은 플레이어가 탈락한다." (`game-rule.md`: 12).
*   **오류 처리 및 예외 케이스**: 해당 없음
*   **데이터 모델 접점**: 해당 없음 (FSM 컨텍스트 읽기).
*   **API 엔드포인트 / 메서드**: 해당 없음 (내부 FSM 가드).
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: `story-board.md`: 2.6. 정산 - 게임 종료 조건 충족?
*   **의존성**: `FN-020`의 플레이어 상태 업데이트.
*   **수락 기준**:
    *   활성 플레이어가 1명 이하 남았을 때를 정확하게 식별합니다.
    *   모든 플레이어가 생존 또는 탈락했을 때를 정확하게 식별합니다.
    *   게임 종료 조건이 충족되면 true, 그렇지 않으면 false를 반환합니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: `Settlement` 상태의 `isGameOver` 가드, `checkForGameEndCondition` 액션.

---

### `FN-023`: 게임 종료 처리
*   **목적 / 가치**: 게임을 최종 마무리하고, 최종 승자를 발표하며, 정리합니다.
*   **범위 / 모듈**: GamePlay / 핵심 게임 로직
*   **주요 행위자**: 시스템 (FSM)
*   **트리거**: `isGameOver` 가드가 true 반환. FSM 상태: `GameEnded`.
*   **입력**: (FSM 컨텍스트에서) `players` 목록.
*   **처리 로직**: (FSM `GameEnded` 진입 액션)
    1.  `determineFinalWinner`: 'SURVIVED' 상태 또는 마지막 'ACTIVE' 플레이어를 기준으로 최종 승자 식별.
    2.  `persistGameEnd`:
        *   DB에서 `GameRooms.status` (`room_status_id`를 통해)를 'FINISHED'로 업데이트.
    3.  `broadcastGameEndResults`: 모든 클라이언트에 게임 종료 및 최종 결과 알림 (`FN-010`).
    4.  `cleanupGameContext` (선택 사항): 완료된 게임에 대한 FSM 컨텍스트 정리.
*   **출력**:
    *   게임이 공식적으로 종료됩니다.
    *   최종 승자가 발표됩니다.
    *   DB에서 게임 방 상태가 업데이트됩니다.
    *   클라이언트가 게임 오버 화면을 표시합니다.
    *   (FSM 출력) 게임 결과 요약.
*   **비즈니스 규칙 및 제약 조건**: `GameEnded`는 `final` FSM 상태입니다.
*   **오류 처리 및 예외 케이스**: 해당 없음
*   **데이터 모델 접점**: `GameRooms`: UPDATE (`status`).
*   **API 엔드포인트 / 메서드**: 해당 없음 (FSM 내부 로직).
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: `story-board.md`: 3. 게임 종료 - "게임 종료!" 메시지, 최종 승자 표시.
*   **의존성**: `FN-022`, `FN-010`.
*   **수락 기준**:
    *   게임 방 상태가 'FINISHED'로 설정됩니다.
    *   최종 승자가 정확하게 식별되어 브로드캐스트됩니다.
    *   FSM이 최종 상태로 진입합니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: `GameEnded` 상태 및 해당 진입 액션.
    *   `docs/db-schema.md`: 테이블 `GameRooms`.

---

### `FN-024`: 플레이어 연결 끊김 처리 (게임 중)
*   **목적 / 가치**: 활성 게임 중에 플레이어 연결이 끊겼을 때 게임 상태를 관리합니다.
*   **범위 / 모듈**: GamePlay / 핵심 게임 로직
*   **주요 행위자**: 시스템 (FSM)
*   **트리거**: 플레이어 연결 손실 (Supabase Presence에 의해 감지됨). FSM 이벤트: `PLAYER_DISCONNECT_IN_GAME`.
*   **입력**: `playerId`: 연결이 끊긴 플레이어의 `UUID`.
*   **처리 로직**: (FSM `GameInProgress`의 `PLAYER_DISCONNECT_IN_GAME` 이벤트 액션)
    1.  `handlePlayerDisconnect`:
        *   FSM 컨텍스트에서 연결 끊긴 플레이어 상태 업데이트 (예: 'DISCONNECTED'로 변경 또는 현재 액션에서 자동 폴드).
        *   `GameParticipants.status`를 'ELIMINATED' (또는 특정 'DISCONNECTED_ELIMINATED' 상태)로 표시.
        *   해당 플레이어 턴이었으면 턴을 넘기거나 적절히 처리 (예: 자동 폴드).
        *   해당되는 경우 `activeBettors` / `snipingOrder`에서 제거.
    2.  `checkForGameEndCondition`: 연결 끊김으로 인해 게임이 종료되는지 확인 (예: 한 명의 플레이어만 남음).
    3.  업데이트된 게임 상태 / 플레이어 상태 브로드캐스트.
*   **출력**:
    *   연결 끊긴 플레이어 상태가 업데이트됩니다.
    *   게임이 한 명 적은 플레이어로 진행되거나 종료될 수 있습니다.
    *   다른 플레이어에게 알림이 갑니다.
*   **비즈니스 규칙 및 제약 조건**:
    *   연결 끊긴 플레이어 처리 규칙 (예: 탈락 처리되는지? 해당 플레이어 칩은 팟에 남는지? 재참여 가능한지?). FSM은 탈락을 암시.
*   **오류 처리 및 예외 케이스**: 호스트 연결 끊김. 여러 플레이어 연결 끊김.
*   **데이터 모델 접점**: `GameParticipants`: UPDATE (`status`, `eliminated_at`).
*   **API 엔드포인트 / 메서드**: 해당 없음 (실시간 Presence에 의해 트리거되는 FSM 내부 로직).
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: 연결 끊긴 플레이어에 대한 UI 표시.
*   **의존성**: `FN-011` (Presence), `FN-022` (게임 종료 확인).
*   **수락 기준**:
    *   연결 끊긴 플레이어가 적절하게 처리됩니다 (예: 탈락으로 표시).
    *   조건이 충족되면 게임이 올바르게 진행되거나 종료됩니다.
    *   다른 플레이어에게 연결 끊김 및 그 결과에 대해 알림이 갑니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: `GameInProgress` 상태, `PLAYER_DISCONNECT_IN_GAME` 이벤트 및 액션.

---

### `FN-025`: 덱 및 카드 뽑기 관리
*   **목적 / 가치**: 게임 덱 생성, 셔플 및 카드 뽑기를 처리합니다.
*   **범위 / 모듈**: GamePlay / 핵심 게임 로직 (유틸리티)
*   **주요 행위자**: 시스템 (FSM)
*   **트리거**: `initializeGameContext`, `resetRoundContext` (셔플). `dealPersonalCardsToPlayers`, `dealFirstSharedCards`, `dealSecondSharedCards` (뽑기).
*   **입력**: (셔플용) 없음. (뽑기용) 뽑을 카드 수.
*   **처리 로직**:
    1.  **덱 생성**: (`initializeGameContext` 또는 `resetRoundContext`)
        *   40장의 카드로 구성된 덱 생성: 1-10 숫자 4세트. `context.deck`에 저장.
    2.  **덱 셔플**: (`initializeGameContext` 또는 `resetRoundContext`)
        *   `context.deck`을 무작위로 셔플 (예: Fisher-Yates 알고리즘).
    3.  **카드 뽑기**: (카드 분배 액션)
        *   `context.deck` 맨 위에서 지정된 수의 카드 제거.
        *   뽑은 카드 반환.
*   **출력**: 셔플된 덱. 뽑은 카드.
*   **비즈니스 규칙 및 제약 조건**:
    *   덱: 40장, 1-10, 4가지 모양 (모양은 동일한 숫자로 추상화됨).
    *   카드는 현재 라운드 덱에서 비복원 추출해야 합니다.
*   **오류 처리 및 예외 케이스**: 사용 가능한 카드보다 많은 카드를 뽑으려고 시도 (게임 설계상 방지되어야 함).
*   **데이터 모델 접점**: 해당 없음 (FSM 컨텍스트 `deck` 관리).
*   **API 엔드포인트 / 메서드**: 해당 없음 (내부 유틸리티).
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 셔플 알고리즘은 효율적이어야 합니다.
*   **UX 참조**: 해당 없음
*   **의존성**: 없음
*   **수락 기준**:
    *   덱이 40장의 카드로 올바르게 초기화됩니다.
    *   각 라운드/게임 시작 시 덱이 무작위로 셔플됩니다.
    *   덱에서 카드가 올바르게 뽑힙니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: `initializeGameContext`, `resetRoundContext`, 카드 분배 액션.
    *   `docs/game-rule.md`: 규칙 2 (사용 카드).

---

### `FN-026`: 플레이어 턴 순서 결정
*   **목적 / 가치**: 라운드 및 단계 내 플레이어 행동 순서를 설정하고 관리합니다.
*   **범위 / 모듈**: GamePlay / 핵심 게임 로직
*   **주요 행위자**: 시스템 (FSM)
*   **트리거**: `initializeGameContext` (초기 게임 순서). `determinePlayerTurnOrderForRound` (새 라운드). `setNextPlayerTurnForBetting`, `setNextPlayerTurnForSniping`.
*   **입력**: 활성 플레이어 목록. 현재 게임 단계. 이전 턴 플레이어.
*   **처리 로직**:
    1.  **초기 게임 순서** (`initializeGameContext`):
        *   플레이어에게 무작위로 `turn_order` (예: 1부터 N까지) 할당. `GameParticipants.turn_order`에 저장.
    2.  **라운드 턴 순서** (`determinePlayerTurnOrderForRound`):
        *   초기 순서에 따라 고정되거나 회전할 수 있음 (예: 딜러 버튼 개념). FSM: "랜덤 또는 이전 라운드 기반". `game-rule.md`: "카드를 뽑아 순서를 정하고 선부터 시계 방향으로".
    3.  **베팅/저격 턴 진행** (`setNextPlayerTurnForBetting`, `setNextPlayerTurnForSniping`):
        *   `bettingOrder` 또는 `snipingOrder`에서 현재 플레이어 식별.
        *   해당 순서에서 여전히 'ACTIVE' / `activeBettors`에 있는 다음 플레이어로 이동.
        *   순서 끝에 도달하면 처음으로 돌아가거나 베팅/저격 라운드가 종료됨.
        *   `context.currentPlayerTurn` 또는 `context.currentSniper` 업데이트.
*   **출력**: 업데이트된 `context.currentPlayerTurn`/`currentSniper`. 베팅/저격 순서.
*   **비즈니스 규칙 및 제약 조건**:
    *   순서는 일반적으로 "선" (첫 번째 플레이어/딜러 버튼)부터 시계 방향입니다.
    *   폴드하거나 탈락한 플레이어는 턴을 건너<0xEB><0x9C><0x84>니다.
*   **오류 처리 및 예외 케이스**: 턴이 완료되기 전에 모든 플레이어가 폴드하는 경우.
*   **데이터 모델 접점**: `GameParticipants`: UPDATE (`turn_order` 초기에).
*   **API 엔드포인트 / 메서드**: 해당 없음 (내부 FSM 로직).
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: 현재 플레이어 턴에 대한 UI 표시.
*   **의존성**: 플레이어 상태 정보.
*   **수락 기준**:
    *   초기 플레이어 턴 순서가 올바르게 설정됩니다.
    *   베팅 및 저격에 대해 턴이 다음 활성 플레이어에게 순서대로 올바르게 진행됩니다.
    *   폴드/탈락한 플레이어는 건너<0xEB><0x9C><0x84>니다.
*   **코드 포인터**:
    *   `docs/fsm.md`: `initializeGameContext`, `determinePlayerTurnOrderForRound`, `setNextPlayerTurnForBetting`, `setNextPlayerTurnForSniping`.
    *   `docs/game-rule.md`: 규칙 3.

---
### 도메인: 사용자 인터페이스 및 경험 (UI/UX)
---

### `FN-027`: 메인 화면/진입점 표시
*   **목적 / 가치**: 사용자가 게임을 시작하거나 참여할 수 있는 초기 인터페이스를 제공합니다.
*   **범위 / 모듈**: UI/UX
*   **주요 행위자**: 사용자
*   **트리거**: 사용자가 게임 웹사이트를 방문합니다.
*   **입력**: 해당 없음
*   **처리 로직**:
    1.  메인 화면 UI를 렌더링합니다.
    2.  닉네임 입력을 허용합니다.
    3.  "방 만들기" 또는 "방 참가하기" (코드 입력 포함) 옵션을 제공합니다.
*   **출력**: 메인 화면이 표시됩니다.
*   **비즈니스 규칙 및 제약 조건**: 해당 없음
*   **오류 처리 및 예외 케이스**: 해당 없음
*   **데이터 모델 접점**: 해당 없음
*   **API 엔드포인트 / 메서드**: 해당 없음
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 빠른 초기 로딩.
*   **UX 참조**: `story-board.md`: 1.1. 메인 화면 (초기 접속).
*   **의존성**: `FN-003`, `FN-004`가 여기서 트리거됩니다.
*   **수락 기준**:
    *   방을 만들거나 참여할 수 있는 옵션과 함께 메인 화면이 표시됩니다.
    *   사용자가 닉네임을 입력할 수 있습니다.
*   **코드 포인터**: `docs/story-board.md`: 1.1. 메인 화면 (초기 접속).

---

### `FN-028`: 게임 보드 및 플레이어 정보 표시
*   **목적 / 가치**: 카드, 칩, 플레이어 상태 및 액션을 보여주는 메인 게임 인터페이스를 렌더링합니다.
*   **범위 / 모듈**: UI/UX
*   **주요 행위자**: 사용자 (플레이어)
*   **트리거**: 게임 시작 (`FN-007`), 게임 상태 변경 (`FN-010`의 브로드캐스트).
*   **입력**: FSM 컨텍스트 / 실시간 브로드캐스트의 게임 상태 데이터.
*   **처리 로직**:
    1.  클라이언트가 게임 상태 업데이트를 수신합니다.
    2.  UI 요소 렌더링:
        *   플레이어 자신의 개인 카드 (보임). 다른 플레이어의 개인 카드 (숨김).
        *   공유 커뮤니티 카드.
        *   각 플레이어의 닉네임, 칩 수, 상태 (활성, 폴드, 저격당함 등).
        *   현재 팟 크기.
        *   현재 플레이어 턴 표시.
        *   현재 플레이어 및 게임 단계와 관련된 액션 버튼 (베팅, 폴드, 저격 등).
*   **출력**: 업데이트된 게임 보드 UI.
*   **비즈니스 규칙 및 제약 조건**:
    *   플레이어는 쇼다운 전까지 자신의 개인 카드만 볼 수 있습니다.
*   **오류 처리 및 예외 케이스**: 업데이트 수신 지연 (UI가 정상적으로 처리해야 함).
*   **데이터 모델 접점**: 해당 없음 (수신된 상태 기반 표시 전용).
*   **API 엔드포인트 / 메서드**: 해당 없음
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: UI 업데이트는 게임 이벤트에 부드럽고 반응적으로 이루어져야 합니다.
*   **UX 참조**: `story-board.md`: 섹션 2.1 - 2.6 (다양한 게임 단계 UI).
*   **의존성**: `FN-010`.
*   **수락 기준**:
    *   게임 보드가 현재 게임 상태를 정확하게 반영합니다.
    *   플레이어 자신의 카드는 보이고 다른 카드는 숨겨집니다.
    *   공유 카드, 칩 수, 팟 및 플레이어 상태가 올바르게 표시됩니다.
    *   액션 버튼이 상황에 맞게 표시됩니다.
*   **코드 포인터**: `docs/story-board.md`: 섹션 2.1 - 2.6.

---

### `FN-029`: 게임 오버 화면 표시
*   **목적 / 가치**: 플레이어에게 게임이 종료되었음을 알리고 최종 결과를 보여줍니다.
*   **범위 / 모듈**: UI/UX
*   **주요 행위자**: 사용자 (플레이어)
*   **트리거**: 게임 종료 (`FN-023`).
*   **입력**: 최종 게임 결과 (승자, 순위 등).
*   **처리 로직**:
    1.  클라이언트가 게임 종료 알림 및 결과를 수신합니다.
    2.  "게임 오버" 화면 렌더링:
        *   "게임 종료!" 메시지.
        *   최종 승자.
        *   "[새 게임 시작]" (호스트인 경우) 또는 "[메인으로 돌아가기]" 옵션.
*   **출력**: 게임 오버 화면이 표시됩니다.
*   **비즈니스 규칙 및 제약 조건**: 해당 없음
*   **오류 처리 및 예외 케이스**: 해당 없음
*   **데이터 모델 접점**: 해당 없음
*   **API 엔드포인트 / 메서드**: 해당 없음
*   **권한 / 보안**: 해당 없음
*   **성능 / SLA 참고**: 해당 없음
*   **UX 참조**: `story-board.md`: 3. 게임 종료.
*   **의존성**: `FN-023`.
*   **수락 기준**:
    *   게임이 종료되면 게임 오버 화면이 표시됩니다.
    *   최종 승자가 명확하게 표시됩니다.
    *   새 게임을 시작하거나 메인 메뉴로 돌아갈 수 있는 옵션이 제공됩니다.
*   **코드 포인터**: `story-board.md`: 3. 게임 종료.

## 3. 교차 기능 (Cross-Cutting Features)

*   **전역 오류 처리**:
    *   **목적**: 애플리케이션 전체에서 오류를 정상적으로 관리하고 표시합니다.
    *   **로직**: 클라이언트 측 및 서버 측 오류를 포착합니다. 사용자 친화적인 메시지 (예: "잘못된 방 코드", "연결 끊김")를 표시합니다. 개발자를 위해 자세한 오류를 기록합니다.
    *   **접점**: 모든 UI 상호작용, API 호출, 실시간 이벤트 처리.
    *   **UX**: 일관된 오류 메시지 스타일. 토스트 알림 또는 모달 대화 상자.
*   **로깅**:
    *   **목적**: 모니터링 및 문제 해결을 위해 중요한 이벤트, 오류 및 디버그 정보를 기록합니다.
    *   **로직**: 클라이언트 측 및 서버 측 로깅을 구현합니다. FSM 전환, 중요한 게임 이벤트, 오류, 사용자 액션을 기록합니다.
    *   **도구**: Supabase Analytics 또는 PostHog (`prd.md`에 따름). 클라이언트용 브라우저 콘솔.
*   **실시간 상태 동기화 (Supabase Realtime)**:
    *   **목적**: 모든 연결된 클라이언트가 게임 상태에 대한 일관되고 최신 보기를 갖도록 보장합니다.
    *   **로직**: 게임 이벤트 브로드캐스팅을 위해 Supabase Channels를 사용하고 연결된 사용자 추적을 위해 Presence를 사용합니다. FSM 액션이 브로드캐스트를 트리거합니다. 클라이언트는 채널을 구독하고 UI를 업데이트합니다.
    *   **세부 정보**: `FN-010`, `FN-011` 참조.
*   **데이터베이스 상호작용 (Supabase PostgreSQL + Prisma)**:
    *   **목적**: 모든 게임 관련 데이터를 저장하고 검색합니다.
    *   **로직**: 지속성이 필요한 FSM 액션 (예: `persistBet`, `persistNewRoundStart`)은 Prisma ORM을 통해 데이터베이스와 상호작용합니다.
    *   **데이터 모델**: `db-schema.md` 및 `erd.md`에 정의됨.
    *   **보안**: Supabase의 Row Level Security.
*   **인증 및 권한 부여 (Supabase Auth)**:
    *   **목적**: 사용자 ID를 관리하고 기능에 대한 접근을 제어합니다.
    *   **로직**: 사용자 로그인을 위해 Supabase Auth (예: Magic Link, JWT)를 사용합니다. JWT는 실시간 채널 구독 및 API 요청 (개념적)을 승인하는 데 사용됩니다.
    *   **세부 정보**: `FN-001` 참조.

## 4. 데이터 흐름도 (텍스트 기반)

1.  **사용자 상호작용 (UI/UX)**:
    *   사용자 입력 (닉네임, 방 코드, 베팅 금액, 저격 선택)은 클라이언트 측 UI에 의해 캡처됩니다.
    *   이러한 액션은 클라이언트 측 FSM으로 전송되는 이벤트를 트리거하거나 서버 측 FSM으로 전송되는 실시간 이벤트를 트리거합니다.

2.  **클라이언트 측 FSM / 로직**:
    *   로컬 액션 및 서버에서 수신된 브로드캐스트를 기반으로 UI 상태를 관리합니다.
    *   플레이어 게임 액션 (베팅, 저격)을 실시간을 통해 서버 측 FSM으로 전달합니다.

3.  **서버 측 FSM (중앙 게임 로직 - GamePlay)**:
    *   플레이어 액션 및 시스템 이벤트 (예: 타이머 - 명시적으로 자세히 설명되지 않음)를 수신합니다.
    *   게임 규칙을 처리하고 내부 상태 (`context`)를 업데이트합니다.
    *   **데이터베이스 (Supabase PostgreSQL)**에 상태를 저장하기 위해 `persist` 액션을 트리거합니다.
        *   *예시*: `GameRooms` 상태, `GameParticipants` 칩/상태, `GameRounds` 세부 정보, `PlayerHands`, `Bets`, `Snipes`, `SharedCards`, `FinalHandCompositionCards`.
    *   **실시간 통신 (Supabase Realtime)**을 통해 상태 업데이트를 보내기 위해 `broadcast` 액션을 트리거합니다.

4.  **데이터베이스 (Supabase PostgreSQL)**:
    *   모든 영구 게임 데이터 저장: 사용자 계정, 방 세부 정보, 라운드 기록, 플레이어 패, 베팅, 저격.
    *   게임 상태 기록 및 설정에 대한 단일 진실 공급원(Single Source of Truth) 역할을 합니다.
    *   서버 측 로직에서 Prisma ORM을 통해 접근 (개념적, FSM "persist" 액션이 이를 암시).

5.  **실시간 통신 (Supabase Realtime - Realtime 도메인)**:
    *   서버 측 FSM에서 브로드캐스트 메시지를 수신합니다.
    *   이러한 메시지를 해당 게임 방 채널에 연결된 모든 클라이언트에 배포합니다.
    *   Presence 추적 (플레이어 연결/연결 해제)을 처리하며, 이는 FSM에 이벤트를 다시 제공할 수 있습니다.

6.  **클라이언트 UI 업데이트 (UI/UX)**:
    *   Supabase Realtime에서 브로드캐스트된 상태 변경 사항을 수신합니다.
    *   새 게임 상태를 반영하도록 UI를 업데이트합니다 (예: 공개된 카드, 이동된 칩, 플레이어 상태 변경).

**데이터 흐름 요약**:
사용자 액션 (UI) → 클라이언트 FSM/실시간 → 서버 FSM (게임 로직) → [데이터베이스 (저장) AND 실시간 (브로드캐스트)] → 클라이언트 UI (업데이트). 실시간의 Presence 데이터도 서버 FSM에 제공될 수 있습니다.

## 5. 용어 및 약어 해설

*   **앤티 (Ante)**: 라운드를 시작하기 위해 모든 플레이어에게 필요한 기본 베팅. (기본 베팅)
*   **FSM**: 유한 상태 머신 (Finite State Machine). 게임 흐름 관리에 사용됨 (`docs/fsm.md`).
*   **패 순위 (Hand Rank)**: 포커 패의 가치 (예: 스트레이트, 풀하우스). (족보)
*   **호스트 (Host)**: 게임 방을 만든 플레이어.
*   **로비 (Lobby)**: 게임 시작 전에 플레이어들이 모이는 대기 공간.
*   **개인 카드 (Personal Cards)**: 각 플레이어에게 비공개로 분배되는 카드 2장.
*   **팟 (Pot)**: 한 라운드에 베팅된 총 칩 금액. (판돈)
*   **공유 카드 / 커뮤니티 카드 (Shared Cards / Community Cards)**: 중앙에 앞면이 보이도록 놓여 모든 플레이어가 사용할 수 있는 카드.
*   **저격 (Snipe)**: 상대방의 일치하는 패를 평가 절하하기 위해 특정 패 순위와 높은 카드를 선언하는 것.
*   **SoT**: 단일 진실 공급원 (Single Source of Truth).
*   **생존 칩 (Survival Chips)**: 플레이어가 "생존"으로 확정되기 위해 지불해야 하는 칩 수 (75개).
*   **참가자 ID (Participant ID)**: `GameParticipants.id` (`Users.id`와 구별됨). FSM `Player.id`가 이것을 참조.

## 6. 미해결 질문 / 모호성

1.  **서버 측 구현 세부 정보**: 문서는 FSM 로직과 DB 스키마를 설명하지만, FSM(예: Supabase Edge Function, 전용 서버)의 실제 서버 측 호스팅/실행 환경 및 Prisma 통합 방식은 개념적입니다. "코드 포인터"는 설계 문서를 참조합니다.
2.  **호스트 마이그레이션 세부 정보**: `assignNewHostIfNeeded`가 언급되었지만, 호스트 마이그레이션의 정확한 메커니즘(예: 가장 먼저 참여, 무작위)은 자세히 설명되어 있지 않습니다.
3.  **타이머 구현**: `story-board.md`의 일부 UI 요소(베팅, 저격)는 타이머를 언급하지만, FSM은 턴 타임아웃에 대한 타이머 이벤트나 처리를 명시적으로 자세히 설명하지 않습니다.
4.  **최대 베팅 계산 뉘앙스**: "칩이 가장 적은 플레이어의 칩의 수보다 많이 진행할 수 없다" (`game-rule.md`: 5)가 주요 규칙입니다. FSM은 `maxBet` 계산을 언급하지만, 특정 예외 케이스(예: 올인이 동일 라운드의 후속 플레이어 최대 베팅에 영향을 미치는 경우)는 더 자세히 설명될 수 있습니다.
5.  **플레이어 재연결**: `PLAYER_DISCONNECT_IN_GAME`이 처리되지만(탈락 암시), 플레이어가 진행 중인 게임에 *재연결*할 가능성이나 메커니즘은 명시되어 있지 않습니다.
6.  **생존자 칩 분배 UI**: FSM은 `handleSurvivorChipDistribution`을 언급하고 `story-board.md`는 UI를 참조하지만, 생존자가 칩을 분배하는 정확한 UI 상호작용 흐름은 상위 수준입니다.
7.  **생존을 위한 "지불" 명확성**: `game-rule.md` 규칙 11은 "칩 75개를 지불하고 생존을 확정짓는다"고 명시합니다. FSM 액션 `checkPlayerSurvivalAndElimination`은 `handleSurvivorChipDistribution`이 *남은* 초과분을 처리하기 *전에* 이 75칩이 플레이어 총계에서 *차감*되도록 보장해야 합니다. 이는 신중한 구현이 필요합니다. (제 생각 과정에서 FSM 노트가 이 차감을 포함하도록 업데이트되었습니다).
8.  **`story-board.md` 대 `fsm.md`의 FSM 상태 이름 지정**: `story-board.md`의 해석과 수정된 `fsm.md` (예: 개인 카드 대 공유 카드 분배 순서) 간에 FSM 상태 이름 지정/순서에 약간의 불일치가 있었습니다. FDD는 `namu-wiki.md` 정렬 후 `fsm.md`의 최신 이해와 일치시키려고 시도합니다.
9.  **기능의 세분성**: 일부 FSM 액션은 더 큰 개념적 기능으로 그룹화됩니다. 더 세분화하면 훨씬 더 많은 FN- 항목이 생성될 수 있지만 개요 가독성이 떨어질 수 있습니다. 현재 수준은 균형을 목표로 합니다.
10. **AI 봇 게임플레이 로직**: `is_ai_bot` 플래그는 존재하지만, AI 봇의 특정 게임플레이 로직이나 의사 결정(튜토리얼 이상으로 플레이하는 경우)은 이 문서에 정의되어 있지 않습니다.
11. **초기 턴 순서 (무작위 이후)**: `game-rule.md` 규칙 3: "게임이 시작되면 카드를 뽑아 순서를 정하고 선부터 시계 방향으로 게임을 진행한다." FSM: "랜덤 또는 이전 라운드 기반". 초기 무작위 순서 이후 후속 라운드의 정확한 방법은 엄격하게 순환하지 않는 경우 더 명시적일 수 있습니다.
12. **저격/베팅을 위한 "선 플레이어" 정의**: 각 단계에서 저격/베팅 액션을 시작하는 사람(예: 호스트 왼쪽 플레이어 또는 이전 팟 승자)을 결정하는 일관성은 FSM의 `bettingOrder`/`snipingOrder` 설정에서 명확해야 합니다. FSM은 저격을 위해 "선 플레이어부터"라고 표시합니다.

이 기능 정의 문서는 제공된 프로젝트 문서를 기반으로 한 포괄적인 단일 진실 공급원 역할을 해야 합니다.
