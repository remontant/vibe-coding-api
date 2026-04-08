'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ref, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useModalStore } from '@/store/modalStore';
import styles from './Navbar.module.css';

const YOZ_CLASSES = ['도화가', '기상술사', '환수사'];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { openModal } = useModalStore();
  const [user, setUser] = useState<{ id: string; mainCharacter: string; image: string; characterClassName?: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('User parsing error:', e);
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    openModal({
      title: '회원탈퇴',
      message: '정말 탈퇴하시겠습니까?\n가입 정보가 모두 삭제되며 복구할 수 없습니다.',
      type: 'warning',
      showCancel: true,
      onConfirm: async () => {
        try {
          const userRef = ref(db, `users/${user.id}`);
          await remove(userRef);
          openModal({ title: '탈퇴 완료', message: '회원탈퇴가 완료되었습니다.', type: 'success' });
          localStorage.removeItem('user');
          setUser(null);
          router.push('/');
        } catch (error) {
          console.error('회원탈퇴 에러:', error);
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
