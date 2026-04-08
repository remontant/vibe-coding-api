'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getCharacterData } from '@/app/actions';
import { useModalStore } from '@/store/modalStore';
import SHA256 from 'crypto-js/sha256';

export default function LoginPage() {
  const router = useRouter();
  const { openModal } = useModalStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 로그인 폼 상태
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  // 회원가입 폼 상태
  const [signupId, setSignupId] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [mainCharacter, setMainCharacter] = useState('');
  const [verifiedCharacter, setVerifiedCharacter] = useState<any>(null);
  
  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [tempCharacterData, setTempCharacterData] = useState<any>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !loginPw) return;
    
    setLoading(true);
    setError('');

    try {
      const userRef = ref(db, `users/${loginId}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        
        // 입력받은 비밀번호를 SHA256으로 해싱
        const hashedPw = SHA256(loginPw).toString();

        // 기존 평문 비밀번호 호환을 위해 둘 다 확인
        if (userData.password === hashedPw || userData.password === loginPw) {
          
          let className = userData.characterClassName;
          
          // 과거에 가입해서 직업 정보가 없는 계정들을 위한 패치
          if (!className) {
            try {
              const res = await getCharacterData(userData.mainCharacter, 'profiles');
              if (res?.data?.CharacterClassName) {
                className = res.data.CharacterClassName;
                await set(ref(db, `users/${loginId}/characterClassName`), className);
              }
            } catch (err) {}
          }

          // 로그인 성공
          localStorage.setItem('user', JSON.stringify({
            id: loginId,
            mainCharacter: userData.mainCharacter,
            image: userData.image,
            characterClassName: className || ''
          }));
          openModal({
            title: '로그인 성공',
            message: '환영합니다! 로그인이 완료되었습니다.',
            type: 'success'
          });
          router.push('/');
        } else {
          setError('비밀번호가 일치하지 않습니다.');
        }
      } else {
        setError('존재하지 않는 아이디입니다.');
      }
    } catch (err) {
      console.error(err);
      setError('서버와 통신 중 에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCharacter = async () => {
    if (!mainCharacter) return;
    setLoading(true);
    setError('');
    
    try {
      // 로스트아크 API에서 캐릭터 정보 가져오기
      // profiles 엔드포인트는 ItemMaxLevel 데이터를 포함합니다.
      const res = await getCharacterData(mainCharacter, 'profiles');
      
      if (res?.error || !res?.data) {
        setError('존재하지 않는 캐릭터이거나 로스트아크 점검 중일 수 있습니다.');
        return;
      }

      setTempCharacterData(res.data);
      setShowModal(true); // 모달 띄우기
    } catch (err) {
      setError('캐릭터 검색 중 에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCharacter = () => {
    setVerifiedCharacter(tempCharacterData);
    setShowModal(false);
  };

  const handleCancelCharacter = () => {
    setTempCharacterData(null);
    setShowModal(false);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupId || !signupPw) return;
    
    if (!verifiedCharacter) {
      setError('캐릭터 검색 후 내 캐릭터가 맞는지 확인해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. 아이디 중복 확인
      const userRef = ref(db, `users/${signupId}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        setError('이미 존재하는 아이디입니다.');
        setLoading(false);
        return;
      }

      const characterImage = verifiedCharacter.CharacterImage;
      const hashedPw = SHA256(signupPw).toString();

      // 2. DB에 회원가입 정보 저장
      await set(userRef, {
        password: hashedPw,
        mainCharacter: verifiedCharacter.CharacterName, // 확인된 캐릭터 이름 저장
        image: characterImage || '',
        characterClassName: verifiedCharacter.CharacterClassName || ''
      });

      openModal({
        title: '가입 완료',
        message: '망고네 가입이 완료되었습니다!\n이제 로그인해주세요.',
        type: 'success'
      });
      setIsLogin(true); // 로그인 탭으로 이동
      setSignupId('');
      setSignupPw('');
      setMainCharacter('');
      setVerifiedCharacter(null);
    } catch (err) {
      console.error(err);
      setError('회원가입 처리 중 에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 py-12 flex flex-col items-center justify-center relative">
      <div className="w-full max-w-md bg-[#111] border border-[#2a2d36] rounded-2xl overflow-hidden shadow-2xl z-10">
        
        {/* 탭 전환 영역 */}
        <div className="flex border-b border-[#2a2d36]">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              isLogin ? 'text-[#d4af37] bg-[#161719]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setVerifiedCharacter(null);
              setError('');
            }}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              !isLogin ? 'text-[#d4af37] bg-[#161719]' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            회원가입
          </button>
        </div>

        {/* 폼 영역 */}
        <div className="p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
              {isLogin ? '돌아오신 것을 환영해요!' : '망고네 가입하기'}
            </h2>
            <p className="text-sm text-gray-400">
              {isLogin ? '가까운 지인들끼리 사용하는 스케줄러입니다.' : '가입 후 본캐 닉네임으로 함께 일정을 공유하세요.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">아이디</label>
                <input 
                  type="text" 
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  required
                  disabled={loading}
                  className="w-full bg-[#1a1c23] border border-[#333] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">비밀번호</label>
                <input 
                  type="password" 
                  value={loginPw}
                  onChange={(e) => setLoginPw(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  disabled={loading}
                  className="w-full bg-[#1a1c23] border border-[#333] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                />
              </div>
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#d4af37] hover:bg-[#f1c40f] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-lg mt-4 transition-colors"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">아이디</label>
                <input 
                  type="text" 
                  value={signupId}
                  onChange={(e) => setSignupId(e.target.value)}
                  placeholder="사용할 아이디를 입력하세요"
                  required
                  disabled={loading}
                  className="w-full bg-[#1a1c23] border border-[#333] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">비밀번호</label>
                <input 
                  type="password" 
                  value={signupPw}
                  onChange={(e) => setSignupPw(e.target.value)}
                  placeholder="사용할 비밀번호를 입력하세요"
                  required
                  disabled={loading}
                  className="w-full bg-[#1a1c23] border border-[#333] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                />
                <p className="text-[11px] text-[#217b46] mt-2 flex items-center gap-1 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  비밀번호는 안전하게 암호화되어 저장되니 안심하세요!
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>본캐 닉네임</span>
                  <span className="text-[#ff5e5e] text-[10px]">* 가입 전 검색 필수</span>
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={mainCharacter}
                    onChange={(e) => {
                      setMainCharacter(e.target.value);
                      setVerifiedCharacter(null); // 이름 변경 시 다시 검색하도록 초기화
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleVerifyCharacter();
                      }
                    }}
                    placeholder="대표 캐릭터 닉네임을 입력하세요"
                    required
                    disabled={loading}
                    className="flex-1 bg-[#1a1c23] border border-[#333] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d4af37] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCharacter}
                    disabled={loading || !mainCharacter}
                    className="bg-[#2a2d36] hover:bg-[#444] border border-[#444] text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    검색
                  </button>
                </div>
              </div>

              {/* 이미 인증된 캐릭터 표시 */}
              {verifiedCharacter && (
                <div className="mt-1 p-3 bg-[#111] border border-[#d4af37] rounded-xl flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#d4af37] overflow-hidden shrink-0 bg-[#222]">
                    <div 
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url(${verifiedCharacter.CharacterImage || "https://img.lostark.co.kr/armory/3/BCFECAB4BFB898D2F165F04A317C5F84C526F7FB2BF59B973CDDA1300227D00A.jpg"})`,
                        backgroundSize: '550%',
                        backgroundPosition: ['도화가', '기상술사', '환수사'].includes(verifiedCharacter.CharacterClassName) 
                          ? 'center 31%' 
                          : 'center 15%',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">
                        {verifiedCharacter.CharacterName}
                      </span>
                      <span className="text-[#d4af37] text-xs font-bold">인증 완료</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      [{verifiedCharacter.ServerName}] Lv.{verifiedCharacter.ItemAvgLevel || verifiedCharacter.ItemMaxLevel}
                    </div>
                  </div>
                </div>
              )}
              
              <button 
                type="submit"
                disabled={loading || !verifiedCharacter}
                className="w-full bg-[#217b46] hover:bg-[#1e6a3d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg mt-4 transition-colors"
              >
                {loading ? '가입 처리 중...' : (!verifiedCharacter ? '캐릭터를 검색해주세요' : '이 캐릭터로 가입하기')}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 모달 창 (캐릭터 확인) */}
      {showModal && tempCharacterData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111] border border-[#2a2d36] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-[#2a2d36] text-center">
              <h3 className="text-lg font-extrabold text-white">캐릭터 확인</h3>
              <p className="text-xs text-gray-400 mt-1">이 캐릭터가 본인의 대표 캐릭터가 맞나요?</p>
            </div>
            
            <div className="p-6 flex flex-col items-center">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-[#d4af37] overflow-hidden mb-4 bg-[#222] shadow-[0_0_15px_rgba(212,175,55,0.3)] shrink-0">
                <div 
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${tempCharacterData.CharacterImage || "https://img.lostark.co.kr/armory/3/BCFECAB4BFB898D2F165F04A317C5F84C526F7FB2BF59B973CDDA1300227D00A.jpg"})`,
                    backgroundSize: '550%',
                    backgroundPosition: ['도화가', '기상술사', '환수사'].includes(tempCharacterData.CharacterClassName) 
                      ? 'center 31%' 
                      : 'center 15%',
                    backgroundRepeat: 'no-repeat'
                  }}
                />
              </div>
              
              <div className="text-2xl font-black text-white mb-2 tracking-tight">
                {tempCharacterData.CharacterName}
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-[#1a1c23] border border-[#333] rounded-full text-sm font-medium text-gray-300">
                  {tempCharacterData.ServerName}
                </span>
                <span className="px-3 py-1 bg-[#1a1c23] border border-[#d4af37]/30 rounded-full text-sm font-bold text-[#d4af37]">
                  Lv. {tempCharacterData.ItemAvgLevel || tempCharacterData.ItemMaxLevel}
                </span>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-[#161719] border-t border-[#2a2d36] flex gap-3">
              <button 
                type="button"
                onClick={handleCancelCharacter}
                className="flex-1 py-3 bg-[#2a2d36] hover:bg-[#333] text-gray-300 font-bold rounded-xl transition-colors"
              >
                아닙니다
              </button>
              <button 
                type="button"
                onClick={handleConfirmCharacter}
                className="flex-1 py-3 bg-[#d4af37] hover:bg-[#f1c40f] text-black font-bold rounded-xl transition-colors"
              >
                네, 맞습니다
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}