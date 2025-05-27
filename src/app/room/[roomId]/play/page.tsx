import { Metadata } from "next";
import { notFound } from "next/navigation";

interface GamePlayPageProps {
  params: {
    roomId: string;
  };
}

export async function generateMetadata({
  params,
}: GamePlayPageProps): Promise<Metadata> {
  return {
    title: `게임 진행 중 - 방 ${params.roomId} - 저격 홀덤`,
    description: "저격 홀덤 게임이 진행 중입니다.",
  };
}

export default function GamePlayPage({ params }: GamePlayPageProps) {
  const { roomId } = params;

  // 방 코드 유효성 검사
  if (!roomId || roomId.length !== 5 || !/^[A-Z]{5}$/.test(roomId)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 게임 헤더 */}
        <div className="flex justify-between items-center mb-6 bg-black/20 rounded-lg p-4">
          <div className="text-white">
            <h1 className="text-xl font-bold">저격 홀덤</h1>
            <p className="text-sm opacity-80">방 코드: {roomId}</p>
          </div>
          <div className="text-white text-right">
            <p className="text-sm opacity-80">라운드 1</p>
            <p className="font-semibold">베팅 라운드 1</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
          {/* 왼쪽: 플레이어 정보 */}
          <div className="col-span-3 space-y-4">
            <h2 className="text-white font-semibold mb-4">플레이어</h2>

            {/* 플레이어 카드들 */}
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={`bg-white/10 backdrop-blur rounded-lg p-4 border-2 ${i === 0 ? "border-yellow-400" : "border-transparent"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">
                    플레이어{i + 1}
                  </span>
                  {i === 0 && (
                    <span className="text-yellow-400 text-xs">내 턴</span>
                  )}
                </div>
                <div className="text-white/80 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>칩:</span>
                    <span className="font-mono">45개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>베팅:</span>
                    <span className="font-mono">5개</span>
                  </div>
                  <div className="text-xs text-green-400">ACTIVE</div>
                </div>
              </div>
            ))}
          </div>

          {/* 중앙: 게임 보드 */}
          <div className="col-span-6 flex flex-col">
            {/* 공유 카드 영역 */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <h3 className="text-white font-semibold mb-4">공유 카드</h3>
              <div className="flex space-x-4 mb-8">
                {/* 공개된 공유 카드 */}
                <div className="w-16 h-24 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">7</div>
                    <div className="text-red-600">♥</div>
                  </div>
                </div>
                <div className="w-16 h-24 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-black">10</div>
                    <div className="text-black">♠</div>
                  </div>
                </div>

                {/* 아직 공개되지 않은 카드 */}
                <div className="w-16 h-24 bg-blue-900 rounded-lg flex items-center justify-center shadow-lg border-2 border-dashed border-white/30">
                  <span className="text-white/50 text-xs">?</span>
                </div>
                <div className="w-16 h-24 bg-blue-900 rounded-lg flex items-center justify-center shadow-lg border-2 border-dashed border-white/30">
                  <span className="text-white/50 text-xs">?</span>
                </div>
              </div>

              {/* 팟 (총 베팅액) */}
              <div className="bg-yellow-600 rounded-full px-6 py-3 mb-4">
                <div className="text-center text-white">
                  <div className="text-sm">팟</div>
                  <div className="text-xl font-bold">20 칩</div>
                </div>
              </div>
            </div>

            {/* 내 개인 카드 */}
            <div className="bg-black/30 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3 text-center">
                내 카드
              </h4>
              <div className="flex justify-center space-x-4">
                <div className="w-16 h-24 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">A</div>
                    <div className="text-red-600">♦</div>
                  </div>
                </div>
                <div className="w-16 h-24 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-black">K</div>
                    <div className="text-black">♣</div>
                  </div>
                </div>
              </div>
              <div className="text-center mt-2">
                <span className="text-white/80 text-sm">현재 예상 족보: </span>
                <span className="text-yellow-400 font-semibold">하이카드</span>
              </div>
            </div>
          </div>

          {/* 오른쪽: 액션 및 정보 */}
          <div className="col-span-3 space-y-4">
            {/* 액션 버튼들 */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="text-white font-semibold mb-4">액션</h3>
              <div className="space-y-3">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded font-medium">
                  체크
                </button>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium">
                  베팅
                </button>
                <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded font-medium">
                  레이즈
                </button>
                <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded font-medium">
                  폴드
                </button>
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded font-medium">
                  저격
                </button>
              </div>
            </div>

            {/* 베팅 금액 조절 */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">베팅 금액</h4>
              <input
                type="range"
                min="1"
                max="45"
                defaultValue="5"
                className="w-full mb-2"
              />
              <div className="flex justify-between text-white/80 text-sm">
                <span>1</span>
                <span className="font-semibold">5 칩</span>
                <span>45 (올인)</span>
              </div>
            </div>

            {/* 게임 로그 */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-4 flex-1">
              <h4 className="text-white font-semibold mb-3">게임 로그</h4>
              <div className="space-y-2 text-sm text-white/80 max-h-40 overflow-y-auto">
                <p>• 플레이어1이 5칩을 베팅했습니다.</p>
                <p>• 플레이어2가 콜했습니다.</p>
                <p>• 플레이어3이 폴드했습니다.</p>
                <p>• 공유 카드 2장이 공개되었습니다.</p>
                <p>• 베팅 라운드 1이 시작되었습니다.</p>
              </div>
            </div>

            {/* 나가기 버튼 */}
            <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded font-medium">
              게임 나가기
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
