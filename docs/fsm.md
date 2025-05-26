# 저격 홀덤 Web - XState 상태 머신 설계 (v5)

이 문서는 `game-rule.md`와 `db-schema.md`를 기반으로 "저격 홀덤" 게임의 상태를 제어하기 위한 XState 상태 머신을 설계합니다.
XState V5 문서를 참조하여 작성되었습니다. ([https://stately.ai/docs/](https://stately.ai/docs/))

## 1. 개요

상태 머신은 게임의 전체 흐름을 관리하며, 로비(Lobby)에서 시작하여 게임 진행(GameInProgress) 중 여러 단계를 거쳐 게임 종료(GameEnded) 상태로 전환됩니다.

-   **`id`**: `devilsPlanPokerMachine`
-   **`initial`**: `Lobby`
-   **`context`**: 게임의 현재 상태를 저장하는 데이터 객체입니다. (상세 내용은 아래 `Context 정의` 참조)
-   **`states`**: 주요 상태 노드들을 정의합니다.

## 2. Context 정의

상태 머신의 `context`는 게임 진행에 필요한 모든 데이터를 포함합니다.

```typescript
interface Player {
  id: string; // GameParticipants.id (user_id 아님)
  userId: string; // Users.id
  username: string;
  chips: number;
  status: 'ACTIVE' | 'SURVIVED' | 'ELIMINATED';
  turnOrder: number;
  personalCards: number[]; // [숫자, 숫자]
  finalHand?: { rank: HandRank; cards: number[]; highCard: number };
  isSniped: boolean;
  snipedBy?: string; // sniper's participantId
  snipedRank?: HandRank; // 저격당한 족보
  hasDeclaredSnipe: boolean; // 이번 라운드에 저격을 선언했는지 여부
}

interface SnipeDeclaration {
  sniperId: string; // participantId
  declaredRank: HandRank;
  declaredHighCard: number;
}

interface Bet {
  participantId: string;
  amount: number;
  totalBetInRound: number; // 해당 라운드 누적 베팅 금액
}

// Enum Types from db-schema.md
// type RoomStatus = 'WAITING' | 'PLAYING' | 'FINISHED';
type HandRank = 'HIGH_CARD' | 'ONE_PAIR' | 'TWO_PAIR' | 'TRIPLE' | 'STRAIGHT' | 'FULL_HOUSE' | 'FOUR_OF_A_KIND';
// type GamePhase = 'READY' | 'SHARED_CARD_1' | 'PERSONAL_CARD_1_DRAW' | 'BET_1' | 'SHARED_CARD_2' | 'BET_2' | 'SNIPE' | 'SHOWDOWN' | 'SETTLEMENT';

interface PokerMachineContext {
  roomId?: string; // GameRooms.id
  roomCode?: string; // GameRooms.room_code
  hostId?: string; // GameRooms.host_id (Users.id)
  players: Player[];
  maxPlayers: number; // 기본 6, GameRooms.max_players
  
  currentRoundNumber: number;
  currentRoundId?: string; // GameRounds.id
  currentPlayerTurn?: string; // 현재 턴인 Player.id (participantId)
  
  deck: number[]; // 게임에 사용될 카드 덱 (1-10, 4세트 = 40장)
  sharedCards: number[]; // [숫자, 숫자, 숫자, 숫자]
  potChips: number;
  
  // 베팅 관련
  currentBettingRound: 'BETTING_1' | 'BETTING_2' | null;
  minBet: number; // 기본 1칩, 또는 이전 베팅액
  maxBet: number; // 가장 칩이 적은 플레이어의 칩 수 or 상황에 따른 한도
  lastBetAmount: number; // 현재 베팅 라운드의 마지막 베팅액 (콜 기준)
  betsInCurrentPhase: Bet[]; // 현재 베팅 페이즈의 베팅 기록
  activeBettors: string[]; // 현재 베팅 라운드에 참여 중인 플레이어 ID 목록
  bettingOrder: string[]; // 현재 베팅 라운드의 베팅 순서

  // 저격 관련
  snipesInCurrentRound: SnipeDeclaration[];
  snipingOrder: string[]; // 저격 순서 (선 플레이어부터)
  currentSniper?: string; // 현재 저격 턴인 Player.id

  // 정산 관련
  roundWinner?: string; // Player.id
  isDraw: boolean;
  
  // 게임 설정 관련
  initialChips: number; // 기본 60
  survivalChips: number; // 기본 75

  // 에러/메시지
  errorMessage?: string;
}
```

**초기 Context 값 예시:**

```typescript
const initialContext: PokerMachineContext = {
  players: [],
  maxPlayers: 6,
  currentRoundNumber: 0,
  deck: [], // startGame 시 생성
  sharedCards: [],
  potChips: 0,
  currentBettingRound: null,
  minBet: 1,
  maxBet: 0, // startGame 또는 newRound 시 플레이어 칩 기반으로 계산
  lastBetAmount: 0,
  betsInCurrentPhase: [],
  activeBettors: [],
  bettingOrder: [],
  snipesInCurrentRound: [],
  snipingOrder: [],
  isDraw: false,
  initialChips: 60,
  survivalChips: 75,
};
```

## 3. 상태(States) 및 전환(Transitions)

### 3.1. 최상위 상태 (Root States)

```typescript
{
  id: 'devilsPlanPokerMachine',
  initial: 'Lobby',
  context: initialContext, // 위에서 정의된 초기 컨텍스트
  states: {
    Lobby: { /* ... */ },
    GameInProgress: { /* ... */ },
    GameEnded: { /* ... */ }
  }
}
```

### 3.2. Lobby 상태

-   **설명**: 플레이어들이 게임 시작을 기다리는 대기실 상태입니다.
-   **진입 시 액션 (`entry`)**:
    -   `assignRoomInfo`: (선택적) 방 정보(ID, 코드)를 컨텍스트에 할당.
-   **이벤트 (`on`)**:
    -   `PLAYER_JOIN`:
        -   **가드 (`guard`)**: `canPlayerJoin` (방이 꽉 차지 않았는지, 이미 참여한 유저가 아닌지 등)
        -   **액션 (`actions`)**: `addPlayerToContext`, `broadcastRoomUpdate` (DB 업데이트는 외부에서 처리)
    -   `PLAYER_LEAVE`:
        -   **액션 (`actions`)**: `removePlayerFromContext`, `assignNewHostIfNeeded`, `broadcastRoomUpdate`
    -   `START_GAME`:
        -   **가드 (`guard`)**: `canStartGame` (최소 플레이어 수 충족 등, 예: 2명 이상)
        -   **타겟 (`target`)**: `GameInProgress`
        -   **액션 (`actions`)**: `initializeGameContext` (덱 생성 및 셔플, 플레이어 순서 결정, 초기칩 분배 등), `persistInitialGameSetup` (DB에 `GameRooms.status`='PLAYING', `GameParticipants` 생성 등), `broadcastGameStart`

### 3.3. GameInProgress 상태

-   **설명**: 실제 게임 플레이가 진행되는 상태입니다. 여러 하위 상태를 가집니다.
-   **초기 상태 (`initial`)**: `ReadyToStartRound`
-   **진입 시 액션 (`entry`)**: (START_GAME에서 이미 처리되었을 수 있음)
-   **하위 상태 (`states`)**:
    -   `ReadyToStartRound`: 라운드 시작 준비
    -   `DealingSharedCards1`: 첫 번째 공유 카드 2장 공개
    -   `DealingPersonalCards`: 각 플레이어에게 개인 카드 2장 지급
    -   `Betting1`: 첫 번째 베팅 라운드
    -   `DealingSharedCards2`: 두 번째 공유 카드 2장 공개
    -   `Betting2`: 두 번째 베팅 라운드
    -   `Sniping`: 저격 라운드
    -   `Showdown`: 카드 공개 및 승자 결정
    -   `Settlement`: 칩 정산 및 생존/탈락 처리
-   **공통 이벤트 (`on`)**:
    -   `PLAYER_DISCONNECT_IN_GAME`: (플레이어 연결 끊김 처리)
        -   **액션**: `handlePlayerDisconnect`, `checkForGameEndCondition`
        -   **타겟**: 상황에 따라 `GameEnded` 또는 현재 상태 유지 (예: AI로 대체 또는 턴 스킵)
    -   `FORCE_END_GAME`: (방장 등에 의한 강제 종료)
        -   **타겟**: `GameEnded`
        -   **액션**: `setGameAsFinished`


#### 3.3.1. `ReadyToStartRound` 상태

-   **설명**: 새 라운드를 시작하기 전 준비 단계입니다.
-   **진입 시 액션 (`entry`)**:
    -   `incrementRoundNumber`
    -   `resetRoundContext` (덱 셔플, 공유/개인 카드 초기화, 팟 초기화, 플레이어 상태(isSniped, finalHand 등) 초기화)
    -   `determinePlayerTurnOrderForRound` (랜덤 또는 이전 라운드 기반)
    -   `collectAnte` (모든 `ACTIVE` 플레이어로부터 기본 베팅 1칩씩 팟에 추가)
    -   `persistNewRoundStart` (DB에 `GameRounds` 생성, `GameRooms.current_round_id` 업데이트)
    -   `broadcastRoundStart`
-   **전환**:
    -   항상 (`always`): `DealingSharedCards1` (즉시 다음 상태로)

#### 3.3.2. `DealingSharedCards1` 상태

-   **설명**: 각 `ACTIVE` 플레이어에게 개인 카드 2장을 비공개로 지급합니다.
-   **진입 시 액션 (`entry`)**:
    -   `dealPersonalCardsToPlayers` (덱에서 각 `ACTIVE` 플레이어에게 2장씩 비공개 지급, 컨텍스트 업데이트)
    -   `persistPlayerHands` (DB `PlayerHands` 테이블에 개인 카드 정보 저장)
    -   `broadcastPersonalCardsDealt` (각 플레이어에게 자신의 카드 정보만 전송)
-   **전환**: 항상 (`always`): `DealingSharedCards1`

#### 3.3.3. `DealingPersonalCards` 상태 (규칙 기반: 이 상태가 DealingSharedCards1 보다 먼저)

-   **이전 상태명**: `DealingPersonalCards` (이 상태가 이제 첫 번째 공유 카드 공개를 담당)
-   **설명**: 시스템이 첫 번째 공유 카드 2장을 공개합니다.
-   **진입 시 액션 (`entry`)**:
    -   `dealFirstSharedCards` (덱에서 2장 뽑아 `sharedCards`에 추가, 컨텍스트 업데이트)
    -   `persistSharedCardsUpdate` (DB `GameRounds.shared_card_1` 업데이트 - 참고: DB 스키마는 현재 SharedCards 테이블로 변경됨)
    -   `broadcastSharedCardsUpdate`
-   **전환**: 항상 (`always`): `Betting1`

#### 3.3.4. `Betting1` 상태

-   **설명**: 첫 번째 베팅 라운드.
-   **진입 시 액션 (`entry`)**:
    -   `setupBettingRound` (currentBettingRound='BETTING_1', activeBettors 설정 (ACTIVE 상태인 플레이어), bettingOrder 설정, min/maxBet 계산, lastBetAmount=0, betsInCurrentPhase 초기화)
    -   `setNextPlayerTurnForBetting` (베팅 순서의 첫번째 플레이어로 턴 설정)
    -   `broadcastBettingPhaseStart`
-   **이벤트 (`on`)**:
    -   `PLACE_BET`:
        -   **가드 (`guard`)**: `isBetValidForCurrentPlayer` (현재 턴인 플레이어인지, 베팅액 유효한지 등)
        -   **액션 (`actions`)**:
            -   `processBet` (플레이어 칩 차감, 팟 증가, betsInCurrentPhase에 기록, lastBetAmount 업데이트)
            -   `persistBet` (DB `Bets` 테이블에 기록, `GameParticipants.chips` 업데이트, `GameRounds.pot_chips` 업데이트)
            -   `broadcastPlayerBet`
            -   `setNextPlayerTurnForBetting`
        -   **재진입 (`reenter`):** `false` (같은 상태 내에서 턴만 변경)
    -   `FOLD`: (별도 FOLD 이벤트 대신, 베팅액이 0이거나 콜 금액보다 적으면 FOLD로 간주 가능, 또는 명시적 FOLD)
        -   **가드 (`guard`)**: `isCurrentPlayerTurn`
        -   **액션 (`actions`)**: `processFold` (activeBettors에서 제거), `broadcastPlayerFold`
        -   `setNextPlayerTurnForBetting`
        -   **재진입 (`reenter`):** `false`
-   **조건부 자동 전환 (`always`)**:
    -   **조건 (`cond`)**: `isBettingRoundComplete` (모든 activeBettors가 lastBetAmount만큼 베팅했거나, 한 명 빼고 모두 폴드)
        -   **타겟**: `DealingSharedCards2`
        -   **액션**: `finalizeBettingRoundActions`
    -   **조건 (`cond`)**: `onlyOnePlayerLeftInBetting` (한 명만 남고 모두 폴드)
        -   **타겟**: `Settlement` (즉시 라운드 종료 및 팟 분배)
        -   **액션**: `assignPotToLastPlayer`, `finalizeBettingRoundActions`

#### 3.3.5. `DealingSharedCards2` 상태

-   **설명**: 시스템이 두 번째 공유 카드 2장을 추가로 공개하여 총 4장의 공유 카드가 됩니다.
-   **진입 시 액션 (`entry`)**:
    -   `dealSecondSharedCards` (덱에서 2장 뽑아 `sharedCards`에 추가)
    -   `persistSharedCardsUpdate` (DB `GameRounds.shared_card_2` 업데이트)
    -   `broadcastSharedCardsUpdate`
-   **전환**:
    -   항상 (`always`): `Betting2`

#### 3.3.6. `Betting2` 상태

-   **설명**: 두 번째 베팅 라운드. `Betting1` 상태와 유사하게 동작.
-   **진입 시 액션 (`entry`)**:
    -   `setupBettingRound` (currentBettingRound='BETTING_2', ...)
    -   `setNextPlayerTurnForBetting`
    -   `broadcastBettingPhaseStart`
-   **이벤트 (`on`)**:
    -   `PLACE_BET`: (Betting1과 동일 로직)
    -   `FOLD`: (Betting1과 동일 로직)
-   **조건부 자동 전환 (`always`)**:
    -   **조건 (`cond`)**: `isBettingRoundComplete`
        -   **타겟**: `Sniping`
        -   **액션**: `finalizeBettingRoundActions`
    -   **조건 (`cond`)**: `onlyOnePlayerLeftInBetting`
        -   **타겟**: `Settlement`
        -   **액션**: `assignPotToLastPlayer`, `finalizeBettingRoundActions`

#### 3.3.7. `Sniping` 상태

-   **설명**: 플레이어들이 돌아가며 저격을 선언합니다.
-   **진입 시 액션 (`entry`)**:
    -   `setupSnipingRound` (snipesInCurrentRound 초기화, snipingOrder 설정 (Betting2에 참여한 플레이어들 대상, 선 플레이어부터), currentSniper 설정)
    -   `broadcastSnipingPhaseStart`
-   **이벤트 (`on`)**:
    -   `DECLARE_SNIPE`:
        -   **가드 (`guard`)**: `isSnipeValidForCurrentPlayer` (현재 저격 턴인 플레이어인지, 이미 저격하지 않았는지 등)
        -   **액션 (`actions`)**:
            -   `processSnipeDeclaration` (snipesInCurrentRound에 기록, Player.hasDeclaredSnipe = true)
            -   `persistSnipe` (DB `Snipes` 테이블에 기록)
            -   `broadcastPlayerSnipeDeclaration`
            -   `setNextPlayerTurnForSniping`
        -   **재진입 (`reenter`):** `false`
    -   `PASS_SNIPE`: (저격하지 않고 턴 넘기기)
        -   **가드 (`guard`)**: `isCurrentPlayerTurn`
        -   **액션 (`actions`)**: `setNextPlayerTurnForSniping`, `broadcastPlayerPassSnipe`
        -   **재진입 (`reenter`):** `false`
-   **조건부 자동 전환 (`always`)**:
    -   **조건 (`cond`)**: `isSnipingRoundComplete` (모든 snipingOrder의 플레이어가 저격 또는 패스를 완료)
        -   **타겟**: `Showdown`

#### 3.3.8. `Showdown` 상태

-   **설명**: 모든 생존 플레이어가 카드를 공개하고, 저격 결과를 적용하여 최종 라운드 승자를 결정합니다.
-   **진입 시 액션 (`entry`)**:
    -   `revealAllPersonalCards` (모든 `ACTIVE` 플레이어의 개인 카드를 컨텍스트에 공개적으로 설정)
    -   `calculateAllPlayerHands` (각 `ACTIVE` 플레이어의 공유 카드 + 개인 카드로 최상의 족보 계산, 컨텍스트의 `player.finalHand` 업데이트)
    -   `applySnipes`:
        -   컨텍스트의 `snipesInCurrentRound`를 순회합니다.
        -   각 `snipe`에 대해, 모든 `ACTIVE` 플레이어(`p`)의 `p.finalHand`를 확인합니다.
        -   만약 `p.finalHand.rank === snipe.declaredRank` 이고 `p.finalHand.highCard === snipe.declaredHighCard` 이면:
            -   `p.isSniped = true`로 설정.
            -   `p.snipedBy = snipe.sniperId` (선택적).
            -   `p.snipedRank = snipe.declaredRank` (선택적).
            -   해당 `snipe`는 성공한 것으로 간주 (DB 업데이트 위해 `snipe.is_successful = true` 마킹).
    -   `determineRoundWinner`:
        -   `ACTIVE` 플레이어들 중 `isSniped === false`인 플레이어들 중에서 가장 높은 족보를 가진 플레이어를 찾습니다.
        -   그 다음으로 `isSniped === true`인 플레이어들을 고려합니다 (저격당한 족보는 최하위).
        -   동점자 규칙(`game-rule.md` 및 `namu-wiki.md`의 상세 규칙 참조)을 적용하여 최종 승자(`roundWinner`) 또는 무승부(`isDraw`)를 결정합니다.
    -   `persistShowdownResults` (DB `PlayerHands.final_hand_rank`, `PlayerHands.is_sniped`, `Snipes.is_successful`, `GameRounds.winner_participant_id`, `GameRounds.is_draw` 등 업데이트)
    -   `broadcastShowdownResults` (모든 카드, 족보, 저격 성공 여부, 라운드 승자 정보 포함)
-   **전환**:
    -   항상 (`always`): `Settlement`

#### 3.3.9. `Settlement` 상태

-   **설명**: 라운드 승자에게 팟의 칩을 분배하고, 각 플레이어의 생존/탈락 여부를 확인합니다.
-   **진입 시 액션 (`entry`)**:
    -   `distributePotToWinner` (`roundWinner`에게 `potChips` 추가, 무승부 시 규칙에 따라 분배. 컨텍스트 `Player.chips` 업데이트)
    -   `persistChipChanges` (DB `GameParticipants.chips` 업데이트)
    -   `checkPlayerSurvivalAndElimination`:
        -   각 플레이어의 칩 확인.
        -   75칩 이상이면 `Player.status = 'SURVIVED'`, `GameParticipants.status`, `survived_at` 업데이트.
        -   칩이 0개 이하이고 생존하지 못한 플레이어는 `Player.status = 'ELIMINATED'`, `GameParticipants.status`, `eliminated_at` 업데이트.
    -   `updateUserStatistics` (라운드 결과, 승패, 저격 성공/실패 등 DB `UserStatistics` 업데이트)
    -   `handleSurvivorChipDistribution`: (생존자가 발생한 경우 실행)
        -   생존 확정한 플레이어가 75칩을 초과하여 보유한 경우, 초과분을 다른 플레이어에게 분배합니다.
        -   분배 시, 칩이 0개인 플레이어에게는 최소 1개의 칩을 주어야 합니다. (`game-rule.md`, `namu-wiki.md` 규칙 참조)
        -   분배 로직은 UI를 통해 생존자가 직접 선택하거나, 미리 정해진 규칙(예: 남은 플레이어에게 균등 분배)을 따를 수 있습니다.
        -   분배 결과에 따라 `Player.chips` 컨텍스트 및 DB `GameParticipants.chips`를 업데이트합니다.
    -   `broadcastSettlementUpdate`
    -   `checkForGameEndCondition`:
        -   `ACTIVE` 상태인 플레이어가 1명 이하이거나, 모든 플레이어가 `SURVIVED` 또는 `ELIMINATED` 상태가 되면 게임 종료.
-   **조건부 자동 전환 (`always`)**:
    -   **조건 (`cond`)**: `isGameOver`
        -   **타겟**: `GameEnded`
    -   **조건 (`cond`)**: `!isGameOver` (게임 계속)
        -   **타겟**: `ReadyToStartRound` (다음 라운드 준비)
        -   **액션**: `prepareForNextRound` (필요시 딜러 버튼 이동 등)

### 3.4. GameEnded 상태

-   **설명**: 게임이 최종적으로 종료된 상태입니다.
-   **타입 (`type`)**: `final` (이 머신의 최종 상태)
-   **진입 시 액션 (`entry`)**:
    -   `determineFinalWinner` (생존자 중 최종 승자 결정 또는 룰에 따른 처리)
    -   `persistGameEnd` (DB `GameRooms.status = 'FINISHED'` 업데이트)
    -   `broadcastGameEndResults` (최종 순위, 승자 등)
    -   `cleanupGameContext` (선택적: 메모리 정리)
-   **출력 데이터 (`output`)**: (선택적) 게임 결과 요약 데이터 반환 가능.
    ```typescript
    output: ({ context }) => ({
      roomId: context.roomId,
      winners: context.players.filter(p => p.status === 'SURVIVED'), // 또는 최종 승자 1명
      fullPlayerStats: context.players,
    })
    ```

## 4. 액션 (Actions) 정의 예시

XState의 `actions` 필드에 실제 함수들을 매핑합니다. `assign`을 사용하여 컨텍스트를 업데이트합니다.

```typescript
import { assign } from 'xstate';

const pokerMachine = createMachine({
  // ... id, initial, context ...
  states: { /* ... */ },
}, {
  actions: {
    initializeGameContext: assign((context, event) => {
      // 덱 생성 및 셔플 로직
      // 플레이어 순서 결정 로직 (랜덤)
      // 각 플레이어 초기 칩 할당 및 상태 설정
      // GameRounds.round_number = 1
      // ...
      return {
        ...context,
        deck: shuffleDeck(createDeck()),
        players: event.players.map((p, index) => ({
          ...p,
          chips: context.initialChips,
          status: 'ACTIVE',
          turnOrder: index + 1, // 임시, 실제로는 랜덤 또는 방장부터
          personalCards: [],
          isSniped: false,
          hasDeclaredSnipe: false,
        })),
        currentRoundNumber: 1,
        potChips: 0, // Ante는 ReadyToStartRound에서
        // ... 기타 초기화
      };
    }),
    // ... 기타 액션들 ...
    addPlayerToContext: assign({
      players: ({ context, event }) => [...context.players, event.player]
    }),
    removePlayerFromContext: assign({
      players: ({ context, event }) => context.players.filter(p => p.id !== event.playerId)
    }),
    collectAnte: assign((context) => {
      let newPotChips = context.potChips;
      const updatedPlayers = context.players.map(player => {
        if (player.status === 'ACTIVE') {
          newPotChips += 1; // 기본 베팅 1칩
          return { ...player, chips: player.chips - 1 };
        }
        return player;
      });
      return { ...context, players: updatedPlayers, potChips: newPotChips };
    }),
    // ... (processBet, processSnipeDeclaration, determineRoundWinner 등 상세 구현) ...
    // DB Persist 액션들은 실제로는 Supabase client를 호출하는 side effect가 될 것입니다.
    // XState에서는 이런 side effect를 invoke service로 처리하거나, 
    // action에서 직접 호출 후 결과를 이벤트로 보내 머신을 업데이트 할 수 있습니다.
    // 여기서는 개념적으로만 명시합니다.
    persistInitialGameSetup: (context, event) => { /* DB 업데이트 로직 */ },
    broadcastRoomUpdate: (context, event) => { /* Supabase Realtime Broadcast 로직 */ },
  },
  guards: {
    canPlayerJoin: (context, event) => {
      return context.players.length < context.maxPlayers && 
             !context.players.some(p => p.userId === event.player.userId);
    },
    canStartGame: (context, event) => {
      return context.players.length >= 2; // 최소 2명
    },
    isBetValidForCurrentPlayer: (context, event) => {
      const player = context.players.find(p => p.id === context.currentPlayerTurn);
      if (!player || player.id !== event.playerId) return false;
      // 추가 베팅 금액 유효성 검사 (칩 보유량, min/maxBet 등)
      return true;
    },
    isBettingRoundComplete: (context, event) => {
      // 모든 activeBettors가 lastBetAmount만큼 베팅했는지 또는 폴드했는지 확인
      // 또는 activeBettors가 1명만 남았는지 확인
      return true; // 실제 로직 구현 필요
    },
    isSnipingRoundComplete: (context, event) => {
      // 모든 snipingOrder의 플레이어가 저격 또는 패스를 완료했는지 확인
      return context.snipingOrder.every(playerId => 
        context.players.find(p => p.id === playerId)?.hasDeclaredSnipe || 
        context.snipesInCurrentRound.some(s => s.sniperId === playerId && s.declaredRank === null) // PASS_SNIPE를 null rank로 기록한다면
      );
    },
    isGameOver: (context, event) => {
      const activePlayers = context.players.filter(p => p.status === 'ACTIVE');
      const survivedPlayers = context.players.filter(p => p.status === 'SURVIVED');
      if (activePlayers.length <= 1) return true;
      // 모든 플레이어가 생존 또는 탈락한 경우도 게임 종료 조건이 될 수 있음
      // (예: 마지막 1명이 생존 확정하고 나머지가 탈락)
      if (activePlayers.length === 0 && survivedPlayers.length > 0) return true;
      return false;
    },
    // ... 기타 가드들 ...
  }
});
```

## 5. 주요 이벤트 (Events)

플레이어 액션, 시스템 액션, 시간 초과 등으로 인해 발생하는 이벤트들입니다.

-   `PLAYER_JOIN`: `{ type: 'PLAYER_JOIN', player: NewPlayerInfo }`
-   `PLAYER_LEAVE`: `{ type: 'PLAYER_LEAVE', playerId: string }`
-   `START_GAME`: `{ type: 'START_GAME', players: InitialPlayerInfo[] }` (Lobby에서 초기 플레이어 목록 전달)
-   `PLACE_BET`: `{ type: 'PLACE_BET', playerId: string, amount: number }`
-   `FOLD`: `{ type: 'FOLD', playerId: string }` (또는 베팅액으로 FOLD 판정)
-   `DECLARE_SNIPE`: `{ type: 'DECLARE_SNIPE', sniperId: string, targetId?: string, declaredRank: HandRank, declaredHighCard: number }`
-   `PASS_SNIPE`: `{ type: 'PASS_SNIPE', playerId: string }`
-   `PLAYER_DISCONNECT_IN_GAME`: `{ type: 'PLAYER_DISCONNECT_IN_GAME', playerId: string }`
-   `FORCE_END_GAME`: `{ type: 'FORCE_END_GAME' }`
-   `(시스템 내부 이벤트)`: 카드 분배 완료, 승자 결정 완료 등은 액션 실행 후 `always` 트랜지션으로 처리.

## 6. 참고: 카드 및 족보 처리

-   **카드**: 1~10 숫자. 4세트. 총 40장. (예: `[1,1,1,1, 2,2,2,2, ..., 10,10,10,10]`)
-   **족보 계산**: 6장(공유 4 + 개인 2)으로 만들 수 있는 최고 조합. `game-rule.md` 7번 항목 참조.
    -   `hand_rank` Enum (`HIGH_CARD`, `ONE_PAIR`, ...) 사용.
    -   동점자 규칙은 `game-rule.md` 10번 항목 참조.
-   **저격 처리**: `game-rule.md` 8, 9번 항목 참조. 저격당한 족보는 최하위.

## 7. 연동 고려사항 (DB 및 실시간 통신)

-   **DB 업데이트**: 상태 전환 시 실행되는 액션 내에서 또는 해당 액션이 완료된 후 (예: `invoke` 사용) DB 스키마에 맞게 데이터를 `PERSIST` 해야 합니다. (예: `GameRooms.status`, `GameParticipants.chips`, `GameRounds`, `Bets`, `Snipes` 등)
-   **실시간 통신 (Supabase Realtime)**: 주요 상태 변경, 플레이어 액션, 카드 공개 등은 `BROADCAST` 액션을 통해 클라이언트들에게 전파되어야 합니다.
    -   XState 액션 내에서 직접 Supabase 클라이언트를 호출하여 브로드캐스트 실행.
    -   민감한 정보(예: 다른 플레이어의 개인 카드)는 해당 플레이어에게만 전달하거나 서버에서 필터링 후 전달.

이 설계는 게임의 핵심 로직을 XState로 관리하기 위한 기본 구조입니다. 실제 구현 시에는 각 액션과 가드의 세부 로직, 에러 처리, 타임아웃 등을 추가적으로 고려해야 합니다. 