import { Metadata } from "next";
import { notFound } from "next/navigation";

interface RoomPageProps {
  params: {
    roomId: string;
  };
}

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  return {
    title: `게임 방 ${params.roomId} - 저격 홀덤`,
    description: "게임 시작을 기다리는 중입니다.",
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = params;

  // 방 코드 유효성 검사 (5자리 영문 대문자)
  if (!roomId || roomId.length !== 5 || !/^[A-Z]{5}$/.test(roomId)) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 방 정보 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">게임 대기실</h1>
          <div className="bg-muted rounded-lg p-4 inline-block">
            <p className="text-sm text-muted-foreground mb-1">방 코드</p>
            <p className="text-2xl font-mono font-bold tracking-wider">
              {roomId}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              친구들에게 이 코드를 공유하세요
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 플레이어 목록 */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">참여 플레이어 (1/6)</h2>
            <div className="space-y-3">
              {/* 방장 */}
              <div className="bg-card rounded-lg p-4 border border-primary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-semibold">
                        방
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">플레이어1</p>
                      <p className="text-sm text-muted-foreground">방장</p>
                    </div>
                  </div>
                  <div className="text-green-600 text-sm font-medium">
                    준비 완료
                  </div>
                </div>
              </div>

              {/* 빈 슬롯들 */}
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="bg-muted/50 rounded-lg p-4 border-2 border-dashed border-muted"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-muted-foreground text-sm">
                        {i + 2}
                      </span>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        플레이어 대기 중...
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 게임 설정 및 액션 */}
          <div className="space-y-6">
            {/* 게임 설정 */}
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="font-semibold mb-3">게임 설정</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">최소 인원:</span>
                  <span>2명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">최대 인원:</span>
                  <span>6명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">시작 칩:</span>
                  <span>50개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">생존 칩:</span>
                  <span>75개</span>
                </div>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="space-y-3">
              {/* 방장만 보이는 게임 시작 버튼 */}
              <button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-md font-medium"
                disabled={true} // 최소 인원 미달 시 비활성화
              >
                게임 시작 (최소 2명 필요)
              </button>

              {/* 나가기 버튼 */}
              <button className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md font-medium">
                방 나가기
              </button>
            </div>

            {/* 초대 링크 공유 */}
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-sm">친구 초대</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/room/${roomId}`}
                  readOnly
                  className="flex-1 px-2 py-1 text-xs bg-background border rounded"
                />
                <button className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90">
                  복사
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 게임 규칙 요약 (접을 수 있는 섹션) */}
        <div className="mt-12">
          <details className="bg-card rounded-lg border">
            <summary className="p-4 cursor-pointer font-medium hover:bg-muted/50">
              게임 규칙 요약 보기
            </summary>
            <div className="px-4 pb-4 text-sm text-muted-foreground space-y-2">
              <p>• 각 플레이어는 50개의 칩으로 시작합니다.</p>
              <p>
                • 개인 카드 2장과 공유 카드 4장으로 최고의 5장 조합을 만드세요.
              </p>
              <p>
                • 저격 시스템: 특정 족보와 숫자를 선언하여 상대방의 패를
                무력화할 수 있습니다.
              </p>
              <p>• 75개의 칩을 모으면 생존이 확정됩니다.</p>
              <p>• 마지막까지 남은 플레이어가 승리합니다.</p>
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}
