import { useState } from 'react';

export default function GemsTab({ data, combatSkills }: { data: any, combatSkills: any }) {
  const [sortOrder, setSortOrder] = useState<'default' | 'levelDesc'>('default');

  if (!data?.Gems || data.Gems.length === 0) {
    return <div className="text-gray-500 text-sm">장착된 보석이 없습니다.</div>;
  }

  // 보석 데이터 파싱 (딜/쿨 구분 및 스킬 이름/아이콘 추출)
  const parsedGems = data.Gems.map((gem: any) => {
    let skillName = '';
    let isDamage = true; // 기본값을 딜 보석으로 설정 (서포터 등 다양한 텍스트 포괄)
    let isT4 = false;
    let effectText = '';

    try {
      const tooltipStr = gem.Tooltip || '';
      
      // 딜/쿨 구분 (쿨감이 아니면 딜 보석으로 분류)
      if (tooltipStr.includes('재사용 대기시간') && tooltipStr.includes('감소')) {
        isDamage = false;
      }
      
      // T4 보석 구분
      if (tooltipStr.includes('티어 4') || tooltipStr.includes('1640')) isT4 = true;

      // JSON 파싱으로 정확한 스킬명과 효과 추출 (상단 Title의 '장착중'과 혼동 방지)
      const tooltipObj = JSON.parse(tooltipStr);
      if (tooltipObj.Element_006 && tooltipObj.Element_006.value && tooltipObj.Element_006.value.Element_001) {
        const rawText = tooltipObj.Element_006.value.Element_001;
        
        const skillMatch = rawText.match(/<FONT COLOR=['"]#FFD200['"]>([^<]+)<\/FONT>/);
        if (skillMatch) skillName = skillMatch[1];

        // HTML 태그 제거 및 스킬명/클래스명 등 정리
        let cleanText = rawText.replace(/<[^>]+>/g, ' '); // 태그를 공백으로
        cleanText = cleanText.replace(/\[.*?\]/g, ''); // [직업명] 제거
        if (skillName) cleanText = cleanText.replace(skillName, ''); // 스킬명 중복 제거
        
        // "추가 효과" 등의 불필요한 단어 정리 및 다듬기
        cleanText = cleanText.replace(/추가 효과/g, ',').replace(/\s+/g, ' ').trim();
        
        // 쉼표 띄어쓰기 정리
        cleanText = cleanText.replace(/ , /g, ', ').replace(/^,\s*/, '').trim();
        effectText = cleanText;
      }
    } catch (e) {
      effectText = isDamage ? '피해 증가' : '재사용 대기시간 감소';
    }

    // 전투 스킬 데이터에서 스킬 아이콘 찾기
    const skillIcon = combatSkills?.find((s: any) => s.Name === skillName)?.Icon || null;

    // 명칭 라벨 생성
    let label = `${gem.Level}`;
    if (isDamage) label += isT4 ? '레벨 겁화' : '레벨 멸화';
    else label += isT4 ? '레벨 작열' : '레벨 홍염';

    return { ...gem, skillName, skillIcon, isDamage, label, isT4, effectText };
  });

  // 정렬 로직
  let sortedGems = [...parsedGems];
  if (sortOrder === 'levelDesc') {
    // 레벨 높은 순 (레벨이 같으면 슬롯 순)
    sortedGems.sort((a: any, b: any) => {
      if (b.Level !== a.Level) return b.Level - a.Level;
      return a.Slot - b.Slot;
    });
  } else {
    // 기본순 (API에서 제공해준 순서인 Slot 오름차순)
    sortedGems.sort((a: any, b: any) => a.Slot - b.Slot);
  }

  const damageGems = sortedGems.filter((g: any) => g.isDamage);
  const cooldownGems = sortedGems.filter((g: any) => !g.isDamage);

  const renderGemListRow = (gem: any, idx: number) => (
    <div key={idx} className="bg-[#181a20] border-b border-[#2a2d36] last:border-0 p-4 flex items-center justify-between hover:bg-[#22252e] transition-colors group">
      <div className="flex items-center gap-6 w-full">
        {/* 아이콘 */}
        <div className="relative shrink-0 flex items-center justify-center w-12 h-12">
          <img src={gem.Icon} className="w-10 h-10 rounded border border-[#333]" alt={gem.label} />
        </div>
        
        {/* 명칭 (8광) */}
        <div className="shrink-0 w-20">
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${gem.isDamage ? 'bg-[#3b30d8] text-white' : 'bg-[#3b30d8] text-white'}`}>
            {gem.Level}{gem.isDamage ? (gem.isT4 ? (gem.label.includes('겁화') ? '겁' : '광') : '멸') : (gem.isT4 ? (gem.label.includes('작열') ? '작' : '광') : '홍')}
          </span>
        </div>
        
        {/* 스킬명 */}
        <div className="w-48 shrink-0">
          <span className="text-gray-100 font-bold text-sm truncate">{gem.skillName || '알 수 없는 스킬'}</span>
        </div>

        {/* 효과 텍스트 */}
        <div className="flex-1 text-gray-400 text-sm">
          {gem.effectText || (gem.isDamage ? '피해 증가' : '재사용 대기시간 감소')}
        </div>
      </div>
    </div>
  );

  const renderGemCard = (gem: any, idx: number) => (
    <div key={idx} className="bg-[#181a20] rounded-xl border border-[#2a2d36] p-4 flex items-center gap-4 hover:border-[#444] transition-colors">
      <div className="relative shrink-0">
        <img src={gem.Icon} className="w-14 h-14 rounded-lg border border-[#333]" alt={gem.label} />
        <span className="absolute -bottom-2 -right-2 bg-black text-xs px-1.5 py-0.5 rounded border border-[#444] font-bold text-white z-10">
          Lv.{gem.Level}
        </span>
      </div>
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${gem.isDamage ? 'text-[#ff5e5e]' : 'text-[#4cc3ff]'}`}>
            {gem.label}
          </span>
          <span className="text-xs text-gray-500">{gem.Grade} 보석</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {gem.skillIcon && (
            <img src={gem.skillIcon} alt={gem.skillName} className="w-5 h-5 rounded-full border border-[#444]" />
          )}
          <span className="text-gray-200 font-bold text-sm truncate">{gem.skillName || '알 수 없는 스킬'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 최상단: 헤더 및 정렬 옵션 */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">장착 보석</h3>
        <div className="flex gap-2 bg-[#1a1c23] p-1 rounded-lg border border-[#2a2d36]">
          <button 
            onClick={() => setSortOrder('default')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              sortOrder === 'default' 
                ? 'bg-[#2a2d36] text-white shadow-sm' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            기본순
          </button>
          <button 
            onClick={() => setSortOrder('levelDesc')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              sortOrder === 'levelDesc' 
                ? 'bg-[#2a2d36] text-white shadow-sm' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            레벨 높은 순
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        {sortOrder === 'default' ? (
          <>
            {/* 기본순: 딜/쿨 분리된 카드형 레이아웃 */}
            {damageGems.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-2 border-b border-[#2a2d36] pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5e5e]"></span>
                  <h4 className="text-lg font-bold text-white">피해 증가 (겁화 / 멸화)</h4>
                  <span className="text-gray-400 text-sm ml-2">{damageGems.length}개</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {damageGems.map(renderGemCard)}
                </div>
              </div>
            )}

            {cooldownGems.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-2 border-b border-[#2a2d36] pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4cc3ff]"></span>
                  <h4 className="text-lg font-bold text-white">재사용 대기시간 감소 (작열 / 홍염)</h4>
                  <span className="text-gray-400 text-sm ml-2">{cooldownGems.length}개</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cooldownGems.map(renderGemCard)}
                </div>
              </div>
            )}
          </>
        ) : (
          /* 레벨 높은 순: 딜/쿨 구분 없이 리스트형으로 한 번에 쭉 나열 */
          <div className="bg-[#181a20] rounded-xl border border-[#2a2d36] overflow-hidden flex flex-col">
            {sortedGems.map(renderGemListRow)}
          </div>
        )}
      </div>
    </div>
  );
}
