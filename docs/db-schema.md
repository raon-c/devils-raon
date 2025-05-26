# 저격 홀덤 Web - 상세 DB 스키마

이 문서는 `prd.md`와 `game-rule.md`를 기반으로 설계된 상세 데이터베이스 스키마입니다.

## 목차

1.  [Enum Types](#enum-types)
2.  [Tables](#tables)
    *   [Users](#users)
    *   [GameRooms](#gamerooms)
    *   [GameParticipants](#gameparticipants)
    *   [GameRounds](#gamerounds)
    *   [PlayerHands](#playerhands)
    *   [Bets](#bets)
    *   [Snipes](#snipes)

## Enum Types

### `room_status`

-   `WAITING` (대기 중)
-   `PLAYING` (게임 중)
-   `FINISHED` (게임 종료)

### `player_status`

-   `ACTIVE` (게임 중)
-   `SURVIVED` (생존 확정)
-   `ELIMINATED` (탈락)
-   `OBSERVING` (관전 중)

### `hand_rank` (족보)

-   `HIGH_CARD`
-   `ONE_PAIR`
-   `TWO_PAIR`
-   `TRIPLE`
-   `STRAIGHT`
-   `FULL_HOUSE`
-   `FOUR_OF_A_KIND`

### `game_phase` (게임 라운드 상태 - XState와 동기화)

-   `READY` (라운드 준비)
-   `DEAL_PERSONAL_CARDS` (개인 카드 2장 지급)
-   `REVEAL_SHARED_CARDS_1` (첫 번째 공유 카드 2장 공개)
-   `BETTING_1` (첫 번째 베팅)
-   `REVEAL_SHARED_CARDS_2` (두 번째 공유 카드 2장 공개)
-   `BETTING_2` (두 번째 베팅)
-   `SNIPING` (저격)
-   `SHOWDOWN` (결과 공개)
-   `SETTLEMENT` (정산)

## Tables

### Users

사용자 계정 정보

| Column        | Type           | Constraints                     | Description                                   |
|---------------|----------------|---------------------------------|-----------------------------------------------|
| `id`          | `UUID`         | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | 사용자 고유 ID (Supabase Auth `auth.users.id`와 연결) |
| `username`    | `VARCHAR(255)` | `UNIQUE`, `NOT NULL`            | 사용자 닉네임                                 |
| `created_at`  | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT NOW()`     | 계정 생성 시각                                |
| `updated_at`  | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT NOW()`     | 계정 정보 수정 시각                           |
| `is_ai_bot`   | `BOOLEAN`      | `NOT NULL`, `DEFAULT FALSE`     | AI 튜토리얼 봇 여부                           |

### GameRooms

게임 방 정보

| Column        | Type           | Constraints                     | Description                               |
|---------------|----------------|---------------------------------|-------------------------------------------|
| `id`          | `UUID`         | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | 게임 방 고유 ID                           |
| `room_code`   | `VARCHAR(8)`   | `UNIQUE`, `NOT NULL`            | 사용자가 입력하는 방 참가 코드 (생성 시 랜덤 부여) |
| `host_id`     | `UUID`         | `NOT NULL`, `REFERENCES Users(id)` | 방장 사용자 ID                            |
| `status`      | `room_status`  | `NOT NULL`, `DEFAULT 'WAITING'` | 방 상태 (WAITING, PLAYING, FINISHED)      |
| `max_players` | `INTEGER`      | `NOT NULL`, `DEFAULT 6`, `CHECK (max_players >= 2 AND max_players <= 6)` | 최대 플레이어 수                        |
| `is_public`   | `BOOLEAN`      | `NOT NULL`, `DEFAULT TRUE`      | 공개 방 여부 (향후 로비 기능 확장을 위함)   |
| `created_at`  | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT NOW()`     | 방 생성 시각                              |
| `updated_at`  | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT NOW()`     | 방 정보 수정 시각                         |
| `current_round_id` | `UUID`    | `REFERENCES GameRounds(id) ON DELETE SET NULL` | 현재 진행 중인 라운드 ID                 |

### GameParticipants

게임 방에 참여한 플레이어 정보

| Column         | Type           | Constraints                     | Description                                     |
|----------------|----------------|---------------------------------|-------------------------------------------------|
| `id`           | `UUID`         | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | 참여자 고유 ID                                  |
| `room_id`      | `UUID`         | `NOT NULL`, `REFERENCES GameRooms(id) ON DELETE CASCADE` | 참여한 게임 방 ID                             |
| `user_id`      | `UUID`         | `NOT NULL`, `REFERENCES Users(id) ON DELETE CASCADE`    | 사용자 ID                                     |
| `chips`        | `INTEGER`      | `NOT NULL`, `DEFAULT 60`        | 현재 보유 칩 개수 (게임 시작 시 60개)           |
| `status`       | `player_status`| `NOT NULL`, `DEFAULT 'ACTIVE'`  | 플레이어 상태 (ACTIVE, SURVIVED, ELIMINATED, OBSERVING) |
| `turn_order`   | `INTEGER`      |                                 | 게임 내 순서 (랜덤 배정)                        |
| `joined_at`    | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT NOW()`     | 방 참여 시각                                  |
| `survived_at`  | `TIMESTAMPTZ`  |                                 | 생존 확정 시각 (75칩 이상 달성 시)              |
| `eliminated_at`| `TIMESTAMPTZ`  |                                 | 탈락 시각                                     |
| `UNIQUE (room_id, user_id)`    |                                 |                                                 | 한 사용자는 한 방에 한 번만 참여 가능           |
| `UNIQUE (room_id, turn_order)` |                                 |                                                 | 한 방 내에서 순서는 고유해야 함                 |


### GameRounds

게임 라운드 정보

| Column         | Type           | Constraints                     | Description                               |
|----------------|----------------|---------------------------------|-------------------------------------------|
| `id`           | `UUID`         | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()` | 라운드 고유 ID                            |
| `room_id`      | `UUID`         | `NOT NULL`, `REFERENCES GameRooms(id) ON DELETE CASCADE` | 해당 라운드가 속한 게임 방 ID               |
| `round_number` | `INTEGER`      | `NOT NULL`                      | 방 내에서의 라운드 순서 (1부터 시작)        |
| `phase`        | `game_phase`   | `NOT NULL`, `DEFAULT 'READY'`   | 현재 라운드 진행 단계                       |
| `pot_chips`    | `INTEGER`      | `NOT NULL`, `DEFAULT 0`         | 현재 라운드에 베팅된 총 칩 (판돈)         |
| `shared_card_1`| `INTEGER[]`    |                                 | 첫 번째 공개된 공유 카드 2장 (숫자 배열)   |
| `shared_card_2`| `INTEGER[]`    |                                 | 두 번째 공개된 공유 카드 2장 (숫자 배열)   |
| `created_at`   | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT NOW()`     | 라운드 시작 시각                          |
| `ended_at`     | `TIMESTAMPTZ`  |                                 | 라운드 종료 시각                          |
| `winner_participant_id` | `UUID` | `REFERENCES GameParticipants(id) ON DELETE SET NULL` | 라운드 최종 승리자 ID                      |
| `is_draw`      | `BOOLEAN`      | `NOT NULL`, `DEFAULT FALSE`     | 무승부 여부                               |
| `UNIQUE (room_id, round_number)` |                               |                                           | 한 방 내에서 라운드 번호는 고유해야 함    |

### PlayerHands

라운드별 플레이어의 개인 카드 및 최종 족보 정보

| Column             | Type          | Constraints                                       | Description                                   |
|--------------------|---------------|---------------------------------------------------|-----------------------------------------------|
| `id`               | `UUID`        | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()`       | 핸드 고유 ID                                  |
| `round_id`         | `UUID`        | `NOT NULL`, `REFERENCES GameRounds(id) ON DELETE CASCADE` | 해당 핸드가 속한 라운드 ID                    |
| `participant_id`   | `UUID`        | `NOT NULL`, `REFERENCES GameParticipants(id) ON DELETE CASCADE` | 해당 핸드의 플레이어 ID                     |
| `personal_card_1`  | `INTEGER`     | `NOT NULL`                                        | 첫 번째 개인 카드 숫자                          |
| `personal_card_2`  | `INTEGER`     | `NOT NULL`                                        | 두 번째 개인 카드 숫자                          |
| `final_hand_rank`  | `hand_rank`   |                                                   | 최종 결정된 족보                              |
| `final_hand_cards` | `INTEGER[]`   |                                                   | 최종 족보를 구성하는 카드 숫자 배열 (최대 5장)  |
| `is_sniped`        | `BOOLEAN`     | `NOT NULL`, `DEFAULT FALSE`                       | 저격 당했는지 여부                            |
| `created_at`       | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()`                       | 핸드 생성(카드 지급) 시각                     |
| `UNIQUE (round_id, participant_id)` |                                                 |                                               | 한 라운드에 플레이어당 하나의 핸드만 존재 가능    |

### Bets

라운드별 베팅 기록

| Column           | Type           | Constraints                                     | Description                               |
|------------------|----------------|-------------------------------------------------|-------------------------------------------|
| `id`             | `UUID`         | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()`     | 베팅 기록 고유 ID                         |
| `round_id`       | `UUID`         | `NOT NULL`, `REFERENCES GameRounds(id) ON DELETE CASCADE` | 해당 베팅이 속한 라운드 ID                  |
| `participant_id` | `UUID`         | `NOT NULL`, `REFERENCES GameParticipants(id) ON DELETE CASCADE` | 베팅한 플레이어 ID                        |
| `bet_amount`     | `INTEGER`      | `NOT NULL`, `CHECK (bet_amount > 0)`          | 베팅한 칩 개수                            |
| `bet_phase`      | `game_phase`   | `NOT NULL`, `CHECK (bet_phase IN ('BETTING_1', 'BETTING_2'))` | 베팅이 이루어진 단계 (`BETTING_1` 또는 `BETTING_2`) |
| `created_at`     | `TIMESTAMPTZ`  | `NOT NULL`, `DEFAULT NOW()`                     | 베팅 시각                                 |

### Snipes

라운드별 저격 기록

| Column             | Type          | Constraints                                        | Description                               |
|--------------------|---------------|----------------------------------------------------|-------------------------------------------|
| `id`               | `UUID`        | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()`        | 저격 기록 고유 ID                         |
| `round_id`         | `UUID`        | `NOT NULL`, `REFERENCES GameRounds(id) ON DELETE CASCADE` | 해당 저격이 속한 라운드 ID                  |
| `sniper_id`        | `UUID`        | `NOT NULL`, `REFERENCES GameParticipants(id) ON DELETE CASCADE` | 저격을 한 플레이어 ID                     |
| `declared_rank`    | `hand_rank`   | `NOT NULL`                                         | 선언한 족보                               |
| `declared_high_card`| `INTEGER`    | `NOT NULL`                                         | 선언한 족보의 가장 높은 숫자                |
| `is_successful`    | `BOOLEAN`     |                                                    | 저격 성공 여부 (쇼다운 후 결정)             |
| `created_at`       | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()`                        | 저격 시각                                 |

---

**참고:**

*   모든 `TIMESTAMPTZ` 타입은 UTC 기준으로 저장하는 것을 권장합니다.
*   카드 표현: `INTEGER` 타입으로 1부터 10까지의 숫자를 저장합니다. 카드 세트(모양) 정보는 게임 로직 상 구별할 필요가 없어 스키마에서 제외했습니다. (PRD: "1-10 숫자·4세트")
*   `uuid_generate_v4()` 함수 사용을 위해서는 PostgreSQL `uuid-ossp` 확장 모듈이 필요할 수 있습니다. Supabase에서는 기본 제공됩니다.
*   `FOREIGN KEY` 제약 조건에 `ON DELETE CASCADE` 또는 `ON DELETE SET NULL`을 적절히 사용하여 데이터 무결성을 유지합니다.
*   `GameRooms`의 `current_round_id`는 게임 재접속 시 현재 라운드 정보를 빠르게 로드하기 위해 추가했습니다. 