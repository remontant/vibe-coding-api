'use client';

import { useEffect } from 'react';
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

  // authStore에서 user 상태 직접 구독 — localStorage 읽기 코드 제거
  const { user, init, logout, deleteAccount } = useAuthStore();

  // 앱 최초 마운트 시 localStorage에서 복원
  useEffect(() => {
    init();
  }, [init]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleDeleteAccount = () => {
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
    { name: '숙제', path: '/homework' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.row}>
          <div className={styles.left}>
            <Link href="/" className={styles.logo}>망고네</Link>
            <nav className={styles.nav}>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`${styles.navLink} ${pathname === item.path ? styles.navLinkActive : ''}`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className={styles.right}>
            {user ? (
              <div className={styles.userSection}>
                <div className={styles.userInfo}>
                  <div className={styles.avatarWrap}>
                    <div
                      className={styles.avatarImg}
                      style={{
                        backgroundImage: `url(${user.image})`,
                        backgroundSize: '550%',
                        backgroundPosition: YOZ_CLASSES.includes(user.characterClassName ?? '')
                          ? 'center 31%'
                          : 'center 15%',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                  </div>
                  <span className={styles.userName}>
                    {user.mainCharacter}
                    <span className={styles.userNameSub}>님</span>
                  </span>
                </div>
                <div className={styles.actions}>
                  <button type="button" onClick={handleLogout} className={styles.btnLogout}>
                    로그아웃
                  </button>
                  <button type="button" onClick={handleDeleteAccount} className={styles.btnDelete}>
                    회원탈퇴
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className={styles.btnLogin}>
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
