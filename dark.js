/* BODEGS dark mode.
   Choice is saved on the phone: "light", "dark" or "auto" (auto follows the phone's setting; default).
   Put <script src="dark.js?v=1"></script> as the first line inside <head> of each shopper page.

   Follows the usual dark-UI rules: no pure black / pure white, no big bright surfaces,
   depth shown by lighter raised surfaces (not shadows), softer colours, accent only on buttons and active things.
   It re-colours whatever the page already has, so it works with any page without touching styles.css. */
(function () {
  var KEY = "bodegsTheme";
  var pref = "auto";
  try { pref = localStorage.getItem(KEY) || "auto"; } catch (e) {}
  if (pref !== "light" && pref !== "dark") pref = "auto";

  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var isDark = pref === "dark" || (pref === "auto" && mq && mq.matches);

  window.BODEGSTheme = {
    get: function () { return pref; },
    isDark: function () { return isDark; },
    set: function (v) {
      try { localStorage.setItem(KEY, v); } catch (e) {}
      location.reload();
    }
  };

  if (mq && pref === "auto") {
    var onChange = function () { if (mq.matches !== isDark) location.reload(); };
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }


  /* ---------- Light / Dark / Auto toggle with a sliding bubble (same spring as the bottom bar) ---------- */
  var TCSS =
    ".bt{position:relative;display:grid;grid-template-columns:repeat(3,1fr);height:46px;padding:4px;border-radius:999px;background:#e7e3da;box-sizing:border-box;font-family:Arial,sans-serif;-webkit-tap-highlight-color:transparent;user-select:none}" +
    ".bt .bt-bub{position:absolute;top:4px;bottom:4px;left:4px;width:calc((100% - 8px) / 3);border-radius:999px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.14);transition:transform .42s cubic-bezier(.34,1.32,.5,1)}" +
    ".bt button{position:relative;z-index:1;border:0;background:transparent;border-radius:999px;font:600 14px Arial,sans-serif;color:#6b6b6b;cursor:pointer;transition:color .25s ease,transform .15s ease;padding:0}" +
    ".bt button:active{transform:scale(.95)}" +
    ".bt button.on{color:#111}" +
    "[data-theme=dark] .bt{background:#232323}" +
    "[data-theme=dark] .bt .bt-bub{background:#4a4a4a;box-shadow:none}" +
    "[data-theme=dark] .bt button{color:#8d8d8d}" +
    "[data-theme=dark] .bt button.on{color:#ececec}" +
    "@media (prefers-reduced-motion:reduce){.bt .bt-bub{transition:none}}";
  function addToggleCss() {
    if (document.getElementById("bt-css")) return;
    var s = document.createElement("style"); s.id = "bt-css"; s.textContent = TCSS;
    (document.head || document.documentElement).appendChild(s);
  }
  var ORDER = ["light", "dark", "auto"], LABEL = { light: "Light", dark: "Dark", auto: "Auto" };
  window.BODEGSTheme.toggle = function () {
    addToggleCss();
    var box = document.createElement("div");
    box.className = "bt dk-skip";
    box.setAttribute("role", "radiogroup");
    box.setAttribute("aria-label", "Appearance");
    var bub = document.createElement("div"); bub.className = "bt-bub"; box.appendChild(bub);
    function place(v) { bub.style.transform = "translateX(" + (ORDER.indexOf(v) * 100) + "%)"; }
    ORDER.forEach(function (v) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = LABEL[v];
      b.setAttribute("role", "radio");
      if (v === pref) b.className = "on";
      b.setAttribute("aria-checked", v === pref ? "true" : "false");
      b.addEventListener("click", function () {
        if (v === pref) return;
        var all = box.querySelectorAll("button");
        for (var i = 0; i < all.length; i++) all[i].className = all[i] === b ? "on" : "";
        place(v);
        setTimeout(function () { window.BODEGSTheme.set(v); }, 460);
      });
      box.appendChild(b);
    });
    place(pref);
    return box;
  };

  if (!isDark) return;

  var PAGE = "#1b1b1b", CARD = "#2c2c2c", CHIP = "#373737";
  var root = document.documentElement;
  root.setAttribute("data-theme", "dark");

  /* hide the page until it is re-coloured so there is no white flash */
  var st = document.createElement("style");
  st.id = "dk-base";
  st.textContent =
    "html{color-scheme:dark;background:" + PAGE + "}" +
    "html.dk-pending body{opacity:0}" +
    "[data-theme=dark] ::placeholder{color:#7d8a84 !important;opacity:1}" +
    "[data-theme=dark] ::selection{background:rgba(120,170,150,.35)}";
  root.appendChild(st);
  root.classList.add("dk-pending");
  setTimeout(function () { root.classList.remove("dk-pending"); }, 1500);

  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) { meta = document.createElement("meta"); meta.name = "theme-color"; document.head.appendChild(meta); }
  meta.content = PAGE;

  /* ---------- colour maths ---------- */
  function parse(c) {
    var m = /rgba?\(([^)]+)\)/.exec(c || "");
    if (!m) return null;
    var p = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 && !isNaN(p[3]) ? p[3] : 1 };
  }
  function toHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2, d = mx - mn;
    if (d) {
      s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: h, s: s, l: l };
  }
  function hsl(h, s, l, a) {
    s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r, g, b;
    if (h < 60) { r = c; g = x; b = 0; } else if (h < 120) { r = x; g = c; b = 0; } else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; } else if (h < 300) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; }
    return "rgba(" + Math.round((r + m) * 255) + "," + Math.round((g + m) * 255) + "," + Math.round((b + m) * 255) + "," + a + ")";
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* backgrounds: page #1b1b1b, every card/panel the same #2c2c2c, chips and inputs #373737 (lighter = more raised) */
  var bodyRgb = null;
  function chroma(k) { return (Math.max(k.r, k.g, k.b) - Math.min(k.r, k.g, k.b)) / 255; }
  function mapBg(c, big, tag) {
    var k = parse(c);
    if (!k || k.a === 0) return null;
    var o = toHsl(k.r, k.g, k.b), L;
    if (k.a < 1) {
      if (o.l > .6) return null;                                   /* white glass: keep */
      if (k.a >= .3) return null;                                  /* dark scrim: keep */
      return "rgba(255,255,255," + (k.a * .9).toFixed(3) + ")";    /* faint dark tint on a light surface -> faint light tint */
    }
    if (o.l >= .62) {
      if ((chroma(k) > .12 || (chroma(k) > .06 && (o.h < 22 || o.h > 60))) && o.l < .96) return hsl(o.h, Math.min(o.s, .6) * .45, .2, 1);    /* pale coloured badge: dark, same hue, softer */
      if (o.l >= .9) {
        if (tag === "BODY" || tag === "HTML") return PAGE;
        if (bodyRgb && k.r === bodyRgb.r && k.g === bodyRgb.g && k.b === bodyRgb.b) return PAGE;
        return CARD;
      }
      return CHIP;
    }
    if (o.l >= .3) return hsl(o.h, o.s * .55, clamp(o.l, .34, .46), 1);
    if (tag === "NAV") return CARD;
    if (big) return CARD;                                           /* big dark bar (header): a raised surface */
    if (o.s < .1) return "#3d3d3d";                                 /* black button -> soft grey button */
    return hsl(o.h, o.s * .5, .33, 1);                              /* green button -> muted accent */
  }

  /* text: dark text -> soft off-white, grey -> lighter grey, never pure white */
  function mapText(c) {
    var k = parse(c);
    if (!k) return null;
    var o = toHsl(k.r, k.g, k.b), L = o.l;
    if (chroma(k) > .2 && L > .25 && L < .6) return hsl(o.h, .5, .68, k.a);   /* red / coloured text stays coloured, just softer */
    if (L <= .55) L = L < .3 ? .9 : clamp(1 - L, .6, .72); else L = Math.min(L, .92);
    return hsl(o.h, o.s * .25, L, k.a);
  }

  function mapBorder(c) {
    var k = parse(c);
    if (!k || k.a === 0) return null;
    var o = toHsl(k.r, k.g, k.b);
    if (k.a < 1 || o.l > .75) return "rgba(255,255,255,.12)";
    if (o.l < .3) return hsl(o.h, o.s * .5, .55, 1);               /* selected / outlined: accent */
    return "rgba(255,255,255,.14)";
  }

  /* ---------- walking the page ---------- */
  var PROPS = ["background-color", "color", "border-top-color", "border-right-color", "border-bottom-color",
    "border-left-color", "box-shadow", "text-shadow"];
  var SKIP = ".welcome-carousel,.dk-skip,script,style,link,meta,noscript,head,title,img,video,canvas,picture,source";
  /* every product / order card gets exactly the same colour */
  var CARDSEL = "a.product-card,.product-card,.explore-product,.explore-product > a,.recommended-card,.recently-viewed-card,.cart-product,.order-card,.sk-product,.sk-store-card,.pp-block,a.pp-visit";
  var vw = window.innerWidth;

  function skipped(el) {
    try { return el.closest ? !!el.closest(SKIP) : false; } catch (e) { return false; }
  }
  function clear(el) {
    if (!el._dk) return;
    for (var i = 0; i < PROPS.length; i++) {
      var o = el._dkO && el._dkO[PROPS[i]];
      if (o) el.style.setProperty(PROPS[i], o[0], o[1]);      /* put back the page's own inline colour */
      else el.style.removeProperty(PROPS[i]);
    }
    el._dk = 0;
  }
  function list(node) {
    var out = [];
    if (node.nodeType !== 1) return out;
    out.push(node);
    var all = node.getElementsByTagName("*");
    for (var i = 0; i < all.length; i++) out.push(all[i]);
    return out;
  }

  var pass = 0;
  function process(nodes) {
    var items = [], i, el;
    pass++;
    for (i = 0; i < nodes.length; i++) {
      el = nodes[i];
      if (el.nodeType !== 1 || el.id === "dk-base") continue;
      if (el.namespaceURI !== "http://www.w3.org/1999/xhtml" && el.tagName.toLowerCase() !== "svg") continue;
      if (el._dkPass === pass) continue;                       /* same element listed twice */
      el._dkPass = pass;
      if (skipped(el)) continue;
      items.push(el);
    }
    for (i = 0; i < items.length; i++) clear(items[i]);          /* 1. undo our own colours */
    var read = [];
    for (i = 0; i < items.length; i++) {                         /* 2. read the page's real colours */
      el = items[i];
      var cs = getComputedStyle(el);
      var tag = el.tagName;
      var hasImg = cs.backgroundImage && cs.backgroundImage !== "none";
      var big = tag === "NAV" || tag === "HEADER" || tag === "FOOTER" ||
        (el.offsetWidth >= vw * .6 && el.offsetHeight >= 40 && tag !== "BUTTON" && tag !== "A" && tag !== "INPUT");
      var rec = { el: el, d: [] };
      var isCard = false;
      try { isCard = el.matches(CARDSEL); } catch (e) {}
      if (isCard && cs.backgroundColor !== "rgba(0, 0, 0, 0)") rec.d.push(["background-color", CARD]);
      else if (!hasImg) { var b = mapBg(cs.backgroundColor, big, tag); if (b) rec.d.push(["background-color", b]); }
      var t = mapText(cs.color);
      if (t) rec.d.push(["color", t]);
      var sides = ["top", "right", "bottom", "left"];
      for (var s = 0; s < 4; s++) {
        if (parseFloat(cs["border-" + sides[s] + "-width"]) > 0 && cs["border-" + sides[s] + "-style"] !== "none") {
          var bc = mapBorder(cs["border-" + sides[s] + "-color"]);
          if (bc) rec.d.push(["border-" + sides[s] + "-color", bc]);
        }
      }
      var bs = cs.boxShadow;
      if (bs && bs !== "none") {
        if (bs.indexOf("inset") > -1) {
          rec.d.push(["box-shadow", bs.replace(/rgba?\([^)]+\)/g, function (m) {
            var k = parse(m); if (!k) return m;
            var o = toHsl(k.r, k.g, k.b);
            return o.l < .3 ? hsl(o.h, o.s * .5, .55, 1) : "rgba(255,255,255,.2)";
          })]);
        } else {
          rec.d.push(["box-shadow", "none"]);                    /* depth comes from lighter surfaces, not shadows */
        }
      }
      read.push(rec);
    }
    for (i = 0; i < read.length; i++) {                          /* 3. write */
      var r = read[i];
      if (!r.el._dkO) r.el._dkO = {};
      for (var j = 0; j < r.d.length; j++) {
        var pn = r.d[j][0], st0 = r.el.style;
        if (!(pn in r.el._dkO) && st0.getPropertyValue(pn)) r.el._dkO[pn] = [st0.getPropertyValue(pn), st0.getPropertyPriority(pn)];
        st0.setProperty(pn, r.d[j][1], "important");
      }
      r.el._dk = 1;
    }
  }

  function run(nodes) {
    try { process(nodes); } catch (e) {}
  }

  var started = false, queue = [], timer = 0;
  function flush() {
    timer = 0;
    var nodes = [], seen = [];
    for (var i = 0; i < queue.length; i++) {
      var l = list(queue[i]);
      for (var j = 0; j < l.length; j++) nodes.push(l[j]);
    }
    queue = [];
    run(nodes);
  }
  function enqueue(node) {
    queue.push(node);
    if (!timer) timer = requestAnimationFrame(flush);
  }

  function start() {
    if (started) return;
    started = true;
    vw = window.innerWidth;
    var bcs = getComputedStyle(document.body).backgroundColor, bp = parse(bcs);
    if (!bp || bp.a === 0) bp = parse(getComputedStyle(root).backgroundColor);
    bodyRgb = bp && bp.a ? bp : { r: 255, g: 255, b: 255 };
    run(list(document.documentElement));
    root.classList.remove("dk-pending");
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === "childList") {
          for (var j = 0; j < m.addedNodes.length; j++) if (m.addedNodes[j].nodeType === 1) enqueue(m.addedNodes[j]);
        } else if (m.type === "attributes" && m.target.nodeType === 1) {
          enqueue(m.target);
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden"] });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
  window.addEventListener("load", function () { run(list(document.documentElement)); });
})();
