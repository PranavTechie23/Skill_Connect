import { cn } from '@/lib/utils';



/** Shared layout tokens for admin "Add" modals (reference: Add New User on /admin/users). */

export const ADMIN_FORM_MODAL_WIDTH = 'max-w-3xl';



export function adminFormModalOverlayClass(darkMode?: boolean, className?: string) {

  return cn(

    'fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md',

    darkMode ? 'bg-black/65' : 'bg-white/55',

    className,

  );

}



export function adminFormModalPanelClass(darkMode: boolean, className?: string) {

  return cn(

    'max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl sm:rounded-[2rem] border shadow-[0_30px_120px_rgba(0,0,0,0.6)]',

    darkMode ? 'border-white/10 bg-[#0f1728] text-white' : 'border-white/80 bg-[#fbf8ff] text-slate-900',

    className,

  );

}



export function adminFormModalHeaderClass(darkMode: boolean, className?: string) {

  return cn(

    'relative overflow-hidden border-b px-4 py-4 sm:px-8 sm:py-5',

    darkMode ? 'border-white/10 bg-slate-900/40' : 'border-violet-200/70 bg-white/75',

    className,

  );

}



export function adminFormModalHeaderGradientClass(darkMode: boolean) {

  return cn(

    'pointer-events-none absolute inset-0',

    darkMode

      ? 'bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.28),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.14),transparent_28%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.78))]'

      : 'bg-[radial-gradient(circle_at_top_left,rgba(192,132,252,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(96,165,250,0.1),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,243,255,0.92))]',

  );

}



export function adminFormModalIconWrapClass(className?: string) {

  return cn(

    'flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 text-white shadow-[0_18px_45px_rgba(139,92,246,0.45)] ring-1 ring-white/20',

    className,

  );

}



export function adminFormModalTitleClass(darkMode: boolean) {

  return cn('text-xl sm:text-3xl font-black tracking-tight', darkMode ? 'text-white' : 'text-slate-900');

}



export function adminFormModalSubtitleClass(darkMode: boolean) {

  return cn('mt-1 text-sm font-medium', darkMode ? 'text-slate-300' : 'text-slate-600');

}



export function adminFormModalCloseBtnClass(darkMode: boolean) {

  return cn(

    'grid h-9 w-9 place-items-center rounded-lg transition-all',

    darkMode ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',

  );

}



export function adminFormModalBodyScrollClass() {

  return 'max-h-[calc(92vh-130px)] overflow-y-auto';

}



export function adminFormModalFormClass() {

  return 'space-y-4 px-4 py-4 sm:px-8 sm:py-5';

}



export function adminFormModalSectionClass(darkMode: boolean) {

  return cn(

    'space-y-4 rounded-xl sm:rounded-2xl border p-3 sm:p-4',

    darkMode ? 'border-white/10 bg-white/[0.03]' : 'border-white/80 bg-white/90 shadow-[0_18px_50px_rgba(148,163,184,0.12)]',

  );

}



export function adminFormModalFooterClass(darkMode: boolean) {

  return cn('flex gap-3 border-t pt-3 sm:pt-4', darkMode ? 'border-white/10' : 'border-slate-200/80');

}



export function adminFormModalCancelBtnClass(darkMode: boolean) {

  return cn(

    'flex-1 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 text-sm font-bold transition-all',

    darkMode ? 'bg-white/8 text-slate-200 hover:bg-white/12' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',

  );

}



export function adminFormModalSubmitBtnClass() {

  return 'flex-1 rounded-xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500 px-4 py-2.5 sm:px-5 sm:py-3 text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-violet-500/30 disabled:opacity-50';

}



export function adminFormModalGridClass() {

  return 'grid grid-cols-1 gap-3 sm:grid-cols-2';

}



export function adminFormLabelClass(darkMode: boolean) {

  return cn(

    'mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em]',

    darkMode ? 'text-slate-200' : 'text-slate-700',

  );

}



export function adminFormInputClass(darkMode: boolean, className?: string) {

  return cn(

    'h-10 w-full rounded-xl border px-3 text-sm font-medium outline-none transition-all',

    darkMode

      ? 'border-white/10 bg-[#071122] text-white placeholder:text-slate-500 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/45'

      : 'border-slate-200 bg-white/90 text-slate-900 placeholder:text-slate-400 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/30',

    className,

  );

}



/** Icon-leading inputs (e.g. location, website). */

export function adminFormInputWithIconClass(darkMode: boolean, className?: string) {

  return adminFormInputClass(darkMode, cn('pl-9', className));

}



export function adminFormTextareaClass(darkMode: boolean, className?: string) {

  return cn(

    'min-h-[88px] w-full resize-y rounded-xl border px-3 py-2 text-sm font-medium leading-relaxed outline-none transition-all',

    darkMode

      ? 'border-white/10 bg-[#071122] text-white placeholder:text-slate-500 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/45'

      : 'border-slate-200 bg-white/90 text-slate-900 placeholder:text-slate-400 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/30',

    className,

  );

}



/** Radix Select trigger — same height as text inputs. */

export function adminFormSelectTriggerClass(darkMode: boolean, className?: string) {

  return cn(

    adminFormInputClass(darkMode),

    'flex items-center justify-between shadow-none [&>span]:line-clamp-1',

    className,

  );

}



/**

 * Shadcn Input/Select in dialog add modals (employees, job-postings).

 * Compact sizing with page-specific accent rings.

 */

export function adminFormDialogFieldClass(

  darkMode: boolean,

  accent: 'violet' | 'orange' = 'violet',

  className?: string,

) {

  const lightRing = accent === 'orange' ? 'focus-visible:ring-orange-500' : 'focus-visible:ring-violet-500';

  const darkRing = accent === 'orange' ? 'focus-visible:ring-orange-400' : 'focus-visible:ring-violet-400';



  return cn(

    'h-10 rounded-xl border text-sm px-3 shadow-none',

    darkMode

      ? `border-[#2F4675] bg-[#08173A] text-white placeholder:text-indigo-200/45 ${darkRing} focus-visible:ring-offset-0`

      : `border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 ${lightRing} focus-visible:ring-offset-0`,

    className,

  );

}



export function adminFormDialogTextareaClass(

  darkMode: boolean,

  accent: 'violet' | 'orange' = 'violet',

  className?: string,

) {

  const lightRing = accent === 'orange' ? 'focus-visible:ring-orange-500' : 'focus-visible:ring-violet-500';

  const darkRing = accent === 'orange' ? 'focus-visible:ring-orange-400' : 'focus-visible:ring-violet-400';



  return cn(

    'min-h-[88px] w-full resize-y rounded-xl border px-3 py-2 text-sm leading-relaxed shadow-none',

    darkMode

      ? `border-[#2F4675] bg-[#08173A] text-white placeholder:text-indigo-200/45 ${darkRing} focus-visible:ring-offset-0`

      : `border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 ${lightRing} focus-visible:ring-offset-0`,

    className,

  );

}



/** Radix Dialog shell — hides default top-right close; use header close instead. */

export function adminFormDialogContentClass(darkMode: boolean, className?: string) {
  return cn(
    'flex flex-col max-h-[92vh] w-full overflow-hidden rounded-2xl sm:rounded-[2rem] border-0 p-0 sm:max-w-3xl [&>button.absolute]:hidden',
    darkMode
      ? 'border-white/10 bg-[#0f1728] text-white shadow-[0_30px_120px_rgba(5,10,25,0.75)]'
      : 'border-white/80 bg-[#fbf8ff] text-slate-900 shadow-[0_30px_120px_rgba(88,28,135,0.18)]',
    className,
  );
}

export function adminFormDialogHeaderClass(darkMode: boolean, className?: string) {
  return cn(adminFormModalHeaderClass(darkMode), 'shrink-0 space-y-0 text-left', className);
}

export function adminFormDialogBodyScrollClass() {
  return 'flex-1 overflow-y-auto p-1';
}



export function adminFormDialogFooterClass(darkMode: boolean) {
  return cn(
    'shrink-0 flex flex-col-reverse gap-3 border-t px-4 py-4 sm:px-8 sm:py-5 sm:flex-row sm:items-center sm:justify-end',
    darkMode ? 'border-white/10' : 'border-violet-200/50',
  );
}

