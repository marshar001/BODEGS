/* BODEGS: keeps each account's cart separate on a shared phone.
   Every page asks for "weraeCart"; this quietly turns that into "weraeCart:<signed-in email>". */
(function () {
  try {
    var P = Storage.prototype, get = P.getItem, set = P.setItem, rem = P.removeItem;
    function who() {
      try {
        var s = JSON.parse(get.call(localStorage, "sb-cdwstvsesiyvfcadyqzs-auth-token") || "null");
        var e = s && s.user && s.user.email;
        return String(e || "guest").toLowerCase();
      } catch (x) { return "guest"; }
    }
    function map(store, key) {
      if (store !== localStorage || key !== "weraeCart") return key;
      var k = "weraeCart:" + who();
      /* the old shared cart goes to the first signed-in account that opens the app, then is removed */
      try {
        var legacy = get.call(localStorage, "weraeCart");
        if (legacy !== null) {
          if (k !== "weraeCart:guest" && get.call(localStorage, k) === null) set.call(localStorage, k, legacy);
          if (k !== "weraeCart:guest") rem.call(localStorage, "weraeCart");
        }
      } catch (x) {}
      return k;
    }
    P.getItem = function (key) { return get.call(this, map(this, key)); };
    P.setItem = function (key, v) { return set.call(this, map(this, key), v); };
    P.removeItem = function (key) { return rem.call(this, map(this, key)); };
  } catch (e) {}
})();
