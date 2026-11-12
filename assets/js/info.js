/* Info pages: locations, subscribe, blog, franchise, account, 404 game. */
(function () {
  "use strict";
  var D = document, W = window, DD = W.DD || {}, $ = DD.$, $$ = DD.$$;
  if (!$) return;

  /* ---------- open / closed status + today's hours ---------- */
  $$("[data-open-status]").forEach(function (el) {
    var rows = JSON.parse(el.dataset.hours), now = new Date(), day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    var names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    function covers(label) {
      var l = label.toLowerCase(), parts = l.split("–").map(function (s) { return s.trim(); });
      if (parts.length === 1) return names[day] === parts[0];
      var a = names.indexOf(parts[0]), b = names.indexOf(parts[1]); if (a < 0 || b < 0) return false;
      return a <= b ? day >= a && day <= b : day >= a || day <= b;
    }
    function toMin(t) { var m = /(\d+):(\d+)\s*(AM|PM)/i.exec(t); if (!m) return 0; var h = +m[1] % 12 + (m[3].toUpperCase() === "PM" ? 12 : 0); return h * 60 + +m[2]; }
    var rowEls = $$(".loc__hours-row", el.parentElement), open = false, label = "Closed today";
    rows.forEach(function (r, i) {
      if (!covers(r[0])) return; rowEls[i] && rowEls[i].classList.add("is-today");
      var span = r[1].split("–"), o = toMin(span[0]), c = toMin(span[1]);
      open = mins >= o && mins < c; label = open ? "Open now · closes " + span[1].trim() : mins < o ? "Opens today at " + span[0].trim() : "Closed · see you tomorrow";
    });
    el.textContent = label; el.style.setProperty("--st", open ? "#30a050" : "#c9281e");
  });

  /* ---------- subscribe plan picker ---------- */
  $$("[data-plans]").forEach(function (g) { g.addEventListener("click", function (e) { var b = e.target.closest("[data-plan]"); if (!b) return; $$("[data-plan]", g).forEach(function (x) { x.classList.toggle("is-active", x === b); }); }); });

  /* ---------- blog filter + pagination ---------- */
  $$("[data-blog-grid]").forEach(function (grid) {
    var per = +grid.dataset.per || 6, items = $$(":scope > div", grid), pager = $("[data-blog-pager]"), cat = "All", page = 0;
    var wrap = grid.closest("[data-tabs]");
    function list() { return items.filter(function (it) { return cat === "All" || it.dataset.cat === cat; }); }
    function render(scroll) {
      var l = list(), pages = Math.max(1, Math.ceil(l.length / per)); page = Math.min(page, pages - 1);
      items.forEach(function (it) { it.hidden = true; });
      l.forEach(function (it, i) { if (Math.floor(i / per) === page) { it.hidden = false; it.style.animationDelay = (i % per) * 50 + "ms"; } });
      pager.innerHTML = "";
      for (var k = 0; k < pages; k++) { var b = D.createElement("button"); b.type = "button"; b.textContent = k + 1; if (k === page) b.className = "is-current"; b.dataset.pg = k; pager.appendChild(b); }
      if (pages > 1) { var nx = D.createElement("button"); nx.type = "button"; nx.textContent = "→"; nx.dataset.pg = (page + 1) % pages; nx.setAttribute("aria-label", "Next page"); pager.appendChild(nx); }
      if (scroll) DD.scrollToY(wrap.getBoundingClientRect().top + W.scrollY - 120);
    }
    pager.addEventListener("click", function (e) { var b = e.target.closest("[data-pg]"); if (!b) return; page = +b.dataset.pg; render(true); });
    wrap.addEventListener("click", function (e) { var c = e.target.closest("[data-blog-cat]"); if (!c) return; cat = c.dataset.blogCat; page = 0; $$("[data-blog-cat]", wrap).forEach(function (x) { x.classList.toggle("is-active", x === c); }); render(false); });
    render(false);
  });

  /* ---------- franchise multi-step form ---------- */
  $$("[data-steps-form]").forEach(function (box) {
    var form = $("form", box), steps = $$("[data-fstep]", box), i = 0, bar = $("[data-steps-bar]", box);
    var next = $("[data-fnext]", box), back = $("[data-fback]", box), sub = $("[data-fsubmit]", box);
    function show() { steps.forEach(function (s, k) { s.hidden = k !== i; }); back.hidden = i === 0; next.hidden = i === steps.length - 1; sub.hidden = i !== steps.length - 1; bar.style.width = ((i + 1) / steps.length) * 100 + "%"; }
    function valid() {
      var ok = true;
      $$("input[required], select[required]", steps[i]).forEach(function (inp) {
        var v = inp.type === "radio" ? !!$('input[name="' + inp.name + '"]:checked', steps[i]) : inp.type === "email" ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inp.value) : inp.value.trim() !== "";
        inp.classList.toggle("is-invalid", !v); if (!v) ok = false;
      });
      if (!ok) DD.toast("Please complete the required fields.");
      return ok;
    }
    next.addEventListener("click", function () { if (valid()) { i++; show(); } });
    back.addEventListener("click", function () { i--; show(); });
    show();
  });
  $$("[data-video-mute]").forEach(function (b) { var v = b.parentElement.querySelector("video"); b.addEventListener("click", function () { v.muted = !v.muted; b.textContent = v.muted ? "🔇" : "🔊"; b.setAttribute("aria-label", v.muted ? "Unmute video" : "Mute video"); if (!v.muted) v.play(); }); });

  /* ---------- account sub-views (#recover) ---------- */
  var acSteps = $$("[data-ac-step]");
  if (acSteps.length) {
    var go = function (s) { acSteps.forEach(function (c) { c.hidden = c.dataset.acStep !== s; }); };
    D.addEventListener("click", function (e) { var g = e.target.closest("[data-ac-go]"); if (g) { go(g.dataset.acGo); history.replaceState(null, "", g.dataset.acGo === "recover" ? "#recover" : location.pathname); } });
    if (location.hash === "#recover") go("recover");
  }

  /* ---------- 404: Bean Blaster ---------- */
  var sec = $("[data-blaster]");
  if (sec) {
    var cv = $("[data-bb-canvas]", sec), ctx = cv.getContext("2d"), hud = $("[data-bb-hud]", sec), over = $("[data-bb-over]", sec);
    var beanImgs = []; for (var k = 1; k <= 8; k++) { var im = new Image(); im.src = (D.body.dataset.root || "") + "assets/img/gen/bean-" + k + ".png"; beanImgs.push(im); }
    var best = +(localStorage.getItem("dd-bb-best") || 0), dpr = Math.min(2, W.devicePixelRatio || 1), Wd, Ht;
    var S = null, keys = {}, raf = 0, touch = null;
    function size() { var r = sec.getBoundingClientRect(); Wd = r.width; Ht = r.height; cv.width = Wd * dpr; cv.height = Ht * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); W.addEventListener("resize", size);
    function lives() { $("[data-bb-lives]", sec).innerHTML = new Array(S.lives + 1).join("<i></i>"); }
    function spawn(x, y, r) {
      var a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 1.4 + S.level * 0.15;
      if (x == null) { var edge = Math.random() * 4 | 0; x = edge === 0 ? -40 : edge === 1 ? Wd + 40 : Math.random() * Wd; y = edge === 2 ? -40 : edge === 3 ? Ht + 40 : Math.random() * Ht; }
      S.beans.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: r || 34 + Math.random() * 14, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.05, img: beanImgs[Math.random() * 8 | 0] });
    }
    function start() {
      over.hidden = true; hud.hidden = false; sec.classList.add("is-playing"); DD.lockScroll(true);
      S = { ship: { x: Wd * 0.62, y: Ht * 0.45, a: -Math.PI / 2, vx: 0, vy: 0, inv: 90 }, beans: [], shots: [], parts: [], score: 0, lives: 3, level: 1, cd: 0, t: 0 };
      for (var i = 0; i < 5; i++) spawn();
      lives(); $("[data-bb-score]", sec).textContent = 0; $("[data-bb-best]", sec).textContent = best;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    }
    function stop(showOver) {
      cancelAnimationFrame(raf); sec.classList.remove("is-playing"); DD.lockScroll(false);
      if (showOver) { over.hidden = false; $("[data-bb-final]", sec).textContent = S.score; } else { hud.hidden = true; ctx.clearRect(0, 0, Wd, Ht); }
    }
    function boom(x, y, n, col) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, s = 1 + Math.random() * 4; S.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 30 + Math.random() * 20, c: col }); } }
    function fire() { var s = S.ship; S.shots.push({ x: s.x + Math.cos(s.a) * 22, y: s.y + Math.sin(s.a) * 22, vx: Math.cos(s.a) * 9 + s.vx, vy: Math.sin(s.a) * 9 + s.vy, life: 70 }); S.cd = 9; }
    function wrapP(o, m) { if (o.x < -m) o.x = Wd + m; if (o.x > Wd + m) o.x = -m; if (o.y < -m) o.y = Ht + m; if (o.y > Ht + m) o.y = -m; }
    function drawShip(s) {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a + Math.PI / 2);
      if (s.inv > 0 && (s.inv >> 3) % 2) ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#1a1a1a"; ctx.strokeStyle = "#f0ede8"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 4, 20, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 8, 0, Math.PI, 0); ctx.fillStyle = "#f0ede8"; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(-5, -11); ctx.lineTo(5, -11); ctx.closePath(); ctx.fillStyle = "#1a1a1a"; ctx.fill();
      if (keys.up) { ctx.beginPath(); ctx.moveTo(-6, 12); ctx.lineTo(0, 22 + Math.random() * 8); ctx.lineTo(6, 12); ctx.fillStyle = "#f0ede8"; ctx.fill(); }
      ctx.restore();
    }
    function loop() {
      var s = S.ship; S.t++;
      if (touch) { var dx = touch.x - s.x, dy = touch.y - s.y; s.a = Math.atan2(dy, dx); if (Math.hypot(dx, dy) > 40) { s.vx += Math.cos(s.a) * 0.22; s.vy += Math.sin(s.a) * 0.22; } if (S.cd <= 0) fire(); }
      if (keys.left) s.a -= 0.075; if (keys.right) s.a += 0.075;
      if (keys.up) { s.vx += Math.cos(s.a) * 0.18; s.vy += Math.sin(s.a) * 0.18; }
      if (keys.down) { s.vx *= 0.92; s.vy *= 0.92; }
      if (keys.fire && S.cd <= 0) fire();
      s.vx *= 0.99; s.vy *= 0.99; s.x += s.vx; s.y += s.vy; wrapP(s, 20); S.cd--; s.inv > 0 && s.inv--;
      S.shots.forEach(function (b) { b.x += b.vx; b.y += b.vy; b.life--; wrapP(b, 4); });
      S.shots = S.shots.filter(function (b) { return b.life > 0; });
      S.beans.forEach(function (b) { b.x += b.vx; b.y += b.vy; b.rot += b.vr; wrapP(b, b.r); });
      for (var i = S.beans.length - 1; i >= 0; i--) {
        var b = S.beans[i];
        for (var j = S.shots.length - 1; j >= 0; j--) { var sh = S.shots[j]; if (Math.hypot(sh.x - b.x, sh.y - b.y) < b.r * 0.8) {
          S.shots.splice(j, 1); S.beans.splice(i, 1); boom(b.x, b.y, 14, "#4a2510"); S.score += b.r > 30 ? 20 : 50;
          if (b.r > 30) { spawn(b.x, b.y, b.r * 0.6); spawn(b.x, b.y, b.r * 0.6); }
          $("[data-bb-score]", sec).textContent = S.score; break; } }
        if (S.beans[i] === b && s.inv <= 0 && Math.hypot(s.x - b.x, s.y - b.y) < b.r * 0.7 + 12) {
          S.lives--; lives(); boom(s.x, s.y, 30, "#1a1a1a"); s.x = Wd / 2; s.y = Ht / 2; s.vx = s.vy = 0; s.inv = 120;
          if (S.lives <= 0) { if (S.score > best) { best = S.score; try { localStorage.setItem("dd-bb-best", best); } catch (e) {} } $("[data-bb-best]", sec).textContent = best; return stop(true); }
        }
      }
      if (!S.beans.length) { S.level++; for (var n = 0; n < 4 + S.level; n++) spawn(); }
      S.parts.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96; p.life--; });
      S.parts = S.parts.filter(function (p) { return p.life > 0; });
      ctx.clearRect(0, 0, Wd, Ht);
      S.beans.forEach(function (b) { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); if (b.img.complete) ctx.drawImage(b.img, -b.r, -b.r, b.r * 2, b.r * 2); ctx.restore(); });
      ctx.fillStyle = "#1a1a1a"; S.shots.forEach(function (b) { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, 6.28); ctx.fill(); });
      S.parts.forEach(function (p) { ctx.globalAlpha = p.life / 50; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 3, 3); }); ctx.globalAlpha = 1;
      drawShip(s);
      raf = requestAnimationFrame(loop);
    }
    var map = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down", " ": "fire" };
    D.addEventListener("keydown", function (e) { if (!sec.classList.contains("is-playing")) return; if (e.key === "Escape") { stop(false); return; } var k = map[e.key]; if (k) { keys[k] = true; e.preventDefault(); } });
    D.addEventListener("keyup", function (e) { var k = map[e.key]; if (k) keys[k] = false; });
    cv.addEventListener("pointerdown", function (e) { if (!sec.classList.contains("is-playing") || e.pointerType === "mouse") return; var r = cv.getBoundingClientRect(); touch = { x: e.clientX - r.left, y: e.clientY - r.top }; });
    cv.addEventListener("pointermove", function (e) { if (!touch) return; var r = cv.getBoundingClientRect(); touch.x = e.clientX - r.left; touch.y = e.clientY - r.top; });
    W.addEventListener("pointerup", function () { touch = null; });
    $("[data-bb-play]", sec).addEventListener("click", function () { start(); this.blur(); });
    $("[data-bb-again]", sec).addEventListener("click", start);
    $("[data-bb-best]", sec).textContent = best;
  }
})();
