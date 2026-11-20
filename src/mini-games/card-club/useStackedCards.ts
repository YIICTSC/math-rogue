import { useLayoutEffect, type RefObject } from 'react';

const cardRows = [
  '.cc-hand',
  '.cc-table-cards',
  '.cc-public-hand',
  '.cc-melds article > div',
  '.cc-foundations article > div',
  '.cc-layouts article > div:not(.cc-golf-grid):not(.cc-chinese-grid)',
  '.cc-mitch-row',
].join(',');

/** Keep the card corners readable as the hand and table change size. */
export function useStackedCards(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const host = root.current;
    if (!host) return;

    let frame = 0;
    const watched = new Set<Element>();
    const observer = new ResizeObserver(schedule);

    function layout() {
      frame = 0;
      for (const element of watched) {
        if (host.contains(element)) continue;
        observer.unobserve(element);
        watched.delete(element);
      }

      for (const row of host.querySelectorAll<HTMLElement>(cardRows)) {
        const cards = Array.from(row.children).filter((child) => child.matches('.cc-card,figure'));
        if (!cards.length) {
          row.classList.remove('cc-auto-stack');
          continue;
        }
        if (!watched.has(row)) {
          observer.observe(row);
          watched.add(row);
        }

        const card = cards[0].matches('.cc-card') ? cards[0] : cards[0].querySelector('.cc-card');
        const width = card?.getBoundingClientRect().width ?? 0;
        const available = row.clientWidth;
        if (!width || !available) continue;

        const overflow = cards.length > 1 && cards.length * (width + 6) > available;
        row.classList.toggle('cc-auto-stack', overflow);
        if (!overflow) continue;

        if (row.matches('.cc-hand')) {
          // Keep a single row with at least a readable corner on each overlapping card.
          const style = getComputedStyle(row);
          const inset = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
          const step = Math.max(24, (available - inset - width) / (cards.length - 1));
          row.style.setProperty('--cc-hand-columns', String(cards.length - 1));
          row.style.setProperty('--cc-hand-step', `${step}px`);
          row.style.setProperty('--cc-hand-tail', `${width}px`);
          continue;
        }

        const columns = Math.min(cards.length, Math.max(1, Math.floor((available - width) / 30) + 1));
        const tail = Math.max(0, width - (available - width) / Math.max(1, columns - 1));
        row.style.setProperty('--cc-stack-cols', String(columns));
        row.style.setProperty('--cc-stack-tail', `${tail}px`);
      }
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(layout);
    }

    const changes = new MutationObserver(schedule);
    changes.observe(host, { childList: true, subtree: true });
    observer.observe(host);
    schedule();
    return () => {
      changes.disconnect();
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [root]);
}
