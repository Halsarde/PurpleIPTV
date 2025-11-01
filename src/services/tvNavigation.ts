// Lightweight D-Pad navigation for Android/Google TV
// Moves focus between focusable elements using Arrow keys and triggers click on Enter

type Dir = 'up' | 'down' | 'left' | 'right';

const isEditable = (el: Element | null) => {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || el.isContentEditable) return true;
  if (tag === 'select') return true;
  return false;
};

const isFocusable = (el: Element): el is HTMLElement => {
  if (!(el instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(el);
  if (style.visibility === 'hidden' || style.display === 'none') return false;
  if (el.hasAttribute('disabled')) return false;
  const tabIndexAttr = el.getAttribute('tabindex');
  const tabIndex = tabIndexAttr !== null ? parseInt(tabIndexAttr, 10) : NaN;
  const focusableSelector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return (
    (!Number.isNaN(tabIndex) && tabIndex >= 0) ||
    el.matches(focusableSelector)
  );
};

const getFocusable = (): HTMLElement[] => {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(
    'a[href], button, input, select, textarea, [tabindex]'
  ));
  return nodes.filter(isFocusable);
};

const distance = (a: DOMRect, b: DOMRect) => {
  const ax = a.left + a.width / 2;
  const ay = a.top + a.height / 2;
  const bx = b.left + b.width / 2;
  const by = b.top + b.height / 2;
  const dx = ax - bx;
  const dy = ay - by;
  return Math.hypot(dx, dy);
};

const move = (dir: Dir) => {
  const current = (document.activeElement as HTMLElement) || null;
  const focusables = getFocusable();
  if (!current || !focusables.includes(current)) {
    // Focus first visible element
    const first = focusables[0];
    if (first) first.focus();
    return;
  }

  const cRect = current.getBoundingClientRect();
  const candidates = focusables.filter((el) => el !== current);

  const inDir = candidates
    .map((el) => ({ el, rect: el.getBoundingClientRect() }))
    .filter(({ rect }) => {
      switch (dir) {
        case 'up':
          return rect.bottom <= cRect.top - 2;
        case 'down':
          return rect.top >= cRect.bottom + 2;
        case 'left':
          return rect.right <= cRect.left - 2;
        case 'right':
          return rect.left >= cRect.right + 2;
      }
    })
    .sort((a, b) => distance(cRect, a.rect) - distance(cRect, b.rect));

  const next = inDir[0]?.el;
  if (next) next.focus();
};

let initialized = false;

export const initTVNavigation = () => {
  if (initialized) return;
  initialized = true;

  window.addEventListener('keydown', (e) => {
    const key = e.key;
    const active = document.activeElement;
    // Allow typing in editable fields
    if (isEditable(active)) return;

    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
      e.preventDefault();
      move(key.replace('Arrow', '').toLowerCase() as Dir);
      return;
    }

    if (key === 'Enter') {
      e.preventDefault();
      const el = active as HTMLElement | null;
      el?.click?.();
      return;
    }

    if (key === 'Backspace') {
      // Navigate back if not in input
      e.preventDefault();
      if (window.history.length > 1) window.history.back();
      return;
    }
  });

  // Initial focus
  window.setTimeout(() => {
    if (!document.activeElement || document.activeElement === document.body) {
      const first = getFocusable()[0];
      first?.focus();
    }
  }, 50);
};

