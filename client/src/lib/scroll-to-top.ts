/** Marks the scrollable main panel in tabbed dashboards (employer/employee). */
export const DASHBOARD_SCROLL_ROOT_SELECTOR = "[data-dashboard-scroll-root]";

/**
 * Scrolls the dashboard main panel to top, or the window when no panel exists
 * (standalone employer/employee routes). Uses double rAF so layout can settle after tab swaps.
 */
export function scrollDashboardToTop(explicitRoot?: HTMLElement | null): void {
  const run = () => {
    const root =
      explicitRoot ??
      document.querySelector<HTMLElement>(DASHBOARD_SCROLL_ROOT_SELECTOR);

    if (root) {
      root.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  requestAnimationFrame(() => requestAnimationFrame(run));
}

/** Scroll window to top (public pages, pagination, etc.). */
export function scrollPageToTop(): void {
  scrollDashboardToTop();
}
