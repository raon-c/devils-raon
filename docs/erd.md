# 저격 홀덤 Web - ERD (Entity Relationship Diagram)

이 문서는 `db-schema.md`의 데이터베이스 스키마를 기반으로 작성된 ERD입니다. MermaidJS 형식을 사용하여 표현되었습니다.

```mermaid
erDiagram
    Users {
        UUID id PK "사용자 고유 ID"
        VARCHAR username "사용자 닉네임 (UNIQUE, NOT NULL)"
        TIMESTAMPTZ created_at "계정 생성 시각 (NOT NULL, DEFAULT NOW())"
        TIMESTAMPTZ updated_at "계정 정보 수정 시각 (NOT NULL, DEFAULT NOW())"
        BOOLEAN is_ai_bot "AI 튜토리얼 봇 여부 (NOT NULL, DEFAULT FALSE)"
    }

    GameRooms {
        UUID id PK "게임 방 고유 ID"
        VARCHAR room_code "방 참가 코드 (UNIQUE, NOT NULL)"
        UUID host_id FK "방장 사용자 ID (REFERENCES Users(id))"
        room_status status "방 상태 (NOT NULL, DEFAULT 'WAITING')"
        INTEGER max_players "최대 플레이어 수 (NOT NULL, DEFAULT 6, CHECK 2-6)"
        BOOLEAN is_public "공개 방 여부 (NOT NULL, DEFAULT TRUE)"
        TIMESTAMPTZ created_at "방 생성 시각 (NOT NULL, DEFAULT NOW())"
        TIMESTAMPTZ updated_at "방 정보 수정 시각 (NOT NULL, DEFAULT NOW())"
        UUID current_round_id "현재 진행 중인 라운드 ID (REFERENCES GameRounds(id) ON DELETE SET NULL)"
    }

    GameParticipants {
        UUID id PK "참여자 고유 ID"
        UUID room_id FK "참여한 게임 방 ID (REFERENCES GameRooms(id) ON DELETE CASCADE)"
        UUID user_id FK "사용자 ID (REFERENCES Users(id) ON DELETE CASCADE)"
        INTEGER chips "현재 보유 칩 (NOT NULL, DEFAULT 60)"
        player_status status "플레이어 상태 (NOT NULL, DEFAULT 'ACTIVE')"
        INTEGER turn_order "게임 내 순서"
        TIMESTAMPTZ joined_at "방 참여 시각 (NOT NULL, DEFAULT NOW())"
        TIMESTAMPTZ survived_at "생존 확정 시각"
        TIMESTAMPTZ eliminated_at "탈락 시각"
    }

    GameRounds {
        UUID id PK "라운드 고유 ID"
        UUID room_id FK "해당 라운드가 속한 게임 방 ID (REFERENCES GameRooms(id) ON DELETE CASCADE)"
        INTEGER round_number "방 내에서의 라운드 순서 (NOT NULL)"
        game_phase phase "현재 라운드 진행 단계 (NOT NULL, DEFAULT 'READY')"
        INTEGER pot_chips "현재 라운드 베팅된 총 칩 (NOT NULL, DEFAULT 0)"
        INTEGER_ARRAY shared_card_1 "첫 번째 공유 카드 2장"
        INTEGER_ARRAY shared_card_2 "두 번째 공유 카드 2장"
        TIMESTAMPTZ created_at "라운드 시작 시각 (NOT NULL, DEFAULT NOW())"
        TIMESTAMPTZ ended_at "라운드 종료 시각"
        UUID winner_participant_id FK "라운드 최종 승리자 ID (REFERENCES GameParticipants(id) ON DELETE SET NULL)"
        BOOLEAN is_draw "무승부 여부 (NOT NULL, DEFAULT FALSE)"
    }

    PlayerHands {
        UUID id PK "핸드 고유 ID"
        UUID round_id FK "해당 핸드가 속한 라운드 ID (REFERENCES GameRounds(id) ON DELETE CASCADE)"
        UUID participant_id FK "해당 핸드의 플레이어 ID (REFERENCES GameParticipants(id) ON DELETE CASCADE)"
        INTEGER personal_card_1 "첫 번째 개인 카드 (NOT NULL)"
        INTEGER personal_card_2 "두 번째 개인 카드 (NOT NULL)"
        hand_rank final_hand_rank "최종 결정된 족보"
        INTEGER_ARRAY final_hand_cards "최종 족보 구성 카드 (최대 5장)"
        BOOLEAN is_sniped "저격 당했는지 여부 (NOT NULL, DEFAULT FALSE)"
        TIMESTAMPTZ created_at "핸드 생성(카드 지급) 시각 (NOT NULL, DEFAULT NOW())"
    }

    Bets {
        UUID id PK "베팅 기록 고유 ID"
        UUID round_id FK "해당 베팅이 속한 라운드 ID (REFERENCES GameRounds(id) ON DELETE CASCADE)"
        UUID participant_id FK "베팅한 플레이어 ID (REFERENCES GameParticipants(id) ON DELETE CASCADE)"
        INTEGER bet_amount "베팅한 칩 개수 (NOT NULL, CHECK > 0)"
        game_phase bet_phase "베팅이 이루어진 단계 (NOT NULL, CHECK ('BET_1' or 'BET_2'))"
        TIMESTAMPTZ created_at "베팅 시각 (NOT NULL, DEFAULT NOW())"
    }

    Snipes {
        UUID id PK "저격 기록 고유 ID"
        UUID round_id FK "해당 저격이 속한 라운드 ID (REFERENCES GameRounds(id) ON DELETE CASCADE)"
        UUID sniper_id FK "저격을 한 플레이어 ID (REFERENCES GameParticipants(id) ON DELETE CASCADE)"
        UUID target_id FK "저격 대상 플레이어 ID (REFERENCES GameParticipants(id) ON DELETE CASCADE, NULLABLE)"
        hand_rank declared_rank "선언한 족보 (NOT NULL)"
        INTEGER declared_high_card "선언한 족보의 가장 높은 숫자 (NOT NULL)"
        BOOLEAN is_successful "저격 성공 여부"
        TIMESTAMPTZ created_at "저격 시각 (NOT NULL, DEFAULT NOW())"
    }

    Users ||--o{ GameRooms : "hosts"
    Users ||--o{ GameParticipants : "participates_in"
    GameRooms ||--o{ GameParticipants : "has_participants"
    GameRooms ||--o{ GameRounds : "has_rounds"
    GameRounds ||--o{ PlayerHands : "contains_hands_for"
    GameRounds ||--o{ Bets : "has_bets_in"
    GameRounds ||--o{ Snipes : "has_snipes_in"
    GameParticipants ||--o{ PlayerHands : "has_hand_in_round"
    GameParticipants ||--o{ Bets : "makes_bet"
    GameParticipants ||--o{ Snipes : "declares_snipe_as_sniper"
    GameParticipants ||--o{ Snipes : "is_target_of_snipe"
    GameRounds }o--|| GameRooms : "current_round_for_room"
    GameParticipants }o--|| GameRounds : "winner_of_round"

```

**엔티티 설명:**

*   **Users**: 사용자 계정 정보
*   **GameRooms**: 게임 방 정보
*   **GameParticipants**: 게임 방에 참여한 플레이어 정보 (어떤 유저가 어떤 방에 어떤 상태로 있는지)
*   **GameRounds**: 게임 방 내에서 진행되는 각 라운드의 정보
*   **PlayerHands**: 라운드별 플레이어의 개인 카드 및 최종 패 정보
*   **Bets**: 라운드별 베팅 기록
*   **Snipes**: 라운드별 저격 기록

**관계 설명:**

*   `Users` (1) : (N) `GameRooms` (한 명의 유저는 여러 방의 방장일 수 있음 - host_id)
*   `Users` (1) : (N) `GameParticipants` (한 명의 유저는 여러 방에 참여자로 존재 가능)
*   `GameRooms` (1) : (N) `GameParticipants` (하나의 게임 방은 여러 참여자를 가짐)
*   `GameRooms` (1) : (N) `GameRounds` (하나의 게임 방은 여러 라운드를 가짐)
*   `GameRounds` (1) : (N) `PlayerHands` (하나의 라운드는 여러 플레이어의 패 정보를 가짐)
*   `GameRounds` (1) : (N) `Bets` (하나의 라운드는 여러 베팅 기록을 가짐)
*   `GameRounds` (1) : (N) `Snipes` (하나의 라운드는 여러 저격 기록을 가짐)
*   `GameParticipants` (1) : (N) `PlayerHands` (한 참여자는 여러 라운드에 걸쳐 패 정보를 가질 수 있음)
*   `GameParticipants` (1) : (N) `Bets` (한 참여자는 여러 베팅을 할 수 있음)
*   `GameParticipants` (1) : (N) `Snipes` (한 참여자는 여러 저격을 할 수 있음 - sniper_id)
*   `GameParticipants` (0..1) : (N) `Snipes` (한 참여자는 여러 번 저격 대상이 될 수 있음 - target_id, NULL 허용)
*   `GameRounds` (0..1) -- `GameRooms` (하나의 게임방은 현재 진행중인 라운드 정보를 가질 수 있음 - current_round_id)
*   `GameParticipants` (0..1) -- `GameRounds` (하나의 라운드는 승리자 정보를 가질 수 있음 - winner_participant_id)

**표기법:**

*   `PK`: Primary Key
*   `FK`: Foreign Key
*   `||--o{`: One-to-Many
*   `}o--||`: Many-to-One (화살표 방향으로 읽을 때)

**참고:**

*   Enum 타입들 (`room_status`, `player_status`, `hand_rank`, `game_phase`)은 각 테이블의 컬럼 타입으로 사용되며, ERD에서는 컬럼 설명에 명시했습니다.
*   UNIQUE 제약 조건 등은 `db-schema.md`에 상세히 명시되어 있으며, ERD에서는 주석으로 간략히 표시하거나 생략했습니다.
*   `INTEGER_ARRAY`는 `INTEGER[]` (PostgreSQL 배열 타입)을 의미합니다.

이 ERD는 데이터베이스의 구조와 테이블 간의 관계를 시각적으로 이해하는 데 도움을 줄 것입니다. 