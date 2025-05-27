import Link from "next/link";

export default function RoomNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-900 p-4">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white/10 backdrop-blur rounded-lg p-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-white mb-4">
            방을 찾을 수 없습니다
          </h1>
          <p className="text-white/80 mb-6">
            입력하신 방 코드가 올바르지 않거나 존재하지 않는 방입니다.
          </p>
          <div className="space-y-3">
            <p className="text-white/70 text-sm">
              방 코드는 5자리 영문 대문자여야 합니다. (예: ABCDE)
            </p>
            <div className="space-y-3">
              <Link
                href="/lobby"
                className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-6 rounded-lg font-semibold"
              >
                메인 로비로 돌아가기
              </Link>
              <Link
                href="/"
                className="block w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground py-3 px-6 rounded-lg font-semibold"
              >
                홈으로 가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
