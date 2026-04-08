'use client';

import { useState, useEffect, useRef } from 'react';
import { getCharacterData } from '@/app/actions';
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
  const [characterName, setCharacterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profiles');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [tabData, setTabData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try { setRecentSearches(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const saveRecentSearch = (name: string) => {
    const updated = [name, ...recentSearches.filter((s) => s !== name)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const removeRecentSearch = (e: React.MouseEvent, nameToRemove: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== nameToRemove);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

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
    saveRecentSearch(name);
    setTabData({});
    setActiveTab('profiles');
    await fetchTabData(name, 'profiles');
    Promise.all([
      fetchTabData(name, 'equipment'),
      fetchTabData(name, 'engravings'),
      fetchTabData(name, 'arkpassive'),
      fetchTabData(name, 'gems'),
      fetchTabData(name, 'combat-skills'),
    ]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(characterName);
  };

  const handleTabChange = async (tab: Tab) => {
    setActiveTab(tab);
    if (!tabData[tab]) await fetchTabData(characterName, tab);
  };

  const profile = tabData['profiles'] as Record<string, string> | undefined;

  return (
    <div className={styles.container}>
      {/* 검색 */}
      <div className={styles.searchArea} ref={searchContainerRef}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.inputWrap}>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="캐릭터 이름을 입력하세요 (예: 전기훈)"
              className={styles.searchInput}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !characterName.trim()}
            className={styles.searchBtn}
          >
            {loading && Object.keys(tabData).length === 0 ? '검색 중...' : '검색'}
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
                  onClick={(e) => removeRecentSearch(e, name)}
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

        {/* 레이드 배너 */}
        {Object.keys(tabData).length === 0 && (
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
      {error && <div className={styles.errorBox}>{error}</div>}

      {/* 결과 */}
      {Object.keys(tabData).length > 0 && profile && (
        <div className={styles.resultCard}>
          {/* 프로필 배너 */}
          <div className={styles.banner}>
            <div className={styles.charImgWrap}>
              {profile.CharacterImage && (
                <img
                  src={profile.CharacterImage}
                  alt={profile.CharacterName}
                  className={styles.charImg}
                />
              )}
            </div>

            <div className={styles.bannerTopBar}>
              <button type="button" onClick={() => setTabData({})} className={styles.btnBack}>
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
                <button type="button" onClick={() => performSearch(characterName)} className={styles.btnRefresh}>
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
                onClick={() => handleTabChange(tab.id)}
                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
              >
                {tab.label}
                {activeTab === tab.id && <div className={styles.tabActiveBar} />}
              </button>
            ))}
          </div>

          {/* 컨텐츠 */}
          <div className={styles.tabContent}>
            {loading && !tabData[activeTab] ? (
              <div className={styles.loading}>데이터를 불러오는 중...</div>
            ) : (
              <>
                {activeTab === 'profiles' && tabData['profiles'] && (
                  <ProfileTab
                    profile={tabData['profiles']}
                    equipment={tabData['equipment']}
                    engravings={tabData['engravings']}
                    gems={tabData['gems']}
                    arkpassive={tabData['arkpassive']}
                    combatSkills={tabData['combat-skills']}
                    onTabChange={(tab: string) => handleTabChange(tab as Tab)}
                  />
                )}
                {activeTab !== 'profiles' && (
                  <div className={styles.tabSection}>
                    <h3 className={styles.tabSectionTitle}>
                      {TABS.find((t) => t.id === activeTab)?.label}
                    </h3>
                    {tabData[activeTab] ? (
                      <>
                        {activeTab === 'arkpassive' && <ArkPassiveTab data={tabData['arkpassive']} />}
                        {activeTab === 'combat-skills' && <CombatSkillsTab data={tabData['combat-skills']} />}
                        {activeTab === 'gems' && <GemsTab data={tabData['gems']} combatSkills={tabData['combat-skills']} />}
                        {activeTab === 'siblings' && (
                          <SiblingsTab data={tabData['siblings']} characterName={characterName} onCharacterClick={performSearch} />
                        )}
                        {activeTab !== 'arkpassive' && activeTab !== 'siblings' && activeTab !== 'combat-skills' && activeTab !== 'gems' && (
                          <div className={styles.rawData}>
                            <div className={styles.rawDataLabel}>{'// 전체 API 원본 데이터'}</div>
                            <pre className={styles.rawDataPre}>
                              {JSON.stringify(tabData[activeTab], null, 2)}
                            </pre>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className={styles.noData}>데이터가 없습니다.</div>
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
