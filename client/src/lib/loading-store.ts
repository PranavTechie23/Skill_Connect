/** Delay before showing the fullscreen overlay (avoids flashes on fast requests). */
const SHOW_DELAY_MS = 250;
/** Minimum time overlay stays visible once shown (avoids flicker). */
const MIN_VISIBLE_MS = 150;

let pendingCount = 0;
let overlayVisible = false;
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let visibleSince = 0;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** 0 = hidden, 1 = overlay visible (debounced). */
export function getLoadingCount(): number {
  return overlayVisible ? 1 : 0;
}

export function subscribeLoading(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function startGlobalLoading(): void {
  pendingCount += 1;

  if (pendingCount === 1) {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (!overlayVisible && !showTimer) {
      showTimer = setTimeout(() => {
        showTimer = null;
        if (pendingCount > 0) {
          overlayVisible = true;
          visibleSince = Date.now();
          notify();
        }
      }, SHOW_DELAY_MS);
    }
  }
}

export function stopGlobalLoading(): void {
  if (pendingCount <= 0) return;
  pendingCount -= 1;

  if (pendingCount > 0) return;

  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
    return;
  }

  if (!overlayVisible) return;

  const elapsed = Date.now() - visibleSince;
  const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);

  hideTimer = setTimeout(() => {
    hideTimer = null;
    overlayVisible = false;
    notify();
  }, delay);
}

export function withGlobalLoading<T>(promise: Promise<T>): Promise<T> {
  startGlobalLoading();
  return promise.finally(() => stopGlobalLoading());
}
