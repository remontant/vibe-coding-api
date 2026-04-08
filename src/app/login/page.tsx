'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { getCharacterData } from '@/app/actions';
import { useModalStore } from '@/store/modalStore';
import SHA256 from 'crypto-js/sha256';
import styles from './login.module.css';

const YOZ_CLASSES = ['도화가', '기상술사', '환수사'];
const DEFAULT_IMAGE = 'https://img.lostark.co.kr/armory/3/BCFECAB4BFB898D2F165F04A317C5F84C526F7FB2BF59B973CDDA1300227D00A.jpg';

export default function LoginPage() {
  const router = useRouter();
  const { openModal } = useModalStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  const [signupId, setSignupId] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [mainCharacter, setMainCharacter] = useState('');
  const [verifiedCharacter, setVerifiedCharacter] = useState<Record<string, string> | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [tempCharacterData, setTempCharacterData] = useState<Record<string, string> | null>(null);

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
        const hashedPw = SHA256(loginPw).toString();
        if (userData.password === hashedPw || userData.password === loginPw) {
          let className = userData.characterClassName;
          if (!className) {
            try {
              const res = await getCharacterData(userData.mainCharacter, 'profiles');
              if (res?.data?.CharacterClassName) {
                className = res.data.CharacterClassName;
                await set(ref(db, `users/${loginId}/characterClassName`), className);
              }
            } catch {}
          }
          localStorage.setItem('user', JSON.stringify({
            id: loginId,
            mainCharacter: userData.mainCharacter,
            image: userData.image,
            characterClassName: className || '',
          }));
          openModal({ title: '로그인 성공', message: '환영합니다! 로그인이 완료되었습니다.', type: 'success' });
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
      const res = await getCharacterData(mainCharacter, 'profiles');
      if (res?.error || !res?.data) {
        setError('존재하지 않는 캐릭터이거나 로스트아크 점검 중일 수 있습니다.');
        return;
      }
      setTempCharacterData(res.data);
      setShowModal(true);
    } catch {
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
      const userRef = ref(db, `users/${signupId}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        setError('이미 존재하는 아이디입니다.');
        setLoading(false);
        return;
      }
      const hashedPw = SHA256(signupPw).toString();
      await set(userRef, {
        password: hashedPw,
        mainCharacter: verifiedCharacter.CharacterName,
        image: verifiedCharacter.CharacterImage || '',
        characterClassName: verifiedCharacter.CharacterClassName || '',
      });
      openModal({ title: '가입 완료', message: '망고네 가입이 완료되었습니다!\n이제 로그인해주세요.', type: 'success' });
      setIsLogin(true);
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

  const avatarPosition = (className?: string) =>
    YOZ_CLASSES.includes(className ?? '') ? 'center 31%' : 'center 15%';

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        {/* 탭 전환 */}
        <div className={styles.tabs}>
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`${styles.tabBtn} ${isLogin ? styles.tabBtnActive : ''}`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setVerifiedCharacter(null); setError(''); }}
            className={`${styles.tabBtn} ${!isLogin ? styles.tabBtnActive : ''}`}
          >
            회원가입
          </button>
        </div>

        {/* 폼 영역 */}
        <div className={styles.formBody}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {isLogin ? '돌아오신 것을 환영해요!' : '망고네 가입하기'}
            </h2>
            <p className={styles.formDesc}>
              {isLogin
                ? '가까운 지인들끼리 사용하는 스케줄러입니다.'
                : '가입 후 본캐 닉네임으로 함께 일정을 공유하세요.'}
            </p>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>아이디</label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  required
                  disabled={loading}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>비밀번호</label>
                <input
                  type="password"
                  value={loginPw}
                  onChange={(e) => setLoginPw(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  disabled={loading}
                  className={styles.input}
                />
              </div>
              <button type="submit" disabled={loading} className={styles.btnSubmitLogin}>
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>아이디</label>
                <input
                  type="text"
                  value={signupId}
                  onChange={(e) => setSignupId(e.target.value)}
                  placeholder="사용할 아이디를 입력하세요"
                  required
                  disabled={loading}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>비밀번호</label>
                <input
                  type="password"
                  value={signupPw}
                  onChange={(e) => setSignupPw(e.target.value)}
                  placeholder="사용할 비밀번호를 입력하세요"
                  required
                  disabled={loading}
                  className={styles.input}
                />
                <p className={styles.pwHint}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  비밀번호는 안전하게 암호화되어 저장되니 안심하세요!
                </p>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  <span>본캐 닉네임</span>
                  <span className={styles.labelRequired}>* 가입 전 검색 필수</span>
                </label>
                <div className={styles.nicknameRow}>
                  <input
                    type="text"
                    value={mainCharacter}
                    onChange={(e) => { setMainCharacter(e.target.value); setVerifiedCharacter(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleVerifyCharacter(); } }}
                    placeholder="대표 캐릭터 닉네임을 입력하세요"
                    required
                    disabled={loading}
                    className={styles.nicknameInput}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCharacter}
                    disabled={loading || !mainCharacter}
                    className={styles.btnSearch}
                  >
                    검색
                  </button>
                </div>
              </div>

              {verifiedCharacter && (
                <div className={styles.verifiedCard}>
                  <div className={styles.verifiedAvatar}>
                    <div
                      className={styles.verifiedAvatarImg}
                      style={{
                        backgroundImage: `url(${verifiedCharacter.CharacterImage || DEFAULT_IMAGE})`,
                        backgroundSize: '550%',
                        backgroundPosition: avatarPosition(verifiedCharacter.CharacterClassName),
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                  </div>
                  <div className={styles.verifiedInfo}>
                    <div className={styles.verifiedName}>
                      {verifiedCharacter.CharacterName}
                      <span className={styles.verifiedBadge}>인증 완료</span>
                    </div>
                    <div className={styles.verifiedMeta}>
                      [{verifiedCharacter.ServerName}] Lv.{verifiedCharacter.ItemAvgLevel || verifiedCharacter.ItemMaxLevel}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !verifiedCharacter}
                className={styles.btnSubmitSignup}
              >
                {loading ? '가입 처리 중...' : !verifiedCharacter ? '캐릭터를 검색해주세요' : '이 캐릭터로 가입하기'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 캐릭터 확인 모달 */}
      {showModal && tempCharacterData && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>캐릭터 확인</h3>
              <p className={styles.modalSubtitle}>이 캐릭터가 본인의 대표 캐릭터가 맞나요?</p>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalAvatar}>
                <div
                  className={styles.modalAvatarImg}
                  style={{
                    backgroundImage: `url(${tempCharacterData.CharacterImage || DEFAULT_IMAGE})`,
                    backgroundSize: '550%',
                    backgroundPosition: avatarPosition(tempCharacterData.CharacterClassName),
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              </div>
              <div className={styles.modalCharName}>{tempCharacterData.CharacterName}</div>
              <div className={styles.modalMeta}>
                <span className={styles.modalBadgeServer}>{tempCharacterData.ServerName}</span>
                <span className={styles.modalBadgeLevel}>
                  Lv. {tempCharacterData.ItemAvgLevel || tempCharacterData.ItemMaxLevel}
                </span>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" onClick={handleCancelCharacter} className={styles.btnModalCancel}>
                아닙니다
              </button>
              <button type="button" onClick={handleConfirmCharacter} className={styles.btnModalConfirm}>
                네, 맞습니다
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
