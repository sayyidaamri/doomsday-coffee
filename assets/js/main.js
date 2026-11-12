/* Doomsday Coffee — site behaviour (vanilla JS, no build step). */
(function () {
  "use strict";
  var D = document, B = D.body, W = window;
  var ROOT = B.dataset.root || "";
  var RM = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isPhone = function () { return W.matchMedia("(max-width: 767px)").matches; };
  var $ = function (s, r) { return (r || D).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
  var CAT = W.DD_CATALOG || { roasts: [], bundles: [] };
  var money = function (n) { return "$" + Number(n).toFixed(2); };
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  var ss = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return "blocked"; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
  };

  /* ---------------- script-face casing: capitals everywhere except a lowercase "i" ---------------- */
  var scriptCase = function (s) { return s.toUpperCase().replace(/I/g, "i"); };
  W.DD_scriptCase = scriptCase;
  $$(".u-script, .ss__prefix, .page-header__title, .site-footer__est, .hero-m__script, [data-script]").forEach(function (el) {
    var w = D.createTreeWalker(el, NodeFilter.SHOW_TEXT), n; while ((n = w.nextNode())) n.nodeValue = scriptCase(n.nodeValue);
  });

  /* ---------------- toast ---------------- */
  var toastEl = $("[data-toast]"), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.hidden = false; toastEl.classList.remove("is-out");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.add("is-out"); setTimeout(function () { toastEl.hidden = true; }, 300); }, 2600);
  }
  W.DD = { toast: toast };

  /* ---------------- smooth scroll ---------------- */
  var lenis = null;
  if (!RM && W.Lenis && !$("[data-no-lenis]")) {
    lenis = new W.Lenis({ lerp: 0.07, anchors: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    W.__lenis = lenis;
  }
  function scrollToY(y, opts) { if (lenis) lenis.scrollTo(y, opts || {}); else W.scrollTo({ top: y, behavior: "smooth" }); }
  function lockScroll(on) { if (lenis) on ? lenis.stop() : lenis.start(); }

  /* ---------------- nav tuck ---------------- */
  (function () {
    var nav = $(".site-nav"); if (!nav) return;
    var lastY = W.scrollY, ticking = false;
    function heroBottom() { var m = $("#main"), f = m && m.firstElementChild; var b = f ? f.offsetTop + f.offsetHeight : 600; return Math.min(b, W.innerHeight); }
    function update() {
      ticking = false;
      var y = W.scrollY, open = B.dataset.menu === "open" || B.dataset.cart === "open";
      if (open || y <= 0 || y < heroBottom()) { nav.classList.remove("is-tucked"); lastY = y; return; }
      if (y > lastY + 6) nav.classList.add("is-tucked"); else if (y < lastY - 6) nav.classList.remove("is-tucked");
      lastY = y;
    }
    W.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  })();

  /* ---------------- menu ---------------- */
  function setMenu(open) {
    B.dataset.menu = open ? "open" : "closed";
    $$("[data-menu-toggle]").forEach(function (b) { b.setAttribute("aria-expanded", String(open)); b.setAttribute("aria-label", open ? "Close menu" : "Open menu"); });
    lockScroll(open || B.dataset.cart === "open");
  }
  $$("[data-menu-toggle]").forEach(function (b) { b.addEventListener("click", function () { setMenu(B.dataset.menu !== "open"); }); });
  $$("[data-menu-close]").forEach(function (b) { b.addEventListener("click", function () { setMenu(false); }); });

  /* ---------------- cart ---------------- */
  var CART_KEY = "dd-cart";
  var cart = store.get(CART_KEY, []);
  var cartEl = $("[data-cart]"), itemsEl = $("[data-cart-items]"), emptyEl = $("[data-cart-empty]");
  function findProduct(slug) {
    for (var i = 0; i < CAT.roasts.length; i++) if (CAT.roasts[i].slug === slug) return CAT.roasts[i];
    for (var j = 0; j < CAT.bundles.length; j++) if (CAT.bundles[j].slug === slug) return CAT.bundles[j];
    return null;
  }
  function unitPrice(it) {
    var p = findProduct(it.slug); if (!p) return it.price || 0;
    if (p.kind === "gift") return it.amount || 25;
    var base = it.size === "12oz" ? p.price12 : p.price;
    if (p.kind === "bundle") base = it.size === "12oz" ? p.price12 : p.price;
    return Math.round(base * (it.sub ? 0.9 : 1) * 100) / 100;
  }
  function saveCart() { store.set(CART_KEY, cart); }
  function openCart() { setMenu(false); B.dataset.cart = "open"; cartEl && cartEl.setAttribute("aria-hidden", "false"); lockScroll(true); setCartView("cart"); }
  function closeCart() { B.dataset.cart = "closed"; cartEl && cartEl.setAttribute("aria-hidden", "true"); lockScroll(B.dataset.menu === "open"); }
  function setCartView(v) { var s = $(".cart__slider"); if (s) s.dataset.view = v; if (v === "auth") showAuth("signin"); }
  W.DD.openCart = openCart;
  $$("[data-cart-toggle]").forEach(function (b) { b.addEventListener("click", function () { B.dataset.cart === "open" ? closeCart() : openCart(); }); });
  D.addEventListener("click", function (e) {
    if (e.target.closest("[data-cart-close]")) closeCart();
    var v = e.target.closest("[data-cart-view]"); if (v) setCartView(v.dataset.cartView);
    var a = e.target.closest("[data-auth-go]"); if (a) showAuth(a.dataset.authGo);
    var t = e.target.closest("[data-demo-toast]"); if (t) toast(t.dataset.demoToast);
  });
  D.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (B.dataset.cart === "open") closeCart();
    if (B.dataset.menu === "open") setMenu(false);
    closeModals();
  });
  function showAuth(step) { $$("[data-auth-step]").forEach(function (c) { c.hidden = c.dataset.authStep !== step; if (!c.hidden) c.style.animation = "ac-fade-in .35s ease"; }); }

  var SIZES = ["6oz", "12oz"], GRINDS = ["Whole Bean", "Coarse", "Medium", "Fine", "Espresso"], FREQS = ["2 weeks", "4 weeks", "6 weeks"];
  function lineHTML(it, idx) {
    var p = findProduct(it.slug) || { name: it.slug, kind: "roast" };
    var img = p.kind === "gift" ? ROOT + "assets/img/gen/gift-card.png" : p.kind === "bundle" ? ROOT + "assets/img/gen/bag-" + p.picks[0] + ".png" : ROOT + "assets/img/gen/bag-" + p.slug + ".png";
    var controls = "";
    if (p.kind !== "gift") {
      var si = SIZES.indexOf(it.size);
      controls = '<div class="cart-item__controls"><div class="cart-item__size" style="--n:2;--i:' + si + '"><span class="cart-item__size-ink"></span>' + SIZES.map(function (s) { return '<button type="button" data-line-size="' + s + '"' + (s === it.size ? ' class="is-active"' : "") + ">" + s + "</button>"; }).join("") + "</div>" +
        (p.kind === "roast" ? '<label class="cart-item__grind"><span class="sr-only">Grind</span><select data-line-grind>' + GRINDS.map(function (g) { return "<option" + (g === it.grind ? " selected" : "") + ">" + g + "</option>"; }).join("") + '</select><span class="caret">▼</span></label>' : "") + "</div>";
    }
    var sub = p.kind === "gift" ? "" : '<button type="button" class="cart-item__sub' + (it.sub ? " is-on" : "") + '" data-line-sub><span class="cart-item__sub-label">↻ Subscribe &amp; save 10%</span><span class="switch"><i></i></span></button>' +
      (it.sub ? '<div class="cart-item__freqs">' + FREQS.map(function (f) { return '<button type="button" data-line-freq="' + f + '"' + (f === it.freq ? ' class="is-active"' : "") + ">Every " + f + "</button>"; }).join("") + "</div>" : "");
    var meta = p.kind === "gift" ? "Digital gift card" : p.kind === "bundle" ? "3 bags · " + it.size : (it.grind || "Whole Bean");
    var href = p.kind === "gift" ? ROOT + "products/gift-card.html" : p.kind === "bundle" ? ROOT + "shop.html#bundles" : ROOT + "products/" + p.slug + ".html";
    return '<div class="cart-item" data-line="' + idx + '"><div class="cart-item__top"><div class="cart-item__img"><img src="' + img + '" alt=""></div><div class="cart-item__body"><div class="cart-item__head"><div><a class="cart-item__name" href="' + href + '">' + p.name + '</a><div class="cart-item__meta">' + meta + '</div></div><button type="button" class="cart-item__remove" data-line-remove aria-label="Remove">✕</button></div>' + controls + "</div></div>" +
      '<div class="cart-item__bar"><div class="cart-item__qty"><button type="button" data-line-qty="-1" aria-label="Decrease">–</button><span data-qty>' + it.qty + '</span><button type="button" data-line-qty="1" aria-label="Increase">+</button></div><span class="cart-item__price" data-price>' + money(unitPrice(it) * it.qty) + "</span></div>" + sub + "</div>";
  }
  function renderCart(opts) {
    opts = opts || {};
    if (!itemsEl) return;
    $$(".cart-item", itemsEl).forEach(function (n) { n.remove(); });
    var count = 0, total = 0;
    cart.forEach(function (it, i) { count += it.qty; total += unitPrice(it) * it.qty; itemsEl.insertAdjacentHTML("beforeend", lineHTML(it, i)); });
    if (opts.newIdx != null) { var n = $('[data-line="' + opts.newIdx + '"]', itemsEl); n && n.classList.add("is-new"); }
    emptyEl.hidden = cart.length > 0;
    $("[data-cart-rule]").hidden = $("[data-cart-foot]").hidden = cart.length === 0;
    $("[data-cart-total]").textContent = money(total);
    var anySub = cart.some(function (c) { return c.sub; });
    $("[data-cart-hint]").innerHTML = anySub ? "Subscription savings <b>applied</b> · shipping at checkout" : total >= 45 ? "You've unlocked <b>free shipping</b>" : "Add <b>" + money(45 - total) + "</b> more for free shipping";
    $("[data-cart-title-count]").textContent = count ? "(" + count + ")" : "";
    $$("[data-cart-count]").forEach(function (c) { c.textContent = count; c.classList.toggle("is-empty", !count); if (opts.bump) { c.classList.remove("is-bump"); void c.offsetWidth; c.classList.add("is-bump"); } });
    saveCart();
  }
  function addToCart(item, open) {
    item = Object.assign({ size: "6oz", grind: "Whole Bean", qty: 1, sub: false, freq: "4 weeks" }, item);
    var ex = -1;
    cart.forEach(function (c, i) { if (c.slug === item.slug && c.size === item.size && c.grind === item.grind && c.sub === item.sub && (c.amount || 0) === (item.amount || 0)) ex = i; });
    if (ex > -1) cart[ex].qty += item.qty; else cart.push(item);
    renderCart({ bump: true, newIdx: ex > -1 ? ex : cart.length - 1 });
    if (open !== false) openCart();
  }
  W.DD.addToCart = addToCart;
  if (itemsEl) {
    itemsEl.addEventListener("click", function (e) {
      var line = e.target.closest("[data-line]"); if (!line) return;
      var i = +line.dataset.line, it = cart[i];
      var q = e.target.closest("[data-line-qty]");
      if (q) {
        var d = +q.dataset.lineQty; it.qty = Math.max(0, it.qty + d);
        if (!it.qty) return removeLine(line, i);
        saveCart(); renderCart();
        var nl = $('[data-line="' + i + '"]', itemsEl); [$("[data-qty]", nl), $("[data-price]", nl)].forEach(function (n) { n.classList.add(d > 0 ? "is-roll-up" : "is-roll-down"); });
        return;
      }
      if (e.target.closest("[data-line-remove]")) return removeLine(line, i);
      var s = e.target.closest("[data-line-size]"); if (s) { it.size = s.dataset.lineSize; var sz = $(".cart-item__size", line); sz.style.setProperty("--i", SIZES.indexOf(it.size)); setTimeout(renderCart, 260); return; }
      if (e.target.closest("[data-line-sub]")) { it.sub = !it.sub; renderCart(); return; }
      var f = e.target.closest("[data-line-freq]"); if (f) { it.freq = f.dataset.lineFreq; renderCart(); }
    });
    itemsEl.addEventListener("change", function (e) { var g = e.target.closest("[data-line-grind]"); if (g) { cart[+e.target.closest("[data-line]").dataset.line].grind = g.value; renderCart(); } });
  }
  function removeLine(node, i) { node.classList.add("is-removing"); setTimeout(function () { cart.splice(i, 1); renderCart(); }, 380); }
  var clearBtn = $("[data-cart-clear]");
  clearBtn && clearBtn.addEventListener("click", function () { $$(".cart-item", itemsEl).forEach(function (n, k) { n.style.animationDelay = k * 70 + "ms"; n.classList.add("is-removing"); }); setTimeout(function () { cart = []; renderCart(); }, 420 + cart.length * 70); });
  $$("[data-checkout]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); toast("Checkout is disabled — this is a static demo build."); }); });
  renderCart();
  /* grind icon cycle (empty cart) */
  if (!RM) setInterval(function () { $$("[data-grind-cycle]").forEach(function (box) { var im = $$("img", box), c = 0; im.forEach(function (x, i) { if (x.classList.contains("is-active")) c = i; }); im[c].classList.remove("is-active"); im[(c + 1) % im.length].classList.add("is-active"); }); }, 850);

  /* generic add buttons: data-add="slug" [data-add-size] [data-add-qty] */
  D.addEventListener("click", function (e) {
    var b = e.target.closest("[data-add]"); if (!b) return;
    e.preventDefault();
    var card = b.closest("[data-card]"), size = (card && card.dataset.size) || b.dataset.addSize || "6oz";
    addToCart({ slug: b.dataset.add, size: size, qty: +(b.dataset.addQty || 1), sub: b.dataset.addSub === "1", amount: b.dataset.addAmount ? +b.dataset.addAmount : undefined, grind: b.dataset.addGrind || "Whole Bean", freq: b.dataset.addFreq || "4 weeks" });
    if (b.classList.contains("icon-btn") || b.classList.contains("rc__add")) flashAdded(b);
  });
  function flashAdded(b) {
    if (b.__flash) return; var html = b.innerHTML; b.__flash = 1; b.classList.add("is-added");
    b.innerHTML = '<svg class="icon-btn__check" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path pathLength="1" d="M5 12.5l4.5 4.5L19 7"/></svg><span class="rc__add-label">Added</span>';
    setTimeout(function () { b.innerHTML = html; b.classList.remove("is-added"); b.__flash = 0; }, 1400);
  }

  /* ---------------- demo forms (never submit anywhere) ---------------- */
  D.addEventListener("submit", function (e) {
    var f = e.target; if (!f.matches("[data-demo-form]")) return;
    e.preventDefault();
    var ok = true;
    $$("input[required], textarea[required], select[required]", f).forEach(function (inp) {
      var valid = inp.type === "email" ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inp.value) : inp.type === "checkbox" ? inp.checked : inp.value.trim() !== "";
      inp.classList.toggle("is-invalid", !valid); if (!valid) ok = false;
    });
    if (!ok) { var first = $(".is-invalid", f); first && first.focus(); toast("Please fill in the highlighted fields."); return; }
    var done = f.dataset.done;
    if (f.closest("[data-auth]")) return showAuth("done");
    if (done) { var target = $(done); if (target) { f.hidden = true; target.hidden = false; target.style.animation = "ac-fade-in .5s ease"; } }
    else toast("Thanks! (Demo only — nothing was sent.)");
  });
  D.addEventListener("input", function (e) { if (e.target.classList && e.target.classList.contains("is-invalid")) e.target.classList.remove("is-invalid"); });

  /* ---------------- first visit popup ---------------- */
  (function () {
    var fvp = $("[data-fvp]"); if (!fvp) return;
    var KEY = "dd-welcome", state = ss.get(KEY), chip = $("[data-fvp-reopen]");
    function show() { fvp.hidden = false; chip && (chip.hidden = true); lockScroll(true); step(1); }
    function hide(done) { fvp.hidden = true; ss.set(KEY, done ? "done" : "1"); chip && (chip.hidden = !!done); lockScroll(false); }
    function step(n) { $$("[data-fvp-step]", fvp).forEach(function (s) { s.hidden = s.dataset.fvpStep !== String(n); }); }
    W.DD.closePopup = function () { if (!fvp.hidden) hide(false); };
    if (state === "done" || state === "blocked") {} else if (state === "1") { chip && (chip.hidden = false); }
    else setTimeout(function () { if (B.dataset.menu !== "open" && B.dataset.cart !== "open") show(); else setTimeout(show, 4000); }, +fvp.dataset.delay || 5000);
    fvp.addEventListener("click", function (e) {
      if (e.target === fvp || e.target.closest("[data-fvp-close]")) { hide(false); return; }
      var bl = e.target.closest("[data-fvp-blend]"); if (bl) { fvp.dataset.blend = bl.dataset.fvpBlend; step(2); var n = $("[data-fvp-name]", fvp); setTimeout(function () { n && n.focus(); }, 50); }
    });
    $("[data-fvp-form]", fvp).addEventListener("submit", function (e) {
      e.preventDefault();
      var em = $("[data-fvp-email]", fvp), nm = $("[data-fvp-name]", fvp);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value)) { em.classList.add("is-invalid"); em.focus(); return; }
      $("[data-fvp-done-name]", fvp).textContent = nm.value.trim() ? ", " + nm.value.trim().split(" ")[0] : "";
      $("[data-fvp-done-blend]", fvp).textContent = (fvp.dataset.blend || "a roast").toLowerCase() === "surprise me" ? "a surprise roast" : "a " + (fvp.dataset.blend || "").toLowerCase() + " roast";
      step(3); ss.set(KEY, "done");
    });
    $$("[data-fvp-open]").forEach(function (b) { b.addEventListener("click", show); });
  })();

  /* ---------------- modals (generic) ---------------- */
  function closeModals() { $$("[data-modal]:not([hidden])").forEach(function (m) { m.hidden = true; }); lockScroll(false); }
  D.addEventListener("click", function (e) {
    var o = e.target.closest("[data-modal-open]"); if (o) { var m = $(o.dataset.modalOpen); if (m) { m.hidden = false; lockScroll(true); m.dispatchEvent(new CustomEvent("modal:open")); var f = $("button, a, input", m); f && f.focus({ preventScroll: true }); } }
    if (e.target.matches("[data-modal]") || e.target.closest("[data-modal-close]")) { var mm = e.target.closest("[data-modal]"); if (mm) { mm.hidden = true; lockScroll(false); } }
  });
  W.DD.closeModals = closeModals;

  /* ---------------- page transition ---------------- */
  (function () {
    var pt = $("[data-pt]"); if (!pt) return;
    var titleEl = $("[data-pt-title]", pt);
    function setTitle(t) { titleEl.innerHTML = ""; t.split(" ").forEach(function (w, i) { var m = D.createElement("span"); m.className = "pt__w"; m.style.setProperty("--i", i); var s = D.createElement("span"); s.textContent = scriptCase(w); m.appendChild(s); titleEl.appendChild(m); titleEl.appendChild(D.createTextNode(" ")); }); }
    var saved = null; try { saved = JSON.parse(sessionStorage.getItem("dd-pt") || "null"); } catch (e) {}
    if (D.documentElement.classList.contains("pt-cover") && saved) {
      setTitle(saved.title); pt.className = "pt is-cover";
      sessionStorage.removeItem("dd-pt");
      var leave = function () { setTimeout(function () { pt.className = "pt is-out"; setTimeout(function () { W.dispatchEvent(new Event("dd:uncover")); }, 240); setTimeout(function () { pt.className = "pt"; D.documentElement.classList.remove("pt-cover"); }, 1080); }, 160); };
      D.readyState === "complete" ? leave() : W.addEventListener("load", leave, { once: true });
    }
    W.addEventListener("pageshow", function (e) { if (e.persisted) pt.className = "pt"; });
    if (RM) return;
    var SKIP = "[data-no-pt], .rc, [data-susan-item]";
    function titleFor(a, url) {
      var lab = $(".menu__label", a);
      var t = (a.getAttribute("data-pt-title") || (lab && lab.textContent) || a.getAttribute("aria-label") || a.textContent || "").replace(/\b\d+\b/g, " ").replace(/[→←]/g, "").replace(/\s+/g, " ").trim();
      if (!t || t.length > 32) { var seg = url.pathname.split("/").filter(Boolean).pop() || ""; t = seg.replace(/\.html$/, "").replace(/[-_]+/g, " ") || "Home"; if (t === "index") t = "Home"; }
      return t;
    }
    W.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download") || a.closest(SKIP)) return;
      var url; try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.protocol !== location.protocol || (url.protocol !== "file:" && url.origin !== location.origin)) return;
      if (url.pathname === location.pathname) return;
      e.preventDefault();
      var title = titleFor(a, url); setTitle(title);
      try { sessionStorage.setItem("dd-pt", JSON.stringify({ title: title, t: Date.now() })); } catch (err) {}
      setMenu(false); closeCart();
      pt.className = "pt is-in";
      setTimeout(function () { location.href = url.href; }, 1150);
    });
  })();
  function whenUncovered(fn) { if (!D.documentElement.classList.contains("pt-cover")) return fn(); var ran = false, go = function () { if (!ran) { ran = true; fn(); } }; W.addEventListener("dd:uncover", go, { once: true }); setTimeout(go, 2600); }

  /* ---------------- press feedback ---------------- */
  (function () {
    if (RM || !Element.prototype.animate) return;
    var SEL = 'button, [role="button"], .btn, .sq-btn, .arrow-btn, .icon-btn', held = null;
    function parts(el) { return el.classList.contains("btn") ? $$(":scope > .btn__bg, :scope > .btn__in", el) : [el]; }
    D.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      var el = e.target.closest(SEL); if (!el || el.disabled) return;
      var r = el.getBoundingClientRect(), d = Math.max(0.94, 1 - 5 / Math.max(r.width, r.height, 1));
      parts(el).forEach(function (n) { n.__dn && n.__dn.cancel(); n.__dn = n.animate([{ scale: 1 }, { scale: d }], { duration: 110, easing: "cubic-bezier(.3,0,.5,1)", fill: "forwards" }); });
      held = el;
    }, true);
    function up() { var el = held; held = null; if (!el) return; parts(el).forEach(function (n) { if (!n.__dn) return; var dn = n.__dn; var a = n.animate([{ scale: getComputedStyle(n).scale === "none" ? 1 : getComputedStyle(n).scale }, { scale: 1.025, offset: .45 }, { scale: .995, offset: .75 }, { scale: 1 }], { duration: 380, easing: "ease-out" }); a.onfinish = function () { dn.cancel(); n.__dn = null; }; }); }
    D.addEventListener("pointerup", up, true); D.addEventListener("pointercancel", up, true); W.addEventListener("blur", up);
  })();

  /* ---------------- cursor pops ---------------- */
  (function () {
    if (W.matchMedia("(pointer:coarse)").matches) return;
    var wrap = $("[data-pop-wrap]"), src = null; if (!wrap) return;
    D.addEventListener("mousemove", function (e) {
      var el = e.target.closest ? e.target.closest("[data-pop]") : null;
      if (!el) { if (src) { wrap.style.display = "none"; src = null; } return; }
      if (el !== src) {
        src = el;
        if (el.dataset.popName) {
          wrap.innerHTML = '<div class="pop-card" style="--lc:' + (el.dataset.popLc || "#e06d2d") + '"><div class="pop-card__meta"></div><div class="pop-card__name"></div><div class="pop-card__notes"></div></div>';
          $(".pop-card__meta", wrap).textContent = el.dataset.pop; $(".pop-card__name", wrap).textContent = el.dataset.popName; $(".pop-card__notes", wrap).textContent = el.dataset.popNotes || "";
          wrap.style.setProperty("--pop-sh", "transparent");
        } else {
          wrap.innerHTML = '<div class="pop"></div>'; var pill = wrap.firstChild; pill.textContent = el.dataset.pop;
          var bg = el.dataset.popBg || "#f0ede8"; pill.style.background = bg; pill.style.color = el.dataset.popFg || "#1a1a1a";
          wrap.style.setProperty("--pop-sh", bg === "#1a1a1a" ? "#f0ede8" : "#1a1a1a");
        }
      }
      wrap.style.display = "block";
      wrap.style.left = (src.dataset.popName && e.clientX + 24 + 384 > W.innerWidth ? Math.max(8, e.clientX - 384) : e.clientX) + "px";
      wrap.style.top = e.clientY + "px";
    }, { passive: true });
  })();

  /* ---------------- bean fields ---------------- */
  function initBeanFields(root) {
    if (RM) return;
    $$("[data-bean-field]", root).forEach(function (field) {
      if (field.__b) return; field.__b = 1;
      var host = field.parentElement, beans = $$("img", field);
      var fast = field.dataset.tempo === "fast", ON = fast ? [650, 1300] : [1800, 3000], OFF = fast ? [220, 520] : [360, 720], GAP = fast ? 16 : 28;
      var bias = field.dataset.sideBias === "edges" ? 0.45 : 0, avoid = [], dims = { w: 1, h: 1 }, scale = isPhone() ? 0.72 : 1;
      function measure() {
        var wr = field.getBoundingClientRect(); if (!wr.width) return; dims = { w: wr.width, h: wr.height }; avoid = [];
        $$("[data-bean-avoid]", host).concat($$(".site-nav a, .site-nav button")).forEach(function (el) { var r = el.getBoundingClientRect(); if (r.width) avoid.push({ x0: r.left - wr.left, y0: r.top - wr.top, x1: r.right - wr.left, y1: r.bottom - wr.top }); });
      }
      measure(); setTimeout(measure, 300); setTimeout(measure, 900); W.addEventListener("resize", measure);
      var lastY = W.scrollY, slots = beans.map(function () { return { left: 50, top: 50, size: 40, on: false }; });
      function claim(i) {
        var size = rnd(34, 62); if (W.scrollY !== lastY) { lastY = W.scrollY; measure(); }
        for (var t = 0; t < 80; t++) {
          var left = bias > 0 && Math.random() < bias ? (Math.random() < 0.5 ? rnd(2, 24) : rnd(76, 98)) : rnd(3, 97), top = rnd(4, 95);
          var x = left / 100 * dims.w, y = top / 100 * dims.h, half = size * scale * 0.8 + 5, ok = true;
          for (var a = 0; a < avoid.length; a++) { var r = avoid[a]; if (x + half > r.x0 - GAP && x - half < r.x1 + GAP && y + half > r.y0 - GAP && y - half < r.y1 + GAP) { ok = false; break; } }
          if (ok) for (var j = 0; j < slots.length; j++) { if (j === i || !slots[j].on) continue; var sx = slots[j].left / 100 * dims.w, sy = slots[j].top / 100 * dims.h, lim = (size + slots[j].size) / 2 * scale * 0.9; if (Math.abs(x - sx) < lim && Math.abs(y - sy) < lim) { ok = false; break; } }
          if (ok) return { left: left, top: top, size: size };
        }
        return null;
      }
      beans.forEach(function (bean, i) {
        function appear() { var s = claim(i); if (s) { slots[i] = { left: s.left, top: s.top, size: s.size, on: true }; bean.style.left = s.left + "%"; bean.style.top = s.top + "%"; bean.style.setProperty("--br", Math.round(rnd(-50, 50)) + "deg"); bean.style.setProperty("--bw", Math.round(s.size) + "px"); bean.classList.add("is-on"); } setTimeout(disappear, rnd(ON[0], ON[1])); }
        function disappear() { slots[i].on = false; bean.classList.remove("is-on"); setTimeout(appear, rnd(OFF[0], OFF[1])); }
        setTimeout(appear, i * 200 + rnd(0, 300));
      });
    });
    $$(".sweep", root).forEach(function (el) {
      function size() { var par = el.parentElement.parentElement || el.parentElement; var w = par.offsetWidth, h = par.offsetHeight, reach = 0.354 * (2.2 * h + 64) + 96; el.style.setProperty("--sweep-start", Math.round(w + reach) + "px"); el.style.setProperty("--sweep-end", Math.round(-64 - reach) + "px"); }
      size(); W.addEventListener("resize", size);
    });
  }
  initBeanFields(D);

  /* ---------------- split reveal ---------------- */
  (function () {
    var els = $$("[data-split]"); if (!els.length) return;
    if (RM || !("IntersectionObserver" in W)) { els.forEach(function (el) { el.classList.add("sr-off"); }); return; }
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("is-in"); io.unobserve(x.target); } }); }, { rootMargin: "0px 0px -20% 0px" });
    whenUncovered(function () { els.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < W.innerHeight && r.bottom > 0) el.classList.add("is-in"); else io.observe(el); }); });
  })();

  /* ---------------- marquee ---------------- */
  $$("[data-marquee]").forEach(function (track) {
    track.innerHTML += track.innerHTML;
    if (RM) return;
    var wrap = track.parentElement, x = 0, last = null, paused = false, dragX = null, resumeT = 0, speed = +(track.dataset.speed || 42);
    function period() { var k = track.children, mid = k.length / 2; return k.length > 1 ? k[mid].offsetLeft - k[0].offsetLeft : 0; }
    function wrapX(p) { if (p > 0) { while (x <= -p) x += p; while (x > 0) x -= p; } }
    wrap.addEventListener("mouseenter", function () { paused = true; });
    wrap.addEventListener("mouseleave", function () { paused = false; });
    wrap.addEventListener("touchstart", function (e) { dragX = e.touches[0].clientX; paused = true; clearTimeout(resumeT); }, { passive: true });
    wrap.addEventListener("touchmove", function (e) { if (dragX == null) return; var cx = e.touches[0].clientX; x += cx - dragX; dragX = cx; wrapX(period()); track.style.transform = "translate3d(" + x + "px,0,0)"; }, { passive: true });
    var release = function () { dragX = null; clearTimeout(resumeT); resumeT = setTimeout(function () { paused = false; last = null; }, 1200); };
    wrap.addEventListener("touchend", release); wrap.addEventListener("touchcancel", release);
    (function step(ts) { if (last == null) last = ts; var dt = (ts - last) / 1000; last = ts; var p = period(); if (!paused && p > 0 && dt < 0.5) { x -= speed * dt; wrapX(p); track.style.transform = "translate3d(" + x + "px,0,0)"; } requestAnimationFrame(step); })(performance.now());
  });

  /* ---------------- 3D "lazy susan" bag carousel ---------------- */
  function bezier(x1, y1, x2, y2) {
    function bx(t) { return 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t; }
    function by(t) { return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t; }
    return function (x) { var lo = 0, hi = 1, t = x; for (var i = 0; i < 22; i++) { t = (lo + hi) / 2; bx(t) < x ? (lo = t) : (hi = t); } return by(t); };
  }
  $$("[data-susan]").forEach(function (root) {
    var stage = $("[data-susan-stage]", root), items = $$("[data-susan-item]", root), n = items.length; if (!n) return;
    var cap = $("[data-susan-cap]", root), elRank = $("[data-susan-rank]", root), elName = $("[data-susan-name]", root), elMeta = $("[data-susan-meta]", root), elPrice = $("[data-susan-price]", root), elLink = $("[data-susan-link]", root);
    var X = 0.65, BACK = 0.5, ROT = 5, MOVE = 1500, REST = +(root.dataset.rest || 3000), DROP = 0, pos = 0, front = -1, raf = 0, loop = 0, hold = 0, drag = null, dragged = false, onScreen = true, bw = 0;
    var ease = bezier(0.6, 0, 0, 1);
    function spread() { var cs = getComputedStyle(root); var v = parseFloat(cs.getPropertyValue("--susan-x")); X = v > 0 ? v : 0.65; var d = parseFloat(cs.getPropertyValue("--susan-drop")); DROP = isFinite(d) ? d : 0; }
    function caption(k) { var it = items[k]; elRank.textContent = "#" + (k + 1); elName.textContent = it.dataset.name; elMeta.textContent = it.dataset.meta; elPrice.textContent = it.dataset.price; elLink.href = it.getAttribute("href"); }
    function render() {
      if (!bw) { bw = items[0].offsetWidth || 128; spread(); }
      var rx = bw * X, f = ((Math.round(pos) % n) + n) % n;
      items.forEach(function (el, k) {
        var rel = k - pos; rel = ((((rel + n / 2) % n) + n) % n) - n / 2; rel = Math.max(-2, Math.min(2, rel));
        var ang = rel / 2 * Math.PI, depth = (Math.cos(ang) + 1) / 2, x = rel <= -2 || rel >= 2 ? 0 : Math.sin(ang) * rx, s = BACK + (1 - BACK) * depth, op = Math.max(0, Math.min(1, (Math.min(2, n / 2) - Math.abs(rel)) * 2));
        el.style.transform = "translateX(calc(-50% + " + x.toFixed(2) + "px))" + (DROP ? " translateY(" + (DROP * Math.max(0, 2 * depth - 1)).toFixed(2) + "px)" : "") + " perspective(1200px) rotateY(" + (Math.sin(ang) * -ROT).toFixed(2) + "deg) scale(" + s.toFixed(4) + ")";
        el.style.opacity = op.toFixed(3); el.style.zIndex = Math.round(1 + 999 * depth); el.style.pointerEvents = op > 0.5 ? "auto" : "none";
        el.setAttribute("aria-hidden", k === f ? "false" : "true"); el.tabIndex = k === f ? 0 : -1;
      });
      if (f !== front) { front = f; caption(f); }
      var c = Math.max(0, 1 - Math.abs(pos - Math.round(pos)) * 3); cap.style.opacity = c.toFixed(3); cap.style.transform = c < 1 ? "translateY(" + ((1 - c) * 6).toFixed(1) + "px)" : "";
    }
    function spinTo(target, dur, done) { cancelAnimationFrame(raf); var from = pos; if (RM || from === target) { pos = target; render(); done && done(); return; } var t0 = performance.now(); (function tick(now) { var t = Math.min(1, (now - t0) / dur); pos = from + (target - from) * ease(t); render(); t < 1 ? (raf = requestAnimationFrame(tick)) : done && done(); })(t0); }
    function step() { clearTimeout(loop); if (RM || drag || !onScreen || D.hidden || Date.now() < hold || !root.offsetWidth) { loop = setTimeout(step, 500); return; } spinTo(Math.round(pos) + 1, MOVE, function () { loop = setTimeout(step, REST); }); }
    function userSpin(t) { hold = Date.now() + 2500; clearTimeout(loop); spinTo(t, 900, function () { loop = setTimeout(step, 2500); }); }
    function goTo(k) { var base = Math.round(pos), d = (((k - base) % n) + n) % n; if (d > n / 2) d -= n; if (d) userSpin(base + d); }
    items.forEach(function (el, k) { el.addEventListener("click", function (e) { if (dragged) { e.preventDefault(); dragged = false; return; } if (k !== front) { e.preventDefault(); goTo(k); } }); });
    $("[data-susan-prev]", root).addEventListener("click", function () { userSpin(Math.round(pos) - 1); });
    $("[data-susan-next]", root).addEventListener("click", function () { userSpin(Math.round(pos) + 1); });
    stage.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") { e.preventDefault(); userSpin(Math.round(pos) - 1); } else if (e.key === "ArrowRight") { e.preventDefault(); userSpin(Math.round(pos) + 1); } });
    stage.addEventListener("pointerdown", function (e) { if (e.target.closest("[data-susan-prev],[data-susan-next]")) return; clearTimeout(loop); dragged = false; drag = { x: e.clientX, lx: e.clientX, lt: performance.now(), v: 0 }; hold = Date.now() + 2500; });
    stage.addEventListener("pointermove", function (e) { if (!drag) return; var dx = e.clientX - drag.x; if (Math.abs(dx) > 6) dragged = true; var now = performance.now(); if (now > drag.lt) { drag.v = (e.clientX - drag.lx) / (now - drag.lt); drag.lx = e.clientX; drag.lt = now; } drag.dx = dx; });
    function release(e) { if (!drag) return; var g = drag; drag = null; hold = Date.now() + 2500; var dx = g.dx || 0, dir = 0; if (dragged && e.type !== "pointercancel" && (Math.abs(dx) > 30 || Math.abs(g.v) > 0.35)) dir = (dx || -g.v) < 0 ? 1 : -1; dir ? userSpin(Math.round(pos) + dir) : (loop = setTimeout(step, 2500)); if (e.type !== "pointerup") dragged = false; }
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (t) { stage.addEventListener(t, release); });
    if ("IntersectionObserver" in W) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; }).observe(stage);
    W.addEventListener("resize", function () { bw = 0; render(); });
    render(); loop = setTimeout(step, REST);
  });

  /* ---------------- UFO best sellers ---------------- */
  $$("[data-ufo]").forEach(function (sec) {
    var bags = $$("[data-ufo-bag]", sec), n = bags.length, idx = 0;
    function apply() {
      bags.forEach(function (bag, i) {
        var d = i - idx; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
        bag.dataset.slot = Math.max(-2, Math.min(2, d)); bag.style.zIndex = 10 - Math.abs(d);
        if (d === 0) { bag.dataset.pop = "Learn More"; } else bag.removeAttribute("data-pop");
      });
      $$("[data-ufo-detail]", sec).forEach(function (det, i) { det.hidden = i !== idx; if (i === idx) { det.style.animation = "none"; void det.offsetWidth; det.style.animation = ""; } });
      var c = bags[idx].dataset.color; sec.style.setProperty("--beam", c);
      $$("[data-ufo-particles] circle", sec).forEach(function (ci) { ci.setAttribute("fill", c); });
    }
    sec.addEventListener("click", function (e) {
      if (e.target.closest("[data-ufo-prev]")) { idx = (idx - 1 + n) % n; return apply(); }
      if (e.target.closest("[data-ufo-next]")) { idx = (idx + 1) % n; return apply(); }
      var bag = e.target.closest("[data-ufo-bag]"); if (!bag) return;
      var i = bags.indexOf(bag); if (i === idx) navigate(bag.dataset.url, bag.getAttribute("aria-label")); else { idx = i; apply(); }
    });
    sec.addEventListener("keydown", function (e) { var bag = e.target.closest("[data-ufo-bag]"); if (bag && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); bag.click(); } });
    apply();
    if (!RM) { var t0 = performance.now(); (function fl(t) { sec.style.setProperty("--ufo-float", (Math.sin((t - t0) / 1400) * 7).toFixed(2) + "px"); requestAnimationFrame(fl); })(t0); }
  });
  function navigate(href, title) { var a = D.createElement("a"); a.href = href; if (title) a.dataset.ptTitle = title; a.style.display = "none"; B.appendChild(a); a.click(); a.remove(); }
  W.DD.navigate = navigate;

  /* ---------------- sticky steps ---------------- */
  $$("[data-ss]").forEach(function (wrap) {
    var items = $$("[data-ss-item]", wrap); if (!items.length || !("IntersectionObserver" in W)) return;
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (!x.isIntersecting) return; items.forEach(function (it) { var pos = it.compareDocumentPosition(x.target); it.dataset.ssStatus = it === x.target ? "active" : pos & Node.DOCUMENT_POSITION_FOLLOWING ? "before" : "after"; }); }); }, { rootMargin: "-45% 0px -45% 0px" });
    items.forEach(function (it, i) { it.dataset.ssStatus = i ? "after" : "active"; io.observe(it); });
    if (RM) return;
    var dq = W.matchMedia("(min-width: 1024px)"), texts = items.map(function (it) { return $(".ss__text", it) || it; }), snapT = 0, snapping = false;
    W.addEventListener("scroll", function () {
      if (snapping) return; clearTimeout(snapT);
      snapT = setTimeout(function () {
        if (!dq.matches) return;
        var vh = W.innerHeight, best = -1, bd = Infinity;
        texts.forEach(function (t, i) { var r = t.getBoundingClientRect(), d = r.top + r.height / 2 - vh / 2; if (Math.abs(d) < Math.abs(bd)) { bd = d; best = i; } });
        if (best < 0 || Math.abs(bd) < 4 || Math.abs(bd) > vh * 0.5 || (best === 0 && bd > vh * 0.25) || (best === texts.length - 1 && bd < -vh * 0.25)) return;
        snapping = true; var done = function () { snapping = false; };
        if (lenis) lenis.scrollTo(W.scrollY + bd, { duration: 0.7, onComplete: done }); else { W.scrollTo({ top: W.scrollY + bd, behavior: "smooth" }); setTimeout(done, 800); }
      }, 160);
    }, { passive: true });
    /* mobile stacked-cards shrink */
    var mq = W.matchMedia("(max-width: 1023px)"), raf = 0;
    function paint() {
      raf = 0; if (!mq.matches) { items.forEach(function (it) { it.style.transform = it.style.opacity = ""; }); return; }
      for (var i = 0; i < items.length - 1; i++) {
        var top = parseFloat(getComputedStyle(items[i]).top) || 0, h = items[i].offsetHeight || 1, y = items[i + 1].getBoundingClientRect().top;
        var p = Math.max(0, Math.min(1, (top + h - y) / h));
        items[i].style.transform = p ? "scale(" + (1 - 0.12 * p) + ")" : ""; items[i].style.opacity = p ? String(Math.max(0, 1 - p / 0.7)) : "";
      }
    }
    W.addEventListener("scroll", function () { raf || (raf = requestAnimationFrame(paint)); }, { passive: true });
    W.addEventListener("resize", paint);
  });

  /* ---------------- horizontal timeline ---------------- */
  $$("[data-timeline]").forEach(function (sec) {
    var track = $("[data-timeline-track]", sec), bg = $("[data-timeline-bg]", sec), pin = $("[data-timeline-pin]", sec), ticking = false;
    function on() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var r = sec.getBoundingClientRect(), pinH = pin.offsetHeight, sc = Math.max(1, sec.offsetHeight - pinH), p = Math.min(1, Math.max(0, -r.top / sc));
        if (W.innerWidth < 768) p = Math.min(1, p / 0.88);
        var last = track.lastElementChild, padR = parseFloat(getComputedStyle(track).paddingRight) || 0, end = last ? last.offsetLeft + last.offsetWidth + padR : track.scrollWidth, x = Math.max(0, end - W.innerWidth);
        track.style.transform = "translate3d(" + -p * x + "px,0,0)";
        if (bg) { var bgW = bg.offsetHeight * 2.3567; bg.style.width = bgW + "px"; bg.style.transform = "translate3d(" + -p * Math.max(0, bgW - W.innerWidth) + "px,0,0)"; }
        ticking = false;
      });
    }
    if (RM) return;
    W.addEventListener("scroll", on, { passive: true }); W.addEventListener("resize", on); on();
  });

  /* ---------------- bean physics (Matter.js, lazy) ---------------- */
  function loadScript(src, cb) { if (W.Matter) return cb(); var s = D.createElement("script"); s.src = src; s.onload = cb; D.head.appendChild(s); }
  $$("[data-bean-physics]").forEach(function (host) {
    if (RM || !("IntersectionObserver" in W)) return;
    var io = new IntersectionObserver(function (en) { if (en.some(function (e) { return e.isIntersecting; })) { io.disconnect(); loadScript(ROOT + "assets/vendor/matter.min.js", function () { startPhysics(host); }); } }, { rootMargin: "0px 0px -10% 0px" });
    io.observe(host);
  });
  function startPhysics(host) {
    var M = W.Matter, Wd = host.clientWidth, H = host.clientHeight; if (!Wd || !H) return;
    var total = +(host.dataset.beanTotal || 95), size = +(host.dataset.beanSize || 64);
    if (Wd < 768) { total = Math.min(total, 40); size = Math.min(size, 42); }
    var srcs = []; for (var i = 1; i <= 8; i++) srcs.push(ROOT + "assets/img/gen/bean-" + i + ".png");
    var engine = M.Engine.create(); engine.world.gravity.y = 1.3;
    var render = M.Render.create({ element: host, engine: engine, options: { background: "transparent", wireframes: false, width: Wd, height: H, pixelRatio: Math.min(2, W.devicePixelRatio || 1) } });
    var ti = 0;
    function drop() {
      var src = srcs[ti++ % srcs.length], jitter = rnd(0.85, 1.15), sc = (size * jitter) / 120, w = 120 * sc * 0.62, h = 120 * sc * 0.8;
      M.Composite.add(engine.world, M.Bodies.rectangle(rnd(w / 2 + 8, Wd - w / 2 - 8), -h, w, h, { chamfer: { radius: Math.min(w, h) / 2.2 }, restitution: 0.55, friction: 0.15, density: 0.0014, angle: rnd(-Math.PI, Math.PI), render: { sprite: { texture: src, xScale: sc, yScale: sc } } }));
    }
    var wall = 300;
    M.Composite.add(engine.world, [M.Bodies.rectangle(Wd / 2, H + wall / 2, Wd + wall * 2, wall, { isStatic: true, render: { visible: false } }), M.Bodies.rectangle(-wall / 2, H / 2, wall, H * 4, { isStatic: true, render: { visible: false } }), M.Bodies.rectangle(Wd + wall / 2, H / 2, wall, H * 4, { isStatic: true, render: { visible: false } })]);
    M.Render.run(render); var runner = M.Runner.create(); M.Runner.run(runner, engine);
    var dropped = 0, timer = setInterval(function () { drop(); if (++dropped >= total) clearInterval(timer); }, 70);
    var mouse = M.Mouse.create(render.canvas), mc = M.MouseConstraint.create(engine, { mouse: mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
    M.Composite.add(engine.world, mc);
    mouse.element.removeEventListener("mousewheel", mouse.mousewheel); mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel); mouse.element.removeEventListener("wheel", mouse.mousewheel);
    mouse.element.removeEventListener("touchstart", mouse.mousedown); mouse.element.removeEventListener("touchmove", mouse.mousemove); mouse.element.removeEventListener("touchend", mouse.mouseup);
    M.Events.on(mc, "startdrag", function () { render.canvas.style.cursor = "grabbing"; });
    M.Events.on(mc, "enddrag", function () { render.canvas.style.cursor = "grab"; });
    var sec = host.closest("section") || host.parentElement, ptr = { x: 0, y: 0, vx: 0, vy: 0, on: false };
    sec.addEventListener("pointermove", function (e) { if (e.pointerType === "touch") return; var r = host.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; if (ptr.on) { ptr.vx += x - ptr.x; ptr.vy += y - ptr.y; } ptr.x = x; ptr.y = y; ptr.on = true; }, { passive: true });
    sec.addEventListener("pointerleave", function () { ptr.on = false; ptr.vx = ptr.vy = 0; });
    var reach = size * 1.6;
    M.Events.on(engine, "beforeUpdate", function () {
      var sp = Math.hypot(ptr.vx, ptr.vy);
      if (!ptr.on || sp < 0.5 || mc.body) { ptr.vx *= 0.5; ptr.vy *= 0.5; return; }
      var push = Math.min(sp, 48), ux = ptr.vx / sp, uy = ptr.vy / sp;
      M.Composite.allBodies(engine.world).forEach(function (b) {
        if (b.isStatic) return; var dx = b.position.x - ptr.x, dy = b.position.y - ptr.y, d = Math.hypot(dx, dy); if (d > reach) return;
        var f = 1 - d / reach, ax = d ? dx / d : 0, ay = d ? dy / d : -1, vx = b.velocity.x + (ax * 0.55 + ux * 0.45) * push * 0.22 * f, vy = b.velocity.y + (ay * 0.55 + uy * 0.45) * push * 0.22 * f - 1.2 * f, v = Math.hypot(vx, vy);
        if (v > 18) { vx *= 18 / v; vy *= 18 / v; }
        M.Body.setVelocity(b, { x: vx, y: vy }); M.Body.setAngularVelocity(b, b.angularVelocity + (ux * ay - uy * ax) * 0.04 * f);
      });
      ptr.vx *= 0.5; ptr.vy *= 0.5;
    });
    var running = true;
    new IntersectionObserver(function (es) { var vis = es[es.length - 1].isIntersecting; if (vis && !running) { M.Render.run(render); M.Runner.run(runner, engine); running = true; } else if (!vis && running) { M.Render.stop(render); M.Runner.stop(runner); running = false; } }, { rootMargin: "100px 0px" }).observe(host);
  }

  /* ---------------- drag-scroll rows + arrows ---------------- */
  $$("[data-row]").forEach(function (row) {
    var down = null, moved = false;
    row.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse" || W.innerWidth < 1024) return; down = { x: e.clientX, s: row.scrollLeft }; moved = false; });
    W.addEventListener("pointermove", function (e) { if (!down) return; var dx = e.clientX - down.x; if (Math.abs(dx) > 5) { moved = true; row.classList.add("is-dragging"); } row.scrollLeft = down.s - dx; });
    W.addEventListener("pointerup", function () { if (!down) return; down = null; setTimeout(function () { row.classList.remove("is-dragging"); }, 0); });
    row.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    var id = row.id; if (!id) return;
    $$('[data-row-prev="' + id + '"], [data-row-next="' + id + '"]').forEach(function (b) {
      b.addEventListener("click", function () { var kid = row.firstElementChild, stride = kid ? kid.offsetWidth + parseFloat(getComputedStyle(row).columnGap || 20) : 300; row.scrollBy({ left: (b.hasAttribute("data-row-prev") ? -1 : 1) * stride, behavior: "smooth" }); });
    });
    function fade() { var max = row.scrollWidth - row.clientWidth; row.classList.toggle("is-fade-l", row.scrollLeft > 2); row.classList.toggle("is-fade-r", row.scrollLeft < max - 2); }
    row.addEventListener("scroll", fade, { passive: true }); W.addEventListener("resize", fade); fade();
  });

  /* ---------------- generic tabs / segmented ---------------- */
  D.addEventListener("click", function (e) {
    var t = e.target.closest("[data-tab]"); if (!t) return;
    var group = t.closest("[data-tabs]"); if (!group) return;
    $$("[data-tab]", group).forEach(function (b) { var on = b === t; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on); });
    $$("[data-panel]", group).forEach(function (p) { p.hidden = p.dataset.panel !== t.dataset.tab; if (!p.hidden) p.style.animation = "ac-fade-in .4s ease"; });
    group.dispatchEvent(new CustomEvent("tab:change", { detail: t.dataset.tab }));
  });

  /* ---------------- accordions ---------------- */
  D.addEventListener("click", function (e) {
    var q = e.target.closest("[data-acc]"); if (!q) return;
    var item = q.closest("[data-acc-item]"), open = item.classList.toggle("is-open"); q.setAttribute("aria-expanded", open);
    var body = $("[data-acc-body]", item); if (body) body.style.maxHeight = open ? body.scrollHeight + "px" : "0px";
  });

  W.DD.$ = $; W.DD.$$ = $$; W.DD.money = money; W.DD.lockScroll = lockScroll; W.DD.scrollToY = scrollToY; W.DD.findProduct = findProduct; W.DD.flashAdded = flashAdded; W.DD.initBeanFields = initBeanFields; W.DD.RM = RM;
  D.dispatchEvent(new Event("dd:ready"));
})();
