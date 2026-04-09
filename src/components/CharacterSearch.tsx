'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchStore } from '@/store/searchStore';
import { useCharacterQuery, usePrefetchCharacter } from '@/hooks/useCharacterQuery';
import ProfileTab from './tabs/ProfileTab';
import ArkPassiveTab from './tabs/ArkPassiveTab';
import SiblingsTab from './tabs/SiblingsTab';
import CombatSkillsTab from './tabs/CombatSkillsTab';
import GemsTab from './tabs/GemsTab';
import styles from './CharacterSearch.module.css';

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
  // 입력 중인 텍스트 (로컬 UI 상태)
  const [inputName, setInputName] = useState('');
  // 실제 검색이 확정된 캐릭터명 — React Query의 key로 사용
  const [searchedName, setSearchedName] = useState('');
  // 현재 활성 탭 (로컬 UI 상태)
  const [activeTab, setActiveTab] = useState<Tab>('profiles');

  // 최근 검색어는 searchStore가 localStorage까지 관리
  const { recentSearches, init: initSearch, addSearch, removeSearch } = useSearchStore();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 앱 시작 시 localStorage에서 최근 검색어 복원
  useEffect(() => {
    initSearch();
  }, [initSearch]);

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
      {/* 검색 */}
      <div className={styles.searchArea} ref={searchContainerRef}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.inputWrap}>
            <input
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              placeholder="캐릭터 이름을 입력하세요 (예: 전기훈)"
              className={styles.searchInput}
            />
          </div>
          <button
            type="submit"
            disabled={profileLoading || !inputName.trim()}
            className={styles.searchBtn}
          >
            {profileLoading && !searchedName ? '검색 중...' : '검색'}
          </button>
        </form>

        {/* 최근 검색어 */}
        {recentSearches.length > 0 && (
          <div className={styles.recentList}>
            <span className={styles.recentLabel}>최근검색어</span>
            {recentSearches.map((name, idx) => (
              <div key={idx} className={styles.recentTag} onClick={() => performSearch(name)}>
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
        )}

        {/* 레이드 배너 (검색 결과 없을 때) */}
        {!hasResult && (
          <a href="/raid" className={styles.raidBanner}>
            <div className={styles.raidBannerInner}>
              <div className={styles.raidBannerLeft}>
                <div className={styles.raidBannerBadge}>수요일 ~ 화요일</div>
                <h2 className={styles.raidBannerTitle}>이번주 레이드 약속 🗓️</h2>
                <p className={styles.raidBannerDesc}>이번 주 레이드 스케줄을 캘린더에 연동하고 관리하세요.</p>
              </div>
              <div className={styles.raidBannerArrow}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </a>
        )}
      </div>

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
