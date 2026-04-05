export default function ArkPassiveTab({ data }: { data: any }) {
  if (!data) return <div className="text-gray-500 text-sm">데이터가 없습니다.</div>;
  
  const columns = ['깨달음', '진화', '도약'];
  const colors: Record<string, string> = {
    '깨달음': 'text-[#87bdf5]',
    '진화': 'text-[#e5c171]',
    '도약': 'text-[#aadd66]'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {columns.map(colName => {
        const pointInfo = data.Points?.find((p: any) => p.Name === colName);
        const effects = data.Effects?.filter((e: any) => e.Name === colName) || [];
        
        return (
          <div key={colName} className="bg-[#111] border border-[#2a2d36] rounded-xl flex flex-col overflow-hidden">
            <div className="bg-[#181a20] border-b border-[#2a2d36] p-4 flex flex-col items-center justify-center">
              <div className={`text-lg font-bold ${colors[colName]}`}>{colName}</div>
              <div className="text-3xl font-bold text-white mt-1">{pointInfo?.Value || 0}</div>
              <div className="text-xs text-gray-400 mt-1">{pointInfo?.Description || '0랭크 0레벨'}</div>
            </div>
            <div className="flex flex-col gap-2 p-4 h-full">
              {effects.length > 0 ? effects.map((eff: any, idx: number) => (
                <div key={idx} className="bg-[#1a1c23] p-3 rounded border border-[#333] flex items-start gap-3">
                  {eff.Icon && <img src={eff.Icon} className="w-10 h-10 rounded border border-[#444] shrink-0" alt={eff.Name} />}
                  <div className="text-[11px] text-gray-300 leading-relaxed overflow-hidden break-words w-full">
                    <div dangerouslySetInnerHTML={{ __html: eff.Description }} />
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-600 text-xs py-8">활성화된 효과가 없습니다.</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}