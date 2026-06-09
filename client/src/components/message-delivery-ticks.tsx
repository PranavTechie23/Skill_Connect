import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MessageDeliveryStatus = 'pending' | 'delivered' | 'read';

const STATUS_LABEL: Record<MessageDeliveryStatus, string> = {
  pending: 'Sending',
  delivered: 'Delivered',
  read: 'Read',
};

export function messageDeliveryStatus(isRead: boolean, pending?: boolean): MessageDeliveryStatus {
  if (pending) return 'pending';
  if (isRead) return 'read';
  return 'delivered';
}

type MessageDeliveryTicksProps = {
  status: MessageDeliveryStatus;
  className?: string;
  /** Own message on a colored bubble (white / light tick colors). */
  onOwnBubble?: boolean;
};

export function MessageDeliveryTicks({ status, className, onOwnBubble }: MessageDeliveryTicksProps) {
  const tickClass = cn('h-3.5 w-3.5 shrink-0', className);

  if (status === 'pending') {
    return (
      <span className="inline-flex" role="img" aria-label={STATUS_LABEL.pending}>
        <Check className={cn(tickClass, onOwnBubble ? 'opacity-50' : 'opacity-40')} aria-hidden />
      </span>
    );
  }

  if (status === 'read') {
    return (
      <span className="inline-flex" role="img" aria-label={STATUS_LABEL.read}>
        <CheckCheck
          className={cn(tickClass, onOwnBubble ? 'text-sky-200' : 'text-sky-500 dark:text-sky-400')}
          aria-hidden
        />
      </span>
    );
  }

  return (
    <span className="inline-flex" role="img" aria-label={STATUS_LABEL.delivered}>
      <CheckCheck
        className={cn(tickClass, onOwnBubble ? 'opacity-75' : 'opacity-60 text-muted-foreground')}
        aria-hidden
      />
    </span>
  );
}
