import { Metadata } from "next";

export const metadata: Metadata = {
  title: "메인 로비 - 저격 홀덤",
  description: "게임 방을 만들거나 참여하여 저격 홀덤을 즐겨보세요.",
};

export default function LobbyPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">저격 홀덤 로비</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 방 만들기 섹션 */}
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-4">새 게임 시작</h2>
            <p className="text-muted-foreground mb-4">
              새로운 게임 방을 만들고 친구들을 초대하세요.
            </p>
            <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium">
              방 만들기
            </button>
          </div>

          {/* 방 참여 섹션 */}
          <div className="bg-card rounded-lg p-6 border">
            <h2 className="text-xl font-semibold mb-4">게임 참여</h2>
            <p className="text-muted-foreground mb-4">
              방 코드를 입력하여 친구의 게임에 참여하세요.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="방 코드 입력 (예: ABCDE)"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={5}
              />
              <button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md font-medium">
                방 참여하기
              </button>
            </div>
          </div>
        </div>

        {/* 활성 방 목록 (MVP 이후) */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">활성 게임 방</h2>
          <div className="text-center text-muted-foreground py-8">
            <p>현재 참여 가능한 공개 방이 없습니다.</p>
            <p className="text-sm mt-2">
              방을 만들거나 방 코드로 참여해보세요!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
