'use client';

import { useState } from 'react';
import styles from './GemsTab.module.css';

type AnyData = Record<string, unknown>;

export default function GemsTab({ data, combatSkills }: { data: unknown; combatSkills: unknown }) {
  const [sortOrder, setSortOrder] = useState<'default' | 'levelDesc'>('default');

  const d = data as AnyData;
  if (!d?.Gems || (d.Gems as AnyData[]).length === 0) {
    return <div className={styles.noData}>장착된 보석이 없습니다.</div>;
  }

  type ParsedGem = AnyData & { skillName: string; skillIcon: string | null; isDamage: boolean; label: string; isT4: boolean; effectText: string };
  const parsedGems = (d.Gems as AnyData[]).map((gem) => {
    let skillName = '', isDamage = true, isT4 = false, effectText = '';
    try {
      const tooltipStr = gem.Tooltip as string;
      if (tooltipStr.includes('재사용 대기시간') && tooltipStr.includes('감소')) isDamage = false;
      if (tooltipStr.includes('티어 4') || tooltipStr.includes('1640')) isT4 = true;
      const tooltipObj = JSON.parse(tooltipStr);
      if (tooltipObj.Element_006?.value?.Element_001) {
        const rawText = tooltipObj.Element_006.value.Element_001 as string;
        const skillMatch = rawText.match(/<FONT COLOR=['"]#FFD200['"]>([^<]+)<\/FONT>/);
        if (skillMatch) skillName = skillMatch[1];
        let cleanText = rawText.replace(/<[^>]+>/g, ' ').replace(/\[.*?\]/g, '');
        if (skillName) cleanText = cleanText.replace(skillName, '');
        cleanText = cleanText.replace(/추가 효과/g, ',').replace(/\s+/g, ' ').trim().replace(/ , /g, ', ').replace(/^,\s*/, '').trim();
        effectText = cleanText;
      }
    } catch {
      effectText = isDamage ? '피해 증가' : '재사용 대기시간 감소';
    }

    const skillIcon = skillName
      ? ((combatSkills as AnyData[]) || []).find((s) => s.Name === skillName)?.Icon as string ?? null
      : null;

    const suffix = isDamage ? (isT4 ? '레벨 겁화' : '레벨 멸화') : (isT4 ? '레벨 작열' : '레벨 홍염');
    const label = `${gem.Level}${suffix}`;
    return { ...gem, skillName, skillIcon, isDamage, label, isT4, effectText };
  });

  const sorted = ([...parsedGems] as ParsedGem[]).sort((a, b) =>
    sortOrder === 'levelDesc'
      ? (b.Level as number) !== (a.Level as number)
        ? (b.Level as number) - (a.Level as number)
        : (a.Slot as number) - (b.Slot as number)
      : (a.Slot as number) - (b.Slot as number)
  );

  const dmgGems  = sorted.filter((g) => g.isDamage);
  const coolGems = sorted.filter((g) => !g.isDamage);

  const renderCard = (gem: ParsedGem, idx: number) => (
    <div key={idx} className={styles.gemCard}>
      <div className={styles.cardIconWrap}>
        <img src={gem.Icon as string} alt={gem.label as string} />
        <span className={styles.cardLvBadge}>Lv.{gem.Level as number}</span>
      </div>
      <div className={styles.cardInfo}>
        <div className={styles.cardLabelRow}>
          <span className={gem.isDamage ? styles.cardLabelDmg : styles.cardLabelCool}>
            {gem.label as string}
          </span>
          <span className={styles.cardGrade}>{gem.Grade as string} 보석</span>
        </div>
        <div className={styles.cardSkill}>
          {gem.skillIcon ? <img src={gem.skillIcon} alt={gem.skillName} /> : null}
          <span className={styles.cardSkillName}>{(gem.skillName as string) || '알 수 없는 스킬'}</span>
        </div>
      </div>
    </div>
  );

  const renderListRow = (gem: ParsedGem, idx: number) => {
    const shortLabel = `${gem.Level}${(gem.isDamage as boolean)
      ? ((gem.isT4 as boolean) ? '겁' : '멸')
      : ((gem.isT4 as boolean) ? '작' : '홍')}`;
    return (
      <div key={idx} className={styles.listRow}>
        <div className={styles.listRowInner}>
          <div className={styles.listIconWrap}>
            <img src={gem.Icon as string} alt={gem.label as string} />
          </div>
          <div className={styles.listBadgeWrap}>
            <span className={styles.listBadge}>{shortLabel}</span>
          </div>
          <div className={styles.listSkillName}>
            <span className={styles.listSkillNameText}>{(gem.skillName as string) || '알 수 없는 스킬'}</span>
          </div>
          <div className={styles.listEffect}>
            {(gem.effectText as string) || ((gem.isDamage as boolean) ? '피해 증가' : '재사용 대기시간 감소')}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>장착 보석</h3>
        <div className={styles.sortBar}>
          <button type="button" onClick={() => setSortOrder('default')} className={`${styles.sortBtn} ${sortOrder === 'default' ? styles.sortBtnActive : ''}`}>기본순</button>
          <button type="button" onClick={() => setSortOrder('levelDesc')} className={`${styles.sortBtn} ${sortOrder === 'levelDesc' ? styles.sortBtnActive : ''}`}>레벨 높은 순</button>
        </div>
      </div>

      <div className={styles.body}>
        {sortOrder === 'default' ? (
          <>
            {dmgGems.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={`${styles.sectionDot} ${styles.dotDmg}`} />
                  <h4 className={styles.sectionTitle}>피해 증가 (겁화 / 멸화)</h4>
                  <span className={styles.sectionCount}>{dmgGems.length}개</span>
                </div>
                <div className={styles.cardGrid}>{dmgGems.map(renderCard)}</div>
              </div>
            )}
            {coolGems.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={`${styles.sectionDot} ${styles.dotCool}`} />
                  <h4 className={styles.sectionTitle}>재사용 대기시간 감소 (작열 / 홍염)</h4>
                  <span className={styles.sectionCount}>{coolGems.length}개</span>
                </div>
                <div className={styles.cardGrid}>{coolGems.map(renderCard)}</div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.listCard}>{sorted.map(renderListRow)}</div>
        )}
      </div>
    </div>
  );
}
