/* BODEGS prices for the cart and checkout.
   The buyer pays the selling price of the items plus a service fee shown on its own line.
   The real amounts are always worked out again on the server when the order is placed. */
(function () {
  var P = { feePercent: 15 };

  function money(n) {
    n = Number(n) || 0;
    var whole = Math.abs(n - Math.round(n)) < 0.005;
    return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
  }
  function r2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }

  /* Price the buyer pays for one item right now. */
  P.sell = function (row) {
    var base = Number(row.price_ngn) || 0;
    var ref = row.reference_price != null ? Number(row.reference_price) : base;
    var d = Number(row.discount_percent) || 0;
    var now = Date.now();
    var on = d > 0 && row.promo_start && row.promo_end &&
             now >= new Date(row.promo_start).getTime() && now <= new Date(row.promo_end).getTime();
    return on ? r2(ref * (1 - d / 100)) : ref;
  };

  /* lines: [{price, quantity}] -> { items, fee, total } */
  P.totals = function (lines) {
    var items = 0, fee = 0;
    lines.forEach(function (l) {
      var q = Number(l.quantity) || 1, p = Number(l.price) || 0;
      items += r2(p * q);
      fee += r2(p * q * P.feePercent / 100);
    });
    items = r2(items); fee = r2(fee);
    return { items: items, fee: fee, total: r2(items + fee) };
  };
  P.money = money;

  /* Refreshes the saved cart with today's prices. Resolves true when something changed. */
  P.syncCart = function (key) {
    key = key || "weraeCart";
    return new Promise(function (resolve) {
      try {
        if (typeof sb === "undefined") { return resolve(false); }
        var cart = JSON.parse(localStorage.getItem(key) || "[]");
        if (!cart.length) { return resolve(false); }
        var ids = cart.map(function (i) { return i.productId; });
        var changed = false;
        var feeDone = sb.rpc("pricing_settings").then(function (r) {
          var f = r && r.data && Number(r.data.buyer_fee_percent);
          if (isFinite(f) && f >= 0 && f !== P.feePercent) { P.feePercent = f; changed = true; }
        }, function () {});
        var priceDone = sb.from("products")
          .select("id, price_ngn, reference_price, discount_percent, promo_start, promo_end")
          .in("id", ids).then(function (res) {
            if (res.error || !res.data) { return; }
            var map = {};
            res.data.forEach(function (r) { map[String(r.id)] = P.sell(r); });
            cart.forEach(function (i) {
              var np = map[String(i.productId)];
              if (np != null && Number(i.numericPrice) !== np) { i.numericPrice = np; i.price = np; changed = true; }
            });
            if (changed) { localStorage.setItem(key, JSON.stringify(cart)); }
          }, function () {});
        Promise.all([feeDone, priceDone]).then(function () { resolve(changed); }, function () { resolve(false); });
      } catch (e) { resolve(false); }
    });
  };
  window.BODEGSPrice = P;
})();
