'use server'

export async function getCharacterData(characterName: string, endpoint: string) {
  if (!characterName) return { error: '캐릭터 이름을 입력해주세요.' };

  const apiKey = process.env.LOSTARK_API_KEY;
  if (!apiKey) {
    return { error: 'API 키가 설정되지 않았습니다.' };
  }

  try {
    // siblings 엔드포인트는 armories 경로가 아닌 characters 경로를 사용합니다.
    const url = endpoint === 'siblings' 
      ? `https://developer-lostark.game.onstove.com/characters/${encodeURIComponent(characterName)}/siblings`
      : `https://developer-lostark.game.onstove.com/armories/characters/${encodeURIComponent(characterName)}/${endpoint}`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      if (res.status === 404) return { error: '캐릭터를 찾을 수 없습니다.' };
      if (res.status === 429) return { error: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' };
      if (res.status === 401) return { error: 'API 키가 유효하지 않거나 인증에 실패했습니다.' };
      return { error: `API 요청 실패 (${res.status})` };
    }

    const data = await res.json();
    
    if (!data) return { error: '정보가 존재하지 않습니다.' };
    
    return { data };
  } catch (error) {
    console.error(`API Fetch Error (${endpoint}):`, error);
    return { error: '서버 통신 중 에러가 발생했습니다.' };
  }
}
