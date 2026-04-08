'use client';

import { useModalStore } from '@/store/modalStore';

export default function GlobalModal() {
  const { isOpen, title, message, type, showCancel, onConfirm, closeModal } = useModalStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeModal();
  };

  // 아이콘 렌더링
  const renderIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-12 h-12 rounded-full bg-[#217b46]/20 flex items-center justify-center shrink-0 mb-4 mx-auto">
            <svg className="w-6 h-6 text-[#217b46]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-12 h-12 rounded-full bg-[#ff5e5e]/20 flex items-center justify-center shrink-0 mb-4 mx-auto">
            <svg className="w-6 h-6 text-[#ff5e5e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-full bg-[#d4af37]/20 flex items-center justify-center shrink-0 mb-4 mx-auto">
            <svg className="w-6 h-6 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-12 h-12 rounded-full bg-[#4cc3ff]/20 flex items-center justify-center shrink-0 mb-4 mx-auto">
            <svg className="w-6 h-6 text-[#4cc3ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111] border border-[#2a2d36] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          {renderIcon()}
          
          <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-gray-400 whitespace-pre-line leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="px-6 py-4 bg-[#161719] border-t border-[#2a2d36] flex gap-3">
          {showCancel && (
            <button 
              type="button"
              onClick={closeModal}
              className="flex-1 py-3 bg-[#2a2d36] hover:bg-[#333] text-gray-300 font-bold rounded-xl transition-colors"
            >
              취소
            </button>
          )}
          <button 
            type="button"
            onClick={handleConfirm}
            className={`flex-1 py-3 font-bold rounded-xl transition-colors ${
              type === 'error' ? 'bg-[#ff5e5e] hover:bg-[#e65555] text-white' :
              type === 'warning' ? 'bg-[#d4af37] hover:bg-[#f1c40f] text-black' :
              type === 'success' ? 'bg-[#217b46] hover:bg-[#1e6a3d] text-white' :
              'bg-[#d4af37] hover:bg-[#f1c40f] text-black'
            }`}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}