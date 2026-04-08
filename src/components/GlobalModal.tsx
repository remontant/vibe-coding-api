'use client';

import { useModalStore } from '@/store/modalStore';
import styles from './GlobalModal.module.css';

export default function GlobalModal() {
  const { isOpen, title, message, type, showCancel, onConfirm, closeModal } = useModalStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeModal();
  };

  const iconWrapClass = {
    success: styles.iconSuccess,
    error:   styles.iconError,
    warning: styles.iconWarning,
    info:    styles.iconInfo,
  }[type];

  const btnClass = {
    success: styles.btnConfirmSuccess,
    error:   styles.btnConfirmError,
    warning: styles.btnConfirmWarning,
    info:    styles.btnConfirmInfo,
  }[type];

  const icon = {
    success: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }[type];

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.body}>
          <div className={`${styles.iconWrap} ${iconWrapClass}`}>{icon}</div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.message}>{message}</p>
        </div>
        <div className={styles.footer}>
          {showCancel && (
            <button type="button" onClick={closeModal} className={styles.btnCancel}>
              취소
            </button>
          )}
          <button type="button" onClick={handleConfirm} className={`${styles.btnConfirm} ${btnClass}`}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
