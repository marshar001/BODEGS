/* BODEGS: small "add to cart" button on every product card.
   Works on any page that has product cards (home, category, explore, store, product).
   Needs products.js on the page. Products that need a size open their page instead. */
(function () {
  "use strict";
  if (window.__bodegsCardCart) { return; }
  window.__bodegsCardCart = true;

  var css = [
    ".product-card > small:first-of-type{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;overflow:hidden}",
    ".cc-foot{display:flex;align-items:center;justify-content:space-between;gap:6px;margin:2px 3px 3px;min-height:34px}",
    ".cc-foot small{margin:0 !important;min-width:0}",
    ".cc-btn{flex:none;margin-left:auto;width:32px;height:32px;margin:0;padding:0;border:0;border-radius:11px;corner-shape:squircle;background:#f1efe9;color:#111;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent}",
    ".cc-btn svg{width:21px;height:21px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}",
    ".cc-btn:active{transform:scale(.92)}",
    ".cc-btn.cc-ok{background:#173b32;color:#fff}",
    ".cc-toast{position:fixed;left:50%;bottom:calc(86px + env(safe-area-inset-bottom));z-index:4000;transform:translate(-50%,12px);opacity:0;padding:11px 18px;border-radius:14px;background:#111;color:#fff;font:600 14px Roboto,'Segoe UI',Arial,sans-serif;transition:opacity .2s,transform .2s;pointer-events:none;max-width:86vw;text-align:center}",
    ".cc-toast.on{opacity:1;transform:translate(-50%,0)}"
  ].join("\n");
  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  var ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2.2l2 11h9.6l2-8H7"></path><circle cx="9.5" cy="19" r="1.2"></circle><circle cx="16.5" cy="19" r="1.2"></circle><path d="M12 8.2v4M10 10.2h4"></path></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>';

  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "cc-toast"; document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("on"); }, 1700);
  }

  function getCart() { try { return JSON.parse(localStorage.getItem("weraeCart") || "[]"); } catch (e) { return []; } }

  function findProduct(id) {
    try {
      if (window.BODEGS && window.BODEGS.getAllProducts) {
        var all = window.BODEGS.getAllProducts();
        for (var i = 0; i < all.length; i++) { if (String(all[i].id) === String(id)) { return all[i]; } }
      }
    } catch (e) {}
    return null;
  }

  function idOf(card) {
    var href = card.getAttribute("href") || "";
    var m = href.match(/[?&]id=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  function add(card, btn) {
    var id = idOf(card);
    var p = findProduct(id);
    if (!p) { location.href = card.href; return; }
    if (Array.isArray(p.sizes) && p.sizes.length) {
      toast("Choose a size first");
      setTimeout(function () { location.href = card.href; }, 450);
      return;
    }
    var stock = Number(p.inventory);
    var has = p.inventory !== undefined && p.inventory !== null && isFinite(stock);
    var cart = getCart();
    var ex = cart.filter(function (i) { return String(i.productId) === String(p.id); })[0];
    if (ex) { ex.quantity = Math.min(Number(ex.quantity || 1) + 1, has && stock > 0 ? stock : 99); }
    else {
      cart.push({
        productId: p.id, sellerId: p.sellerId, sellerName: p.sellerName || "",
        name: p.name, price: Number(p.price), numericPrice: Number(p.price),
        currency: p.currency || "NGN", image: (p.images && p.images[0]) || "",
        url: "product.html?id=" + encodeURIComponent(p.id), size: "", color: "", quantity: 1
      });
    }
    try { localStorage.setItem("weraeCart", JSON.stringify(cart)); } catch (e) {}
    btn.classList.add("cc-ok");
    btn.innerHTML = CHECK;
    setTimeout(function () { btn.classList.remove("cc-ok"); btn.innerHTML = ICON; }, 1100);
    toast("Added to cart");
  }

  function decorate(card) {
    if (card.__cc || card.tagName !== "A" || !idOf(card)) { return; }
    var price = card.querySelector("p");
    if (!price) { return; }          // card not filled yet
    card.__cc = true;
    var p = findProduct(idOf(card));
    if (p && p.inventory !== undefined && p.inventory !== null && isFinite(Number(p.inventory)) && Number(p.inventory) <= 0) { return; }
    var parent = price.parentNode;
    var row = document.createElement("div");
    row.className = "cc-foot";
    var smalls = parent.querySelectorAll(":scope > small");
    for (var k = 0; k < smalls.length; k++) {
      if (/verified/i.test(smalls[k].textContent) && smalls[k] !== parent.querySelector(":scope > small:first-of-type") || (smalls.length === 1 && /^\W*BODEGS verified/i.test(smalls[k].textContent))) { row.appendChild(smalls[k]); }
    }
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cc-btn";
    btn.setAttribute("aria-label", "Add to cart");
    btn.innerHTML = ICON;
    btn.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); add(card, btn); });
    row.appendChild(btn);
    parent.appendChild(row);
  }

  function scan() {
    var cards = document.querySelectorAll("a.product-card, .explore-product > a");
    for (var i = 0; i < cards.length; i++) { decorate(cards[i]); }
  }

  var pending = false;
  new MutationObserver(function () {
    if (pending) { return; }
    pending = true;
    setTimeout(function () { pending = false; scan(); }, 60);
  }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState !== "loading") { scan(); } else { document.addEventListener("DOMContentLoaded", scan); }
})();
