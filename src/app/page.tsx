export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">저격 홀덤 Web</h1>
      <div className="space-y-4">
        <input 
          type="text" 
          placeholder="닉네임 입력" 
          className="p-2 border rounded text-black"
        />
        <button className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          방 만들기
        </button>
        <div className="flex space-x-2">
          <input 
            type="text" 
            placeholder="방 코드 입력" 
            className="p-2 border rounded flex-grow text-black"
          />
          <button className="p-2 bg-green-500 text-white rounded hover:bg-green-600">
            참가하기
          </button>
        </div>
      </div>
    </main>
  );
} 