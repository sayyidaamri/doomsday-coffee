/* Product page + reviews (loaded after pages.js) */
(function () {
  "use strict";
  var D = document, W = window, DD = W.DD || {}, $ = DD.$, $$ = DD.$$, money = DD.money, roll = (W.DD_PAGES || {}).roll;
  if (!$) return;

  var pdp = $("[data-pdp]");
  if (pdp) {
    var gift = pdp.hasAttribute("data-gift");
    var st = { size: "6oz", grind: "Whole Bean", qty: 1, amount: 10 };
    var sub = $("[data-sub-toggle]", pdp);
    var price = function () {
      var unit = gift ? st.amount : +(st.size === "12oz" ? pdp.dataset.p12 : pdp.dataset.p6);
      var on = sub && sub.classList.contains("is-on"), each = on ? unit * 0.9 : unit;
      var tot = $("[data-price-total]", pdp), prev = tot.textContent; tot.textContent = money(each * st.qty);
      if (prev !== tot.textContent && roll) roll(tot, parseFloat(prev.slice(1)) < each * st.qty);
      var cmp = $("[data-price-compare]", pdp), off = $("[data-price-off]", pdp);
      if (cmp) { cmp.hidden = !on; cmp.textContent = money(unit * st.qty); }
      if (off) off.hidden = !on;
    };
    pdp.addEventListener("click", function (e) {
      var s = e.target.closest("[data-pdp-size]");
      if (s) { st.size = s.dataset.pdpSize; $$("[data-pdp-size]", pdp).forEach(function (x) { x.classList.toggle("is-active", x === s); }); price(); }
      var g = e.target.closest("[data-pdp-grind]");
      if (g) { st.grind = g.dataset.pdpGrind; $$("[data-pdp-grind]", pdp).forEach(function (x) { x.classList.toggle("is-active", x === g); x.setAttribute("aria-pressed", x === g); }); }
      var a = e.target.closest("[data-gift-amt]");
      if (a) {
        st.amount = +a.dataset.giftAmt; $$("[data-gift-amt]", pdp).forEach(function (x) { x.classList.toggle("is-active", x === a); });
        var v = $("[data-gift-val]", pdp); v.textContent = "$" + st.amount;
        v.animate([{ transform: "scale(1.3) rotate(-6deg)" }, { transform: "none" }], { duration: 400, easing: "cubic-bezier(.34,1.45,.55,1)" }); price();
      }
      var q = e.target.closest("[data-qty]");
      if (q) { var d = +q.dataset.qty; st.qty = Math.max(1, Math.min(20, st.qty + d)); var qv = $("[data-qty-value]", pdp); qv.textContent = st.qty; roll && roll(qv, d > 0); price(); }
      var add = e.target.closest("[data-pdp-add]");
      if (add) {
        var on = sub && sub.classList.contains("is-on"), fq = sub ? $("[data-freq].is-active", sub) : null;
        DD.addToCart(gift ? { slug: "gift-card", amount: st.amount, qty: st.qty, size: "6oz" } : { slug: pdp.dataset.slug, size: st.size, grind: st.grind, qty: st.qty, sub: on, freq: fq ? fq.dataset.freq : "4 weeks" });
        DD.flashAdded(add);
      }
    });
    if (sub) sub.addEventListener("sub:change", price);
  }

  /* video lightbox: autoplay muted on open, pause on close */
  $$(".lightbox[data-modal]").forEach(function (vm) {
    var v = $("video", vm); if (!v) return;
    vm.addEventListener("modal:open", function () { v.muted = true; v.play().catch(function () {}); });
    new MutationObserver(function () { if (vm.hidden) v.pause(); }).observe(vm, { attributes: true, attributeFilter: ["hidden"] });
  });

  /* reviews paging */
  $$("[data-reviews]").forEach(function (sec) {
    var cards = $$("[data-rev-card]", sec); if (!cards.length) return;
    var per = +(sec.dataset.perPage || 3), pages = Math.ceil(cards.length / per), pg = 0;
    var show = function () { cards.forEach(function (c, i) { c.hidden = Math.floor(i / per) !== pg; }); var l = $("[data-rev-page]", sec); if (l) l.textContent = pg + 1 + " / " + pages; };
    sec.addEventListener("click", function (e) {
      if (e.target.closest("[data-rev-prev]")) { pg = (pg - 1 + pages) % pages; show(); }
      if (e.target.closest("[data-rev-next]")) { pg = (pg + 1) % pages; show(); }
    });
  });
  D.addEventListener("click", function (e) {
    var s = e.target.closest("[data-star]"); if (!s) return;
    var n = +s.dataset.star; $$("[data-star]", s.parentElement).forEach(function (x) { x.classList.toggle("is-on", +x.dataset.star <= n); });
  });
  var f = $("[data-rev-form]");
  if (f) f.addEventListener("submit", function () {
    setTimeout(function () {
      if ($(".is-invalid", f)) return;
      var m = f.closest("[data-modal]"); m.hidden = true; DD.lockScroll(false);
      var done = $("[data-rev-done]"); if (done) done.hidden = false; f.reset();
    }, 0);
  }, true);
})();
