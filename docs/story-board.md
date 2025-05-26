# 저격 홀덤 Web - 스토리보드

이 문서는 `prd.md`, `game-rule.md`, `db-schema.md`, `fsm.md`, `erd.md`를 기반으로 "저격 홀덤" 웹 게임의 사용자 경험 흐름을 나타낸 스토리보드입니다.

## 1. 게임 시작 및 로비 (Lobby)

### 1.1. 메인 화면 (초기 접속)

*   **화면 구성**:
    *   게임 로고 / 제목 ("저격 홀덤 Web")
    *   닉네임 입력 필드 (또는 자동 생성 후 수정 가능)
    *   [방 만들기] 버튼
    *   [방 참가하기] 버튼 (방 코드 입력 필드와 함께)
*   **사용자 액션**:
    *   닉네임 입력/수정.
    *   [방 만들기] 클릭 → 1.2. 방 만들기 플로우로 이동.
    *   방 코드 입력 후 [방 참가하기] 클릭 → 1.3. 방 참가하기 플로우로 이동.
*   **시스템 반응 / FSM 상태**:
    *   초기 상태. FSM은 아직 특정 방과 연결되지 않음.
    *   닉네임은 로컬 저장 또는 임시 세션으로 관리.

### 1.2. 방 만들기

*   **사용자 액션**: 메인 화면에서 [방 만들기] 버튼 클릭.
*   **시스템 반응**:
    *   서버에 방 생성 요청 (API 호출).
    *   서버는 고유한 방 코드 생성 (`GameRooms` 테이블에 새 레코드 생성, `host_id`에 현재 유저 할당).
    *   생성된 방 코드를 클라이언트에 반환.
    *   클라이언트는 자동으로 해당 방의 로비(1.4)로 이동.
*   **FSM 상태 변화**:
    *   새로운 게임 머신 인스턴스 생성 또는 기존 인스턴스에 방 정보 할당.
    *   `Lobby` 상태로 진입 (`assignRoomInfo` 액션 실행).
    *   `PLAYER_JOIN` 이벤트 발생 (방장 자신 참여 처리, `addPlayerToContext` 액션).

### 1.3. 방 참가하기

*   **사용자 액션**: 메인 화면에서 방 코드 입력 후 [방 참가하기] 버튼 클릭.
*   **시스템 반응**:
    *   입력된 방 코드로 서버에 방 존재 유무 및 참가 가능 여부 확인 (API 호출).
    *   성공 시: 해당 방의 로비(1.4)로 이동.
    *   실패 시: 오류 메시지 표시 (예: "존재하지 않는 방입니다.", "방이 가득 찼습니다.").
*   **FSM 상태 변화** (성공 시):
    *   기존 게임 머신 인스턴스에 방 정보 할당 (만약 해당 방의 FSM이 이미 서버에 있다면 해당 FSM에 연결).
    *   `Lobby` 상태.
    *   `PLAYER_JOIN` 이벤트 발생 (`canPlayerJoin` 가드 통과 후 `addPlayerToContext` 액션).

### 1.4. 게임 대기방 (로비 UI)

*   **FSM 상태**: `Lobby`
*   **화면 구성**:
    *   방 코드 표시.
    *   현재 참여 플레이어 목록 (닉네임, 방장 표시).
    *   [게임 시작] 버튼 (방장에게만 보임).
    *   [나가기] 버튼.
    *   (선택적) 최대 플레이어 수, 공개/비공개 설정 등 방 설정 (방장).
    *   (선택적) 채팅창.
*   **사용자 액션**:
    *   **방장**: [게임 시작] 버튼 클릭.
        *   **시스템 반응**: `START_GAME` 이벤트 발생.
        *   **FSM**: `canStartGame` 가드 통과 시 `GameInProgress` 상태로 전환. `initializeGameContext`, `persistInitialGameSetup`, `broadcastGameStart` 액션 실행.
    *   **모든 플레이어**: [나가기] 버튼 클릭.
        *   **시스템 반응**: `PLAYER_LEAVE` 이벤트 발생.
        *   **FSM**: `removePlayerFromContext`, `assignNewHostIfNeeded` (만약 나간 사람이 방장이면), `broadcastRoomUpdate` 액션 실행. 방에 아무도 없으면 방 삭제 고려.
*   **시스템 반응 (실시간)**:
    *   다른 플레이어 참가/퇴장 시 플레이어 목록 즉시 업데이트 (`broadcastRoomUpdate` 수신).

## 2. 게임 진행 (GameInProgress)

### 2.1. 라운드 시작 및 카드 분배

*   **FSM 상태**: `GameInProgress` → `ReadyToStartRound` → `DealingSharedCards1` → `DealingPersonalCards` (FSM 설계에 따라 순서 유의)
    *   PRD: `Ready` → `Shared card 1` → `drawing personal card 1`
    *   fsm.md (규칙 기반): `ReadyToStartRound` → (`dealPersonalCardsToPlayers`) → `DealingSharedCards1` → (`dealFirstSharedCards`) → `DealingPersonalCards` (이 부분은 fsm.md에서 `DealingSharedCards1`이 개인카드 지급, `DealingPersonalCards`가 공유카드1 지급으로 명명되어 혼동의 여지가 있어 보임. PRD/규칙 일관성 필요. 여기서는 **개인카드 2장 받고 -> 공유카드1 2장 공개** 순서로 가정)
*   **화면 구성**:
    *   "라운드 N 시작" 알림.
    *   자신의 개인 카드 2장 표시 (다른 플레이어에게는 뒷면).
    *   공유 카드 영역 (처음엔 비어있음).
    *   플레이어별 칩 정보, 현재 턴 표시, 팟 정보.
    *   기본 베팅(Ante)으로 인해 칩이 차감되고 팟에 쌓이는 애니메이션/표시.
*   **사용자 액션**: 없음 (자동 진행).
*   **시스템 반응**:
    *   `collectAnte` 실행: 각 플레이어 칩 1개 차감, 팟 증가.
    *   `dealPersonalCardsToPlayers`: 각자에게 개인 카드 2장 전달 (UI는 자신의 것만 보이도록).
    *   `dealFirstSharedCards`: 공유 카드 2장 순차적 또는 동시에 공개.
    *   `broadcast...` 액션들을 통해 각 단계별 정보 전달.
*   **다음 상태**: `Betting1` (자동 전환). `setupBettingRound`, `setNextPlayerTurnForBetting` 액션 실행. 첫 번째 베팅 플레이어 턴.

### 2.2. 베팅 라운드 (Betting1, Betting2)

*   **FSM 상태**: `Betting1` 또는 `Betting2`.
*   **화면 구성**:
    *   현재 턴인 플레이어 강조 표시.
    *   자신의 턴일 때:
        *   베팅 옵션 버튼: [베팅], [콜], [체크], [폴드], [레이즈] (게임 상황에 따라 활성화/비활성화).
        *   베팅 금액 입력 슬라이더 또는 버튼 (최소/최대 베팅액(`minBet`, `maxBet`) 표시).
        *   타이머 (제한 시간 있는 경우).
    *   다른 플레이어 턴일 때: 대기 상태, 다른 플레이어 액션 관찰.
    *   플레이어별 베팅 금액, 남은 칩, 팟 정보 실시간 업데이트.
    *   베팅 히스토리 또는 현재 라운드 베팅 상태 요약 (토스트 메시지 또는 별도 영역).
*   **사용자 액션 (자신의 턴)**:
    *   [베팅]/[레이즈] 클릭 후 금액 확정:
        *   **시스템 반응**: `PLACE_BET` 이벤트 (금액과 함께).
        *   **FSM**: `isBetValidForCurrentPlayer` 가드. `processBet`, `persistBet`, `broadcastPlayerBet`, `setNextPlayerTurnForBetting` 액션.
    *   [콜] 클릭:
        *   **시스템 반응**: `PLACE_BET` 이벤트 (콜 금액과 함께).
        *   **FSM**: (위와 동일)
    *   [체크] 클릭 (앞선 베팅이 없을 때):
        *   **시스템 반응**: `PLACE_BET` 이벤트 (0 베팅, 또는 `CHECK` 이벤트).
        *   **FSM**: `setNextPlayerTurnForBetting`.
    *   [폴드] 클릭:
        *   **시스템 반응**: `FOLD` 이벤트.
        *   **FSM**: `processFold`, `broadcastPlayerFold`, `setNextPlayerTurnForBetting`.
*   **시스템 반응 (자동 전환)**:
    *   베팅 라운드 종료 조건 충족 시 (`isBettingRoundComplete` 가드):
        *   `Betting1` → `DealingSharedCards2` (액션: `finalizeBettingRoundActions`).
        *   `Betting2` → `Sniping` (액션: `finalizeBettingRoundActions`).
    *   한 명 빼고 모두 폴드 시 (`onlyOnePlayerLeftInBetting` 가드):
        *   → `Settlement` (액션: `assignPotToLastPlayer`).
*   **다음 상태**: `DealingSharedCards2` (Betting1 이후) 또는 `Sniping` (Betting2 이후) 또는 `Settlement`.

### 2.3. 추가 공유 카드 공개 (DealingSharedCards2)

*   **FSM 상태**: `DealingSharedCards2`.
*   **화면 구성**: Betting1과 유사하나, 추가 공유 카드 2장이 더 공개됨 (총 4장).
*   **사용자 액션**: 없음 (자동 진행).
*   **시스템 반응**:
    *   `dealSecondSharedCards`: 추가 공유 카드 2장 공개.
    *   `broadcastSharedCardsUpdate`.
*   **다음 상태**: `Betting2` (자동 전환). `setupBettingRound` 액션 실행.

### 2.4. 저격 라운드 (Sniping)

*   **FSM 상태**: `Sniping`.
*   **화면 구성**:
    *   현재 저격 턴인 플레이어 강조.
    *   자신의 턴일 때:
        *   [저격하기] 버튼, [패스] 버튼.
        *   저격 시: UI 모달 또는 팝업
            *   저격할 족보 선택 (드롭다운/버튼).
            *   저격할 족보의 가장 높은 숫자 선택 (드롭다운/입력).
            *   [확인] / [취소] 버튼.
    *   다른 플레이어들의 저격 선언 내용 간략히 표시 (예: "Player A가 7 스트레이트를 저격했습니다.").
    *   타이머 (제한 시간 있는 경우).
*   **사용자 액션 (자신의 턴)**:
    *   [저격하기] 선택 후 족보, 숫자 입력 후 [확인]:
        *   **시스템 반응**: `DECLARE_SNIPE` 이벤트.
        *   **FSM**: `isSnipeValidForCurrentPlayer` 가드. `processSnipeDeclaration`, `persistSnipe`, `broadcastPlayerSnipeDeclaration`, `setNextPlayerTurnForSniping` 액션.
    *   [패스] 클릭:
        *   **시스템 반응**: `PASS_SNIPE` 이벤트.
        *   **FSM**: `setNextPlayerTurnForSniping`, `broadcastPlayerPassSnipe` 액션.
*   **시스템 반응 (자동 전환)**:
    *   모든 플레이어가 저격/패스 완료 시 (`isSnipingRoundComplete` 가드):
        *   → `Showdown`.
*   **다음 상태**: `Showdown`.

### 2.5. 쇼다운 (Showdown)

*   **FSM 상태**: `Showdown`.
*   **화면 구성**:
    *   모든 생존 플레이어의 개인 카드 공개 애니메이션.
    *   각 플레이어의 최종 6장 카드 및 확정된 족보 표시 (예: "Player A: 7 풀하우스 [7,7,7,2,2,1]").
    *   저격 결과 표시:
        *   성공한 저격: "Player C가 Player A의 7 풀하우스를 저격 성공! Player A의 족보는 최하위가 됩니다."
        *   실패한 저격: "Player D의 저격 실패!"
    *   최종 라운드 승자 강조 표시.
*   **사용자 액션**: 없음 (결과 관찰).
*   **시스템 반응**:
    *   `revealAllPersonalCards`, `calculateAllPlayerHands`, `applySnipes`, `determineRoundWinner`, `persistShowdownResults`, `broadcastShowdownResults` 액션 순차 실행.
*   **다음 상태**: `Settlement` (자동 전환).

### 2.6. 정산 및 생존/탈락 처리 (Settlement)

*   **FSM 상태**: `Settlement`.
*   **화면 구성**:
    *   팟의 칩이 승자에게 이동하는 애니메이션.
    *   각 플레이어의 칩 변화 명확히 표시.
    *   **생존 확정 시**: "Player X 생존 확정! (75칩 지불)" 알림.
        *   남은 칩 분배 UI: (규칙 11) 생존 확정자가 남은 칩을 다른 플레이어에게 분배. UI 필요 (대상 선택, 분배량 입력). 0개인 플레이어에게 최소 1개.
    *   **탈락 시**: "Player Y 탈락!" 알림. 해당 플레이어 UI 비활성화 또는 관전 모드로 전환 표시.
    *   현재 생존자/탈락자/활동 중인 플레이어 상태 요약.
*   **사용자 액션**: (생존 확정자의 칩 분배 시) 대상 및 금액 선택 후 확인.
*   **시스템 반응**:
    *   `distributePotToWinner`, `persistChipChanges`.
    *   `checkPlayerSurvivalAndElimination`: 플레이어 상태 업데이트 (ACTIVE, SURVIVED, ELIMINATED).
        *   생존 확정 시 관련 DB 업데이트, 칩 분배 로직 트리거.
    *   `updateUserStatistics` (최소 기능에서는 제외 가능).
    *   `broadcastSettlementUpdate`.
    *   `checkForGameEndCondition` 실행.
*   **다음 상태**: `isGameOver` 가드 결과에 따라:
    *   `GameEnded` (게임 종료 조건 충족 시).
    *   `ReadyToStartRound` (게임 계속 시).

## 3. 게임 종료 (GameEnded)

*   **FSM 상태**: `GameEnded` (final state).
*   **화면 구성**:
    *   "게임 종료!" 메시지.
    *   최종 승자(들) 표시 (예: "최후의 생존자: Player A").
    *   (선택적) 최종 순위, 플레이어별 상세 결과.
    *   [새 게임 시작] 버튼 (방장에게만 표시)
    *   [메인으로 돌아가기] 버튼
*   **사용자 액션**:
    *   [새 게임 시작] 또는 [메인으로 돌아가기] 클릭.
*   **시스템 반응**:
    *   `determineFinalWinner`, `persistGameEnd`, `broadcastGameEndResults` 액션 실행.
    *   (새 게임) 로비 상태로 재설정 또는 (메인으로) 초기 화면으로 이동.

---
이 스토리보드는 주요 화면과 상호작용 흐름을 정의하며, 실제 UI/UX 디자인 단계에서 더 구체화될 수 있습니다. 