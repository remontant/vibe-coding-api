export function getQualityColor(q: number) {
  if (q >= 90) return 'bg-[#ca59ff]';
  if (q >= 70) return 'bg-[#00b5ff]';
  if (q >= 30) return 'bg-[#8cc500]';
  if (q > 0) return 'bg-[#ffe600]';
  return 'bg-[#ff0000]';
}

export function getMappedType(eqType: string, eqName: string) {
  if (eqType === '무기') return '무기';
  if (eqName.includes('머리장식') || eqType === '투구') return '투구';
  if (eqName.includes('견갑') || eqType === '어깨') return '어깨';
  if (eqName.includes('상의')) return '상의';
  if (eqName.includes('하의')) return '하의';
  if (eqName.includes('장갑')) return '장갑';
  return eqType;
}

const FALLBACK_ICONS: Record<string, string> = {};

const RANDOM_FALLBACKS = [
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_01/ark_passive_01_15.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_01/ark_passive_01_34.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_bm/ark_passive_bm_1.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_01/ark_passive_01_4.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_bm/ark_passive_bm_4.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_evolution/ark_passive_evolution_1.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_evolution/ark_passive_evolution_4.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_evolution/ark_passive_evolution_16.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_evolution/ark_passive_evolution_29.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_evolution/ark_passive_evolution_14.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_evolution/ark_passive_evolution_41.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_evolution/ark_passive_evolution_44.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_evolution/ark_passive_evolution_21.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_02/ark_passive_02_2.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_01/ark_passive_01_10.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_02/ark_passive_02_5.png',
  'https://cdn-lostark.game.onstove.com/efui_iconatlas/ark_passive_bm/ark_passive_bm_7.png'
];

export function getFallbackIcon(name: string) {
  // 우선 매핑된 아이콘 확인
  if (FALLBACK_ICONS[name]) return FALLBACK_ICONS[name];
  
  // 없다면 해싱을 통해 일관된 아이콘 반환
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % RANDOM_FALLBACKS.length;
  return RANDOM_FALLBACKS[index];
}