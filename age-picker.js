/* age-picker.js: a draggable ruler for choosing an age (used on the sign-up screens).

   Usage:
     var picker = AgePicker.create(document.getElementById("agePicker"), { min: 13, max: 90, value: 25 });
     picker.get()    -> the chosen age (number)
     picker.isSet()  -> true once the person has moved the ruler
     picker.set(30)  -> jump to an age

   Colours can be changed on the container with CSS variables:
     --ap-bg (card), --ap-fg (text), --ap-accent (needle)
*/
(function () {
  var STEP = 12; // width of one year on the ruler, in px

  var CSS = [
    ".ap { background: var(--ap-bg, #14181c); color: var(--ap-fg, #fff); border-radius: 22px; padding: 16px 0 14px; text-align: center; font-family: Roboto, 'Segoe UI', Arial, sans-serif; user-select: none; -webkit-user-select: none; }",
    ".ap-q { font-size: 15px; font-weight: 500; opacity: .85; }",
    ".ap-num { height: 64px; margin-top: 6px; display: flex; align-items: center; justify-content: center; }",
    ".ap-val { font-size: 56px; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: 0; transition: filter .12s ease, opacity .12s ease, transform .12s ease; }",
    ".ap-val.ap-blur { filter: blur(3px); opacity: .55; transform: translateY(2px); }",
    ".ap.ap-untouched .ap-val { opacity: .5; }",
    ".ap-unit { margin-top: 2px; font-size: 12px; opacity: .6; }",
    ".ap-rule { position: relative; margin-top: 12px; height: 54px; }",
    ".ap-scroll { height: 100%; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain; touch-action: pan-x; outline: none;",
    "  -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 18%, #000 82%, transparent 100%); mask-image: linear-gradient(90deg, transparent 0, #000 18%, #000 82%, transparent 100%); }",
    ".ap-scroll::-webkit-scrollbar { display: none; }",
    ".ap-track { display: flex; width: max-content; padding: 0 calc(50% - " + (STEP / 2) + "px); }",
    ".ap-t { position: relative; flex: none; width: " + STEP + "px; height: 54px; scroll-snap-align: center; }",
    ".ap-t::before { content: ''; position: absolute; left: 50%; top: 4px; width: 1.5px; height: 14px; margin-left: -.75px; background: var(--ap-fg, #fff); opacity: .32; border-radius: 1px; }",
    ".ap-t.ap-5::before { height: 22px; opacity: .55; }",
    ".ap-t.ap-10::before { height: 26px; opacity: .8; }",
    ".ap-t.ap-10::after { content: attr(data-n); position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); font-size: 11px; opacity: .6; }",
    ".ap-needle { position: absolute; left: 50%; top: 0; width: 3px; height: 32px; margin-left: -1.5px; background: var(--ap-accent, #e8590c); border-radius: 2px; pointer-events: none; box-shadow: 0 0 8px rgba(232, 89, 12, .55); }",
    ".ap-hint { margin-top: 8px; font-size: 12px; opacity: .6; }",
    ".ap:not(.ap-untouched) .ap-hint { visibility: hidden; }"
  ].join("\n");

  function injectCss() {
    if (document.getElementById("ap-css")) { return; }
    var style = document.createElement("style");
    style.id = "ap-css";
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function create(host, options) {
    injectCss();
    var min = (options && options.min) || 13;
    var max = (options && options.max) || 90;
    var value = Math.min(max, Math.max(min, (options && options.value) || 25));
    var onChange = (options && options.onChange) || function () {};
    var touched = false;
    var quiet = 0; // > 0 while we move the ruler ourselves

    host.textContent = "";
    var box = document.createElement("div");
    box.className = "ap ap-untouched";

    var q = document.createElement("div");
    q.className = "ap-q";
    q.textContent = (options && options.question) || "How old are you?";

    var numWrap = document.createElement("div");
    numWrap.className = "ap-num";
    var num = document.createElement("span");
    num.className = "ap-val";
    num.setAttribute("aria-live", "polite");
    numWrap.appendChild(num);

    var unit = document.createElement("div");
    unit.className = "ap-unit";
    unit.textContent = "years old";

    var rule = document.createElement("div");
    rule.className = "ap-rule";
    var scroll = document.createElement("div");
    scroll.className = "ap-scroll";
    scroll.tabIndex = 0;
    scroll.setAttribute("role", "slider");
    scroll.setAttribute("aria-label", "Your age");
    scroll.setAttribute("aria-valuemin", String(min));
    scroll.setAttribute("aria-valuemax", String(max));
    var track = document.createElement("div");
    track.className = "ap-track";
    for (var age = min; age <= max; age++) {
      var tick = document.createElement("span");
      tick.className = "ap-t" + (age % 10 === 0 ? " ap-10" : age % 5 === 0 ? " ap-5" : "");
      if (age % 10 === 0) { tick.setAttribute("data-n", String(age)); }
      track.appendChild(tick);
    }
    scroll.appendChild(track);
    var needle = document.createElement("i");
    needle.className = "ap-needle";
    rule.appendChild(scroll);
    rule.appendChild(needle);

    var hint = document.createElement("div");
    hint.className = "ap-hint";
    hint.textContent = (options && options.hint) || "Slide to set your age";

    box.appendChild(q);
    box.appendChild(numWrap);
    box.appendChild(unit);
    box.appendChild(rule);
    box.appendChild(hint);
    host.appendChild(box);

    function show() {
      num.textContent = String(value);
      scroll.setAttribute("aria-valuenow", String(value));
    }

    var blurTimer = 0;
    function pulse() {
      num.classList.add("ap-blur");
      clearTimeout(blurTimer);
      blurTimer = setTimeout(function () { num.classList.remove("ap-blur"); }, 110);
    }

    function moveTo(v, smooth) {
      quiet++;
      scroll.scrollTo({ left: (v - min) * STEP, behavior: smooth ? "smooth" : "auto" });
      setTimeout(function () { quiet = Math.max(0, quiet - 1); }, smooth ? 450 : 80);
    }

    function setValue(v, fromUser) {
      v = Math.min(max, Math.max(min, v));
      if (v === value && (touched || !fromUser)) { return; }
      var changed = v !== value;
      value = v;
      show();
      if (changed) {
        pulse();
        if (fromUser && navigator.vibrate) { try { navigator.vibrate(6); } catch (e) {} }
      }
      if (fromUser && !touched) {
        touched = true;
        box.classList.remove("ap-untouched");
      }
      onChange(value, touched);
    }

    scroll.addEventListener("scroll", function () {
      if (quiet > 0) { return; }
      setValue(min + Math.round(scroll.scrollLeft / STEP), true);
    }, { passive: true });

    scroll.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setValue(value - 1, true); moveTo(value, true); }
      if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setValue(value + 1, true); moveTo(value, true); }
    });

    // mouse users: drag the ruler (phones use normal touch scrolling)
    var drag = null;
    scroll.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") { return; }
      drag = { x: e.clientX, left: scroll.scrollLeft };
      scroll.style.scrollSnapType = "none";
      scroll.setPointerCapture(e.pointerId);
    });
    scroll.addEventListener("pointermove", function (e) {
      if (drag) { scroll.scrollLeft = drag.left - (e.clientX - drag.x); }
    });
    function endDrag() {
      if (!drag) { return; }
      drag = null;
      scroll.style.scrollSnapType = "";
      moveTo(value, true);
    }
    scroll.addEventListener("pointerup", endDrag);
    scroll.addEventListener("pointercancel", endDrag);

    // The ruler can only be positioned while it is visible (the sign-up box starts hidden).
    function place() { moveTo(value, false); }
    var placed = false;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !placed && scroll.clientWidth > 0) {
            placed = true;
            place();
          }
        });
      }).observe(scroll);
    }
    show();
    if (scroll.clientWidth > 0) { placed = true; place(); }

    return {
      get: function () { return value; },
      isSet: function () { return touched; },
      set: function (v) { value = Math.min(max, Math.max(min, v)); show(); moveTo(value, false); },
      refresh: function () { moveTo(value, false); },
      reset: function () {
        touched = false;
        box.classList.add("ap-untouched");
      }
    };
  }

  window.AgePicker = { create: create };
})();
