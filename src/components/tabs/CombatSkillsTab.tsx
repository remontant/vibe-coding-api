export default function CombatSkillsTab({ data }: { data: any }) {
  if (!Array.isArray(data)) return <div className="text-gray-500 text-sm">데이터가 없습니다.</div>;

  const activeSkills = data.filter((s: any) => s.Level > 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-bold text-white">스킬 현황</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">총 {activeSkills.length}개 스킬 사용 중</span>
          <button className="flex items-center gap-2 bg-[#ff5e5e] hover:bg-[#ff4444] text-white px-3 py-1.5 rounded-md transition-colors font-medium text-xs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            스킬 코드
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeSkills.map((skill: any, idx: number) => {
          const selectedTripods = skill.Tripods?.filter((t: any) => t.IsSelected) || [];
          const code = selectedTripods.map((t: any) => t.Slot).join('');
          
          return (
            <div key={idx} className="bg-[#181a20] rounded-xl border border-[#2a2d36] p-5 flex flex-col gap-4 hover:border-[#444] transition-colors group">
              {/* 상단: 스킬 아이콘, 이름, 레벨, 타입, 그리고 우측에 트포코드 */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src={skill.Icon} alt={skill.Name} className="w-10 h-10 rounded-full border border-[#333]" />
                  <div className="flex items-center gap-2">
                    <span className="text-[#ff5e5e] font-bold text-sm">Lv.{skill.Level}</span>
                    <span className="text-white font-bold text-base">{skill.Name}</span>
                    <span className="text-xs text-gray-500 bg-[#222] px-1.5 py-0.5 rounded border border-[#333]">{skill.Type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-[#2a2d36] text-gray-300 text-sm font-mono px-2 py-1 rounded border border-[#333] tracking-widest">{code}</span>
                  <span className="text-gray-500 group-hover:text-white transition-colors cursor-pointer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </span>
                </div>
              </div>

              {/* 하단: 트라이포드 목록과 룬 */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-4">
                  {selectedTripods.map((t: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <img src={t.Icon} alt={t.Name} className="w-6 h-6 rounded-full" />
                      <span className="text-xs text-gray-400">{t.Name}</span>
                    </div>
                  ))}
                </div>
                
                {skill.Rune && (
                  <div className="flex items-center gap-1.5 bg-[#111] px-2 py-1 rounded border border-[#222]">
                    <img src={skill.Rune.Icon} alt={skill.Rune.Name} className="w-5 h-5 rounded-full" />
                    <span className={`text-xs font-bold ${
                      skill.Rune.Grade === '전설' ? 'text-[#e5c171]' :
                      skill.Rune.Grade === '영웅' ? 'text-[#ce43fc]' :
                      skill.Rune.Grade === '희귀' ? 'text-[#00b5ff]' : 'text-gray-300'
                    }`}>
                      {skill.Rune.Name}
                    </span>
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
