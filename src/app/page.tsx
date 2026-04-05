import CharacterSearch from "@/components/CharacterSearch";

export default function Home() {
  return (
    <main className="min-h-screen px-0 py-8 md:p-24 flex flex-col items-center selection:bg-gold selection:text-black">
      <div className="w-full max-w-2xl mb-12 text-center mt-10 md:mt-20 px-4 md:px-0">
        <div className="inline-block px-3 py-1 mb-4 rounded-full border border-gold/30 bg-gold/10 text-gold text-sm font-medium">
          Lost Ark Open API
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
          망고네&nbsp;
          <span className="text-[#58C7F3] drop-shadow-[0_0_10px_rgba(88,199,243,0.25)]">로스트아크</span>&nbsp;
          <span className="text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.4)] ml-1">정보 검색</span>
        </h1>
        <p className="text-gray-400 text-lg">
          캐릭터의 클래스, 레벨, 장비 정보를 확인하세요
        </p>
      </div>
      
      <CharacterSearch />
    </main>
  );
}
