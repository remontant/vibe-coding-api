import { useState, useEffect } from 'react';
import { getCharacterData } from '@/app/actions';
import styles from './SiblingsTab.module.css';

const YOZ_CLASSES = ['도화가', '기상술사', '환수사'];

type CharData = {
  CharacterName: string;
  CharacterLevel: string;
  CharacterClassName: string;
  ServerName: string;
  ItemAvgLevel: string;
  itemLevelNum?: number;
};

function SiblingCard({ char, isSearched, onCharacterClick }: {
  char: CharData;
  isSearched: boolean;
  onCharacterClick: (name: string) => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getCharacterData(char.CharacterName, 'profiles').then((res) => {
      if (isMounted && res?.data?.CharacterImage) {
        setImageUrl(res.data.CharacterImage as string);
      }
    });
    return () => { isMounted = false; };
  }, [char.CharacterName]);

  return (
    <div
      className={`${styles.card} ${isSearched ? styles.cardSearched : ''}`}
      onClick={() => onCharacterClick(char.CharacterName)}
    >
      <div className={styles.avatar}>
        {imageUrl ? (
          <div
            className={styles.avatarImg}
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: '550%',
              backgroundPosition: YOZ_CLASSES.includes(char.CharacterClassName) ? 'center 31%' : 'center 15%',
              backgroundRepeat: 'no-repeat',
            }}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardLeft}>
          <span className={`${styles.cardName} ${isSearched ? styles.cardNameSearched : ''}`}>
            {char.CharacterName}
          </span>
          <span className={styles.cardLevel}>{char.ItemAvgLevel}</span>
        </div>
        <div className={styles.cardRight}>
          <span className={styles.cardBattleLv}>Lv.{char.CharacterLevel}</span>
          <span className={styles.cardClass}>{char.CharacterClassName}</span>
        </div>
      </div>
    </div>
  );
}

export default function SiblingsTab({
  data,
  characterName,
  onCharacterClick,
}: {
  data: unknown;
  characterName: string;
  onCharacterClick: (name: string) => void;
}) {
  if (!Array.isArray(data)) return <div className={styles.noData}>데이터가 없습니다.</div>;

  const serverGroups: Record<string, CharData[]> = {};
  data.forEach((char: CharData) => {
    if (!serverGroups[char.ServerName]) serverGroups[char.ServerName] = [];
    serverGroups[char.ServerName].push({
      ...char,
      itemLevelNum: parseFloat(char.ItemAvgLevel.replace(/,/g, '')) || 0,
    });
  });

  const serverNames = Object.keys(serverGroups).sort((a, b) => {
    if (serverGroups[b].length !== serverGroups[a].length) return serverGroups[b].length - serverGroups[a].length;
    return a.localeCompare(b);
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>원정대 캐릭터</h3>
        <div className={styles.headerMeta}>
          <span className={styles.serverCount}>{serverNames.length}개 서버</span>
          <span className={styles.charCount}>{data.length}캐릭터</span>
        </div>
      </div>

      <div className={styles.serverList}>
        {serverNames.map((server) => {
          const chars = [...serverGroups[server]].sort((a, b) => (b.itemLevelNum ?? 0) - (a.itemLevelNum ?? 0));
          return (
            <div key={server} className={styles.serverGroup}>
              <div className={styles.serverHeader}>
                <div className={styles.serverHeaderLeft}>
                  <span className={styles.serverName}>{server}</span>
                  <span className={styles.serverCharCount}>{chars.length}캐릭터</span>
                </div>
                <span className={styles.serverHeaderIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </span>
              </div>
              <div className={styles.charGrid}>
                {chars.map((char, i) => (
                  <SiblingCard
                    key={i}
                    char={char}
                    isSearched={char.CharacterName === characterName}
                    onCharacterClick={onCharacterClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
