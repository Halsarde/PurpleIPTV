(function() {
  function getScopeRoot() {
    const modal = document.getElementById('player-modal');
    if (modal && !modal.classList.contains('hidden')) return modal;
    return document;
  }

  function getNavigables(root = document) {
    return Array.from(root.querySelectorAll('[data-nav]')).filter(el => !el.disabled && el.offsetParent !== null);
  }

  function focusElement(el) {
    if (!el) return;
    try {
      el.focus({ preventScroll: true });
    } catch { el.focus(); }
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    } catch {}
  }

  function focusNearest(from, dir) {
    const scope = getScopeRoot();
    const items = getNavigables(scope);
    if (!items.length) return;

    const fr = (from.getBoundingClientRect ? from.getBoundingClientRect() : {left:0,top:0,width:0,height:0});
    const candidates = items.filter(i => i !== from).map(el => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      const fx = fr.left + fr.width/2, fy = fr.top + fr.height/2;
      const dx = cx - fx, dy = cy - fy;

      if (dir === 'left'  && dx >= 0) return null;
      if (dir === 'right' && dx <= 0) return null;
      if (dir === 'up'    && dy >= 0) return null;
      if (dir === 'down'  && dy <= 0) return null;

      const dist = Math.hypot(dx, dy);
      const axis = (dir === 'left' || dir === 'right') ? Math.abs(dy) : Math.abs(dx);
      return { el, dist, axis };
    }).filter(Boolean);

    candidates.sort((a,b) => (a.axis - b.axis) || (a.dist - b.dist));
    if (candidates[0]) focusElement(candidates[0].el);
  }

  function ensureFocus() {
    const scope = getScopeRoot();
    if (!document.activeElement || document.activeElement === document.body || !scope.contains(document.activeElement)) {
      const first = getNavigables(scope)[0];
      if (first) focusElement(first);
    }
  }

  window.addEventListener('keydown', (e) => {
    const active = document.activeElement || document.body;
    const tag = (active && active.tagName) ? active.tagName.toUpperCase() : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === 'ArrowLeft')  { e.preventDefault(); focusNearest(active, 'left'); }
    if (e.key === 'ArrowRight') { e.preventDefault(); focusNearest(active, 'right'); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); focusNearest(active, 'up'); }
    if (e.key === 'ArrowDown')  { e.preventDefault(); focusNearest(active, 'down'); }
  });

  window.addEventListener('DOMContentLoaded', ensureFocus);
})();
