import { getQualityColor, getMappedType, getFallbackIcon } from './utils';

export default function ProfileTab({ 
  profile, 
  equipment, 
  engravings, 
  gems, 
  arkpassive, 
  combatSkills,
  onTabChange 
}: any) {
  // 특성 필터링 헬퍼
  const getStat = (type: string) => {
    return profile?.Stats?.find((s: any) => s.Type === type)?.Value || '0';
  };

  const parsedEquipment = equipment?.map((eq: any) => {
    let quality = -1;
    let itemLevel = 0;
    let tier = '';
    let advRefine = '';
    let stoneEngravings: { name: string, level: string, isPenalty: boolean }[] = [];
    let accOptions: { text: string, color: string }[] = [];
    let braceletOptions: string[] = [];
    let orbEffect = '';

    try {
      const tooltip = JSON.parse(eq.Tooltip);
      
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

        if (tooltip[key].type === 'SingleTextBox' && tooltip[key].value.includes('상급 재련')) {
          const match = tooltip[key].value.match(/<FONT COLOR='#FFD200'>(\d+)<\/FONT>단계/);
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
              stoneEngravings.push({
                name: nameMatch[2],
                level: lvMatch[1],
                isPenalty: nameMatch[1] === '#FE2E2E'
              });
            }
          }
        }

        if (tooltip[key].type === 'ItemPartBox' && tooltip[key].value?.Element_000?.includes('연마 효과')) {
          const lines = tooltip[key].value.Element_001.split('<br>');
          lines.forEach((line: string) => {
             const cleanLine = line.replace(/<img[^>]*>/g, '').trim();
             const colorMatch = cleanLine.match(/<FONT[ ]+color='?#?([^'>]+)'?>/i) || cleanLine.match(/<FONT[ ]+COLOR='?#?([^'>]+)'?>/i);
             const text = cleanLine.replace(/<[^>]*>/g, '').trim();
             if (text) {
               accOptions.push({ text, color: colorMatch ? '#' + colorMatch[1].replace('#', '') : '#ffffff' });
             }
          });
        }

        if (tooltip[key].type === 'ItemPartBox' && tooltip[key].value?.Element_000?.includes('팔찌 효과')) {
          const lines = tooltip[key].value.Element_001.split('<BR>');
          lines.forEach((line: string) => {
             const text = line.replace(/<img[^>]*>/g, '').replace(/<[^>]*>/g, '').trim();
             if (text) braceletOptions.push(text);
          });
        }

        if (tooltip[key].type === 'ItemPartBox' && tooltip[key].value?.Element_000?.includes('특수 효과')) {
          // 보주 특수 효과 텍스트 추출 (HTML 태그 제거)
          orbEffect = tooltip[key].value.Element_001.replace(/<br>/gi, ' ').replace(/<BR>/gi, ' ').replace(/<[^>]*>/g, '').trim();
        }
      }
    } catch(e) {}

    let refine = '';
    let cleanName = eq.Name.replace(/<[^>]*>/g, '');
    const refineMatch = cleanName.match(/^\+(\d+)\s+/);
    if (refineMatch) {
      refine = '+' + refineMatch[1];
      cleanName = cleanName.replace(/^\+(\d+)\s+/, '');
    }

    return { ...eq, cleanName, quality, itemLevel, tier, refine, advRefine, stoneEngravings, accOptions, braceletOptions, orbEffect };
  }) || [];

  const leftEqTypes = ['투구', '어깨', '상의', '하의', '장갑', '무기'];
  const rightEqTypes = ['목걸이', '귀걸이', '반지', '어빌리티 스톤'];

  const leftEqs = leftEqTypes.map(t => parsedEquipment.find((eq: any) => getMappedType(eq.Type, eq.cleanName) === t)).filter(Boolean);
  const rightEqs = parsedEquipment.filter((eq: any) => rightEqTypes.includes(eq.Type));
  rightEqs.sort((a: any, b: any) => rightEqTypes.indexOf(a.Type) - rightEqTypes.indexOf(b.Type));

  const bracelet = parsedEquipment.find((eq: any) => eq.Type === '팔찌');
  const orb = parsedEquipment.find((eq: any) => eq.Type === '보주');
  const specialEquips = parsedEquipment.filter((eq: any) => ['나침반', '부적', '보주'].includes(eq.Type));

  const renderEquipItem = (eq: any, idx: number) => {
    if (!eq) return null;
    const isStone = eq.Type === '어빌리티 스톤';
    const isBracelet = eq.Type === '팔찌';
    const isAcc = ['목걸이', '귀걸이', '반지'].includes(eq.Type);
    const isArmorWeapon = ['투구', '어깨', '상의', '하의', '장갑', '무기'].includes(getMappedType(eq.Type, eq.cleanName));
    const isSpecial = ['나침반', '부적', '보주'].includes(eq.Type);
    
    const bgGrade = eq.Grade === '에스더' ? 'from-[#0c2e2c] to-[#26a89c]' :
                    eq.Grade === '고대' ? 'from-[#3d3325] to-[#dcc999]' :
                    eq.Grade === '유물' ? 'from-[#3a1b14] to-[#c96226]' : 
                    eq.Grade === '전설' ? 'from-[#362a0c] to-[#c89d20]' : 'from-[#222] to-[#444]';

    return (
      <div key={`${eq.Name}-${idx}`} className="flex items-start gap-3 bg-[#111] p-3 rounded border border-[#222]">
        <div className={`relative w-[46px] h-[46px] rounded border border-[#333] shrink-0 bg-gradient-to-br ${bgGrade}`}>
          <img src={eq.Icon} alt={eq.Type} className="w-full h-full object-cover rounded" />
          {eq.quality >= 0 && !isStone && !isBracelet && !isSpecial && (
            <div className={`absolute -bottom-1.5 -left-1.5 text-[9px] text-white px-1 rounded font-bold z-10 border border-[#222] ${getQualityColor(eq.quality)}`}>
              {eq.quality}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            {isArmorWeapon ? (
              <>
                <span className="text-[13px] font-bold text-[#e3c7a1]">{getMappedType(eq.Type, eq.cleanName)} <span className="text-white">{eq.refine}</span></span>
                <span className="text-[11px] text-gray-400">T4 <span className="text-gray-500 underline decoration-gray-600 underline-offset-2">{eq.advRefine}</span></span>
              </>
            ) : isSpecial ? (
              <span className="text-[13px] font-bold text-white">{eq.Type}</span>
            ) : (
              <span className="text-[13px] font-bold text-white">{isStone ? '스톤' : eq.Type} <span className="text-[11px] text-gray-400 font-normal">T4</span></span>
            )}
          </div>

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {isArmorWeapon && (
                <>
                  {eq.quality >= 0 && (
                    <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${getQualityColor(eq.quality)}`}>
                      {eq.quality}
                    </div>
                  )}
                  <span className="text-[11px] text-gray-400">{eq.itemLevel}</span>
                </>
              )}
              {isAcc && (
                <>
                  {eq.quality >= 0 && (
                    <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-[#00b5ff]`}>
                      {eq.quality}
                    </div>
                  )}
                  <span className="text-[10px] bg-[#222] text-[#00b5ff] border border-[#333] px-1.5 py-0.5 rounded-full">+12</span>
                </>
              )}
            </div>

            {isAcc && eq.accOptions && (
              <div className="flex flex-col text-[10px] leading-tight border-l border-[#333] pl-2 ml-2">
                {eq.accOptions.map((opt: any, i: number) => {
                  let badge = '';
                  let color = '';
                  if (opt.color.toLowerCase() === '#ce43fc') { badge = '상'; color = 'text-[#ce43fc]'; }
                  else if (opt.color.toLowerCase() === '#00b5ff') { badge = '하'; color = 'text-[#00b5ff]'; }
                  else { badge = '중'; color = 'text-[#91FE02]'; }
                  
                  return (
                    <div key={i} className="flex gap-1">
                      <span className={color}>{badge}</span>
                      <span className="text-gray-300">{opt.text.replace(/\[[^\]]+\]/g, '').trim()}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {isStone && eq.stoneEngravings && (
              <div className="flex flex-col text-[10px] leading-tight border-l border-[#333] pl-2 ml-2">
                {eq.stoneEngravings.map((eng: any, i: number) => (
                  <div key={i} className="flex gap-1">
                    <span className={eng.isPenalty ? 'text-[#ff5e5e]' : 'text-white'}>{eng.level}</span>
                    <span className="text-gray-400">{eng.name}</span>
                  </div>
                ))}
              </div>
            )}
            
            {isSpecial && (
               <div className="flex flex-col text-[10px] leading-tight border-l border-[#333] pl-2 ml-2 text-gray-400 truncate max-w-[150px]">
                 {eq.cleanName}
               </div>
            )}
          </div>
          
          {isBracelet && (
            <div className="mt-2 text-[10px] text-gray-400 leading-relaxed border-t border-[#222] pt-2">
               {eq.braceletOptions.map((opt: string, i: number) => (
                 <div key={i} className="truncate">{opt}</div>
               ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-6 flex flex-col gap-4">
        <div className="bg-[#181a20] rounded-xl border border-[#2a2d36] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2d36] flex justify-between items-center">
            <span className="font-bold text-sm text-gray-200">장비</span>
          </div>
          <div className="p-4">
            {!equipment ? (
              <div className="text-center text-sm text-gray-500 py-20">로딩 중...</div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    {leftEqs.map((eq: any, idx: number) => renderEquipItem(eq, idx))}
                  </div>
                  <div className="flex flex-col gap-2">
                    {rightEqs.map((eq: any, idx: number) => renderEquipItem(eq, idx))}
                  </div>
                </div>
                {bracelet && (
                  <div className="flex flex-col gap-3 border-t border-[#2a2d36] pt-4">
                    {renderEquipItem(bracelet, 100)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 보석 정보 (좌측 하단으로 이동) */}
        <div className="bg-[#181a20] rounded-xl border border-[#2a2d36] overflow-hidden flex-1">
          <div className="px-4 py-3 border-b border-[#2a2d36] flex justify-between items-center">
            <span className="font-bold text-sm text-gray-200">보석</span>
          </div>
          <div className="p-5">
            {!gems ? (
              <div className="text-center text-sm text-gray-500 py-4">로딩 중...</div>
            ) : (
              (() => {
                const parsedGems = gems.Gems?.map((gem: any) => {
                  let skillName = '';
                  let isDamage = true; // 기본값을 딜 보석으로 설정 (서포터 등 포괄)
                  let isT4 = false;

                  try {
                    const tooltipStr = gem.Tooltip || '';
                    
                    // Extract type (쿨감이 아니면 딜 보석으로 분류)
                    if (tooltipStr.includes('재사용 대기시간') && tooltipStr.includes('감소')) {
                      isDamage = false;
                    }

                    // Extract tier (T4 gems have Item Level 1640 or '티어 4' in tooltip)
                    if (tooltipStr.includes('티어 4') || tooltipStr.includes('1640')) isT4 = true;

                    // Extract skill name via JSON
                    const tooltipObj = JSON.parse(tooltipStr);
                    if (tooltipObj.Element_006 && tooltipObj.Element_006.value && tooltipObj.Element_006.value.Element_001) {
                      const rawText = tooltipObj.Element_006.value.Element_001;
                      const skillMatch = rawText.match(/<FONT COLOR=['"]#FFD200['"]>([^<]+)<\/FONT>/);
                      if (skillMatch) skillName = skillMatch[1];
                    }
                  } catch (e) {}

                  // Find skill icon from combatSkills
                  const skillIcon = combatSkills?.find((s: any) => s.Name === skillName)?.Icon || null;

                  // Create short label (e.g. "7겁", "8작")
                  let label = `${gem.Level}`;
                  if (isDamage) {
                    label += isT4 ? '겁' : '멸';
                  } else {
                    label += isT4 ? '작' : '홍';
                  }

                  return { ...gem, skillName, skillIcon, isDamage, label };
                }) || [];

                // Sort: Level desc
                parsedGems.sort((a: any, b: any) => b.Level - a.Level);

                const damageGems = parsedGems.filter((g: any) => g.isDamage);
                const cooldownGems = parsedGems.filter((g: any) => !g.isDamage);

                const renderGem = (gem: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 group relative">
                    <div className="relative w-12 h-12">
                      <img src={gem.Icon} alt={gem.label} className="w-12 h-12 rounded-lg border border-[#333] shadow-md" />
                      {gem.skillIcon && (
                        <div className="absolute -bottom-1 -right-1 w-[22px] h-[22px] rounded-full border border-black bg-black overflow-hidden z-10 shadow">
                          <img src={gem.skillIcon} alt={gem.skillName} className="w-full h-full object-cover scale-110" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-200 tracking-wider">{gem.label}</span>
                    
                    {/* Hover Tooltip for skill name */}
                    {gem.skillName && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-[#111] border border-[#333] px-2.5 py-1.5 rounded shadow-xl text-xs text-gray-200 z-20 pointer-events-none">
                        <span className="text-[#FFD200] font-bold">{gem.skillName}</span>
                      </div>
                    )}
                  </div>
                );

                return (
                  <div className="flex flex-col gap-6">
                    {damageGems.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                        {damageGems.map(renderGem)}
                      </div>
                    )}
                    {cooldownGems.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                        {cooldownGems.map(renderGem)}
                      </div>
                    )}
                    {damageGems.length === 0 && cooldownGems.length === 0 && (
                      <div className="text-center text-sm text-gray-500 py-4">장착된 보석이 없습니다.</div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          
          {/* 좌측 열: 특성 + 아크패시브 */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#181a20] rounded-xl border border-[#2a2d36] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2d36] flex justify-between items-center">
                <span className="font-bold text-sm text-gray-200">특성</span>
                <span className="text-xs text-gray-500 hover:text-[#d4af37] cursor-pointer">❯</span>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#ff5e5e] rounded-sm"></div>
                    <span className="text-gray-400 text-sm">치명</span>
                  </div>
                  <span className="text-white font-bold">{getStat('치명')}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#d4af37] rounded-sm"></div>
                    <span className="text-gray-400 text-sm">특화</span>
                  </div>
                  <span className="text-white font-bold">{getStat('특화')}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#4cc3ff] rounded-sm"></div>
                    <span className="text-gray-400 text-sm">신속</span>
                  </div>
                  <span className="text-white font-bold">{getStat('신속')}</span>
                </div>
                <div className="text-xs text-gray-400 border-t border-[#2a2d36] pt-3 flex justify-between mt-2">
                  <span>최대 생명력</span>
                  <span className="text-white">{getStat('최대 생명력')}</span>
                </div>
              </div>
            </div>

            {/* 3. 아크 패시브 종합 블록 */}
            {arkpassive && (
              <div className="bg-[#181a20] rounded-xl border border-[#2a2d36] overflow-hidden flex flex-col">
                {/* 포인트 헤더 */}
                <div className="px-4 py-3 flex justify-between items-center border-b border-[#2a2d36]">
                  <span className="font-bold text-sm text-gray-200">아크 패시브 포인트</span>
                  <span className="text-xs text-gray-500 hover:text-[#d4af37] cursor-pointer" onClick={() => onTabChange('arkpassive')}>❯</span>
                </div>
                <div className="px-4 py-3 bg-[#111]">
                  <div className="flex justify-start gap-4">
                    {arkpassive.Points?.map((p: any, idx: number) => {
                      const color = p.Name === '진화' ? 'text-[#e5c171]' : p.Name === '깨달음' ? 'text-[#87bdf5]' : 'text-[#aadd66]';
                      const borderColor = p.Name === '진화' ? 'border-[#e5c171]/50' : p.Name === '깨달음' ? 'border-[#87bdf5]/50' : 'border-[#aadd66]/50';
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${borderColor} text-gray-300 bg-[#222]`}>{p.Name}</span>
                          <span className={`text-sm font-bold ${color}`}>{p.Value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* 효과 섹션 */}
                <div className="px-4 py-3 border-y border-[#2a2d36] bg-[#181a20]">
                  <span className="font-bold text-sm text-gray-200">아크 패시브 효과</span>
                </div>
                <div className="flex flex-col bg-[#111]">
                  {['진화', '깨달음', '도약'].map((type) => {
                    const effects = arkpassive.Effects?.filter((e: any) => e.Name === type) || [];
                    if (effects.length === 0) return null;
                    
                    const titleColor = type === '진화' ? 'text-[#e5c171]' : type === '깨달음' ? 'text-[#4cc3ff]' : 'text-[#aadd66]';

                    return (
                      <div key={type} className="flex flex-col border-b border-[#222] last:border-0">
                        <div className="px-4 py-3">
                          <span className={`text-sm font-bold ${titleColor}`}>{type}</span>
                        </div>
                        <div className="grid grid-cols-2">
                          {effects.map((eff: any, idx: number) => {
                            const tierMatch = eff.Description.match(/(\d+)티어/);
                            const lvMatch = eff.Description.match(/Lv\.(\d+)/);
                            const tier = tierMatch ? `T${tierMatch[1]}` : 'T?';
                            const lv = lvMatch ? `Lv.${lvMatch[1]}` : 'Lv.?';

                            return (
                              <div key={idx} className="flex items-center gap-3 px-4 py-2 border-t border-[#222] even:border-l">
                                <img src={eff.Icon} alt={eff.Name} className="w-8 h-8 rounded border border-[#333]" />
                                <div className="flex items-center gap-2">
                                  <span className="bg-[#2a2d36] text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#444]">{tier}</span>
                                  <span className="text-gray-200 text-sm font-bold">{lv}</span>
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
            )}
          </div>

          {/* 우측 열: 각인 + 보주 */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#181a20] rounded-xl border border-[#2a2d36] overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-[#2a2d36] flex justify-between items-center">
                <span className="font-bold text-sm text-gray-200">각인</span>
              </div>
              <div className="p-0">
                {!engravings ? (
                  <div className="text-center text-sm text-gray-500 py-8">로딩 중...</div>
                ) : (
                  <div className="flex flex-col">
                    {/* 서브 헤더 */}
                    {engravings.ArkPassiveEffects && (
                      <div className="px-4 py-2 border-b border-[#222] flex justify-between items-center bg-[#111]">
                        <span className="text-xs text-gray-400"></span>
                        <span className="text-xs text-[#aadd66]">아크 패시브 활성화</span>
                      </div>
                    )}
                    {/* 각인 리스트 */}
                    <div className="flex flex-col bg-[#111]">
                      {(engravings.ArkPassiveEffects || engravings.Effects || []).map((eng: any, idx: number) => {
                        const iconSrc = eng.Icon || getFallbackIcon(eng.Name); 
                        const stoneLevel = eng.AbilityStoneLevel || 0;
                        const engLevel = eng.Level || 0;
                        
                        return (
                          <div key={idx} className="flex justify-between items-center px-4 py-2.5 border-b border-[#222] last:border-0 hover:bg-[#1a1c23] transition-colors">
                            <div className="flex items-center gap-3">
                              <img src={iconSrc} className="w-8 h-8 rounded border border-[#333]" alt={eng.Name} />
                              <span className="text-sm font-bold text-gray-200">{eng.Name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <span className="text-[#ff5e5e] text-[10px]">♦</span>
                                <span className="text-gray-300 text-sm">× {stoneLevel}</span>
                              </div>
                              {engLevel > 0 && (
                                <div className="flex items-center gap-1 w-12 justify-end">
                                  <span className="text-[#4cc3ff] text-[10px]">♦</span>
                                  <span className="text-gray-300 text-sm">Lv.{engLevel}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {/* 보주 블록 (각인 바로 아래 배치) */}
              {orb && (
                <>
                  <div className="px-4 py-3 border-y border-[#2a2d36] flex justify-between items-center bg-[#181a20]">
                    <span className="font-bold text-sm text-gray-200">보주</span>
                  </div>
                  <div className="flex items-start gap-3 bg-[#111] p-4">
                    <div className={`relative w-[46px] h-[46px] rounded border border-[#333] shrink-0 bg-gradient-to-br ${
                      orb.Grade === '에스더' ? 'from-[#0c2e2c] to-[#26a89c]' :
                      orb.Grade === '고대' ? 'from-[#3d3325] to-[#dcc999]' :
                      orb.Grade === '유물' ? 'from-[#3a1b14] to-[#c96226]' : 
                      orb.Grade === '전설' ? 'from-[#362a0c] to-[#c89d20]' : 'from-[#222] to-[#444]'
                    }`}>
                      <img src={orb.Icon} alt={orb.cleanName} className="w-full h-full object-cover rounded" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                      <div className="text-[13px] font-bold text-white">{orb.cleanName}</div>
                      {orb.orbEffect && (
                        <div className="text-[11px] text-gray-400 leading-relaxed mt-0.5">
                          {orb.orbEffect}
                        </div>
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