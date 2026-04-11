'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSearchStore } from '@/store/searchStore';
import { useCharacterQuery, usePrefetchCharacter, useHotCharactersQuery, HotCharacterBase } from '@/hooks/useCharacterQuery';
import ProfileTab from './tabs/ProfileTab';
import ArkPassiveTab from './tabs/ArkPassiveTab';
import SiblingsTab from './tabs/SiblingsTab';
import CombatSkillsTab from './tabs/CombatSkillsTab';
import GemsTab from './tabs/GemsTab';
import styles from './CharacterSearch.module.css';

type Tab = 'profiles' | 'combat-skills' | 'gems' | 'cards' | 'arkpassive' | 'siblings';

// 현재 날짜 기준 "N월 N째주" 반환 (수요일 리셋 기준 이번 주)
function getWeekLabel() {
  const now = new Date();
  const day = now.getDay();
  // 이번 주 수요일 기준 시작일 계산
  const diffToWed = day >= 3 ? day - 3 : day + 4;
  const wed = new Date(now);
  wed.setDate(now.getDate() - diffToWed);
  const month = wed.getMonth() + 1;
  // 해당 월 1일의 첫 번째 수요일 기준 주차 계산
  const firstDay = new Date(wed.getFullYear(), wed.getMonth(), 1).getDay();
  const weekNum = Math.ceil((wed.getDate() + firstDay) / 7);
  return `${month}월 ${weekNum}째주`;
}

// 서포터 클래스 판별 — 바드/홀리나이트/도화가 외 전부 딜러
export const isSupportClass = (className: string) =>
  ['바드', '홀리나이트', '도화가'].includes(className);

// 나중에 검색량 기반으로 동적화 예정 — 현재는 고정 목록
// combatPower는 useHotCharactersQuery가 API에서 실시간으로 가져옴
const HOT_CHARACTERS: HotCharacterBase[] = [
  { name: '홀리찌니짱',    type: 'dps' },
  { name: '베이지버블',    type: 'support' },
  { name: '성라키',       type: 'dps' },
  { name: '이화얀이올시당', type: 'dps' },
  { name: 'pouu',        type: 'dps' },
  { name: '체방사멸근접딜러', type: 'dps' },
];

let sessionShuffled: HotCharacterBase[] | null = null;

const TABS: { id: Tab; label: string }[] = [
  { id: 'profiles', label: '전투 정보' },
  { id: 'combat-skills', label: '전투 스킬' },
  { id: 'gems', label: '보석' },
  { id: 'cards', label: '카드' },
  { id: 'arkpassive', label: '아크 패시브' },
  { id: 'siblings', label: '보유 캐릭터' },
];

export default function CharacterSearch() {
  // 입력 중인 텍스트 (로컬 UI 상태)
  const [inputName, setInputName] = useState('');
  // 실제 검색이 확정된 캐릭터명 — React Query의 key로 사용
  const [searchedName, setSearchedName] = useState('');
  // 현재 활성 탭 (로컬 UI 상태)
  const [activeTab, setActiveTab] = useState<Tab>('profiles');

  // URL ?q= 파라미터 — Navbar 캐릭터 클릭 시 자동 검색에 사용
  const searchParams = useSearchParams();

  // 최근 검색어는 searchStore가 localStorage까지 관리
  const { recentSearches, init: initSearch, addSearch, removeSearch } = useSearchStore();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // input focus 상태 — 최근 검색어 표시 제어
  const [inputFocused, setInputFocused] = useState(false);

  // 셔플된 HOT 캐릭터 기본 목록 (이름 + 타입만, combatPower는 API에서)
  const [shuffledBase, setShuffledBase] = useState<HotCharacterBase[]>(HOT_CHARACTERS);

  // URL ?q= 파라미터가 있으면 자동 검색 실행 (Navbar 캐릭터 클릭 등)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchedName(q);
      setInputName(q);
      setActiveTab('profiles');
    }
  }, [searchParams]);

  // 앱 시작 시 최근 검색어 복원 및 HOT 캐릭터 셔플 (세션당 1회)
  useEffect(() => {
    initSearch();
    if (!sessionShuffled) {
      const shuffled = [...HOT_CHARACTERS];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      sessionShuffled = shuffled;
    }
    setShuffledBase(sessionShuffled);
  }, [initSearch]);

  // HOT 캐릭터 전투력을 React Query로 실시간 조회 (5분 캐시, 자동 갱신)
  const hotChars = useHotCharactersQuery(shuffledBase);

  const { prefetchAllTabs } = usePrefetchCharacter();

  // React Query — 탭별 독립적인 쿼리
  // searchedName이 있을 때만 enabled, 결과는 5분간 캐시
  const { data: profileData, isLoading: profileLoading, error: profileError } = useCharacterQuery(searchedName, 'profiles');
  const { data: equipmentData } = useCharacterQuery(searchedName, 'equipment');
  const { data: engravingsData } = useCharacterQuery(searchedName, 'engravings');
  const { data: arkpassiveData } = useCharacterQuery(searchedName, 'arkpassive');
  const { data: gemsData } = useCharacterQuery(searchedName, 'gems');
  const { data: combatSkillsData } = useCharacterQuery(searchedName, 'combat-skills');
  const { data: siblingsData, isLoading: siblingsLoading } = useCharacterQuery(searchedName, 'siblings');

  const performSearch = (name: string) => {
    if (!name.trim()) return;
    setSearchedName(name);
    setInputName(name);
    setActiveTab('profiles');
    addSearch(name);
    // 백그라운드에서 나머지 탭들 미리 로드
    prefetchAllTabs(name);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(inputName);
  };

  const handleRemoveRecent = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    removeSearch(name);
  };

  const hasResult = !!searchedName && !!profileData;
  const activeTabLoading =
    (activeTab === 'siblings' && siblingsLoading) ||
    (activeTab === 'profiles' && profileLoading);

  return (
    <div className={styles.container}>
      {/* 검색창 영역 — padding 있는 중앙 정렬 박스 */}
      <div className={styles.searchArea} ref={searchContainerRef}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.inputWrap}>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="검색어를 입력해 주세요."
              className={styles.searchInput}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setTimeout(() => setInputFocused(false), 150)}
            />
            <button
              type="submit"
              disabled={profileLoading || !inputName.trim()}
              className={styles.searchBtn}
              aria-label="검색"
            >
              {profileLoading && searchedName ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              )}
            </button>
          </div>
        </form>

        {/* 최근 검색어 드롭다운 — input focus 시에만 표시 */}
        {inputFocused && recentSearches.length > 0 && (
          <div className={styles.recentList}>
            <div className={styles.recentTitle}>최근검색어</div>
            <div className={styles.recentTagsRow}>
              {recentSearches.map((name, idx) => (
                <div key={idx} className={styles.recentTag} onClick={() => { performSearch(name); setInputFocused(false); }}>
                  <span className={styles.recentTagName}>{name}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveRecent(e, name)}
                    className={styles.recentTagRemove}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* HOT 캐릭터 — React Query로 전투력 실시간 조회 (5분 캐시) */}
      {!hasResult && (
        <div className={styles.hotBarWrap}>
          <div className={styles.hotBar}>
            {hotChars.map((char, idx) => (
              <button
                key={idx}
                type="button"
                className={styles.hotItem}
                onClick={() => performSearch(char.name)}
              >
                <span className={styles.hotFlame}>🔥</span>
                <span className={styles.hotName}>{char.name}</span>
                <span className={char.type === 'support' ? styles.hotLevelSupport : styles.hotLevelDps}>
                  {char.type === 'dps' && !char.isLoading && (
                    <svg
                      width="10" height="10" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round"
                      style={{ marginRight: 2 }}
                    >
                      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
                      <line x1="13" x2="19" y1="19" y2="13" />
                      <line x1="16" x2="20" y1="16" y2="20" />
                      <line x1="19" x2="21" y1="21" y2="19" />
                    </svg>
                  )}
                  {char.type === 'support' && !char.isLoading && '+'}
                  {char.isLoading ? '···' : char.isError ? '-' : char.combatPower}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 레이드 배너 */}
      {!hasResult && (
        <div className={styles.searchArea}>
          <a href="/schedule" className={styles.raidBanner}>
            <div className={styles.raidBannerInner}>
              <div className={styles.raidBannerLeft}>
                <div className={styles.raidBannerBadge}>{getWeekLabel()}</div>
                <h2 className={styles.raidBannerTitle}>이번주 레이드 체크 🗓️</h2>
                <p className={styles.raidBannerDesc}>이번 주 레이드 가능 여부를 체크하고 멤버들과 공유하세요.</p>
              </div>
              <div className={styles.raidBannerArrow}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>
        </div>
      )}

      {/* 에러 */}
      {profileError && (
        <div className={styles.errorBox}>{(profileError as Error).message}</div>
      )}

      {/* 결과 */}
      {hasResult && (() => {
        const profile = profileData as Record<string, string>;
        return (
          <div className={styles.resultCard}>
            {/* 프로필 배너 */}
            <div className={styles.banner}>
              <div className={styles.charImgWrap}>
                {profile.CharacterImage && (
                  <img src={profile.CharacterImage} alt={profile.CharacterName} className={styles.charImg} />
                )}
              </div>

              <div className={styles.bannerTopBar}>
                <button type="button" onClick={() => setSearchedName('')} className={styles.btnBack}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <div className={styles.bannerActions}>
                  <button type="button" className={styles.btnIconSq}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h6v6" /><path d="M10 14L21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    </svg>
                  </button>
                  <button type="button" className={styles.btnFav}>
                    <span>☆</span> 즐겨찾기
                  </button>
                  <button type="button" onClick={() => performSearch(searchedName)} className={styles.btnRefresh}>
                    갱신
                  </button>
                </div>
              </div>

              <div className={styles.charInfo}>
                <div className={styles.charBadges}>
                  <span className={styles.badge}>{profile.ServerName}</span>
                  <span className={styles.badge}>{profile.CharacterClassName}</span>
                </div>
                <h1 className={styles.charName}>{profile.CharacterName}</h1>
                <div className={styles.charTitle}>{profile.Title || '칭호 없음'}</div>
                <div className={styles.charMeta}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>길드</span>
                    <span className={styles.metaValue}>{profile.GuildName || '-'}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>영지</span>
                    <span className={styles.metaValue}>
                      {profile.TownName || '-'}
                      <span className={styles.metaValueSub}>Lv.{profile.TownLevel || 0}</span>
                    </span>
                  </div>
                </div>
                <div className={styles.charStats}>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>아이템</div>
                    <div className={styles.statVal}>{profile.ItemAvgLevel}</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>전투력</div>
                    <div className={`${styles.statVal} ${styles.statValRed}`}>{profile.CombatPower || '-'}</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>전투</div>
                    <div className={styles.statVal}>Lv.{profile.CharacterLevel}</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>원정대</div>
                    <div className={styles.statVal}>Lv.{profile.ExpeditionLevel}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 탭 */}
            <div className={styles.tabNav}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
                >
                  {tab.label}
                  {activeTab === tab.id && <div className={styles.tabActiveBar} />}
                </button>
              ))}
            </div>

            {/* 컨텐츠 */}
            <div className={styles.tabContent}>
              {activeTabLoading ? (
                <div className={styles.loading}>데이터를 불러오는 중...</div>
              ) : (
                <>
                  {activeTab === 'profiles' && (
                    <ProfileTab
                      profile={profileData}
                      equipment={equipmentData}
                      engravings={engravingsData}
                      gems={gemsData}
                      arkpassive={arkpassiveData}
                      combatSkills={combatSkillsData}
                      onTabChange={(tab: string) => setActiveTab(tab as Tab)}
                    />
                  )}
                  {activeTab !== 'profiles' && (
                    <div className={styles.tabSection}>
                      <h3 className={styles.tabSectionTitle}>
                        {TABS.find((t) => t.id === activeTab)?.label}
                      </h3>
                      <>
                        {activeTab === 'arkpassive' && <ArkPassiveTab data={arkpassiveData} />}
                        {activeTab === 'combat-skills' && <CombatSkillsTab data={combatSkillsData} />}
                        {activeTab === 'gems' && <GemsTab data={gemsData} combatSkills={combatSkillsData} />}
                        {activeTab === 'siblings' && (
                          <SiblingsTab data={siblingsData} characterName={searchedName} onCharacterClick={performSearch} />
                        )}
                        {activeTab !== 'arkpassive' && activeTab !== 'siblings' && activeTab !== 'combat-skills' && activeTab !== 'gems' && (
                          <div className={styles.rawData}>
                            <div className={styles.rawDataLabel}>{'// 전체 API 원본 데이터'}</div>
                            <pre className={styles.rawDataPre}>
                              {JSON.stringify(null, null, 2)}
                            </pre>
                          </div>
                        )}
                      </>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
