'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { ChevronRight, ChevronDown } from 'lucide-react';
import styles from './raid.module.css';

// 13:00 ~ 02:00 (14칸) + 03-12 통합 1칸
// CELL_W / NAME_W 값은 CSS와 동기화 필요
const HOURS = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2];
const CELL_W = 38;
const NAME_W = 80;
const MEMBER_COLORS = ['#7c6fe0', '#f97316', '#14b8a6', '#ec4899', '#3b82f6', '#eab308', '#ef4444'];

type Entry = { name: string; image?: string; characterClassName?: string; hours: number[] };
type RaidDB = Record<string, Record<string, Entry>>;
type DayInfo = ReturnType<typeof buildWeekDates>[0];

function buildWeekDates(offset = 0) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const dow = now.getDay();
  const toWed = dow >= 3 ? dow - 3 : dow + 4;
  const wed = new Date(now);
  wed.setDate(now.getDate() - toWed + offset * 7);
  wed.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(wed);
    d.setDate(wed.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const wd = d.getDay();
    return {
      key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      dayName: ['일', '월', '화', '수', '목', '금', '토'][wd],
      dayNameFull: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][wd],
      isToday: d.toDateString() === today.toDateString(),
      isPast: d < today,
      isSun: wd === 0,
      isSat: wd === 6,
    };
  });
}

function weekRange(offset = 0) {
  const w = buildWeekDates(offset);
  return `${w[0].label} - ${w[6].label}`;
}

function sortHours(hs: number[]) {
  return [...hs].sort((a, b) => (a < 6 ? a + 24 : a) - (b < 6 ? b + 24 : b));
}

function formatTimeRange(hs: number[]) {
  if (!hs.length) return '';
  const s = sortHours(hs);
  return `${String(s[0]).padStart(2, '0')}:00-${String((s[s.length - 1] + 1) % 24).padStart(2, '0')}:00`;
}

function getIntersection(entries: Entry[]) {
  if (!entries.length) return [];
  const sets = entries.map(e => new Set(e.hours ?? []));
  return HOURS.filter(h => sets.every(s => s.has(h)));
}

function getBestDay(days: DayInfo[], raidDB: RaidDB) {
  let best: { day: DayInfo; inter: number[]; count: number } | null = null;
  for (const day of days) {
    if (day.isPast) continue;
    const entries = Object.values(raidDB?.[day.key] ?? {}) as Entry[];
    if (!entries.length) continue;
    const inter = getIntersection(entries);
    if (!inter.length) continue;
    if (!best || entries.length > best.count || (entries.length === best.count && inter.length > best.inter.length)) {
      best = { day, inter, count: entries.length };
    }
  }
  return best;
}

function buildColorMap(ids: string[]): Record<string, string> {
  return Object.fromEntries([...ids].sort().map((id, i) => [id, MEMBER_COLORS[i % MEMBER_COLORS.length]]));
}

// CELL_SLOT = cell width(34) + margin(2*2) = 38px — CSS와 동기화
const CELL_SLOT = 38;

// ── 시간 그리드 컴포넌트 ───────────────────────────────
type TimeGridProps = {
  entries: [string, Entry][];
  userId?: string;
  userName?: string;
  colors: Record<string, string>;
  dateKey: string;
  isPast: boolean;
  onToggleHour: (dateKey: string, hour: number) => void;
  onSetHours: (dateKey: string, hours: number[]) => void;
};

function TimeGrid({ entries, userId, userName, colors, dateKey, isPast, onToggleHour, onSetHours }: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 열릴 때 현재 시각을 스크롤 중앙에 위치
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = HOURS.indexOf(new Date().getHours());
    if (idx === -1) return;
    el.scrollLeft = Math.max(0, idx * CELL_SLOT + CELL_SLOT / 2 - el.clientWidth / 2);
  }, []);

  const rows: [string, Entry][] = [...entries];
  if (userId && !entries.find(([uid]) => uid === userId)) {
    rows.push([userId, { name: userName ?? '', image: '', characterClassName: '', hours: [] }]);
  }

  return (
    <div className={styles.timePanel}>
      <div className={styles.tpGrid}>
        {/* 이름 열 — 스크롤 밖, 고정 */}
        <div className={styles.tpNamesCol}>
          <div className={styles.tpNameSpacer} />
          {rows.map(([uid, e]) => {
            const isMe = uid === userId;
            const c = colors[uid] ?? (isMe ? '#7c6fe0' : '#64748b');
            return (
              <div key={uid} className={styles.tpNameRow}>
                <span className={styles.tpDot} style={{ backgroundColor: c }} />
                <span className={styles.tpNameText}>{e.name}{isMe ? '*' : ''}</span>
              </div>
            );
          })}
        </div>

        {/* 시간 셀 영역 — 가로 스크롤 */}
        <div ref={scrollRef} className={styles.tpScrollArea}>
          {/* 시간 헤더 */}
          <div className={styles.tpHoursHeader}>
            {HOURS.map(h => (
              <div key={h} className={styles.tpHourLabel}>
                {String(h).padStart(2, '0')}
              </div>
            ))}
            <div className={styles.tpMergedLabel}>03-12</div>
          </div>

          {/* 셀 행 */}
          {rows.map(([uid, e]) => {
            const isMe = uid === userId;
            const c = colors[uid] ?? (isMe ? '#7c6fe0' : '#64748b');
            return (
              <div key={uid} className={`${styles.tpCellsRow} ${isMe ? styles.tpCellsRowMe : ''}`}>
                {HOURS.map(h => {
                  const active = (e.hours ?? []).includes(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={!isMe || isPast}
                      className={`${styles.tpCell} ${active ? styles.tpCellOn : ''}`}
                      style={active ? { backgroundColor: c, borderColor: `${c}88` } : {}}
                      onClick={() => isMe && !isPast && onToggleHour(dateKey, h)}
                    />
                  );
                })}
                <div className={styles.tpCellMerged} />
              </div>
            );
          })}
        </div>
      </div>

      {(() => {
        const myHours = rows.find(([uid]) => uid === userId)?.[1].hours ?? [];
        const allSelected = HOURS.every(h => myHours.includes(h));
        return (
          <div className={styles.tpFooter}>
            <span className={styles.tpHint}>
              {userId
                ? `내 행(${userName}*)을 탭해서 시간대 조정`
                : '로그인하면 시간대를 입력할 수 있습니다'}
            </span>
            {userId && !isPast && (
              <button
                type="button"
                className={`${styles.allDayBtn} ${allSelected ? styles.allDayBtnOn : ''}`}
                onClick={() => onSetHours(dateKey, allSelected ? [] : [...HOURS])}
              >
                {allSelected ? '전체 해제' : 'All Day'}
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────
export default function RaidPage() {
  const { user, init } = useAuthStore();
  const [activeWeek, setActiveWeek] = useState<0 | 1>(0);
  const [raidDB, setRaidDB] = useState<RaidDB>({});
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(buildWeekDates(0).map(d => d.key))
  );

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    const r = ref(db, 'raid');
    const unsub = onValue(r, snap => setRaidDB(snap.val() ?? {}));
    return () => unsub();
  }, []);

  useEffect(() => {
    setExpanded(new Set(buildWeekDates(activeWeek).map(d => d.key)));
  }, [activeWeek]);

  const days = buildWeekDates(activeWeek);
  const allUserIds = Array.from(new Set(days.flatMap(d => Object.keys(raidDB?.[d.key] ?? {}))));
  const colors = buildColorMap(allUserIds);
  const best = getBestDay(days, raidDB);
  const allOpen = days.length > 0 && days.every(d => expanded.has(d.key));

  const toggleDay = (key: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const toggleAll = () => setExpanded(allOpen ? new Set() : new Set(days.map(d => d.key)));

  const setHours = useCallback(async (dateKey: string, hours: number[]) => {
    if (!user) return;
    if (hours.length === 0) {
      const { remove } = await import('firebase/database');
      await remove(ref(db, `raid/${dateKey}/${user.id}`));
      return;
    }
    await set(ref(db, `raid/${dateKey}/${user.id}`), {
      name: user.mainCharacter,
      image: user.image ?? '',
      characterClassName: user.characterClassName ?? '',
      hours,
    });
  }, [user]);

  const toggleHour = useCallback(async (dateKey: string, hour: number) => {
    if (!user) return;
    const prev = raidDB?.[dateKey]?.[user.id] as Entry | undefined;
    const prevHours: number[] = prev?.hours ?? [];
    const newHours = prevHours.includes(hour)
      ? prevHours.filter(h => h !== hour)
      : [...prevHours, hour];
    await set(ref(db, `raid/${dateKey}/${user.id}`), {
      name: user.mainCharacter,
      image: user.image ?? '',
      characterClassName: user.characterClassName ?? '',
      hours: newHours,
    });
  }, [user, raidDB]);

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <p className={styles.headerLabel}>레이드 일정</p>
        <h1 className={styles.headerTitle}>이번 주 / 다음 주</h1>
      </div>

      <div className={styles.body}>
        {/* 주 탭 */}
        <div className={styles.weekTabs}>
          {([0, 1] as const).map(w => (
            <button
              key={w}
              type="button"
              className={`${styles.weekTab} ${activeWeek === w ? styles.weekTabOn : ''}`}
              onClick={() => setActiveWeek(w)}
            >
              <span className={styles.weekTabName}>{w === 0 ? '이번 주' : '다음 주'}</span>
              <span className={styles.weekTabRange}>{weekRange(w)}</span>
            </button>
          ))}
        </div>

        {/* BEST 카드 */}
        {best && (
          <div className={styles.bestCard}>
            <div className={styles.bestRow1}>
              <span className={styles.bestBadge}>BEST</span>
              <span className={styles.bestDesc}>{best.count}/{best.count} 모두 가능</span>
            </div>
            <div className={styles.bestRow2}>
              <div className={styles.bestDateGroup}>
                <span className={styles.bestDayFull}>{best.day.dayNameFull}</span>
                <span className={styles.bestDateNum}>{best.day.label}</span>
              </div>
              <span className={styles.bestTime}>{formatTimeRange(best.inter)}</span>
            </div>
          </div>
        )}

        {/* 섹션 헤더 */}
        <div className={styles.secRow}>
          <span className={styles.secLabel}>요일별</span>
          <button type="button" className={styles.expandAllBtn} onClick={toggleAll}>
            {allOpen ? '모두 접기' : '모두 펼치기'}
          </button>
        </div>

        {/* 날짜 카드 목록 */}
        <div className={styles.dayList}>
          {days.map(day => {
            const entries = Object.entries(raidDB?.[day.key] ?? {}) as [string, Entry][];
            const open = expanded.has(day.key);
            const inter = getIntersection(entries.map(([, e]) => e));
            const allGo = entries.length >= 2
              && entries.every(([, e]) => (e.hours ?? []).length > 0)
              && inter.length > 0;

            return (
              <div
                key={day.key}
                className={[
                  styles.dayCard,
                  open ? styles.dayCardOpen : '',
                  day.isPast ? styles.dayCardPast : '',
                ].join(' ')}
              >
                <button type="button" className={styles.dayRow} onClick={() => toggleDay(day.key)}>
                  <div className={styles.dayDatePart}>
                    <span className={[
                      styles.dayAbbr,
                      day.isSun ? styles.sun : day.isSat ? styles.sat : '',
                    ].join(' ')}>
                      {day.dayName}
                    </span>
                    <span className={styles.dayDateNum}>{day.label}</span>
                  </div>

                  <div className={styles.dayDots}>
                    {allGo ? (
                      <span className={styles.allGo}>
                        ✦ 모두 가능
                        <span className={styles.allGoTime}>{formatTimeRange(inter)}</span>
                      </span>
                    ) : (
                      entries.map(([uid, e]) => {
                        const hasHours = (e.hours ?? []).length > 0;
                        const c = colors[uid] ?? '#64748b';
                        return (
                          <span
                            key={uid}
                            className={`${styles.memberChip} ${hasHours ? styles.memberChipOn : ''}`}
                            style={hasHours ? { borderColor: `${c}44` } : {}}
                          >
                            <span
                              className={styles.memberChipDot}
                              style={{ backgroundColor: hasHours ? c : 'transparent', borderColor: c }}
                            />
                            <span className={styles.memberChipName} style={hasHours ? { color: '#c7d2fe' } : {}}>
                              {e.name}
                            </span>
                          </span>
                        );
                      })
                    )}
                  </div>

                  <span className={styles.chevron}>
                    {open
                      ? <ChevronDown size={16} color="#64748b" />
                      : <ChevronRight size={16} color="#64748b" />}
                  </span>
                </button>

                {open && (
                  <TimeGrid
                    entries={entries}
                    userId={user?.id}
                    userName={user?.mainCharacter}
                    colors={colors}
                    dateKey={day.key}
                    isPast={day.isPast}
                    onToggleHour={toggleHour}
                    onSetHours={setHours}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
