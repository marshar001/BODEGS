/* BODEGS tap feel: product cards, category icons and buttons squeeze a little when pressed,
   then spring back with a small pop (same spring as the bottom nav) before the next page opens. */
(function () {
  if (window.__bodegsPress) return;
  window.__bodegsPress = true;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  var SPRING = "transform .46s cubic-bezier(.34,1.56,.5,1)";
  var SQUEEZE = "transform .14s cubic-bezier(.3,.7,.4,1)";
  var TARGET = "a[href], button, [role=button], .product-card, .category-card, .store-card";
  var SKIP = "nav.bottom-nav, .bt, input, select, textarea, .pv-track, .welcome-carousel, .carousel-dots, .dk-skip, [data-nopress], .st-row, .cf-back, .age-sheet";
  var vw = window.innerWidth;

  function pick(t) {
    var el = t && t.closest ? t.closest(TARGET) : null;
    if (!el || el.disabled) return null;
    if (el.closest(SKIP)) return null;
    var r = el.getBoundingClientRect();
    if (r.height > 320 || r.width < 8) return null;          /* never squeeze big sections */
    return { el: el, w: r.width };
  }

  var cur = null, holdTimer = 0, sx = 0, sy = 0;

  function squeeze(el, w) {
    var s = w < 120 ? .88 : w < 220 ? .94 : .97;               /* small things squeeze more */
    el.style.transition = SQUEEZE;
    el.style.transform = "scale(" + s + ")";
    el.__pressed = 1;
  }
  function release(el) {
    if (!el || !el.__pressed) return;
    el.__pressed = 0;
    el.style.transition = SPRING;
    el.style.transform = "scale(1)";
    clearTimeout(el.__t);
    el.__t = setTimeout(function () {
      el.style.transition = ""; el.style.transform = "";
    }, 520);
  }

  document.addEventListener("pointerdown", function (e) {
    if (e.button > 0) return;
    var p = pick(e.target);
    if (!p) return;
    cur = p.el; sx = e.clientX; sy = e.clientY;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(function () { if (cur) squeeze(cur, p.w); }, 35);   /* not while the page is being scrolled */
  }, { passive: true });

  document.addEventListener("pointermove", function (e) {
    if (!cur) return;
    if (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10) {
      clearTimeout(holdTimer); release(cur); cur = null;
    }
  }, { passive: true });

  function up() {
    clearTimeout(holdTimer);
    if (cur) {
      if (!cur.__pressed) squeeze(cur, cur.getBoundingClientRect().width);   /* very quick tap: still show it */
      var el = cur;
      setTimeout(function () { release(el); }, 30);
    }
    cur = null;
  }
  document.addEventListener("pointerup", up, { passive: true });
  document.addEventListener("pointercancel", up, { passive: true });

  /* let the pop play before a link opens the next page */
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|javascript:|sms:)/i.test(href)) return;
    if (a.closest(SKIP)) return;
    e.preventDefault();
    var url = a.href;
    setTimeout(function () { window.location.href = url; }, 190);
  });

  /* coming back with the Back button: make sure nothing is left squeezed */
  window.addEventListener("pageshow", function () {
    var all = document.querySelectorAll("[style*='scale(']");
    for (var i = 0; i < all.length; i++) { all[i].style.transform = ""; all[i].style.transition = ""; }
  });
})();
