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
    "nav.bottom-nav{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:2147483000;height:64px;padding:0;margin:0 auto;display:block;border-radius:26px;background:var(--deep-green,#173b32);box-shadow:0 12px 30px rgba(0,0,0,.18);max-width:520px;-webkit-tap-highlight-color:transparent}",
    "nav.bottom-nav .bn-wrap{position:relative;display:grid;grid-template-columns:repeat(5,1fr);align-items:center;height:100%;padding:0 6px}",
    "nav.bottom-nav .bn-pill{position:absolute;top:6px;bottom:6px;left:6px;width:calc((100% - 12px) / 5);pointer-events:none}",
    "nav.bottom-nav .bn-pill i{position:absolute;inset:0;border-radius:22px;background:rgba(255,255,255,.18)}",
    "nav.bottom-nav .bn-pill.go{transition:transform .42s cubic-bezier(.34,1.32,.5,1)}",
    "nav.bottom-nav a.nav-item{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;height:52px;width:100%;padding:0;border:0;border-radius:22px;background:transparent;color:rgba(255,255,255,.65);font-family:Arial,sans-serif;font-size:10px;font-weight:400;letter-spacing:0;text-decoration:none;transition:color .25s ease,transform .15s ease}",
    "nav.bottom-nav a.nav-item:active{transform:scale(.95)}",
    "nav.bottom-nav a.nav-item.active{background:transparent;color:#fff;font-weight:600}",
    "nav.bottom-nav a.nav-item svg{width:22px;height:22px;display:block;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}",
    "nav.bottom-nav a.nav-item span.bn-label{display:block;line-height:1.2}",
    "nav.bottom-nav .bn-badge{position:absolute;top:8px;min-width:16px;height:16px;padding:0 4px;box-sizing:border-box;border-radius:8px;background:#fff;color:#173b32;font:700 10px/16px Arial,sans-serif;text-align:center}",
    "body:has(#bodegsSplash) nav.bottom-nav{z-index:1000}",
    "@media (prefers-reduced-motion:reduce){nav.bottom-nav .bn-pill.go{transition:none}}"
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
      b.style.left = "calc(50% + 6px)";
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

  /* If this account was deleted in the last 30 days, offer to bring it back (checked once per visit). */
  function checkDeletion() {
    try {
      if (typeof sb === "undefined" || !sb.auth || !sb.rpc) return;
      sb.auth.getSession().then(function (r) {
        var u = r && r.data && r.data.session && r.data.session.user;
        if (!u) return;
        var key = "bodegsDelOk:" + u.id + ":" + (u.last_sign_in_at || "");
        try { if (sessionStorage.getItem(key)) return; } catch (e) {}
        sb.rpc("my_deletion_status").then(function (res) {
          if (res.error) return;
          if (!res.data) { try { sessionStorage.setItem(key, "1"); } catch (e) {} return; }
          ask(new Date(res.data), key);
        });
      });
    } catch (e) {}
  }

  function ask(when, key) {
    var dark = false;
    try { dark = window.BODEGSTheme && window.BODEGSTheme.isDark(); } catch (e) {}
    var back = document.createElement("div");
    back.className = "dk-skip";
    back.style.cssText = "position:fixed;inset:0;z-index:2147483600;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:24px;font-family:Arial,sans-serif";
    var box = document.createElement("div");
    box.className = "dk-skip";
    box.style.cssText = "width:100%;max-width:340px;border-radius:22px;padding:22px;text-align:center;background:" + (dark ? "#2c2c2c" : "#fff") + ";color:" + (dark ? "#f2f2f2" : "#1d1d1d");
    var date = when.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    box.innerHTML = '<div style="font-size:18px;font-weight:700;margin-bottom:8px">Restore your account?</div>' +
      '<div style="font-size:14px;line-height:1.5;opacity:.8;margin-bottom:18px">This account is set to be deleted on ' + date + '. Restore it to keep your account.</div>';
    function btn(text, main) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = text;
      b.style.cssText = "display:block;width:100%;border:0;border-radius:14px;padding:13px;margin-top:8px;font-size:15px;font-weight:700;cursor:pointer;background:" + (main ? "#173b32" : (dark ? "#3d3d3d" : "#eee")) + ";color:" + (main ? "#fff" : (dark ? "#f2f2f2" : "#1d1d1d"));
      return b;
    }
    var yes = btn("Restore account", true), no = btn("Keep it deleted", false);
    yes.onclick = function () {
      yes.disabled = true;
      sb.rpc("restore_my_account").then(function (r) {
        if (r.error) { yes.disabled = false; yes.textContent = "Try again"; return; }
        try { sessionStorage.setItem(key, "1"); } catch (e) {}
        back.remove();
      });
    };
    no.onclick = function () {
      sb.auth.signOut().then(function () { try { localStorage.removeItem("weraeUser"); } catch (e) {} location.href = "index.html"; });
    };
    box.appendChild(yes); box.appendChild(no); back.appendChild(box);
    document.body.appendChild(back);
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", checkDeletion); }
  else { checkDeletion(); }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", build); }
  else { build(); }
})();
