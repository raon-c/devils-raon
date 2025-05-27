import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "저격 홀덤 웹 - 실시간 멀티플레이어 카드 게임",
  description:
    "넷플릭스 데블스 플랜에 등장한 저격 홀덤을 웹에서 즐겨보세요. 친구들과 함께 실시간으로 플레이할 수 있습니다.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            저격 홀덤 웹
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
            넷플릭스 〈데블스 플랜〉에 등장한 그 게임을
            <br />
            친구들과 함께 실시간으로 즐겨보세요
          </p>
          <Link href="/lobby">
            <Button size="lg" className="text-lg px-8 py-4">
              게임 시작하기
            </Button>
          </Link>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              저격 시스템
            </h3>
            <p className="text-white/70">
              족보와 숫자를 선언하여 상대방의 패를 무력화하는 독특한 전략 요소
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🃏</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              간소화된 카드
            </h3>
            <p className="text-white/70">
              1-10 숫자 카드만 사용하여 누구나 쉽게 배우고 즐길 수 있습니다
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-white mb-3">
              실시간 플레이
            </h3>
            <p className="text-white/70">
              지연 시간 없는 실시간 동기화로 몰입감 있는 게임 경험을 제공
            </p>
          </div>
        </div>

        {/* How to Play Section */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            게임 방법
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">1</span>
              </div>
              <h4 className="font-semibold text-white mb-2">방 만들기</h4>
              <p className="text-white/70 text-sm">
                새 게임 방을 만들거나 친구의 방에 참여하세요
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">2</span>
              </div>
              <h4 className="font-semibold text-white mb-2">카드 받기</h4>
              <p className="text-white/70 text-sm">
                개인 카드 2장과 공유 카드 4장으로 게임 진행
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">3</span>
              </div>
              <h4 className="font-semibold text-white mb-2">베팅 & 저격</h4>
              <p className="text-white/70 text-sm">
                베팅하고 저격으로 상대방을 견제하세요
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-bold">4</span>
              </div>
              <h4 className="font-semibold text-white mb-2">생존 & 승리</h4>
              <p className="text-white/70 text-sm">
                75개 칩으로 생존하거나 최후까지 살아남으세요
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            지금 바로 시작하기
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Link href="/lobby" className="flex-1">
              <Button className="w-full" size="lg">
                방 만들기
              </Button>
            </Link>
            <Link href="/lobby" className="flex-1">
              <Button variant="outline" className="w-full" size="lg">
                방 참여하기
              </Button>
            </Link>
          </div>
          <p className="text-white/60 text-sm mt-4">
            회원가입 없이 닉네임만으로 바로 시작할 수 있습니다
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/60 text-sm">
            © 2024 저격 홀덤 웹. 넷플릭스 〈데블스 플랜〉 게임을 모티브로
            제작되었습니다.
          </p>
        </div>
      </footer>
    </main>
  );
}
