/* Page-specific behaviour (shop, product, info pages, 404 game). Loaded after main.js. */
(function () {
  "use strict";
  var D = document, W = window, DD = W.DD || {};
  var $ = DD.$, $$ = DD.$$, money = DD.money, RM = DD.RM, ROOT = D.body.dataset.root || "";
  if (!$) return;
  var roll = function (el, up) { if (!el) return; el.classList.remove("is-roll-up", "is-roll-down"); void el.offsetWidth; el.classList.add(up ? "is-roll-up" : "is-roll-down"); };

  /* ---------- roast card size toggles ---------- */
  D.addEventListener("click", function (e) {
    var b = e.target.closest("[data-card-size]"); if (!b) return;
    var card = b.closest("[data-card]"); if (!card) return;
    $$("[data-card-size]", card).forEach(function (x) { x.classList.toggle("is-active", x === b); });
    var s = b.dataset.cardSize; card.dataset.size = s;
    var pr = $("[data-card-price]", card); if (pr) { pr.textContent = money(+(s === "12oz" ? pr.dataset.p12 : pr.dataset.p6)); roll(pr, s === "12oz"); }
    var was = $("[data-card-was]", card); if (was) was.textContent = money(+(s === "12oz" ? was.dataset.w12 : was.dataset.w6));
  });

  /* ---------- roast filters ---------- */
  $$("[data-filters]").forEach(function (f) {
    var row = f.closest("section").querySelector("[data-row]"), empty = f.closest("section").querySelector("[data-filters-empty]");
    f.addEventListener("click", function (e) {
      var b = e.target.closest("[data-filter]"); if (!b) return;
      $$("[data-filter]", f).forEach(function (x) { x.classList.toggle("is-active", x === b); });
      var k = b.dataset.filter, shown = 0;
      $$(".rc", row).forEach(function (c, i) { var on = k === "all" || c.dataset.level === k; c.classList.toggle("is-filtered", !on); if (on) { shown++; c.classList.remove("is-entering"); void c.offsetWidth; c.style.animationDelay = shown * 40 + "ms"; c.classList.add("is-entering"); } });
      if (empty) empty.hidden = shown > 0;
      row.scrollTo({ left: 0, behavior: "smooth" });
      row.dispatchEvent(new Event("scroll"));
    });
  });

  /* ---------- quiz ---------- */
  var quiz = $("#quiz");
  if (quiz) {
    var step = function (n) { $$("[data-quiz-step]", quiz).forEach(function (s) { s.hidden = s.dataset.quizStep !== String(n); }); };
    quiz.addEventListener("modal:open", function () { step(1); });
    quiz.addEventListener("click", function (e) {
      if (e.target.closest("[data-quiz-a1]")) step(2);
      var a = e.target.closest("[data-quiz-a2]");
      if (a) {
        var tpl = $("[data-quiz-cards]", quiz).content, card = tpl.querySelector('[data-for="' + a.dataset.quizA2 + '"]');
        $("[data-quiz-result]", quiz).innerHTML = card ? card.innerHTML : ""; step(3);
      }
      if (e.target.closest("[data-quiz-retake]")) step(1);
    });
  }

  /* ---------- bundle hero ring ---------- */
  $$("[data-bhero]").forEach(function (sec) {
    var stages = $$("[data-bh-stage]", sec), i = 0, busy = false, plan = "sub", freq = "Every 2 weeks";
    var names = ["Dark Roast Bundle", "Light Roast Bundle", "Crowd Pleaser Bundle"], slugs = ["dark-roast-bundle", "light-roast-bundle", "crowd-pleaser-bundle"];
    var contents = stages.map(function (s) { return $$("img", s).map(function (im) { return im.alt; }); });
    var cat = (W.DD_CATALOG || {}).roasts || [];
    function nm(src) { var m = /bag-([\w-]+)\.png/.exec(src); var r = cat.filter(function (x) { return m && x.slug === m[1]; })[0]; return r ? r.name : ""; }
    function go(dir) {
      if (busy || RM) { i = (i + dir + stages.length) % stages.length; stages.forEach(function (s, k) { s.classList.toggle("is-on", k === i); }); cap(); return; }
      busy = true; var from = stages[i]; i = (i + dir + stages.length) % stages.length; var to = stages[i];
      [from, to].forEach(function (s) { s.classList.toggle("is-back", dir < 0); });
      from.classList.add("is-leaving"); from.classList.remove("is-on"); to.classList.add("is-on", "is-entering");
      var c = $("[data-bh-cap]", sec); c.classList.remove("is-roll"); void c.offsetWidth; c.classList.add("is-roll"); setTimeout(cap, 500);
      setTimeout(function () { from.classList.remove("is-leaving"); to.classList.remove("is-entering"); busy = false; }, 1500);
    }
    function cap() {
      $("[data-bh-num]", sec).textContent = i + 1; $("[data-bh-name]", sec).textContent = names[i] || "";
      var imgs = $$("img", stages[i]); $("[data-bh-contents]", sec).textContent = [imgs[2], imgs[0], imgs[1]].map(function (im) { return nm(im.src); }).join(" · ");
    }
    function prices() {
      var base = 66, once = base * 0.9, sub = base * 0.85;
      $("[data-bh-once]", sec).textContent = money(once); $("[data-bh-subp]", sec).textContent = money(sub);
      var now = plan === "sub" ? sub : once; $("[data-bh-now]", sec).textContent = money(now); $("[data-bh-was]", sec).textContent = money(base);
      $("[data-bh-off]", sec).textContent = plan === "sub" ? "15% off" : "10% off"; $("[data-bh-add-label]", sec).textContent = plan === "sub" ? "Subscribe" : "Add to cart";
    }
    sec.addEventListener("click", function (e) {
      if (e.target.closest("[data-bh-prev]")) return go(-1);
      if (e.target.closest("[data-bh-next]")) return go(1);
      if (e.target.closest(".bhero__ring-stage")) return go(1);
      var f = e.target.closest("[data-bh-freq]"); if (f) { freq = f.dataset.bhFreq; $$("[data-bh-freq]", sec).forEach(function (x) { x.classList.toggle("is-active", x === f); }); }
      var p = e.target.closest("[data-bh-plan]"); if (p) { plan = p.dataset.bhPlan; $$("[data-bh-plan]", sec).forEach(function (x) { x.classList.toggle("is-active", x === p); }); prices(); }
      var a = e.target.closest("[data-bh-add]"); if (a) { DD.addToCart({ slug: slugs[i], size: "12oz", sub: plan === "sub", freq: freq.replace("Every ", "") }); DD.flashAdded(a); }
    });
    var sx = null; var st = $(".bhero__ring-stage", sec);
    st.addEventListener("pointerdown", function (e) { sx = e.clientX; });
    st.addEventListener("pointerup", function (e) { if (sx != null && Math.abs(e.clientX - sx) > 40) { go(e.clientX < sx ? 1 : -1); e.preventDefault(); } sx = null; });
    prices(); cap();
  });

  /* ---------- big bang size ---------- */
  $$("[data-bb-sizes]").forEach(function (g) {
    g.addEventListener("click", function (e) { var b = e.target.closest("[data-bigbang-size]"); if (!b) return; $$("[data-bigbang-size]", g).forEach(function (x) { x.classList.toggle("is-active", x === b); }); var add = $("[data-bigbang-add]"); add.dataset.add = b.dataset.bigbangSize; });
  });

  /* ---------- build-your-bundle ---------- */
  $$("[data-builder]").forEach(function (bb) {
    var st = { size: null, grind: null, picks: [], sub: false };
    function show(n) {
      $$("[data-bb-step]", bb).forEach(function (s) { s.hidden = s.dataset.bbStep !== String(n); });
      $$("[data-bb-prog]", bb).forEach(function (p) { var k = +p.dataset.bbProg; p.classList.toggle("is-active", k === n); p.classList.toggle("is-done", k < n); });
      if (n === 4) review();
    }
    function picksUI() {
      $$("[data-bb-pick]", bb).forEach(function (p) {
        var c = st.picks.filter(function (x) { return x === p.dataset.bbPick; }).length;
        p.classList.toggle("is-selected", c > 0); p.classList.toggle("is-maxed", st.picks.length >= 3 && !c);
        $("[data-bb-count]", p).textContent = c > 1 ? "×" + c : "";
      });
      $$("[data-bb-slot]", bb).forEach(function (s, i) {
        var slug = st.picks[i], was = s.classList.contains("is-filled");
        s.classList.toggle("is-filled", !!slug);
        s.innerHTML = slug ? '<span class="bb__slot-name">' + $('[data-bb-pick="' + slug + '"]', bb).dataset.name + '</span><button type="button" class="bb__slot-x" data-bb-unpick="' + i + '" aria-label="Remove">✕</button>' : '<span class="bb__slot-name">Bag ' + (i + 1) + "</span>";
        if (slug && was) s.style.animation = "none";
      });
      $("[data-bb-next-wrap]", bb).hidden = st.picks.length < 3;
    }
    function total() { var base = st.size === "12oz" ? 66 : 36, pct = st.sub ? 0.15 : 0.1; return { base: base, now: base * (1 - pct), pct: pct }; }
    function review() {
      $("[data-bb-grind-label]", bb).textContent = st.grind; $("[data-bb-size-label]", bb).textContent = st.size === "12oz" ? "12 oz" : "6 oz";
      $("[data-bb-configs]", bb).innerHTML = st.picks.map(function (slug, i) { var el = $('[data-bb-pick="' + slug + '"]', bb); return '<div class="bb-config"><img src="' + $("img", el).src + '" alt=""><div><div class="bb-config__name">' + el.dataset.name + '</div><div class="bb-config__meta">Bag ' + (i + 1) + " · " + st.grind + " · " + (st.size === "12oz" ? "12 oz" : "6 oz") + "</div></div></div>"; }).join("");
      var t = total(); $("[data-bb-total]", bb).textContent = money(t.now); $("[data-bb-was]", bb).textContent = money(t.base);
      var off = $("[data-bb-off]", bb); off.textContent = Math.round(t.pct * 100) + "% off" + (st.sub ? " · subscribed" : ""); off.classList.toggle("is-sub", st.sub);
    }
    bb.addEventListener("click", function (e) {
      var s = e.target.closest("[data-bb-size]"); if (s) { st.size = s.dataset.bbSize; $$("[data-bb-size]", bb).forEach(function (x) { x.classList.toggle("is-selected", x === s); }); setTimeout(function () { show(2); }, 220); return; }
      var g = e.target.closest("[data-bb-grind]"); if (g) { st.grind = g.dataset.bbGrind; $$("[data-bb-grind]", bb).forEach(function (x) { x.classList.toggle("is-selected", x === g); }); setTimeout(function () { show(3); }, 220); return; }
      var p = e.target.closest("[data-bb-pick]"); if (p && !p.closest(".is-dragging")) { if (st.picks.length < 3) { st.picks.push(p.dataset.bbPick); picksUI(); } else DD.toast("Three bags max. Remove one to swap."); return; }
      var u = e.target.closest("[data-bb-unpick]"); if (u) { st.picks.splice(+u.dataset.bbUnpick, 1); picksUI(); return; }
      if (e.target.closest("[data-bb-review]")) return show(4);
      var bk = e.target.closest("[data-bb-back]"); if (bk) return show(+bk.dataset.bbBack);
      var sub = e.target.closest("[data-bb-sub]"); if (sub) { st.sub = !st.sub; sub.classList.toggle("is-on", st.sub); sub.setAttribute("aria-pressed", st.sub); review(); return; }
      var a = e.target.closest("[data-bb-add]"); if (a) { DD.addToCart({ slug: "build-bundle", size: st.size, sub: st.sub, grind: st.grind }); DD.toast("Bundle added: " + st.picks.map(function (s) { return $('[data-bb-pick="' + s + '"]', bb).dataset.name; }).join(", ")); }
    });
    picksUI();
  });

  /* ---------- generic sub-toggle (pdp etc.) ---------- */
  D.addEventListener("click", function (e) {
    var t = e.target.closest("[data-sub-toggle]"); if (!t) return;
    var fq = e.target.closest("[data-freq]");
    if (fq) { $$("[data-freq]", t).forEach(function (x) { x.classList.toggle("is-active", x === fq); }); t.dispatchEvent(new CustomEvent("sub:change")); return; }
    var on = !t.classList.contains("is-on"); t.classList.toggle("is-on", on); t.setAttribute("aria-pressed", on);
    var lab = $("[data-sub-label]", t); if (lab) lab.textContent = on ? lab.dataset.on : lab.dataset.off;
    var fl = $("[data-freq-list]", t); if (fl) fl.hidden = !on;
    t.dispatchEvent(new CustomEvent("sub:change"));
  });
  D.addEventListener("keydown", function (e) { var t = e.target.closest && e.target.closest("[data-sub-toggle], [data-bb-sub]"); if (t && (e.key === "Enter" || e.key === " ") && e.target === t) { e.preventDefault(); t.click(); } });

  W.DD_PAGES = { roll: roll };
})();
