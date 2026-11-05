/* BODEGS bottom navigation: one shared, redesigned bar for every page.
   Replaces whatever bar the page had. Add <script src="nav.js"></script> before </body>. */
(function () {
  "use strict";

  var TABS = [
    { id: "home",    href: "index.html",   label: "Home",
      icon: '<path d="M4 10.6 12 4l8 6.6V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19v-8.4Z"></path><path d="M9.5 20.6v-5.4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5.4"></path>' },
    { id: "explore", href: "explore.html", label: "Explore",
      icon: '<circle cx="11" cy="11" r="6.6"></circle><path d="m16.2 16.2 4 4"></path>' },
    { id: "cart",    href: "cart.html",    label: "Cart",
      icon: '<path d="M6.2 8.4h11.6l.9 11a1.2 1.2 0 0 1-1.2 1.3H6.5a1.2 1.2 0 0 1-1.2-1.3l.9-11Z"></path><path d="M9 10.6V7.8a3 3 0 0 1 6 0v2.8"></path>' },
    { id: "orders",  href: "orders.html",  label: "Orders",
      icon: '<path d="M6.7 3.8h10.6A1.7 1.7 0 0 1 19 5.5v14.7l-2.33-1.5-2.34 1.5-2.33-1.5-2.33 1.5-2.34-1.5L5 20.2V5.5a1.7 1.7 0 0 1 1.7-1.7Z"></path><path d="M8.6 9h6.8M8.6 12.6h6.8"></path>' },
    { id: "profile", href: "profile.html", label: "Profile",
      icon: '<circle cx="12" cy="8.2" r="3.7"></circle><path d="M4.8 20.2c.7-3.6 3.6-5.6 7.2-5.6s6.5 2 7.2 5.6"></path>' }
  ];

  var CSS = [
    "nav.bottom-nav{position:fixed;left:14px;right:14px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:1000;height:68px;padding:0;margin:0;display:block;border-radius:28px;corner-shape:squircle;background:linear-gradient(180deg,#1c473c 0%,#143329 100%);box-shadow:0 14px 32px rgba(8,28,22,.34),0 2px 0 rgba(255,255,255,.07) inset,0 0 0 1px rgba(255,255,255,.05);max-width:520px;margin-left:auto;margin-right:auto;-webkit-tap-highlight-color:transparent}",
    "nav.bottom-nav .bn-wrap{position:relative;display:grid;grid-template-columns:repeat(5,1fr);height:100%;padding:0 6px}",
    "nav.bottom-nav .bn-pill{position:absolute;top:8px;bottom:8px;left:6px;width:calc((100% - 12px) / 5);pointer-events:none}",
    "nav.bottom-nav .bn-pill i{position:absolute;inset:0 4px;border-radius:21px;corner-shape:squircle;background:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,.1));box-shadow:0 0 0 1px rgba(255,255,255,.08) inset,0 6px 14px rgba(0,0,0,.16)}",
    "nav.bottom-nav .bn-pill.go{transition:transform .42s cubic-bezier(.34,1.32,.5,1)}",
    "nav.bottom-nav a.nav-item{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;height:100%;width:auto;padding:0;border:0;border-radius:22px;background:transparent;color:rgba(235,244,240,.6);font:600 10.5px/1 Roboto,'Segoe UI',Arial,sans-serif;letter-spacing:.2px;text-decoration:none;transition:color .25s ease,transform .15s ease}",
    "nav.bottom-nav a.nav-item:active{transform:scale(.93)}",
    "nav.bottom-nav a.nav-item.active{background:transparent;color:#fff}",
    "nav.bottom-nav a.nav-item svg{width:24px;height:24px;display:block;fill:none;stroke:currentColor;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round;transition:transform .35s cubic-bezier(.34,1.5,.5,1),fill-opacity .25s ease}",
    "nav.bottom-nav a.nav-item.active svg{fill:currentColor;fill-opacity:.2;stroke-width:1.9;transform:translateY(-1px) scale(1.08)}",
    "nav.bottom-nav a.nav-item span.bn-label{display:block}",
    "nav.bottom-nav .bn-badge{position:absolute;top:9px;left:calc(50% + 6px);min-width:17px;height:17px;padding:0 4px;box-sizing:border-box;border-radius:9px;background:#f2b8a2;color:#3a1a12;font:800 10px/17px Roboto,'Segoe UI',Arial,sans-serif;text-align:center;box-shadow:0 0 0 2px #17382e}",
    "@media (prefers-reduced-motion:reduce){nav.bottom-nav .bn-pill.go,nav.bottom-nav a.nav-item svg{transition:none}}"
  ].join("\n");

  function current() {
    var f = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (f === "" || f === "index.html") { return 0; }
    for (var i = 0; i < TABS.length; i++) { if (TABS[i].href === f) { return i; } }
    if (f === "checkout.html") { return 2; }
    return -1;
  }

  function cartCount() {
    try {
      return JSON.parse(localStorage.getItem("weraeCart") || "[]")
        .reduce(function (t, i) { return t + Number(i.quantity || 1); }, 0);
    } catch (e) { return 0; }
  }

  function build() {
    if (!document.getElementById("bn-css")) {
      var st = document.createElement("style");
      st.id = "bn-css";
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var nav = document.querySelector("nav.bottom-nav");
    if (!nav) { nav = document.createElement("nav"); nav.className = "bottom-nav"; document.body.appendChild(nav); }
    nav.setAttribute("aria-label", "Main");
    nav.textContent = "";

    var cur = current();
    var wrap = document.createElement("div");
    wrap.className = "bn-wrap";

    var pill = document.createElement("div");
    pill.className = "bn-pill";
    pill.innerHTML = "<i></i>";
    pill.hidden = cur < 0;
    wrap.appendChild(pill);

    TABS.forEach(function (t, i) {
      var a = document.createElement("a");
      a.className = "nav-item" + (i === cur ? " active" : "");
      a.href = t.href;
      if (i === cur) { a.setAttribute("aria-current", "page"); }
      a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + t.icon + '</svg><span class="bn-label">' + t.label + "</span>";
      wrap.appendChild(a);
    });

    var n = cartCount();
    if (n > 0) {
      var b = document.createElement("span");
      b.className = "bn-badge";
      b.style.left = "calc(" + (2 * 20 + 10) + "% + 8px)";
      b.textContent = n > 99 ? "99+" : String(n);
      wrap.appendChild(b);
    }
    nav.appendChild(wrap);

    // the highlight starts where the last page left it, then glides to this tab
    var prev = cur;
    try { var p = sessionStorage.getItem("bodegsNavPrev"); if (p !== null && p !== "") { prev = Number(p); } } catch (e) {}
    if (cur >= 0) {
      pill.style.transform = "translateX(" + (prev * 100) + "%)";
      pill.getBoundingClientRect();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          pill.classList.add("go");
          pill.style.transform = "translateX(" + (cur * 100) + "%)";
        });
      });
      try { sessionStorage.setItem("bodegsNavPrev", String(cur)); } catch (e) {}
    }
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", build); }
  else { build(); }
})();
