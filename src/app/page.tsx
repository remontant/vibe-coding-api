import CharacterSearch from "@/components/CharacterSearch";

export default function Home() {
  return (
    <main className="min-h-screen p-8 md:p-24 flex flex-col items-center selection:bg-gold selection:text-black">
      <div className="w-full max-w-2xl mb-12 text-center mt-10 md:mt-20">
        <div className="inline-block px-3 py-1 mb-4 rounded-full border border-gold/30 bg-gold/10 text-gold text-sm font-medium">
          Lost Ark Open API
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          로스트아크 <span className="text-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">정보 검색</span>
        </h1>
        <p className="text-gray-400 text-lg">
          캐릭터의 클래스, 레벨, 장비 정보를 확인하세요
        </p>
      </div>
      
      <CharacterSearch />
    </main>
  );
}
