import { Metadata } from "next";
import { notFound } from "next/navigation";

interface GameResultsPageProps {
  params: {
    roomId: string;
  };
}

export async function generateMetadata({
  params,
}: GameResultsPageProps): Promise<Metadata> {
  return {
    title: `게임 결과 - 방 ${params.roomId} - 저격 홀덤`,
    description: "게임이 종료되었습니다. 결과를 확인해보세요.",
  };
}

export default function GameResultsPage({ params }: GameResultsPageProps) {
  const { roomId } = params;

  // 방 코드 유효성 검사
  if (!roomId || roomId.length !== 5 || !/^[A-Z]{5}$/.test(roomId)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 게임 종료 헤더 */}
        <div className="text-center mb-8">
          <div className="bg-white/10 backdrop-blur rounded-lg p-8 mb-6">
            <h1 className="text-4xl font-bold text-white mb-4">
              🎉 게임 종료 🎉
            </h1>
            <p className="text-white/80 text-lg">방 코드: {roomId}</p>
          </div>
        </div>

        {/* 승자 발표 */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-6 mb-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">🏆 승리자 🏆</h2>
          <div className="text-3xl font-bold text-white mb-2">플레이어1</div>
          <div className="text-white/90">최종 칩: 150개</div>
        </div>

        {/* 최종 순위 */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-6 text-center">
            최종 순위
          </h3>
          <div className="space-y-4">
            {/* 1위 */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4 border border-yellow-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">
                      플레이어1
                    </div>
                    <div className="text-white/70 text-sm">승리</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-lg">150 칩</div>
                  <div className="text-green-400 text-sm">+100</div>
                </div>
              </div>
            </div>

            {/* 2위 */}
            <div className="bg-white/5 rounded-lg p-4 border border-gray-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">2</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">
                      플레이어2
                    </div>
                    <div className="text-white/70 text-sm">생존</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-lg">75 칩</div>
                  <div className="text-green-400 text-sm">+25</div>
                </div>
              </div>
            </div>

            {/* 3위 */}
            <div className="bg-white/5 rounded-lg p-4 border border-orange-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">3</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">
                      플레이어3
                    </div>
                    <div className="text-white/70 text-sm">탈락</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-lg">0 칩</div>
                  <div className="text-red-400 text-sm">-50</div>
                </div>
              </div>
            </div>

            {/* 4위 */}
            <div className="bg-white/5 rounded-lg p-4 border border-red-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">4</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">
                      플레이어4
                    </div>
                    <div className="text-white/70 text-sm">탈락</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-lg">0 칩</div>
                  <div className="text-red-400 text-sm">-50</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 게임 통계 */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4 text-center">
            게임 통계
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">12</div>
              <div className="text-white/70 text-sm">총 라운드</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">8</div>
              <div className="text-white/70 text-sm">저격 시도</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">45분</div>
              <div className="text-white/70 text-sm">게임 시간</div>
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="grid md:grid-cols-2 gap-4">
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground py-4 px-6 rounded-lg font-semibold text-lg">
            같은 멤버로 새 게임 시작
          </button>
          <button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground py-4 px-6 rounded-lg font-semibold text-lg">
            메인 로비로 돌아가기
          </button>
        </div>

        {/* 공유하기 */}
        <div className="mt-8 text-center">
          <p className="text-white/70 mb-4">
            게임 결과를 친구들과 공유해보세요!
          </p>
          <div className="flex justify-center space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              트위터 공유
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
              카카오톡 공유
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">
              링크 복사
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
