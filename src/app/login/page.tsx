export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">로그인</h1>
      <div className="space-y-4 w-full max-w-md">
        <input 
          type="email" 
          placeholder="이메일" 
          className="w-full p-3 border rounded text-black"
        />
        <input 
          type="password" 
          placeholder="비밀번호" 
          className="w-full p-3 border rounded text-black"
        />
        <button className="w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600">
          로그인
        </button>
        <hr className="my-4" />
        <p className="text-center text-gray-600">
          테스트용 로그인 페이지입니다.
        </p>
        <a 
          href="/" 
          className="block w-full p-3 bg-gray-500 text-white rounded hover:bg-gray-600 text-center"
        >
          홈으로 돌아가기 (인증 우회)
        </a>
      </div>
    </main>
  );
} 