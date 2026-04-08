import styles from './CombatSkillsTab.module.css';

type AnyData = Record<string, unknown>;

const RUNE_CLASS: Record<string, string> = {
  '전설': styles.runeLegend,
  '영웅': styles.runeHero,
  '희귀': styles.runeRare,
};

export default function CombatSkillsTab({ data }: { data: unknown }) {
  if (!Array.isArray(data)) return <div className={styles.noData}>데이터가 없습니다.</div>;

  const activeSkills = data.filter((s: AnyData) => (s.Level as number) > 1);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>스킬 현황</h3>
        <div className={styles.headerRight}>
          <span className={styles.headerCount}>총 {activeSkills.length}개 스킬 사용 중</span>
          <button type="button" className={styles.btnCopy}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            스킬 코드
          </button>
        </div>
      </div>

      <div className={styles.skillGrid}>
        {activeSkills.map((skill: AnyData, idx: number) => {
          const tripods = ((skill.Tripods as AnyData[]) || []).filter((t) => t.IsSelected);
          const code    = tripods.map((t) => t.Slot).join('');
          const rune    = skill.Rune as AnyData | null;
          const runeCls = rune ? (RUNE_CLASS[rune.Grade as string] ?? styles.runeNormal) : '';

          return (
            <div key={idx} className={styles.skillCard}>
              <div className={styles.skillTop}>
                <div className={styles.skillLeft}>
                  <img src={skill.Icon as string} alt={skill.Name as string} />
                  <div className={styles.skillMeta}>
                    <span className={styles.skillLv}>Lv.{skill.Level as number}</span>
                    <span className={styles.skillName}>{skill.Name as string}</span>
                    <span className={styles.skillType}>{skill.Type as string}</span>
                  </div>
                </div>
                <div className={styles.skillRight}>
                  <span className={styles.skillCode}>{code}</span>
                  <span className={styles.skillToggle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className={styles.skillBottom}>
                <div className={styles.tripods}>
                  {tripods.map((t: AnyData, i: number) => (
                    <div key={i} className={styles.tripodItem}>
                      <img src={t.Icon as string} alt={t.Name as string} />
                      <span className={styles.tripodName}>{t.Name as string}</span>
                    </div>
                  ))}
                </div>
                {rune && (
                  <div className={styles.rune}>
                    <img src={rune.Icon as string} alt={rune.Name as string} />
                    <span className={runeCls}>{rune.Name as string}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
