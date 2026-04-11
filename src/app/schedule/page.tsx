'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { useModalStore } from '@/store/modalStore';
import { UserCheck, UserMinus, AlertCircle, MessageSquare, Check, X, Edit3, Save, Lock } from 'lucide-react';
import styles from './schedule.module.css';

const YOZ_CLASSES = ['도화가', '기상술사', '환수사'];

type Status = 'available' | 'busy' | 'none';

type PlayerEntry = {
  status?: Status;
  memo: string;
  name: string;
  image?: string;
  characterClassName?: string;
};

type ScheduleDB = {
  [dateKey: string]: {
    [userId: string]: PlayerEntry;
  };
};

function getWeekDates(weekOffset = 0) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const day = now.getDay();
  const diffToWed = day >= 3 ? day - 3 : day + 4;
  const wed = new Date(now);
  wed.setDate(now.getDate() - diffToWed + weekOffset * 7);
  wed.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(wed);
    d.setDate(wed.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return {
      key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      dayName: ['일', '월', '화', '수', '목', '금', '토'][d.getDay()],
      isToday: d.toDateString() === today.toDateString(),
      isPast: d < today,
      isSun: d.getDay() === 0,
      isSat: d.getDay() === 6,
    };
  });
}

function getAvatarStyle(image?: string, characterClassName?: string) {
  if (!image) return {};
  return {
    backgroundImage: `url(${image})`,
    backgroundSize: '550%',
    backgroundPosition: YOZ_CLASSES.includes(characterClassName ?? '')
      ? 'center 31%'
      : 'center 15%',
    backgroundRepeat: 'no-repeat' as const,
  };
}

export default function SchedulePage() {
  const { user, init } = useAuthStore();
  const { openModal } = useModalStore();

  const [activeWeek, setActiveWeek] = useState<0 | 1>(0);
  const [scheduleDB, setScheduleDB] = useState<ScheduleDB>({});

  const [memoOpen, setMemoOpen] = useState(false);
  const [memoDateKey, setMemoDateKey] = useState('');
  const [memoInput, setMemoInput] = useState('');

  useEffect(() => { init(); }, [init]);

  const weekDates = getWeekDates(activeWeek);

  useEffect(() => {
    const dbRef = ref(db, 'schedules');
    const unsub = onValue(dbRef, (snap) => {
      setScheduleDB(snap.val() ?? {});
    });
    return () => unsub();
  }, []);

  const getEntry = (dk: string, uid: string): PlayerEntry | null =>
    scheduleDB?.[dk]?.[uid] ?? null;

  const updateStatus = async (dateKey: string, status: Status) => {
    if (!user) {
      openModal({ title: '로그인 필요', message: '로그인 후 이용해주세요.', type: 'warning' });
      return;
    }
    const prev = getEntry(dateKey, user.id);
    await set(ref(db, `schedules/${dateKey}/${user.id}`), {
      status,
      memo: prev?.memo ?? '',
      name: user.mainCharacter,
      image: user.image ?? '',
      characterClassName: user.characterClassName ?? '',
    });
  };

  const openMemo = (dateKey: string) => {
    if (!user) return;
    setMemoDateKey(dateKey);
    setMemoInput(getEntry(dateKey, user.id)?.memo ?? '');
    setMemoOpen(true);
  };

  const saveMemo = async (overrideMemo?: string | React.MouseEvent) => {
    if (!user) return;
    const finalMemo = typeof overrideMemo === 'string' ? overrideMemo : memoInput;
    const prev = getEntry(memoDateKey, user.id);
    await set(ref(db, `schedules/${memoDateKey}/${user.id}`), {
      status: prev?.status ?? 'available',
      memo: finalMemo,
      name: user.mainCharacter,
      image: user.image ?? '',
      characterClassName: user.characterClassName ?? '',
    });
    setMemoOpen(false);
  };

  return (
    <main className={styles.main}>
      {/* 헤더 */}
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderInner}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h1 className={styles.headerTitle}>RAID CHECK</h1>
              <div className={styles.headerSub}>
                <span className={styles.cycleBadge}>WEEKLY CYCLE</span>
                <span className={styles.cycleDesc}>수요일 AM 06:00 초기화</span>
              </div>
            </div>
          </div>

          <div className={styles.weekTabs}>
            <button
              type="button"
              className={`${styles.weekTab} ${activeWeek === 0 ? styles.weekTabActive : ''}`}
              onClick={() => setActiveWeek(0)}
            >
              이번 주
            </button>
            <button
              type="button"
              className={`${styles.weekTab} ${activeWeek === 1 ? styles.weekTabActive : ''}`}
              onClick={() => setActiveWeek(1)}
            >
              다음 주
            </button>
          </div>
        </div>
      </header>

      {/* 날짜 카드 목록 */}
      <div className={styles.cardList}>
        {weekDates.map((day) => {
          const allEntries = Object.entries(scheduleDB?.[day.key] ?? {}) as [string, PlayerEntry][];
          const available = allEntries.filter(([, e]) => e.status !== 'busy');
          const busyMembers = allEntries.filter(([, e]) => e.status === 'busy');
          const busyCount = busyMembers.length;
          const entry = user ? getEntry(day.key, user.id) : null;
          const myStatus: Status = entry ? (entry.status ?? 'available') : 'none';
          const myMemo = entry?.memo ?? '';
          const isPast = day.isPast;

          return (
            <div
              key={day.key}
              className={`${styles.card} ${day.isToday ? styles.cardToday : ''} ${isPast ? styles.cardPast : ''}`}
            >
              {/* 날짜 뱃지 */}
              <div className={styles.dateBadge}>
                <span className={`${styles.dayName} ${day.isSun ? styles.sun : day.isSat ? styles.sat : ''}`}>
                  {day.dayName}
                </span>
                <span className={styles.dateNum}>{day.label}</span>
                {day.isToday && <span className={styles.todayBadge}>TODAY</span>}
                {isPast && <span className={styles.pastBadge}><Lock size={10} /> 마감</span>}
              </div>

              {/* 참여 가능 멤버 */}
              <div className={styles.memberSection}>
                <div className={styles.memberHeader}>
                  <span className={styles.memberCountAvail}>
                    <UserCheck size={16} /> <span className={styles.memberHeaderTitle}>AVAILABLE ({available.length})</span>
                  </span>
                </div>
                <div className={styles.memberList}>
                  {available.length > 0 ? (
                    available.map(([uid, entry]) => {
                      const isMine = user?.id === uid;
                      return (
                        <div key={uid} className={`${styles.memberChip} ${isMine ? styles.memberChipMine : ''}`}>
                          {entry.image ? (
                            <div
                              className={styles.memberAvatarImg}
                              style={getAvatarStyle(entry.image, entry.characterClassName)}
                            />
                          ) : (
                            <div className={styles.memberAvatar}>{entry.name?.[0] ?? '?'}</div>
                          )}
                          <div className={styles.memberInfo}>
                            <span className={styles.memberName}>{entry.name}</span>
                            <span className={styles.memberMemo}>{entry.memo || '메모 없음'}</span>
                          </div>
                          {isMine && !isPast && (
                            <button
                              type="button"
                              className={styles.chipRemoveBtn}
                              onClick={() => remove(ref(db, `schedules/${day.key}/${user!.id}`))}
                              title="참여 취소"
                            >
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.emptyMembers}>아직 가능한 인원이 없습니다.</div>
                  )}
                </div>

                {/* 참여 불가 멤버 */}
                {busyCount > 0 && (
                  <>
                    <div className={styles.memberHeaderBusy}>
                      <span className={styles.memberCountBusy}>
                        <UserMinus size={16} /> <span className={styles.memberHeaderTitle}>UNAVAILABLE ({busyCount})</span>
                      </span>
                    </div>
                    <div className={styles.memberList}>
                      {busyMembers.map(([uid, entry]) => (
                        <div key={uid} className={styles.memberChipBusy}>
                          <div className={styles.memberInfoBusy}>
                            <span className={styles.memberNameBusy}>{entry.name}</span>
                            {entry.memo && (
                              <span className={styles.memberMemoBusy}>
                                <AlertCircle size={13} className={styles.memoAlertIcon} />
                                {entry.memo}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* 내 상태 */}
              <div className={`${styles.mySection} ${isPast ? styles.mySectionPast : ''}`}>
                <div className={styles.mySectionTop}>
                  <span className={styles.mySectionLabel}>MY STATUS</span>
                  {myStatus !== 'none' && !isPast && (
                    <button type="button" className={styles.editBtn} onClick={() => openMemo(day.key)}>
                      <Edit3 size={13} />
                    </button>
                  )}
                </div>

                {user && (
                  <div className={styles.myCharacterRow}>
                    <div className={styles.myCharacterTag}>
                      <div className={styles.myCharacterAvatar}>
                        <div
                          className={styles.avatarImg}
                          style={getAvatarStyle(user.image, user.characterClassName)}
                        />
                      </div>
                      <span className={styles.myCharacterName}>{user.mainCharacter}</span>
                    </div>
                  </div>
                )}

                <div className={styles.statusBtns}>
                  <button
                    type="button"
                    className={`${styles.statusBtn} ${myStatus === 'available' ? styles.statusBtnAvail : ''}`}
                    onClick={() => updateStatus(day.key, 'available')}
                    disabled={!user || isPast}
                  >
                    <Check size={13} /> 가능
                  </button>
                  <button
                    type="button"
                    className={`${styles.statusBtn} ${myStatus === 'busy' ? styles.statusBtnBusy : ''}`}
                    onClick={() => updateStatus(day.key, 'busy')}
                    disabled={!user || isPast}
                  >
                    <X size={13} /> 불가
                  </button>
                </div>
                <div
                  className={`${styles.memoArea} ${myMemo ? styles.memoAreaFilled : ''}`}
                  onClick={() => !isPast && myStatus !== 'none' && openMemo(day.key)}
                >
                  {isPast
                    ? '지난 날짜입니다.'
                    : myMemo
                    ? myMemo
                    : myStatus !== 'none'
                    ? '+ 메모 입력'
                    : !user
                    ? '로그인이 필요합니다'
                    : '상태를 먼저 선택'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 메모 모달 */}
      {memoOpen && (
        <div className={styles.modalOverlay} onClick={() => setMemoOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <MessageSquare size={18} />
              <span>나의 메모</span>
            </div>
            <textarea
              autoFocus
              className={styles.memoTextarea}
              placeholder="예: 8시 이후 가능, 1시간만 가능 등"
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
            />
            <div className={styles.quickMemos}>
              {['8시 이후 가능', '하루종일 가능', '2시간 가능', '10시 이후 가능', '퇴근후가능'].map((text) => (
                <button
                  key={text}
                  type="button"
                  className={styles.quickMemoBtn}
                  onClick={() => saveMemo(text)}
                >
                  {text}
                </button>
              ))}
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.modalCancel} onClick={() => setMemoOpen(false)}>취소</button>
              <button type="button" className={styles.modalSave} onClick={saveMemo}>
                <Save size={15} /> 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
