import React from 'react';
import { X } from 'lucide-react';
import {
  adminFormModalBodyScrollClass,
  adminFormModalCloseBtnClass,
  adminFormModalFormClass,
  adminFormModalHeaderClass,
  adminFormModalHeaderGradientClass,
  adminFormModalIconWrapClass,
  adminFormModalOverlayClass,
  adminFormModalPanelClass,
  adminFormModalSubtitleClass,
  adminFormModalTitleClass,
} from './admin-form-modal-styles';

export interface AdminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onOverlayClick?: () => void;
  panelClassName?: string;
  /** Skip default px-8 py-7 wrapper (e.g. when children is a full <form>). */
  bareBody?: boolean;
}

/** Fixed overlay shell for admin add/create forms. */
export function AdminFormModal({
  isOpen,
  onClose,
  darkMode,
  title,
  subtitle,
  icon,
  children,
  footer,
  onOverlayClick,
  panelClassName,
  bareBody = false,
}: AdminFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className={adminFormModalOverlayClass(darkMode)} onClick={onOverlayClick ?? onClose}>
      <div
        className={adminFormModalPanelClass(darkMode, panelClassName)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-form-modal-title"
      >
        <div className={adminFormModalHeaderClass(darkMode)}>
          <div className={adminFormModalHeaderGradientClass(darkMode)} aria-hidden />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-5">
              <div className={adminFormModalIconWrapClass()}>{icon}</div>
              <div>
                <h2 id="admin-form-modal-title" className={adminFormModalTitleClass(darkMode)}>
                  {title}
                </h2>
                {subtitle ? <p className={adminFormModalSubtitleClass(darkMode)}>{subtitle}</p> : null}
              </div>
            </div>
            <button type="button" onClick={onClose} className={adminFormModalCloseBtnClass(darkMode)} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className={adminFormModalBodyScrollClass()}>
          {bareBody ? children : <div className={adminFormModalFormClass()}>{children}</div>}
        </div>

        {footer}
      </div>
    </div>
  );
}

