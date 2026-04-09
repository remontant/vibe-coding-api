'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useModalStore } from '@/store/modalStore';
import { useAuthStore } from '@/store/authStore';
import styles from './raid.module.css';

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const YOZ_CLASSES = ['도화가', '기상술사', '환수사'];

type ParticipantData = { name: string; image: string; characterClassName?: string; memo: string };
type ScheduleMap = { [dateKey: string]: { [userId: string]: ParticipantData } };

export default function RaidPage() {
  const { openModal } = useModalStore();
  // authStore에서 직접 구독 — localStorage 읽기 코드 제거
  const { user: currentUser, init } = useAuthStore();
  const [schedules, setSchedules] = useState<ScheduleMap>({});
  const [weeks, setWeeks] = useState<{ title: string; days: Date[] }[]>([]);
  const [editingMemoKey, setEditingMemoKey] = useState<string | null>(null);
  const [localMemo, setLocalMemo] = useState('');

  useEffect(() => {
    // authStore가 아직 초기화되지 않았을 경우를 위해 init 호출
    init();

    const schedulesRef = ref(db, 'schedules');
    const unsubscribe = onValue(schedulesRef, (snapshot) => {
      setSchedules(snapshot.val() || {});
    });

    const now = new Date();
    const loaNow = new Date(now.getTime());
    loaNow.setHours(loaNow.getHours() - 6);
    const currentDay = loaNow.getDay();
    const diffToWed = currentDay >= 3 ? currentDay - 3 : currentDay + 4;
    const lastWed = new Date(loaNow);
    lastWed.setDate(loaNow.getDate() - diffToWed);
    lastWed.setHours(0, 0, 0, 0);

    const calculatedWeeks = [
      { title: '이번 주 레이드 약속', days: [] as Date[] },
      { title: '다음 주 레이드 약속', days: [] as Date[] },
    ];
    for (let w = 0; w < 2; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(lastWed);
        date.setDate(lastWed.getDate() + w * 7 + d);
        calculatedWeeks[w].days.push(date);
      }
    }
    setWeeks(calculatedWeeks);

    return () => unsubscribe();
  }, [init]);

  const getDateKey = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

  const toggleDay = async (dateKey: string) => {
    if (!currentUser) {
      openModal({ title: '로그인 필요', message: '로그인이 필요한 서비스입니다.\n로그인 후 다시 시도해주세요.', type: 'warning' });
      return;
    }
    const isChecked = schedules[dateKey]?.[currentUser.id] !== undefined;
    const dayRef = ref(db, `schedules/${dateKey}/${currentUser.id}`);
    try {
      if (isChecked) {
        await remove(dayRef);
      } else {
        await set(dayRef, { name: currentUser.mainCharacter, image: currentUser.image, characterClassName: currentUser.characterClassName || '', memo: '' });
      }
    } catch (error) {
      console.error(error);
      openModal({ title: '오류', message: '스케줄 업데이트에 실패했습니다.\n잠시 후 다시 시도해주세요.', type: 'error' });
    }
  };

  const startEditingMemo = (dateKey: string, currentMemo: string) => {
    if (!currentUser) return;
    setLocalMemo(currentMemo || '');
    setEditingMemoKey(dateKey);
  };

  const saveMemo = async (dateKey: string) => {
    if (!currentUser) return;
    const dayRef = ref(db, `schedules/${dateKey}/${currentUser.id}`);
    try {
      if (schedules[dateKey]?.[currentUser.id]) {
        await set(dayRef, { name: currentUser.mainCharacter, image: currentUser.image, characterClassName: currentUser.characterClassName || '', memo: localMemo });
      }
    } catch (error) {
      console.error(error);
      openModal({ title: '오류', message: '메모 저장에 실패했습니다.\n잠시 후 다시 시도해주세요.', type: 'error' });
    } finally {
      setEditingMemoKey(null);
    }
  };

  const avatarPos = (className?: string) =>
    YOZ_CLASSES.includes(className ?? '') ? 'center 31%' : 'center 15%';

  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        <div className={styles.hero}>
          <h1 className={styles.title}>레이드 스케줄</h1>
          <p className={styles.desc}>수요일 리셋 기준 2주간의 레이드 가능 요일을 체크해보세요!</p>
        </div>

        <div className={styles.grid}>
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className={styles.weekCard}>
              <div className={styles.weekHeader}>
                <h2 className={styles.weekTitle}>{week.title}</h2>
                <div className={styles.weekRange}>
                  {week.days.length > 0 &&
                    `${week.days[0].getMonth() + 1}월 ${week.days[0].getDate()}일 ~ ${week.days[6].getMonth() + 1}월 ${week.days[6].getDate()}일`}
                </div>
              </div>

              <div className={styles.dayList}>
                {week.days.map((day, dayIdx) => {
                  const dateKey = getDateKey(day);
                  const daySchedules = schedules[dateKey] || {};
                  const mySchedule = currentUser ? daySchedules[currentUser.id] : null;
                  const isChecked = !!mySchedule;
                  const myMemo = mySchedule?.memo || '';
                  const otherParticipants = Object.entries(daySchedules)
                    .filter(([userId]) => !currentUser || userId !== currentUser.id)
                    .map(([, data]) => data);
                  const isToday = getDateKey(new Date()) === dateKey;
                  const isPast = day.getTime() < new Date().setHours(0, 0, 0, 0);

                  const dayNameClass =
                    day.getDay() === 0 ? styles.dayNameSun
                    : day.getDay() === 6 ? styles.dayNameSat
                    : styles.dayName;

                  return (
                    <div
                      key={dayIdx}
                      onClick={() => !isPast && toggleDay(dateKey)}
                      className={[
                        styles.dayRow,
                        isPast ? styles.dayRowDisabled : styles.dayRowClickable,
                        isChecked ? styles.dayRowChecked : '',
                      ].join(' ')}
                    >
                      {/* 날짜 */}
                      <div className={styles.dateCol}>
                        <div className={dayNameClass}>{DAYS_OF_WEEK[day.getDay()]}</div>
                        <div className={`${styles.dateNum} ${isToday ? styles.dateNumToday : ''}`}>
                          {day.getDate()}
                        </div>
                      </div>

                      {/* 참가자 */}
                      <div className={styles.participants}>
                        {otherParticipants.map((p, pIdx) => (
                          <div key={pIdx} className={styles.participantRow}>
                            <div className={styles.participantNameTag}>
                              <div className={styles.participantAvatar}>
                                <div
                                  className={styles.avatarImg}
                                  style={{ backgroundImage: `url(${p.image})`, backgroundSize: '550%', backgroundPosition: avatarPos(p.characterClassName), backgroundRepeat: 'no-repeat' }}
                                />
                              </div>
                              <span className={styles.participantName}>{p.name}</span>
                            </div>
                            <div className={styles.participantMemo}>{p.memo}</div>
                          </div>
                        ))}

                        {/* 내 행 */}
                        <div className={`${styles.myRow} ${isChecked ? '' : styles.myRowHidden}`}>
                          {isChecked && currentUser && (
                            <>
                              <div className={styles.participantNameTag}>
                                <div className={`${styles.participantAvatar} ${styles.participantAvatarMine}`}>
                                  <div
                                    className={styles.avatarImg}
                                    style={{ backgroundImage: `url(${currentUser.image})`, backgroundSize: '550%', backgroundPosition: avatarPos(currentUser.characterClassName), backgroundRepeat: 'no-repeat' }}
                                  />
                                </div>
                                <span className={`${styles.participantName} ${styles.participantNameMine}`}>{currentUser.mainCharacter}</span>
                              </div>

                              {editingMemoKey === dateKey ? (
                                <div className={styles.memoInputWrap}>
                                  <input
                                    type="text"
                                    value={localMemo}
                                    onChange={(e) => setLocalMemo(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onBlur={() => saveMemo(dateKey)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveMemo(dateKey); } }}
                                    autoFocus
                                    placeholder="가능한 시간 메모"
                                    className={styles.memoInput}
                                  />
                                  <button
                                    type="button"
                                    className={styles.memoSaveBtn}
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); saveMemo(dateKey); }}
                                  >
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div
                                  className={styles.memoDisplay}
                                  onClick={(e) => { e.stopPropagation(); startEditingMemo(dateKey, myMemo); }}
                                >
                                  <span className={myMemo ? styles.memoText : styles.memoPlaceholder}>
                                    {myMemo || '가능한 시간 메모'}
                                  </span>
                                  <svg className={styles.memoEditIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {!isChecked && otherParticipants.length === 0 && (
                          <div className={styles.emptyText}>참여 가능한 날짜를 체크하세요</div>
                        )}
                      </div>

                      {/* 체크박스 */}
                      <div className={`${styles.checkbox} ${isChecked ? styles.checkboxChecked : ''}`}>
                        {isChecked && (
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {isToday && <div className={styles.todayBadge}>TODAY</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
