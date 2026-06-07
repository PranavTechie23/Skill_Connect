import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ApprovalActionVariant = 'approve' | 'reject';

export type ApprovalActionPhase = 'idle' | 'loading' | 'success';

type ApprovalActionButtonProps = {
  variant: ApprovalActionVariant;
  phase?: ApprovalActionPhase;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  label?: string;
  fullWidth?: boolean;
};

const labels: Record<ApprovalActionVariant, string> = {
  approve: 'Approve',
  reject: 'Reject',
};

/** Shared approve/reject control: green spinner while loading, green tick on success. */
export function ApprovalActionButton({
  variant,
  phase = 'idle',
  disabled = false,
  onClick,
  className,
  label,
  fullWidth = false,
}: ApprovalActionButtonProps) {
  const isLoading = phase === 'loading';
  const isSuccess = phase === 'success';
  const isBusy = isLoading || isSuccess;
  const text = label ?? labels[variant];

  const icon =
    isLoading ? (
      <Loader2 className="w-5 h-5 animate-spin text-emerald-500" aria-hidden />
    ) : isSuccess ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-hidden />
    ) : variant === 'approve' ? (
      <CheckCircle2 className="w-5 h-5" aria-hidden />
    ) : (
      <XCircle className="w-5 h-5" aria-hidden />
    );

  const base =
    variant === 'approve'
      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 border-transparent'
      : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-900/50';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isBusy}
      aria-busy={isLoading}
      aria-live="polite"
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl font-bold transition-all',
        fullWidth ? 'flex-1 px-6 py-4' : 'px-6 py-3',
        variant === 'reject' && 'border-2',
        base,
        isBusy && 'opacity-90 cursor-wait',
        disabled && !isBusy && 'opacity-60 cursor-not-allowed',
        className,
      )}
    >
      {icon}
      <span>{isLoading ? 'Processing…' : isSuccess ? 'Done' : text}</span>
    </button>
  );
}
