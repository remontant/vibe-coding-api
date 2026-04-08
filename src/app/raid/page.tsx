'use client';

import { useState, useEffect } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useModalStore } from '@/store/modalStore';

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

export default function RaidPage() {
  const { openModal } = useModalStore();
  const [currentUser, setCurrentUser] = useState<{ id: string, mainCharacter: string, image: string, characterClassName?: string } | null>(null);
  
  // 날짜(YYYY-MM-DD)를 키로, 유저ID를 키로 가지는 스케줄 데이터
  const [schedules, setSchedules] = useState<{ [dateKey: string]: { [userId: string]: { name: string, image: string, characterClassName?: string, memo: string } } }>({});
  const [weeks, setWeeks] = useState<{ title: string, days: Date[] }[]>([]);
  
  // 현재 메모를 수정 중인 날짜 키와 임시 메모 상태
  const [editingMemoKey, setEditingMemoKey] = useState<string | null>(null);
  const [localMemo, setLocalMemo] = useState<string>('');

  useEffect(() => {
    // 1. 로그인된 유저 정보 가져오기
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('User parsing error:', e);
      }
    }

    // 2. Firebase 실시간 데이터 구독
    const schedulesRef = ref(db, 'schedules');
    const unsubscribe = onValue(schedulesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSchedules(data);
    });

    // 3. 수요일 기준 2주치 날짜 계산
    const now = new Date();
    // 로스트아크 리셋은 매일 오전 6시, 주간 리셋은 수요일 오전 6시
    // 현재 시간에서 6시간을 뺀 시간을 기준으로 하면 로스트아크 기준 날짜(0시 리셋)처럼 다룰 수 있음
    const loaNow = new Date(now.getTime());
    loaNow.setHours(loaNow.getHours() - 6);

    const currentDay = loaNow.getDay(); // 0(일) ~ 6(토)
    
    // 오늘이 수(3), 목(4), 금(5), 토(6) 이면 -> 가장 최근 수요일은 이번주 수요일
    // 오늘이 일(0), 월(1), 화(2) 이면 -> 가장 최근 수요일은 저번주 수요일
    const diffToWed = currentDay >= 3 ? currentDay - 3 : currentDay + 4;
    
    const lastWed = new Date(loaNow);
    lastWed.setDate(loaNow.getDate() - diffToWed);
    lastWed.setHours(0, 0, 0, 0); // 화면에 표시할 때는 0시 기준으로 날짜만 표시

    const calculatedWeeks = [
      { title: "이번 주 레이드 약속", days: [] as Date[] },
      { title: "다음 주 레이드 약속", days: [] as Date[] }
    ];

    // 이번 주 7일, 다음 주 7일 날짜 배열 생성 (수 ~ 화)
    for(let w = 0; w < 2; w++) {
      for(let d = 0; d < 7; d++) {
        const date = new Date(lastWed);
        date.setDate(lastWed.getDate() + (w * 7) + d);
        calculatedWeeks[w].days.push(date);
      }
    }
    
    setWeeks(calculatedWeeks);

    return () => {
      unsubscribe();
    };
  }, []);

  // 날짜 포맷 (예: 4월 5일)
  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  // 체크박스 토글
  const toggleDay = async (dateKey: string) => {
    if (!currentUser) {
      openModal({
        title: '로그인 필요',
        message: '로그인이 필요한 서비스입니다.\n로그인 후 다시 시도해주세요.',
        type: 'warning'
      });
      return;
    }
    
    const isChecked = schedules[dateKey]?.[currentUser.id] !== undefined;
    const dayRef = ref(db, `schedules/${dateKey}/${currentUser.id}`);
    
    try {
      if (isChecked) {
        // 언체크: Firebase에서 데이터 삭제
        await remove(dayRef);
      } else {
        // 체크: Firebase에 데이터 추가 (기본 메모 비어있음)
        await set(dayRef, {
          name: currentUser.mainCharacter,
          image: currentUser.image,
          characterClassName: currentUser.characterClassName || '',
          memo: ""
        });
      }
    } catch (error) {
      console.error("스케줄 업데이트 실패:", error);
      openModal({
        title: '오류',
        message: '스케줄 업데이트에 실패했습니다.\n잠시 후 다시 시도해주세요.',
        type: 'error'
      });
    }
  };

  // 메모 편집 시작
  const startEditingMemo = (dateKey: string, currentMemo: string) => {
    if (!currentUser) return;
    setLocalMemo(currentMemo || '');
    setEditingMemoKey(dateKey);
  };

  // 메모 저장 (Firebase 연동)
  const saveMemo = async (dateKey: string) => {
    if (!currentUser) return;
    
    const dayRef = ref(db, `schedules/${dateKey}/${currentUser.id}`);
    
    try {
      // 체크된 상태일 때만 메모 업데이트
      if (schedules[dateKey]?.[currentUser.id]) {
        await set(dayRef, {
          name: currentUser.mainCharacter,
          image: currentUser.image,
          characterClassName: currentUser.characterClassName || '',
          memo: localMemo
        });
      }
    } catch (error) {
      console.error("메모 저장 실패:", error);
      openModal({
        title: '오류',
        message: '메모 저장에 실패했습니다.\n잠시 후 다시 시도해주세요.',
        type: 'error'
      });
    } finally {
      setEditingMemoKey(null);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 md:p-24 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
            레이드 스케줄
          </h1>
          <p className="text-gray-400">
            수요일 리셋 기준 2주간의 레이드 가능 요일을 체크해보세요!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="bg-[#111] border border-[#2a2d36] rounded-xl overflow-hidden shadow-2xl flex flex-col">
              <div className="bg-[#161719] px-6 py-4 border-b border-[#2a2d36] flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#d4af37]">
                  {week.title}
                </h2>
                <div className="text-xs text-gray-500 font-medium bg-[#111] px-3 py-1.5 rounded-full border border-[#222]">
                  {week.days.length > 0 && `${week.days[0].getMonth() + 1}월 ${week.days[0].getDate()}일 ~ ${week.days[6].getMonth() + 1}월 ${week.days[6].getDate()}일`}
                </div>
              </div>
              <div className="p-4 md:p-6 flex flex-col gap-3">
                {week.days.map((day, dayIdx) => {
                  const dateKey = getDateKey(day);
                  const daySchedules = schedules[dateKey] || {};
                  
                  // 현재 유저의 체크 여부 및 메모
                  const mySchedule = currentUser ? daySchedules[currentUser.id] : null;
                  const isChecked = !!mySchedule;
                  const myMemo = mySchedule?.memo || '';
                  
                  // 다른 참가자들의 목록 (본인 제외)
                  const otherParticipants = Object.entries(daySchedules)
                    .filter(([userId]) => !currentUser || userId !== currentUser.id)
                    .map(([_, data]) => data);

                  const isToday = getDateKey(new Date()) === dateKey;
                  const isPast = day.getTime() < new Date().setHours(0, 0, 0, 0);
                  
                  return (
                    <div 
                      key={dayIdx} 
                      onClick={() => !isPast && toggleDay(dateKey)}
                      className={`relative flex items-center p-4 rounded-xl border-2 transition-all duration-300 ${
                        !isPast ? 'transform hover:-translate-y-0.5 cursor-pointer' : 'cursor-not-allowed'
                      } ${
                        isPast ? 'opacity-40 grayscale' : ''
                      } ${
                        isChecked 
                          ? 'bg-[#d4af37]/10 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.15)]' 
                          : 'bg-[#1a1c23] border-[#2a2d36] hover:border-gray-500'
                      }`}
                    >
                      {/* Left: 날짜 요일 */}
                      <div className="flex flex-col items-center justify-center min-w-[50px] sm:min-w-[60px] shrink-0 border-r border-[#333] pr-4 mr-4">
                        <div className={`text-xs sm:text-sm font-bold mb-1 ${
                          day.getDay() === 0 ? 'text-red-400' : 
                          day.getDay() === 6 ? 'text-blue-400' : 'text-gray-400'
                        }`}>
                          {DAYS_OF_WEEK[day.getDay()]}
                        </div>
                        <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isToday ? 'text-[#ff5e5e]' : 'text-white'}`}>
                          {day.getDate()}
                        </div>
                      </div>

                      {/* Center: 아바타, 닉네임, 메모 */}
                      <div className="flex-1 flex flex-col justify-center overflow-hidden gap-2 min-h-[40px]">
                        {/* 다른 참가자 렌더링 */}
                        {otherParticipants.map((participant, pIdx) => (
                          <div key={pIdx} className="flex items-center gap-2 sm:gap-3 w-full">
                            <div className="flex items-center gap-2 shrink-0 bg-[#111] px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-[#333] w-[100px] sm:w-[120px]">
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-[#444] overflow-hidden shrink-0 bg-[#222]">
                                <div 
                                  className="w-full h-full"
                                  style={{
                                    backgroundImage: `url(${participant.image})`,
                                    backgroundSize: '550%',
                                    backgroundPosition: ['도화가', '기상술사', '환수사'].includes(participant.characterClassName || '') 
                                      ? 'center 31%' 
                                      : 'center 15%',
                                    backgroundRepeat: 'no-repeat'
                                  }}
                                />
                              </div>
                              <span className="text-[11px] sm:text-[12px] font-bold text-gray-400 hidden sm:block truncate">{participant.name}</span>
                            </div>
                            <div className="flex-1 flex items-center bg-[#111] border border-[#333] rounded-lg px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-400 min-w-[50px] truncate h-[34px] sm:h-[38px]">
                              {participant.memo}
                            </div>
                          </div>
                        ))}

                        {/* 내 참여 정보 (체크 시 표시) */}
                        <div className={`flex items-center gap-2 sm:gap-3 transition-all duration-300 w-full ${isChecked ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none hidden'}`}>
                          {isChecked && currentUser && (
                            <>
                              <div className="flex items-center gap-2 shrink-0 bg-[#111] px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-[#333] w-[100px] sm:w-[120px]">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-[#d4af37] overflow-hidden shrink-0 bg-[#222]">
                                  <div 
                                    className="w-full h-full"
                                    style={{
                                      backgroundImage: `url(${currentUser.image})`,
                                      backgroundSize: '550%',
                                      backgroundPosition: ['도화가', '기상술사', '환수사'].includes(currentUser.characterClassName || '') 
                                        ? 'center 31%' 
                                        : 'center 15%',
                                      backgroundRepeat: 'no-repeat'
                                    }}
                                  />
                                </div>
                                <span className="text-[11px] sm:text-[12px] font-bold text-gray-200 hidden sm:block truncate">{currentUser.mainCharacter}</span>
                              </div>
                              {editingMemoKey === dateKey ? (
                                <div className="flex-1 relative flex items-center min-w-[50px]">
                                  <input
                                    type="text"
                                    value={localMemo}
                                    onChange={(e) => setLocalMemo(e.target.value)}
                                    onClick={(e) => e.stopPropagation()} // 부모 div 클릭 방지
                                    onBlur={() => saveMemo(dateKey)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        saveMemo(dateKey);
                                      }
                                    }}
                                    autoFocus
                                    placeholder="가능한 시간 메모"
                                    className="w-full bg-[#111] border border-[#d4af37] rounded-lg pl-3 pr-8 py-2 sm:py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-colors placeholder-gray-600 h-[34px] sm:h-[38px]"
                                  />
                                  <button 
                                    type="button"
                                    className="absolute right-2 text-[#d4af37] hover:text-white p-0.5"
                                    onMouseDown={(e) => {
                                      // onBlur 보다 먼저 실행되도록 onMouseDown 사용
                                      e.preventDefault();
                                      e.stopPropagation();
                                      saveMemo(dateKey);
                                    }}
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  className="flex-1 flex items-center justify-between bg-[#111] border border-[#333] hover:border-[#555] rounded-lg px-3 py-2 sm:py-2.5 text-xs sm:text-sm cursor-pointer transition-colors min-w-[50px] group/memo h-[34px] sm:h-[38px]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingMemo(dateKey, myMemo);
                                  }}
                                >
                                  <span className={`truncate ${myMemo ? 'text-white' : 'text-gray-600'}`}>
                                    {myMemo || '가능한 시간 메모'}
                                  </span>
                                  <svg className="w-3.5 h-3.5 text-gray-500 group-hover/memo:text-[#d4af37] transition-colors shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        {!isChecked && otherParticipants.length === 0 && (
                          <div className="text-gray-600 text-sm font-medium h-full flex items-center">
                            참여 가능한 날짜를 체크하세요
                          </div>
                        )}
                      </div>

                      {/* Right: Checkbox */}
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition-colors ml-4 shrink-0 ${
                        isChecked 
                          ? 'border-[#d4af37] bg-[#d4af37] text-black' 
                          : 'border-gray-500 bg-[#111]'
                      }`}>
                        {isChecked && (
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      
                      {isToday && (
                        <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/3 sm:translate-x-1/3 bg-[#ff5e5e] text-white text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-lg z-10 animate-bounce">
                          TODAY
                        </div>
                      )}
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