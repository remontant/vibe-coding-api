import { getQualityColor, getMappedType, getFallbackIcon } from './utils';
import styles from './ProfileTab.module.css';

type AnyData = Record<string, unknown>;
type TabName = 'profiles' | 'combat-skills' | 'gems' | 'cards' | 'arkpassive' | 'siblings';

const GRADE_CLASS: Record<string, string> = {
  '에스더': styles.gradeEsder,
  '고대':   styles.gradeAncient,
  '유물':   styles.gradeRelic,
  '전설':   styles.gradeLegend,
};

function getGradeClass(grade: string) {
  return GRADE_CLASS[grade] ?? styles.gradeDefault;
}

export default function ProfileTab({
  profile,
  equipment,
  engravings,
  gems,
  arkpassive,
  combatSkills,
  onTabChange,
}: AnyData & { onTabChange?: (tab: TabName) => void }) {
  const getStat = (type: string) =>
    (profile as AnyData)?.Stats
      ? (((profile as AnyData).Stats as AnyData[]).find((s) => s.Type === type)?.Value as string) ?? '0'
      : '0';

  type ParsedEq = AnyData & { cleanName: string; quality: number; itemLevel: number; tier: string; refine: string; advRefine: string; stoneEngravings: { name: string; level: string; isPenalty: boolean }[]; accOptions: { text: string; color: string }[]; braceletOptions: string[]; orbEffect: string };

  const parsedEquipment: ParsedEq[] = equipment
    ? (equipment as AnyData[]).map((eq) => {
        let quality = -1, itemLevel = 0, tier = '', advRefine = '';
        let stoneEngravings: { name: string; level: string; isPenalty: boolean }[] = [];
        let accOptions: { text: string; color: string }[] = [];
        let braceletOptions: string[] = [];
        let orbEffect = '';

        try {
          const tooltip = JSON.parse(eq.Tooltip as string);
          for (const key in tooltip) {
            if (!tooltip[key]) continue;
            if (tooltip[key].type === 'ItemTitle') {
              quality = tooltip[key].value.qualityValue ?? -1;
              const leftStr2 = tooltip[key].value.leftStr2 || '';
              const matchLv = leftStr2.match(/레벨\s*([\d,]+)/);
              if (matchLv) itemLevel = parseInt(matchLv[1].replace(/,/g, ''));
              const matchTier = leftStr2.match(/티어\s*(\d)/);
              if (matchTier) tier = 'T' + matchTier[1];
            }
            if (tooltip[key].type === 'SingleTextBox' && (tooltip[key].value as string).includes('상급 재련')) {
              const match = (tooltip[key].value as string).match(/<FONT COLOR='#FFD200'>(\d+)<\/FONT>단계/);
              if (match) advRefine = '+' + match[1];
            }
            if (tooltip[key].type === 'IndentStringGroup' && tooltip[key].value?.topStr?.includes('무작위 각인 효과')) {
              const content = tooltip[key].value?.Element_000?.contentStr;
              for (const k in content) {
                const str = content[k].contentStr;
                if (!str) continue;
                const nameMatch = str.match(/\[<FONT COLOR='([^']+)'>([^<]+)<\/FONT>\]/);
                const lvMatch = str.match(/Lv\.(\d+)/);
                if (nameMatch && lvMatch) {
                  stoneEngravings.push({ name: nameMatch[2], level: lvMatch[1], isPenalty: nameMatch[1] === '#FE2E2E' });
                }
              }
            }
            if (tooltip[key].type === 'ItemPartBox' && tooltip[key].value?.Element_000?.includes('연마 효과')) {
              const lines = (tooltip[key].value.Element_001 as string).split('<br>');
              lines.forEach((line: string) => {
                const cleanLine = line.replace(/<img[^>]*>/g, '').trim();
                const colorMatch = cleanLine.match(/<FONT[ ]+color='?#?([^'>]+)'?>/i) || cleanLine.match(/<FONT[ ]+COLOR='?#?([^'>]+)'?>/i);
                const text = cleanLine.replace(/<[^>]*>/g, '').trim();
                if (text) accOptions.push({ text, color: colorMatch ? '#' + colorMatch[1].replace('#', '') : '#ffffff' });
              });
            }
            if (tooltip[key].type === 'ItemPartBox' && tooltip[key].value?.Element_000?.includes('팔찌 효과')) {
              const lines = (tooltip[key].value.Element_001 as string).split('<BR>');
              lines.forEach((line: string) => {
                const text = line.replace(/<img[^>]*>/g, '').replace(/<[^>]*>/g, '').trim();
                if (text) braceletOptions.push(text);
              });
            }
            if (tooltip[key].type === 'ItemPartBox' && tooltip[key].value?.Element_000?.includes('특수 효과')) {
              orbEffect = (tooltip[key].value.Element_001 as string).replace(/<br>/gi, ' ').replace(/<BR>/gi, ' ').replace(/<[^>]*>/g, '').trim();
            }
          }
        } catch {}

        let refine = '';
        let cleanName = (eq.Name as string).replace(/<[^>]*>/g, '');
        const refineMatch = cleanName.match(/^\+(\d+)\s+/);
        if (refineMatch) { refine = '+' + refineMatch[1]; cleanName = cleanName.replace(/^\+(\d+)\s+/, ''); }

        return { ...eq, cleanName, quality, itemLevel, tier, refine, advRefine, stoneEngravings, accOptions, braceletOptions, orbEffect } as ParsedEq;
      })
    : [];

  const leftEqTypes  = ['투구', '어깨', '상의', '하의', '장갑', '무기'];
  const rightEqTypes = ['목걸이', '귀걸이', '반지', '어빌리티 스톤'];

  const leftEqs  = leftEqTypes.map((t) => parsedEquipment.find((eq) => getMappedType(eq.Type as string, eq.cleanName as string) === t)).filter(Boolean);
  const rightEqs = parsedEquipment.filter((eq) => rightEqTypes.includes(eq.Type as string));
  rightEqs.sort((a, b) => rightEqTypes.indexOf(a.Type as string) - rightEqTypes.indexOf(b.Type as string));

  const bracelet     = parsedEquipment.find((eq) => eq.Type === '팔찌');
  const orb          = parsedEquipment.find((eq) => eq.Type === '보주');

  const renderEquipItem = (eq: ParsedEq, idx: number) => {
    if (!eq) return null;
    const isStone         = eq.Type === '어빌리티 스톤';
    const isBracelet      = eq.Type === '팔찌';
    const isAcc           = ['목걸이', '귀걸이', '반지'].includes(eq.Type as string);
    const isArmorWeapon   = ['투구', '어깨', '상의', '하의', '장갑', '무기'].includes(getMappedType(eq.Type as string, eq.cleanName as string));
    const isSpecial       = ['나침반', '부적', '보주'].includes(eq.Type as string);

    return (
      <div key={`${eq.Name}-${idx}`} className={styles.equipItem}>
        <div className={`${styles.itemIconWrap} ${getGradeClass(eq.Grade as string)}`}>
          <img src={eq.Icon as string} alt={eq.Type as string} />
          {(eq.quality as number) >= 0 && !isStone && !isBracelet && !isSpecial && (
            <div className={`${styles.qualityBadge} ${getQualityColor(eq.quality as number)}`}>
              {eq.quality as number}
            </div>
          )}
        </div>

        <div className={styles.itemInfo}>
          <div className={styles.itemTitleRow}>
            {isArmorWeapon ? (
              <>
                <span className={styles.itemType}>
                  {getMappedType(eq.Type as string, eq.cleanName as string)}{' '}
                  <span className={styles.itemRefine}>{eq.refine as string}</span>
                </span>
                <span className={styles.itemTierText}>
                  T4 <span className={styles.itemAdvRefine}>{eq.advRefine as string}</span>
                </span>
              </>
            ) : isSpecial ? (
              <span className={styles.itemTypeSpecial}>{eq.Type as string}</span>
            ) : (
              <span className={styles.itemTypeSpecial}>
                {isStone ? '스톤' : eq.Type as string}{' '}
                <span className={styles.itemTierText}>T4</span>
              </span>
            )}
          </div>

          <div className={styles.itemDetailRow}>
            <div className={styles.itemDetailLeft}>
              {isArmorWeapon && (
                <>
                  {(eq.quality as number) >= 0 && (
                    <div className={`${styles.qualityInline} ${getQualityColor(eq.quality as number)}`}>
                      {eq.quality as number}
                    </div>
                  )}
                  <span className={styles.itemLevelText}>{eq.itemLevel as number}</span>
                </>
              )}
              {isAcc && (
                <>
                  {(eq.quality as number) >= 0 && (
                    <div className={`${styles.qualityInline} ${styles.qualityAcc}`}>
                      {eq.quality as number}
                    </div>
                  )}
                  <span className={styles.plusBadge}>+12</span>
                </>
              )}
            </div>

            {isAcc && (eq.accOptions as AnyData[])?.length > 0 && (
              <div className={styles.optionList}>
                {(eq.accOptions as { text: string; color: string }[]).map((opt, i) => {
                  const c = opt.color.toLowerCase();
                  const cls = c === '#ce43fc' ? styles.optTop : c === '#00b5ff' ? styles.optBottom : styles.optMid;
                  const badge = c === '#ce43fc' ? '상' : c === '#00b5ff' ? '하' : '중';
                  return (
                    <div key={i} className={styles.optRow}>
                      <span className={cls}>{badge}</span>
                      <span className={styles.optText}>{opt.text.replace(/\[[^\]]+\]/g, '').trim()}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {isStone && (eq.stoneEngravings as AnyData[])?.length > 0 && (
              <div className={styles.optionList}>
                {(eq.stoneEngravings as { name: string; level: string; isPenalty: boolean }[]).map((eng, i) => (
                  <div key={i} className={styles.stoneRow}>
                    <span className={eng.isPenalty ? styles.stonePenalty : styles.stoneLv}>{eng.level}</span>
                    <span className={styles.stoneName}>{eng.name}</span>
                  </div>
                ))}
              </div>
            )}

            {isSpecial && (
              <div className={styles.specialName}>{eq.cleanName as string}</div>
            )}
          </div>

          {isBracelet && (eq.braceletOptions as string[])?.length > 0 && (
            <div className={styles.braceletOpts}>
              {(eq.braceletOptions as string[]).map((opt, i) => (
                <div key={i} className={styles.braceletOpt}>{opt}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 보석 렌더링
  const renderGems = () => {
    if (!gems) return <div className={styles.loadingText}>로딩 중...</div>;
    type ParsedGem = AnyData & { skillName: string; skillIcon: string | null; isDamage: boolean; label: string };
    const gemsData = gems as AnyData;
    const parsedGems: ParsedGem[] = ((gemsData.Gems as AnyData[]) || []).map((gem) => {
      let skillName = '', isDamage = true, isT4 = false;
      try {
        const tooltipStr = gem.Tooltip as string;
        if (tooltipStr.includes('재사용 대기시간') && tooltipStr.includes('감소')) isDamage = false;
        if (tooltipStr.includes('티어 4') || tooltipStr.includes('1640')) isT4 = true;
        const tooltipObj = JSON.parse(tooltipStr);
        if (tooltipObj.Element_006?.value?.Element_001) {
          const match = (tooltipObj.Element_006.value.Element_001 as string).match(/<FONT COLOR=['"]#FFD200['"]>([^<]+)<\/FONT>/);
          if (match) skillName = match[1];
        }
      } catch {}
      const skillIcon = skillName ? ((combatSkills as AnyData[]) || []).find((s) => s.Name === skillName)?.Icon as string ?? null : null;
      const suffix = isDamage ? (isT4 ? '겁' : '멸') : (isT4 ? '작' : '홍');
      const label = `${gem.Level}${suffix}`;
      return { ...gem, skillName, skillIcon, isDamage, label } as ParsedGem;
    });
    parsedGems.sort((a, b) => (b.Level as number) - (a.Level as number));
    const dmg = parsedGems.filter((g) => g.isDamage);
    const cd  = parsedGems.filter((g) => !g.isDamage);
    if (dmg.length === 0 && cd.length === 0) return <div className={styles.gemEmpty}>장착된 보석이 없습니다.</div>;

    const gemEl = (gem: ParsedGem, idx: number) => (
      <div key={idx} className={styles.gemItem}>
        <div className={styles.gemIconWrap}>
          <img src={gem.Icon as string} alt={gem.label as string} />
          {gem.skillIcon && (
            <div className={styles.gemSkillIcon}>
              <img src={gem.skillIcon as string} alt={gem.skillName as string} />
            </div>
          )}
        </div>
        <span className={styles.gemLabel}>{gem.label as string}</span>
        {gem.skillName && (
          <div className={styles.gemTooltip}>
            <span className={styles.gemTooltipName}>{gem.skillName as string}</span>
          </div>
        )}
      </div>
    );

    return (
      <div className={styles.gemSection}>
        {dmg.length > 0 && <div className={styles.gemRow}>{dmg.map(gemEl)}</div>}
        {cd.length  > 0 && <div className={styles.gemRow}>{cd.map(gemEl)}</div>}
      </div>
    );
  };

  return (
    <div className={styles.grid}>
      {/* 좌측: 장비 + 보석 */}
      <div className={`${styles.colLeft}`} style={{ gridColumn: 'span 6' }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>장비</span>
          </div>
          <div className={styles.cardBody}>
            {!equipment ? (
              <div className={styles.loadingText}>로딩 중...</div>
            ) : (
              <div>
                <div className={styles.equipGrid}>
                  <div className={styles.equipCol}>
                    {leftEqs.map((eq, idx) => renderEquipItem(eq as ParsedEq, idx))}
                  </div>
                  <div className={styles.equipCol}>
                    {rightEqs.map((eq, idx) => renderEquipItem(eq, idx))}
                  </div>
                </div>
                {bracelet && (
                  <div className={styles.braceletSep}>
                    {renderEquipItem(bracelet, 100)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 보석 */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>보석</span>
          </div>
          <div className={styles.cardBody}>{renderGems()}</div>
        </div>
      </div>

      {/* 우측 */}
      <div style={{ gridColumn: 'span 6' }}>
        <div className={styles.rightGrid}>
          {/* 특성 + 아크패시브 */}
          <div className={styles.rightLeft}>
            {/* 특성 */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>특성</span>
                <span className={styles.cardLink}>❯</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.statList}>
                  <div className={styles.statRow}>
                    <div className={styles.statLeft}>
                      <div className={`${styles.statDot} ${styles.statDotRed}`} />
                      <span className={styles.statName}>치명</span>
                    </div>
                    <span className={styles.statVal}>{getStat('치명')}</span>
                  </div>
                  <div className={styles.statRow}>
                    <div className={styles.statLeft}>
                      <div className={`${styles.statDot} ${styles.statDotGold}`} />
                      <span className={styles.statName}>특화</span>
                    </div>
                    <span className={styles.statVal}>{getStat('특화')}</span>
                  </div>
                  <div className={styles.statRow}>
                    <div className={styles.statLeft}>
                      <div className={`${styles.statDot} ${styles.statDotBlue}`} />
                      <span className={styles.statName}>신속</span>
                    </div>
                    <span className={styles.statVal}>{getStat('신속')}</span>
                  </div>
                </div>
                <div className={styles.statFooter}>
                  <span>최대 생명력</span>
                  <span className={styles.statFooterVal}>{getStat('최대 생명력')}</span>
                </div>
              </div>
            </div>

            {/* 아크 패시브 */}
            {arkpassive ? (() => {
              const ap = arkpassive as AnyData;
              return (
                <div className={styles.arkCard}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>아크 패시브 포인트</span>
                    <button type="button" className={styles.cardLink} onClick={() => onTabChange?.('arkpassive')}>❯</button>
                  </div>
                  <div className={styles.arkPointsRow}>
                    {((ap.Points as AnyData[]) || []).map((p, idx) => {
                      const isEvo  = p.Name === '진화';
                      const isEnl  = p.Name === '깨달음';
                      const bdg    = isEvo ? styles.arkPointBadgeEvo : isEnl ? styles.arkPointBadgeEnl : styles.arkPointBadgeLeap;
                      const valCls = isEvo ? styles.arkPointValEvo  : isEnl ? styles.arkPointValEnl  : styles.arkPointValLeap;
                      return (
                        <div key={idx} className={styles.arkPointItem}>
                          <span className={`${styles.arkPointBadge} ${bdg}`}>{p.Name as string}</span>
                          <span className={`${styles.arkPointVal} ${valCls}`}>{p.Value as string}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.arkEffectsHeader}>아크 패시브 효과</div>
                  <div style={{ background: 'var(--bg-dark)' }}>
                    {['진화', '깨달음', '도약'].map((type) => {
                      const effects = ((ap.Effects as AnyData[]) || []).filter((e) => e.Name === type);
                      if (effects.length === 0) return null;
                      const titleCls = type === '진화' ? styles.arkTitleEvo : type === '깨달음' ? styles.arkTitleEnl : styles.arkTitleLeap;
                      return (
                        <div key={type} className={styles.arkEffectSection}>
                          <div className={`${styles.arkEffectSectionTitle} ${titleCls}`}>{type}</div>
                          <div className={styles.arkEffectGrid}>
                            {effects.map((eff, idx) => {
                              const tierMatch = (eff.Description as string).match(/(\d+)티어/);
                              const lvMatch   = (eff.Description as string).match(/Lv\.(\d+)/);
                              return (
                                <div key={idx} className={styles.arkEffectItem}>
                                  <img src={eff.Icon as string} alt={eff.Name as string} />
                                  <div className={styles.arkEffectInfo}>
                                    <span className={styles.arkEffectTier}>{tierMatch ? `T${tierMatch[1]}` : 'T?'}</span>
                                    <span className={styles.arkEffectLv}>{lvMatch ? `Lv.${lvMatch[1]}` : 'Lv.?'}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })() : null}
          </div>

          {/* 각인 + 보주 */}
          <div className={styles.rightRight}>
            <div className={styles.engravingCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>각인</span>
              </div>
              {!engravings ? (
                <div className={styles.loadingText}>로딩 중...</div>
              ) : (() => {
                const eng = engravings as AnyData;
                const effects = (eng.ArkPassiveEffects || eng.Effects || []) as AnyData[];
                return (
                  <div>
                    {eng.ArkPassiveEffects ? (
                      <div className={styles.engravingSubHeader}>
                        <span className={styles.engravingSubText}>아크 패시브 활성화</span>
                      </div>
                    ) : null}
                    <div className={styles.engravingList}>
                      {effects.map((e, idx) => {
                        const icon = e.Icon as string || getFallbackIcon(e.Name as string);
                        return (
                          <div key={idx} className={styles.engravingItem}>
                            <div className={styles.engravingLeft}>
                              <img src={icon} alt={e.Name as string} />
                              <span className={styles.engravingName}>{e.Name as string}</span>
                            </div>
                            <div className={styles.engravingRight}>
                              <div className={styles.engravingStone}>
                                <span className={styles.engravingStoneIcon}>♦</span>
                                <span className={styles.engravingStoneLv}>× {e.AbilityStoneLevel as number || 0}</span>
                              </div>
                              {(e.Level as number) > 0 && (
                                <div className={styles.engravingLv}>
                                  <span className={styles.engravingLvIcon}>♦</span>
                                  <span className={styles.engravingLvText}>Lv.{e.Level as number}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* 보주 */}
              {orb && (
                <>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>보주</span>
                  </div>
                  <div className={styles.orbSection}>
                    <div className={`${styles.orbIconWrap} ${getGradeClass(orb.Grade as string)}`}>
                      <img src={orb.Icon as string} alt={orb.cleanName as string} />
                    </div>
                    <div className={styles.orbInfo}>
                      <div className={styles.orbName}>{orb.cleanName as string}</div>
                      {orb.orbEffect && (
                        <div className={styles.orbEffect}>{orb.orbEffect as string}</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
