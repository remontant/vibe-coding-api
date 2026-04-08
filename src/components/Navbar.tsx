'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ref, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useModalStore } from '@/store/modalStore';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { openModal } = useModalStore();
  const [user, setUser] = useState<{ id: string, mainCharacter: string, image: string, characterClassName?: string } | null>(null);

  useEffect(() => {
    // 클라이언트 사이드에서 localStorage 확인
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('User parsing error:', e);
      }
    }
  }, [pathname]); // 페이지 이동 시마다 로그인 상태 재확인

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
          
          openModal({
            title: '탈퇴 완료',
            message: '회원탈퇴가 완료되었습니다.',
            type: 'success'
          });
          localStorage.removeItem('user');
          setUser(null);
          router.push('/');
        } catch (error) {
          console.error('회원탈퇴 에러:', error);
          openModal({
            title: '탈퇴 실패',
            message: '회원탈퇴 처리 중 에러가 발생했습니다.',
            type: 'error'
          });
        }
      }
    });
  };

  const navItems = [
    { name: '홈', path: '/' },
    { name: '레이드 약속', path: '/raid' },
    { name: '숙제', path: '/homework' },
  ];

  return (
    <header className="w-full border-b border-[#2a2d36] bg-[#111] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          <div className="flex items-center gap-8 h-full">
            <Link href="/" className="font-extrabold text-xl text-white tracking-tighter">
              망고네
            </Link>
            <nav className="flex gap-6 h-full items-center">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`text-sm font-bold h-full flex items-center border-b-2 px-1 transition-colors ${
                      isActive 
                        ? 'border-white text-white' 
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-[#d4af37] overflow-hidden shrink-0 bg-[#222]">
                    <div 
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url(${user.image})`,
                        backgroundSize: '550%',
                        backgroundPosition: ['도화가', '기상술사', '환수사'].includes(user.characterClassName || '') 
                          ? 'center 31%' 
                          : 'center 15%',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white hidden sm:block">
                    {user.mainCharacter}<span className="text-gray-400 font-normal ml-0.5">님</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 border-l border-[#333] pl-4">
                  <button 
                    onClick={handleLogout}
                    className="text-xs font-bold text-gray-500 hover:text-white transition-colors"
                  >
                    로그아웃
                  </button>
                  <button 
                    onClick={handleDeleteAccount}
                    className="text-xs font-bold text-gray-500 hover:text-[#ff5e5e] transition-colors"
                  >
                    회원탈퇴
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="text-sm font-bold text-gray-300 hover:text-white transition-colors bg-[#222] hover:bg-[#333] border border-[#333] px-4 py-2 rounded-md"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}