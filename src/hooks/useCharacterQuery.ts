import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { getCharacterData } from '@/app/actions';

type Tab = 'profiles' | 'equipment' | 'engravings' | 'arkpassive' | 'gems' | 'combat-skills' | 'siblings';

// 각 탭별로 독립적인 query — React Query가 캐싱/로딩/에러를 자동 관리
export function useCharacterQuery(characterName: string, tab: Tab) {
  return useQuery({
    queryKey: ['character', characterName, tab],
    queryFn: async () => {
      const res = await getCharacterData(characterName, tab);
      if (res?.error) throw new Error(res.error);
      if (!res?.data) throw new Error('데이터를 찾을 수 없습니다.');
      return res.data;
    },
    enabled: !!characterName,
    staleTime: 5 * 60 * 1000,  // 5분간 fresh 유지 — 같은 캐릭터 재검색 시 API 미호출
    gcTime: 10 * 60 * 1000,    // 10분간 캐시 보관
    retry: 1,
  });
}

// HOT 캐릭터 목록의 프로필을 병렬로 조회 — 5분마다 자동 갱신
export type HotCharacterBase = {
  name: string;
  type: 'dps' | 'support';
};

export function useHotCharactersQuery(characters: HotCharacterBase[]) {
  const results = useQueries({
    queries: characters.map((char) => ({
      queryKey: ['character', char.name, 'profiles'],
      queryFn: async () => {
        const res = await getCharacterData(char.name, 'profiles');
        if (res?.error) throw new Error(res.error);
        if (!res?.data) throw new Error('not found');
        return res.data as Record<string, string>;
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
    })),
  });

  return characters.map((char, idx) => ({
    name: char.name,
    type: char.type,
    combatPower: (results[idx].data?.CombatPower as string) ?? null,
    isLoading: results[idx].isLoading,
    isError: results[idx].isError,
  }));
}

// 검색 시 모든 탭을 미리 prefetch — 탭 전환이 즉각적으로 느껴지게 함
export function usePrefetchCharacter() {
  const queryClient = useQueryClient();

  const prefetchAllTabs = (characterName: string) => {
    const tabs: Tab[] = ['equipment', 'engravings', 'arkpassive', 'gems', 'combat-skills'];
    tabs.forEach((tab) => {
      queryClient.prefetchQuery({
        queryKey: ['character', characterName, tab],
        queryFn: async () => {
          const res = await getCharacterData(characterName, tab);
          if (res?.error) throw new Error(res.error);
          return res?.data ?? null;
        },
        staleTime: 5 * 60 * 1000,
      });
    });
  };

  return { prefetchAllTabs };
}
