import { useState, useEffect } from 'react';
import { getCharacterData } from '@/app/actions';

function SiblingCard({ char, isSearched, onCharacterClick }: { char: any, isSearched: boolean, onCharacterClick: (name: string) => void }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getCharacterData(char.CharacterName, 'profiles').then(res => {
      if (isMounted && res?.data?.CharacterImage) {
        setImageUrl(res.data.CharacterImage);
      }
    });
    return () => { isMounted = false; };
  }, [char.CharacterName]);

  return (
    <div 
      className={`flex items-center gap-3 p-4 rounded-xl border transition-colors cursor-pointer group ${
        isSearched 
          ? 'bg-[#362626] border-[#ff7f7f]/50' 
          : 'bg-[#282222] border-[#3a3030] hover:bg-[#332929] hover:border-[#4a3d3d]'
      }`}
      onClick={() => onCharacterClick(char.CharacterName)}
    >
      {/* 캐릭터 아바타 얼굴 크롭 */}
      <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-[#443a3a] bg-[#1a1818]">
        {imageUrl ? (
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: '550%',
              // 퍼센트(%) 값이 작을수록(0%에 가까울수록) 원본 이미지의 '윗부분(머리 꼭대기)'이 보입니다.
              // 퍼센트(%) 값이 클수록 이미지의 '아랫부분(몸통)'이 보입니다.
              // 요즈족(도화가 등)의 이미지가 위로 올라가게(머리 쪽이 더 보이게) 하려면 25% -> 15% 이런 식으로 숫자를 줄이시면 됩니다.
              backgroundPosition: ['도화가', '기상술사', '환수사'].includes(char.CharacterClassName) 
                ? 'center 31%' 
                : 'center 15%',
              backgroundRepeat: 'no-repeat'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600">
            <svg className="w-6 h-6 opacity-50 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 flex justify-between items-center min-w-0">
        <div className="flex flex-col gap-1 min-w-0">
          <span className={`text-[15px] font-bold truncate transition-colors ${
            isSearched ? 'text-white' : 'text-gray-100 group-hover:text-white'
          }`}>
            {char.CharacterName}
          </span>
          <span className="text-[#e67070] text-sm font-medium">
            {char.ItemAvgLevel}
          </span>
        </div>
        
        <div className="flex flex-col gap-1 items-end shrink-0 pl-2">
          <span className="text-[11px] text-gray-500">
            Lv.{char.CharacterLevel}
          </span>
          <span className="text-xs text-gray-300">
            {char.CharacterClassName}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SiblingsTab({ data, characterName, onCharacterClick }: { data: any, characterName: string, onCharacterClick: (name: string) => void }) {
  if (!Array.isArray(data)) return <div className="text-gray-500 text-sm">데이터가 없습니다.</div>;

  const serverGroups: Record<string, any[]> = {};
  data.forEach((char: any) => {
    if (!serverGroups[char.ServerName]) serverGroups[char.ServerName] = [];
    serverGroups[char.ServerName].push({
      ...char,
      itemLevelNum: parseFloat(char.ItemAvgLevel.replace(/,/g, '')) || 0
    });
  });

  const serverNames = Object.keys(serverGroups).sort((a, b) => {
    // 1순위: 캐릭터 수 내림차순 (가장 많은 서버가 위로)
    if (serverGroups[b].length !== serverGroups[a].length) {
      return serverGroups[b].length - serverGroups[a].length;
    }
    // 2순위: 캐릭터 수가 같다면 서버 이름 가나다순
    return a.localeCompare(b);
  });

  const totalServers = serverNames.length;
  const totalChars = data.length;

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 타이틀 영역 */}
      <div className="flex justify-between items-center mb-2 px-2">
        <h3 className="text-xl font-bold text-white">원정대 캐릭터</h3>
        <div className="text-sm text-gray-400">
          <span className="text-gray-500">{totalServers}개 서버</span> <span className="text-[#ff7f7f] ml-1">{totalChars}캐릭터</span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {serverNames.map((server) => {
          const chars = serverGroups[server];
          chars.sort((a, b) => b.itemLevelNum - a.itemLevelNum);

          return (
            <div key={server} className="flex flex-col bg-[#1a1818] rounded-xl border border-[#332b2b] overflow-hidden">
              {/* 서버명 헤더 */}
              <div className="bg-[#221c1c] px-5 py-4 flex justify-between items-center border-b border-[#332b2b]">
                <div className="flex items-center gap-2">
                  <span className="text-[#ff7f7f] font-bold text-base">{server}</span>
                  <span className="text-gray-400 text-sm">{chars.length}캐릭터</span>
                </div>
                <span className="text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </span>
              </div>
              
              {/* 캐릭터 카드 그리드 (3단) */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 bg-[#1e1a1a]">
                {chars.map((char, i) => {
                  const isSearched = char.CharacterName === characterName;
                  return (
                    <SiblingCard 
                      key={i} 
                      char={char} 
                      isSearched={isSearched} 
                      onCharacterClick={onCharacterClick} 
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}