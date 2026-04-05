'use client';

import { useState, useEffect, useRef } from 'react';
import { getCharacterData } from '@/app/actions';

import ProfileTab from './tabs/ProfileTab';
import ArkPassiveTab from './tabs/ArkPassiveTab';
import SiblingsTab from './tabs/SiblingsTab';
import CombatSkillsTab from './tabs/CombatSkillsTab';
import GemsTab from './tabs/GemsTab';

type Tab = 'profiles' | 'combat-skills' | 'gems' | 'cards' | 'arkpassive' | 'siblings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'profiles', label: '전투 정보' },
  { id: 'combat-skills', label: '전투 스킬' },
  { id: 'gems', label: '보석' },
  { id: 'cards', label: '카드' },
  { id: 'arkpassive', label: '아크 패시브' },
  { id: 'siblings', label: '보유 캐릭터' },
];

export default function CharacterSearch() {
  const [characterName, setCharacterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profiles');
  
  // 최근 검색어 상태
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 로컬 스토리지에서 최근 검색어 불러오기
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('최근 검색어 파싱 오류', e);
      }
    }

    // 바깥쪽 클릭 시 최근 검색어 닫기
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowRecent(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = (name: string) => {
    const updatedSearches = [name, ...recentSearches.filter((s) => s !== name)].slice(0, 10); // 최대 10개
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const removeRecentSearch = (e: React.MouseEvent, nameToRemove: string) => {
    e.stopPropagation(); // 검색 실행 방지
    const updatedSearches = recentSearches.filter((s) => s !== nameToRemove);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };
  
  // 각 탭별로 데이터를 캐싱하기 위한 상태
  const [tabData, setTabData] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchTabData = async (name: string, tab: string) => {
    setLoading(true);
    setError(null);

    const res = await getCharacterData(name, tab);

    if (res?.error) {
      setError(res.error);
    } else if (res?.data) {
      setTabData((prev) => ({ ...prev, [tab]: res.data }));
    } else {
      setError('데이터를 찾을 수 없습니다.');
    }

    setLoading(false);
  };

  const performSearch = async (name: string) => {
    if (!name.trim()) return;

    setCharacterName(name);
    setShowRecent(false); // 검색 시 드롭다운 닫기
    saveRecentSearch(name); // 최근 검색어 저장

    // 새로운 검색 시 데이터 초기화
    setTabData({});
    setActiveTab('profiles');
    await fetchTabData(name, 'profiles');
    
    // 이어서 전투 탭에서 필요한 부가 정보들도 병렬로 당겨오기
    Promise.all([
      fetchTabData(name, 'equipment'),
      fetchTabData(name, 'engravings'),
      fetchTabData(name, 'arkpassive'),
      fetchTabData(name, 'gems'),
      fetchTabData(name, 'combat-skills')
    ]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(characterName);
  };

  const handleTabChange = async (tab: Tab) => {
    setActiveTab(tab);
    // 이미 불러온 데이터가 없다면 API 요청
    if (!tabData[tab]) {
      await fetchTabData(characterName, tab);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      {/* 검색 폼 */}
      <div className="flex justify-center mb-4" ref={searchContainerRef}>
        <form onSubmit={handleSearch} className="flex gap-3 relative w-full max-w-md">
          <div className="w-full relative">
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              onFocus={() => setShowRecent(true)}
              placeholder="캐릭터 이름을 입력하세요 (예: 전기훈)"
              className="w-full bg-[#1a1c23] border border-[#2a2d36] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#d4af37] transition-colors"
            />
            {/* 최근 검색어 드롭다운 */}
            {showRecent && recentSearches.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-[#1a1c23] border border-[#2a2d36] rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="flex justify-between items-center px-4 py-2 bg-[#111] border-b border-[#2a2d36]">
                  <span className="text-xs text-gray-400 font-bold">최근 검색 캐릭터</span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRecentSearches([]);
                      localStorage.removeItem('recentSearches');
                    }}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                  >
                    전체 삭제
                  </button>
                </div>
                <ul className="max-h-60 overflow-y-auto">
                  {recentSearches.map((name, idx) => (
                    <li 
                      key={idx}
                      className="flex justify-between items-center px-4 py-2.5 hover:bg-[#22252e] cursor-pointer transition-colors border-b border-[#2a2d36] last:border-0"
                      onClick={() => performSearch(name)}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-200">{name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => removeRecentSearch(e, name)}
                        className="text-gray-500 hover:text-[#ff5e5e] p-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !characterName.trim()}
            className="bg-[#d4af37] hover:bg-[#f1c40f] text-black font-bold px-8 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[120px] shrink-0"
          >
            <span className="text-black block w-full text-center">
              {loading && Object.keys(tabData).length === 0 ? '검색 중...' : '검색'}
            </span>
          </button>
        </form>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-center font-medium">
          {error}
        </div>
      )}

      {/* 탭 & 결과 영역 (첫 번째 검색 성공 시에만 렌더링) */}
      {Object.keys(tabData).length > 0 && tabData['profiles'] && (
        <div className="bg-[#111111] rounded-xl overflow-hidden border border-[#2a2d36] shadow-2xl">
          
          {/* 상단 프로필 배너 영역 */}
          <div className="relative p-8 min-h-[320px] flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#1a1c23] to-[#0f1115]">
            {/* 캐릭터 이미지 (중앙 배치) */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-full w-[400px] pointer-events-none opacity-90">
              {tabData['profiles'].CharacterImage && (
                <img 
                  src={tabData['profiles'].CharacterImage} 
                  alt={tabData['profiles'].CharacterName}
                  className="w-full h-full object-cover object-top [mask-image:linear-gradient(to_bottom,white_60%,transparent_100%)]"
                />
              )}
            </div>

            {/* 좌우 정보 래퍼 */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between h-full gap-4">
              
              {/* 왼쪽: 기본 정보 */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 text-sm font-medium">
                  <span className="px-2 py-0.5 bg-[#222] border border-[#333] rounded text-gray-300">{tabData['profiles'].ServerName}</span>
                  <span className="px-2 py-0.5 bg-[#222] border border-[#333] rounded text-gray-300">{tabData['profiles'].CharacterClassName}</span>
                </div>
                <h1 className="text-4xl font-bold text-white tracking-tight mt-1">{tabData['profiles'].CharacterName}</h1>
                <div className="text-[#a0a0a0] text-sm mb-6">{tabData['profiles'].Title || '칭호 없음'}</div>
                
                <div className="flex gap-6 mt-auto bg-black/40 p-4 rounded-lg backdrop-blur-sm border border-white/5 w-fit">
                  <div>
                    <div className="text-[11px] text-gray-400 mb-1">아이템</div>
                    <div className="text-xl font-bold text-[#d4af37]">{tabData['profiles'].ItemAvgLevel}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 mb-1">전투력</div>
                    <div className="text-xl font-bold text-[#ff6060]">{tabData['profiles'].CombatPower || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 mb-1">전투</div>
                    <div className="text-xl font-bold text-white">Lv.{tabData['profiles'].CharacterLevel}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-400 mb-1">원정대</div>
                    <div className="text-xl font-bold text-white">Lv.{tabData['profiles'].ExpeditionLevel}</div>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 소속 정보 */}
              <div className="flex flex-col items-end text-sm space-y-3 bg-black/40 p-4 rounded-lg backdrop-blur-sm border border-white/5 h-fit">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">길드</span>
                  <span className="text-white font-medium">{tabData['profiles'].GuildName || '-'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">영지</span>
                  <span className="text-white font-medium">{tabData['profiles'].TownName || '-'} <span className="text-gray-500 ml-1">Lv.{tabData['profiles'].TownLevel || 0}</span></span>
                </div>
              </div>

            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex border-y border-[#2a2d36] bg-[#16181e] overflow-x-auto no-scrollbar px-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-6 py-4 font-bold text-sm whitespace-nowrap transition-colors relative ${
                  activeTab === tab.id ? 'text-[#d4af37]' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#d4af37]" />
                )}
              </button>
            ))}
          </div>

          {/* 탭별 컨텐츠 렌더링 영역 (어두운 회색 배경) */}
          <div className="p-6 bg-[#0f1115] min-h-[400px]">
            {loading && !tabData[activeTab] ? (
              <div className="flex justify-center items-center h-40 text-[#d4af37] font-medium">데이터를 불러오는 중...</div>
            ) : (
              <>
                {/* [1] 기본 정보 (Profiles) 탭 선택시: 특성 및 아크패시브/각인 등 요약 보여주기 */}
                {activeTab === 'profiles' && tabData['profiles'] && (
                  <ProfileTab 
                    profile={tabData['profiles']} 
                    equipment={tabData['equipment']} 
                    engravings={tabData['engravings']} 
                    gems={tabData['gems']} 
                    arkpassive={tabData['arkpassive']} 
                    combatSkills={tabData['combat-skills']}
                    onTabChange={handleTabChange} 
                  />
                )}

                {/* 다른 탭들 (JSON Raw Data 임시 렌더링) */}
                {activeTab !== 'profiles' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-[#d4af37] mb-4 border-b border-[#2a2d36] pb-2">
                      {TABS.find(t => t.id === activeTab)?.label}
                    </h3>
                    
                    {/* 데이터가 있을 경우 */}
                    {tabData[activeTab] ? (
                      <>
                        {/* 아크패시브 탭 특화 렌더링 */}
                        {activeTab === 'arkpassive' && <ArkPassiveTab data={tabData['arkpassive']} />}

                        {/* 전투 스킬 탭 특화 렌더링 */}
                        {activeTab === 'combat-skills' && <CombatSkillsTab data={tabData['combat-skills']} />}
                        
                        {/* 보석 탭 특화 렌더링 */}
                        {activeTab === 'gems' && <GemsTab data={tabData['gems']} combatSkills={tabData['combat-skills']} />}

                        {/* 보유 캐릭터(siblings) 탭 특화 렌더링 */}
                        {activeTab === 'siblings' && <SiblingsTab data={tabData['siblings']} characterName={characterName} onCharacterClick={performSearch} />}

                        {/* 기존 JSON 표시는 커스텀 렌더링된 탭이 아닐 때만 렌더링 */}
                        {activeTab !== 'arkpassive' && activeTab !== 'siblings' && activeTab !== 'combat-skills' && activeTab !== 'gems' && (
                          <div className="bg-[#181a20] rounded-lg p-4 overflow-x-auto border border-[#2a2d36]">
                            <div className="text-xs text-gray-500 mb-2">{'// 전체 API 원본 데이터'}</div>
                            <pre className="text-xs text-gray-400 font-mono">
                              {JSON.stringify(tabData[activeTab], null, 2)}
                            </pre>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-gray-500 text-sm">데이터가 없습니다.</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
}