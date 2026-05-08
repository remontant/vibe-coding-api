'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useModalStore } from '@/store/modalStore';
import { useAuthStore } from '@/store/authStore';
import styles from './Navbar.module.css';

const YOZ_CLASSES = ['도화가', '기상술사', '환수사'];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { openModal } = useModalStore();
  const { user, init, logout, deleteAccount } = useAuthStore();

  const [menuOpen, setMenuOpen] = useState(false);   // 햄버거 드로어
  const [userDropOpen, setUserDropOpen] = useState(false); // 유저 드롭다운

  const userDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { init(); }, [init]);
  useEffect(() => { setMenuOpen(false); setUserDropOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userDropRef.current && !userDropRef.current.contains(e.target as Node)) {
        setUserDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setUserDropOpen(false);
    logout();
    router.push('/');
  };

  const handleDeleteAccount = () => {
    setUserDropOpen(false);
    if (!user) return;
    openModal({
      title: '회원탈퇴',
      message: '정말 탈퇴하시겠습니까?\n가입 정보가 모두 삭제되며 복구할 수 없습니다.',
      type: 'warning',
      showCancel: true,
      onConfirm: async () => {
        try {
          await deleteAccount();
          openModal({ title: '탈퇴 완료', message: '회원탈퇴가 완료되었습니다.', type: 'success' });
          router.push('/');
        } catch {
          openModal({ title: '탈퇴 실패', message: '회원탈퇴 처리 중 에러가 발생했습니다.', type: 'error' });
        }
      },
    });
  };

  const navItems = [
    { name: '홈', path: '/' },
    { name: '레이드 약속', path: '/raid' },
    { name: '스케쥴 체크', path: '/schedule' },
    { name: '숙제', path: '/homework' },
  ];

  const avatarStyle = user ? {
    backgroundImage: `url(${user.image})`,
    backgroundSize: '550%',
    backgroundPosition: YOZ_CLASSES.includes(user.characterClassName ?? '') ? 'center 31%' : 'center 15%',
    backgroundRepeat: 'no-repeat' as const,
  } : {};

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <div className={styles.row}>

            {/* 왼쪽: 햄버거 + 데스크톱 nav */}
            <div className={styles.left}>
              {/* 햄버거 버튼 */}
              <button
                type="button"
                className={styles.hamburger}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="메뉴 열기"
              >
                <span className={`${styles.bar} ${menuOpen ? styles.barTop : ''}`} />
                <span className={`${styles.bar} ${menuOpen ? styles.barMid : ''}`} />
                <span className={`${styles.bar} ${menuOpen ? styles.barBot : ''}`} />
              </button>

              {/* 데스크톱 nav */}
              <nav className={styles.nav}>
                {navItems.map((item) =>
                  item.disabled ? (
                    <span key={item.path} className={styles.navLinkDisabled}>
                      {item.name}
                    </span>
                  ) : (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`${styles.navLink} ${pathname === item.path ? styles.navLinkActive : ''}`}
                    >
                      {item.name}
                    </Link>
                  )
                )}
              </nav>
            </div>

            {/* 오른쪽: 유저 드롭다운 or 로그인 */}
            <div className={styles.right}>
              {user ? (
                <div className={styles.userDropWrap} ref={userDropRef}>
                  {/* 트리거 */}
                  <button
                    type="button"
                    className={styles.userTrigger}
                    onClick={() => setUserDropOpen((v) => !v)}
                  >
                    <div className={styles.avatarWrap}>
                      <div className={styles.avatarImg} style={avatarStyle} />
                    </div>
                    <span className={styles.userName}>{user.mainCharacter}</span>
                    <svg
                      className={`${styles.chevron} ${userDropOpen ? styles.chevronUp : ''}`}
                      width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* 드롭다운 */}
                  {userDropOpen && (
                    <div className={styles.userDrop}>
                      <Link
                        href={`/?q=${encodeURIComponent(user.mainCharacter)}`}
                        className={styles.dropItem}
                        onClick={() => setUserDropOpen(false)}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                        내 정보 보기
                      </Link>
                      <button type="button" className={styles.dropItem} onClick={handleLogout}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        로그아웃
                      </button>
                      <div className={styles.dropDivider} />
                      <button type="button" className={`${styles.dropItem} ${styles.dropItemDanger}`} onClick={handleDeleteAccount}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                        </svg>
                        회원탈퇴
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className={styles.btnLogin}>로그인</Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 드로어 오버레이 */}
      {menuOpen && <div className={styles.overlay} onClick={() => setMenuOpen(false)} />}

      {/* 모바일 드로어 */}
      <div className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`}>
        {user ? (
          <div className={styles.drawerUser}>
            <Link
              href={`/?q=${encodeURIComponent(user.mainCharacter)}`}
              className={styles.drawerUserInfo}
              onClick={() => setMenuOpen(false)}
            >
              <div className={styles.drawerAvatar}>
                <div className={styles.avatarImg} style={avatarStyle} />
              </div>
              <div>
                <div className={styles.drawerCharName}>{user.mainCharacter}</div>
                <div className={styles.drawerCharSub}>내 정보 보기 →</div>
              </div>
            </Link>
          </div>
        ) : (
          <div className={styles.drawerUser}>
            <Link href="/login" className={styles.btnLogin} onClick={() => setMenuOpen(false)}>로그인</Link>
          </div>
        )}

        <nav className={styles.drawerNav}>
          {navItems.map((item) =>
            item.disabled ? (
              <span key={item.path} className={styles.drawerNavLinkDisabled}>
                {item.name}
              </span>
            ) : (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.drawerNavLink} ${pathname === item.path ? styles.drawerNavLinkActive : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.name}
              </Link>
            )
          )}
        </nav>

        {user && (
          <div className={styles.drawerActions}>
            <button type="button" onClick={handleLogout} className={styles.drawerBtn}>로그아웃</button>
            <button type="button" onClick={handleDeleteAccount} className={styles.drawerBtnDanger}>회원탈퇴</button>
          </div>
        )}
      </div>
    </>
  );
}
