/* ទេសចរណ៍ ថ្នាក់ទី១១ — interactive lessons (no build step, GitHub Pages ready) */
(function () {
"use strict";

/* ---------- helpers ---------- */
const KH = "០១២៣៤៥៦៧៨៩";
const kh = n => String(n).replace(/\d/g, d => KH[d]);
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const app = $("#app");

/* ---------- progress (browser storage, per student device) ---------- */
const KEY = "tourism11-progress";
let P = { quiz: {}, acts: {}, name: "", pledges: [], reviews: {} };
try { const s = localStorage.getItem(KEY); if (s) P = Object.assign(P, JSON.parse(s)); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} updateStamps(); };
const hasStamp = id => (P.quiz[id] || 0) >= SITE.passScore;
function updateStamps() { const n = LESSONS.filter(l => hasStamp(l.id)).length; const el = $("#stampCount"); if (el) el.textContent = kh(n); }
function markAct(lid, i) { P.acts[lid + "-" + i] = true; save(); }

function toast(msg) {
  let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 2400);
}
function confetti() {
  const c = document.createElement("canvas"); c.className = "confetti"; document.body.appendChild(c);
  const x = c.getContext("2d"); c.width = innerWidth; c.height = innerHeight;
  const cols = ["#B5542D", "#2F7D5B", "#1F6F99", "#D9A23B", "#D1495B"];
  const ps = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .5, v: 2 + Math.random() * 4, r: 4 + Math.random() * 5, c: cols[Math.floor(Math.random() * 5)], s: Math.random() * 6 }));
  let f = 0; (function step() { x.clearRect(0, 0, c.width, c.height); ps.forEach(p => { p.y += p.v; p.x += Math.sin((f + p.s) / 10); x.fillStyle = p.c; x.fillRect(p.x, p.y, p.r, p.r * 1.6); }); if (++f < 160) requestAnimationFrame(step); else c.remove(); })();
}

/* ---------- router ---------- */
function route() {
  const h = location.hash.replace(/^#\/?/, "").split("/");
  const page = h[0] || "home";
  $$("#mainnav a").forEach(a => a.classList.toggle("on", a.dataset.nav === (page === "lesson" ? "home" : page)));
  document.documentElement.style.removeProperty("--c");
  if (page === "lesson") renderLesson(+h[1], h[2] || "learn");
  else if (page === "map") renderMapPage();
  else if (page === "glossary") renderGlossary();
  else if (page === "passport") renderPassport();
  else if (page === "review") renderReview(+h[1] || 1);
  else if (page === "teacher") renderTeacher();
  else renderHome();
  window.scrollTo(0, 0); app.focus({ preventScroll: true });
}
addEventListener("hashchange", route);

/* ---------- home ---------- */
function renderHome() {
  const got = LESSONS.filter(l => hasStamp(l.id)).length;
  const card = l => `
    <a class="card" href="#/lesson/${l.id}" style="--c:${l.color}">
      <span class="stamp-mini ${hasStamp(l.id) ? "got" : ""}">${hasStamp(l.id) ? "✓" : kh(l.id)}</span>
      <span class="ico">${l.icon}</span>
      <span class="num">មេរៀនទី${kh(l.id)} · ម៉ោងទី${l.sessions}</span>
      <h3>${esc(l.title)}</h3>
      <span class="tag">${esc(l.tagline)}</span>
    </a>`;
  app.innerHTML = `
  <section class="hero">
    <svg class="temple" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 4l4 9h-8z M24 16h16l3 8H21z M18 27h28l4 10H14z M10 40h44l4 14H6z" fill="#fff"/></svg>
    <h1>${esc(SITE.title)}</h1>
    <p>រៀន លេង តេស្ត ហើយប្រមូលត្រាលើ <b>លិខិតឆ្លងដែនទេសចរ</b> របស់អ្នក! ធ្វើតេស្តមេរៀននីមួយៗបាន ${kh(SITE.passScore)}% ឡើងទៅ ដើម្បីទទួលត្រា។</p>
    <div class="progressbar"><span style="width:${got / LESSONS.length * 100}%"></span></div>
    <div class="meta">ត្រាដែលបានទទួល៖ ${kh(got)} / ${kh(LESSONS.length)} ${P.name ? "· " + esc(P.name) : ""}</div>
  </section>
  <div class="sem-title"><h2>ឆមាសទី១</h2><span class="line"></span></div>
  <div class="grid">${LESSONS.filter(l => l.semester === 1).map(card).join("")}</div>
  <div class="sem-title"><h2>ឆមាសទី២</h2><span class="line"></span></div>
  <div class="grid">${LESSONS.filter(l => l.semester === 2).map(card).join("")}</div>
  <div class="sem-title"><h2>ឧបករណ៍រៀនបន្ថែម</h2><span class="line"></span></div>
  <div class="extras">
    <a class="extra" href="#/map"><span>🗺️</span><div><b>ផែនទីទេសចរណ៍កម្ពុជា</b><small>តំបន់៤ និងកន្លែងល្បីៗ ${kh(PLACES.length)}</small></div></a>
    <a class="extra" href="#/glossary"><span>📇</span><div><b>កាតវាក្យសព្ទ</b><small>ខ្មែរ–អង់គ្លេស ${kh(GLOSSARY.length)}ពាក្យ</small></div></a>
    <a class="extra" href="#/review/1"><span>📝</span><div><b>តេស្តរំលឹកឆមាសទី១</b><small>មេរៀនទី១-៦ (ម៉ោងទី១៧)</small></div></a>
    <a class="extra" href="#/review/2"><span>🏆</span><div><b>តេស្តរំលឹកឆមាសទី២</b><small>មេរៀនទី១-១២ (ម៉ោងទី៣៤)</small></div></a>
    <a class="extra" href="#/passport"><span>🛂</span><div><b>លិខិតឆ្លងដែនទេសចរ</b><small>ត្រា និងវិញ្ញាបនបត្រ</small></div></a>
  </div>`;
}

/* ---------- lesson ---------- */
const TABS = [["learn", "📖 មេរៀន"], ["play", "🎮 សកម្មភាព"], ["quiz", "✅ តេស្ត"], ["more", "🎬 ឯកសារបន្ថែម"]];
function renderLesson(id, tab) {
  const L = LESSONS.find(l => l.id === id); if (!L) return renderHome();
  document.documentElement.style.setProperty("--c", L.color);
  const prev = LESSONS.find(l => l.id === id - 1), next = LESSONS.find(l => l.id === id + 1);
  app.innerHTML = `
  <section class="lhead">
    <a class="back" href="#/">← មេរៀនទាំងអស់</a>
    <span class="big">${L.icon}</span>
    <h1>មេរៀនទី${kh(L.id)} · ${esc(L.title)}</h1>
    <p>ម៉ោងទី${L.sessions} · ${esc(L.tagline)}</p>
  </section>
  <nav class="tabs">${TABS.map(([k, t]) => `<a href="#/lesson/${id}/${k}" class="${k === tab ? "on" : ""}">${t}</a>`).join("")}</nav>
  <div id="tabbody"></div>
  <div class="lnav">
    ${prev ? `<a href="#/lesson/${prev.id}">← មេរៀនទី${kh(prev.id)}<br><small>${esc(prev.title)}</small></a>` : "<span></span>"}
    ${next ? `<a href="#/lesson/${next.id}" style="text-align:right">មេរៀនទី${kh(next.id)} →<br><small>${esc(next.title)}</small></a>` : `<a href="#/review/2" style="text-align:right">តេស្តរំលឹកចុងឆ្នាំ →</a>`}
  </div>`;
  const B = $("#tabbody");
  if (tab === "learn") B.innerHTML = learnHTML(L);
  else if (tab === "play") renderActivities(L, B);
  else if (tab === "quiz") runQuiz(B, L.quiz.map(q => Object.assign({ lid: L.id }, q)), score => {
    const before = hasStamp(L.id);
    P.quiz[L.id] = Math.max(P.quiz[L.id] || 0, score); save();
    if (!before && hasStamp(L.id)) { confetti(); toast("🛂 អ្នកទទួលបានត្រាមេរៀនទី" + kh(L.id) + "!"); }
  }, `<a class="btn ghost" href="#/lesson/${L.id}/learn">អានមេរៀនម្តងទៀត</a> <a class="btn" href="#/passport">មើលលិខិតឆ្លងដែន</a>`);
  else B.innerHTML = moreHTML(L);
}

function learnHTML(L) {
  return `
  <div class="box"><h2>🎯 ក្រោយមេរៀននេះ អ្នកអាច៖</h2><ul class="goals">${L.goals.map(g => `<li>${esc(g)}</li>`).join("")}</ul></div>
  <div class="box info"><h2>🖼️ ${esc(L.info.title)}</h2>${infoHTML(L.info)}</div>
  <div class="box"><h2>💡 ចំណុចសំខាន់</h2><div class="ideas">${L.ideas.map(i => `<div class="idea"><h3>${esc(i.h)}</h3><p>${esc(i.t)}</p></div>`).join("")}</div>
    <div class="callout"><b>💬 សំណួរពិភាក្សា៖</b> ${esc(L.discuss)}</div></div>
  <div style="text-align:center"><a class="btn" href="#/lesson/${L.id}/play">ទៅលេងសកម្មភាព →</a></div>`;
}

function infoHTML(I) {
  const pal = ["#B5542D", "#7A4FA0", "#1F6F99", "#2F7D5B", "#C27C0E"];
  if (I.type === "flow") return `<div class="flow">${I.steps.map((s, i) => `${i ? '<div class="arr">➜</div>' : ""}<div class="node ${s.hot ? "hot" : ""}"><h4>${s.h}</h4><p>${s.t}</p></div>`).join("")}</div>`;
  if (I.type === "cols") return `<div class="cols">${I.cols.map((c, i) => `<div class="col" style="--cc:${pal[i % 5]}"><h4>${c.h}</h4><ul>${c.items.map(x => `<li>${x}</li>`).join("")}</ul></div>`).join("")}</div>`;
  if (I.type === "pyramid") return `<div class="pyr">${I.levels.map((l, i) => `<div style="width:${40 + i * 25}%;opacity:${1 - i * .18}"><b>${l.h}</b><small>${l.t}</small></div>`).join("")}</div>`;
  if (I.type === "hub") return `<div class="hub"><div class="center">${I.center}</div>${I.nodes.map(n => `<div class="n"><b>${n.h}</b><small>${n.t}</small></div>`).join("")}</div>`;
  if (I.type === "steps") return `<div class="steps">${I.steps.map(s => `<div class="st"><b>${s.h}</b>${s.t ? `<small>${s.t}</small>` : ""}</div>`).join("")}</div>`;
  if (I.type === "compare") return `<div class="compare"><div class="row">${I.cards.map(c => `<div><b>${c.h}</b><small>${c.t}</small></div>`).join("")}</div><div class="scale"><span>◀ ${I.left}</span><span>${I.right} ▶</span></div></div>`;
  if (I.type === "compare2") return `<div class="cmp2"><div class="col" style="--cc:#E07A1F"><h4>${I.a.h}</h4><ul>${I.a.items.map(x => `<li>${x}</li>`).join("")}</ul></div><div class="vs">ទាក់ទាញ<br>ទេសចរ</div><div class="col" style="--cc:#1F6F99"><h4>${I.b.h}</h4><ul>${I.b.items.map(x => `<li>${x}</li>`).join("")}</ul></div></div>`;
  return "";
}

function moreHTML(L) {
  const yt = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
  return `
  <div class="mission box" style="box-shadow:none"><h3>🚀 បេសកកម្មក្រៅថ្នាក់</h3><p>${esc(L.mission)}</p></div>
  <div class="box"><h2>🎬 វីដេអូពាក់ព័ន្ធ</h2>
    <p class="intro" style="color:var(--muted)">ចុចដើម្បីស្វែងរកវីដេអូនៅលើ YouTube។ ជ្រើសវីដេអូពីប្រភពដែលគួរឱ្យទុកចិត្ត ហើយប្រាប់គ្រូពីអ្វីដែលបានរៀន។</p>
    <div class="media">${L.videos.map(v => `<a href="${yt(v)}" target="_blank" rel="noopener"><span>▶️</span><div>${esc(v)}<small>YouTube</small></div></a>`).join("")}</div></div>
  ${L.links.length ? `<div class="box"><h2>🔗 ប្រភពផ្លូវការ</h2><div class="media">${L.links.map(k => `<a href="${k.u}" target="_blank" rel="noopener"><span>🌐</span><div>${esc(k.t)}<small>${esc(new URL(k.u).hostname)}</small></div></a>`).join("")}</div></div>` : ""}
  <div class="box"><h2>📇 វាក្យសព្ទ</h2><p>រំលឹកពាក្យគន្លឹះខ្មែរ–អង់គ្លេស នៅ <a href="#/glossary">កាតវាក្យសព្ទ</a>។</p></div>`;
}

/* ---------- activities ---------- */
function renderActivities(L, B) {
  B.innerHTML = L.activities.map((a, i) => `<div class="box act" id="act${i}"><h2><span class="st">${P.acts[L.id + "-" + i] ? "✅" : "🎮"}</span> ${esc(a.title)}</h2>${a.intro ? `<p class="intro">${esc(a.intro)}</p>` : ""}<div class="actbody"></div></div>`).join("")
    + `<div style="text-align:center"><a class="btn" href="#/lesson/${L.id}/quiz">ត្រៀមខ្លួនហើយ? ធ្វើតេស្ត →</a></div>`;
  L.activities.forEach((a, i) => {
    const el = $(`#act${i} .actbody`, B), done = () => { markAct(L.id, i); $(`#act${i} h2 .st`).textContent = "✅"; };
    const f = { sort: actSort, match: actMatch, order: actOrder, flip: actFlip, scenario: actScenario, checklist: actChecklist, map: actMap, builder: toolBuilder, multiplier: toolMultiplier, clean: toolClean, plastic: toolPlastic }[a.type];
    if (f) f(el, a, done);
  });
}

function actSort(el, a, done) {
  let sel = null, placed = 0, right = 0;
  const items = shuffle(a.items.map((x, i) => Object.assign({ i }, x)));
  el.innerHTML = `<div class="chips">${items.map(x => `<button class="chip" data-i="${x.i}">${esc(x.t)}</button>`).join("")}</div>
    <div class="buckets">${a.buckets.map((b, k) => `<div class="bucket" data-b="${k}" role="button" tabindex="0"><h4>${esc(b)}</h4></div>`).join("")}</div>
    <div class="score"></div>`;
  const pool = $(".chips", el), arm = on => $$(".bucket", el).forEach(b => b.classList.toggle("armed", on));
  pool.addEventListener("click", e => {
    const c = e.target.closest(".chip"); if (!c) return;
    $$(".chip.sel", pool).forEach(x => x.classList.remove("sel"));
    sel = c; c.classList.add("sel"); arm(true);
  });
  const drop = bk => {
    if (!sel) { toast("ជ្រើសស្ថានការណ៍មួយសិន"); return; }
    const it = a.items[+sel.dataset.i], k = +bk.dataset.b;
    if (it.b === k) {
      const c = document.createElement("div"); c.className = "chip ok";
      c.innerHTML = esc(it.t) + (it.why ? `<span class="why">${esc(it.why)}</span>` : "");
      bk.appendChild(c); sel.remove(); sel = null; arm(false); placed++; right++;
    } else {
      sel.classList.add("bad"); const s = sel; setTimeout(() => s.classList.remove("bad"), 400);
      right -= .5; toast("ពុំទាន់ត្រូវ — សាកប្រអប់ផ្សេង");
    }
    if (placed === a.items.length) {
      const pct = Math.max(0, Math.round(right / a.items.length * 100));
      $(".score", el).innerHTML = `<div class="done-banner">🎉 រួចរាល់! ភាពត្រឹមត្រូវលើកដំបូង៖ ${kh(pct)}% <button class="btn ghost" style="margin-left:8px">លេងម្តងទៀត</button></div>`;
      $(".score button", el).onclick = () => actSort(el, a, done); done();
    }
  };
  $$(".bucket", el).forEach(b => { b.onclick = () => drop(b); b.onkeydown = e => { if (e.key === "Enter") drop(b); }; });
}

function actMatch(el, a, done) {
  const L = a.pairs.map((p, i) => ({ t: p[0], i })), R = shuffle(a.pairs.map((p, i) => ({ t: p[1], i })));
  let pick = null, got = 0, miss = 0;
  el.innerHTML = `<div class="match"><div class="side l">${shuffle(L).map(x => `<button class="chip" data-i="${x.i}">${esc(x.t)}</button>`).join("")}</div>
    <div class="side r">${R.map(x => `<button class="chip" data-i="${x.i}">${esc(x.t)}</button>`).join("")}</div></div><div class="score"></div>`;
  $(".l", el).onclick = e => { const c = e.target.closest(".chip:not(.ok)"); if (!c) return; $$(".l .chip", el).forEach(x => x.classList.remove("sel")); pick = c; c.classList.add("sel"); };
  $(".r", el).onclick = e => {
    const c = e.target.closest(".chip:not(.ok)"); if (!c) return;
    if (!pick) { toast("ជ្រើសខាងឆ្វេងមុន"); return; }
    if (c.dataset.i === pick.dataset.i) { c.classList.add("ok"); pick.classList.add("ok"); pick.classList.remove("sel"); pick = null; got++; }
    else { miss++; c.classList.add("bad"); setTimeout(() => c.classList.remove("bad"), 400); }
    if (got === a.pairs.length) { $(".score", el).innerHTML = `<div class="done-banner">🎉 ផ្គូផ្គងត្រូវទាំងអស់! ចំនួនខុស៖ ${kh(miss)} <button class="btn ghost">លេងម្តងទៀត</button></div>`; $(".score button", el).onclick = () => actMatch(el, a, done); done(); }
  };
}

function actOrder(el, a, done) {
  let cur = shuffle(a.items.map((t, i) => ({ t, i })));
  if (cur.every((x, k) => x.i === k)) cur.reverse();
  const draw = () => {
    el.innerHTML = `<div class="order"><ol>${cur.map((x, k) => `<li data-k="${k}"><span class="n">${kh(k + 1)}</span><span class="t">${esc(x.t)}</span><button class="mv up" aria-label="ឡើង">▲</button><button class="mv dn" aria-label="ចុះ">▼</button></li>`).join("")}</ol></div>
      <p><button class="btn chk">ពិនិត្យចម្លើយ</button></p><div class="score"></div>`;
    $$("li", el).forEach(li => {
      const k = +li.dataset.k;
      $(".up", li).onclick = () => { if (k > 0) { [cur[k - 1], cur[k]] = [cur[k], cur[k - 1]]; draw(); } };
      $(".dn", li).onclick = () => { if (k < cur.length - 1) { [cur[k + 1], cur[k]] = [cur[k], cur[k + 1]]; draw(); } };
    });
    $(".chk", el).onclick = () => {
      let ok = 0; $$("li", el).forEach((li, k) => { const r = cur[k].i === k; ok += r; li.classList.add(r ? "ok" : "bad"); });
      $(".score", el).innerHTML = ok === cur.length ? `<div class="done-banner">🎉 ត្រឹមត្រូវទាំងអស់!</div>` : `<p class="warn">ត្រូវ ${kh(ok)}/${kh(cur.length)} — រៀបឡើងវិញ ហើយពិនិត្យម្តងទៀត។</p>`;
      if (ok === cur.length) done();
    };
  };
  draw();
}

function actFlip(el, a, done) {
  let seen = new Set();
  el.innerHTML = `<div class="flips">${a.cards.map((c, i) => `<button class="flip" data-i="${i}"><div class="in"><div class="f">${esc(c[0])}</div><div class="b">${esc(c[1])}</div></div></button>`).join("")}</div><div class="score"></div>`;
  $$(".flip", el).forEach(f => f.onclick = () => { f.classList.toggle("on"); seen.add(f.dataset.i); if (seen.size === a.cards.length) { $(".score", el).innerHTML = `<div class="done-banner">🎉 អ្នកបានមើលកាតទាំងអស់ហើយ! សាកណែនាំម្ហូបមួយជាភាសាអង់គ្លេសឱ្យមិត្តស្តាប់។</div>`; done(); } });
}

function actScenario(el, a, done) {
  let k = 0, pts = 0;
  const draw = () => {
    if (k >= a.cases.length) {
      const pct = Math.round(pts / (a.cases.length * 2) * 100);
      el.innerHTML = `<div class="result"><div class="bignum">${kh(pct)}%</div><p>${pct >= 80 ? "🌟 អ្នកជាបុគ្គលិកបដិសណ្ឋារកិច្ចឆ្នើម!" : "ល្អហើយ! អានចំណុចទាំង១៤ម្តងទៀត ហើយសាកម្តងទៀត។"}</p><button class="btn">លេងម្តងទៀត</button></div>`;
      $("button", el).onclick = () => actScenario(el, a, done); done(); return;
    }
    const c = a.cases[k], opts = shuffle(c.o);
    el.innerHTML = `<div class="scn"><div class="dots">${a.cases.map((_, i) => `<i class="${i <= k ? "on" : ""}"></i>`).join("")}</div>
      <div class="q">📍 ${esc(c.s)}</div><div class="opts">${opts.map((o, i) => `<button data-i="${i}">${esc(o.t)}</button>`).join("")}</div><div class="fbw"></div></div>`;
    $(".opts", el).onclick = e => {
      const b = e.target.closest("button"); if (!b || el._lock) return; el._lock = true;
      const o = opts[+b.dataset.i]; pts += o.s;
      $(".fbw", el).innerHTML = `<div class="fb g${o.s}">${o.s === 2 ? "✅" : o.s === 1 ? "🟡" : "❌"} ${esc(o.f)}</div><p><button class="btn nx">បន្ទាប់ →</button></p>`;
      $(".nx", el).onclick = () => { el._lock = false; k++; draw(); };
    };
  };
  draw();
}

function actChecklist(el, a, done) {
  el.innerHTML = `<div class="check">${a.items.map((t, i) => `<label><input type="checkbox" data-i="${i}"><span>${kh(i + 1)}. ${esc(t)}</span></label>`).join("")}</div>
    <div class="meter"><span style="width:0"></span></div><div class="score">០ / ${kh(a.items.length)}</div><p><button class="btn ghost rs">ចាប់ផ្តើមក្រុមថ្មី</button></p>`;
  const up = () => { const n = $$("input:checked", el).length; $(".meter span", el).style.width = n / a.items.length * 100 + "%"; $(".score", el).textContent = `${kh(n)} / ${kh(a.items.length)} ${n === a.items.length ? "🌟 ឥតខ្ចោះ!" : ""}`; if (n >= 10) done(); };
  el.addEventListener("change", up); $(".rs", el).onclick = () => { $$("input", el).forEach(x => x.checked = false); up(); };
}

/* ---------- quiz engine ---------- */
function runQuiz(el, qs, onEnd, after) {
  let k = 0, right = 0; qs = qs.slice();
  const draw = () => {
    if (k >= qs.length) {
      const pct = Math.round(right / qs.length * 100); onEnd && onEnd(pct);
      el.innerHTML = `<div class="box result"><div class="bignum">${kh(pct)}%</div><p>ត្រូវ ${kh(right)} / ${kh(qs.length)} សំណួរ</p>
        <p>${pct >= SITE.passScore ? "🛂 អបអរសាទរ! អ្នកបានឆ្លងកាត់ ហើយទទួលបានត្រា។" : `ត្រូវការ ${kh(SITE.passScore)}% ដើម្បីទទួលត្រា។ សាកម្តងទៀត!`}</p>
        <p><button class="btn again">ធ្វើម្តងទៀត</button> ${after || ""}</p></div>`;
      $(".again", el).onclick = () => runQuiz(el, shuffle(qs), onEnd, after); return;
    }
    const q = qs[k], order = shuffle(q.o.map((t, i) => ({ t, i })));
    el.innerHTML = `<div class="box qcard"><div class="dots">${qs.map((_, i) => `<i class="${i <= k ? "on" : ""}"></i>`).join("")}</div>
      <div class="qn">សំណួរទី${kh(k + 1)} / ${kh(qs.length)}${q.lid ? ` · មេរៀនទី${kh(q.lid)}` : ""}</div><div class="qq">${esc(q.q)}</div>
      <div class="opts">${order.map(o => `<button data-i="${o.i}">${esc(o.t)}</button>`).join("")}</div><div class="fbw"></div></div>`;
    let locked = false;
    $(".opts", el).onclick = e => {
      const b = e.target.closest("button"); if (!b || locked) return; locked = true;
      const ok = +b.dataset.i === q.a; if (ok) right++;
      b.classList.add(ok ? "ok" : "bad"); if (!ok) $(`.opts button[data-i="${q.a}"]`, el).classList.add("ok");
      $(".fbw", el).innerHTML = `<div class="fb ${ok ? "g2" : "g0"}">${ok ? "✅ ត្រឹមត្រូវ!" : "❌ ពុំទាន់ត្រូវ។"} ${q.why ? esc(q.why) : ""}</div><p><button class="btn nx">${k + 1 < qs.length ? "បន្ទាប់ →" : "មើលលទ្ធផល"}</button></p>`;
      $(".nx", el).onclick = () => { k++; draw(); };
    };
  };
  draw();
}

/* ---------- special tools ---------- */
function actMap(el) { el.innerHTML = `<div class="lmap" id="lmap"></div><p><a href="#/map">បើកផែនទីពេញអេក្រង់ →</a></p>`; setTimeout(() => buildMap($("#lmap", el)), 30); }

function buildMap(node, legendEl) {
  if (!window.L) { node.innerHTML = "<p style='padding:20px'>ផែនទីត្រូវការអ៊ីនធឺណិត។</p>"; return; }
  const m = L.map(node, { scrollWheelZoom: false }).setView([12.4, 104.9], 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" }).addTo(m);
  const groups = ZONES.map(() => L.layerGroup().addTo(m));
  PLACES.forEach(p => {
    const z = ZONES[p.z];
    L.circleMarker(p.ll, { radius: 9, color: "#fff", weight: 2, fillColor: z.color, fillOpacity: .95 })
      .bindPopup(`<b>${esc(p.n)}</b><br><span style="color:${z.color}">● ${esc(z.name)}</span><br>${esc(p.d)}`)
      .bindTooltip(p.n).addTo(groups[p.z]);
  });
  if (legendEl) {
    legendEl.innerHTML = ZONES.map((z, i) => `<button data-z="${i}"><i style="background:${z.color}"></i>${esc(z.name)}</button>`).join("");
    legendEl.onclick = e => { const b = e.target.closest("button"); if (!b) return; const g = groups[+b.dataset.z]; if (m.hasLayer(g)) { m.removeLayer(g); b.classList.add("off"); } else { m.addLayer(g); b.classList.remove("off"); } };
  }
  return m;
}

function renderMapPage() {
  document.documentElement.style.setProperty("--c", "#1F6F99");
  app.innerHTML = `<h1>🗺️ ផែនទីទេសចរណ៍កម្ពុជា</h1>
    <p>ចុចលើចំណុចដើម្បីអានព័ត៌មាន។ ចុចលើឈ្មោះតំបន់ ដើម្បីបិទ/បើកការបង្ហាញ។ (ទីតាំងប្រហាក់ប្រហែល សម្រាប់ការសិក្សា)</p>
    <div class="legend" id="legend"></div><div id="map"></div>
    <div class="box" style="margin-top:16px"><h2>🧭 បេសកកម្មផែនទី</h2>
    <ol><li>រកប្រាសាទដែលជាបេតិកភណ្ឌពិភពលោកទាំង៤ (អង្គរ · ព្រះវិហារ · សំបូរព្រៃគុក · កោះកេរ)។</li><li>បើអ្នកចាប់ផ្តើមពីភ្នំពេញ តើតំបន់ណានៅជិតជាងគេ? តំបន់ណាឆ្ងាយជាងគេ?</li><li>រកកន្លែងទេសចរណ៍ដែលនៅជិតខេត្តរបស់អ្នកបំផុត។</li></ol>
    <p><a href="#/lesson/3">← ត្រឡប់ទៅមេរៀនទី៣</a></p></div>`;
  setTimeout(() => buildMap($("#map"), $("#legend")), 30);
}

const PRICES = {
  dest: [
    { n: "សៀមរាប · ប្រាសាទអង្គរ", ticket: 37, dist: "far" },
    { n: "ភ្នំពេញ · ព្រះបរមរាជវាំង និងសារមន្ទីរ", ticket: 15, dist: "near" },
    { n: "កំពត-កែប · ភ្នំបូកគោ និងឆ្នេរកែប", ticket: 5, dist: "mid" },
    { n: "ក្រចេះ · មើលផ្សោតទន្លេ", ticket: 9, dist: "mid" },
    { n: "ខេត្តរបស់ខ្ញុំ (កំណត់ដោយខ្លួនឯង)", ticket: 5, dist: "near" }
  ],
  bus: { near: 120, mid: 180, far: 250 }
};
const SERVICES = [
  { k: "bus", n: "រថយន្ត ២៥កន្លែង (ក្នុង១ក្រុម)", core: 1, per: "group", p: d => PRICES.bus[d.dist] },
  { k: "guide", n: "មគ្គុទ្ទេសក៍ (ក្នុង១ក្រុម)", core: 1, per: "group", p: () => 40 },
  { k: "lunch", n: "អាហារថ្ងៃត្រង់", core: 1, per: "person", p: () => 5 },
  { k: "snack", n: "អាហារសម្រន់ និងទឹក", core: 1, per: "person", p: () => 2 },
  { k: "ticket", n: "សំបុត្រចូលទស្សនា", core: 0, per: "person", p: d => d.ticket },
  { k: "ins", n: "ធានារ៉ាប់រងការធ្វើដំណើរ", core: 0, per: "person", p: () => 2 },
  { k: "boat", n: "ជិះទូក ឬជិះកង់កម្សាន្ត", core: 0, per: "person", p: () => 6 }
];
function toolBuilder(el, a, done) {
  el.innerHTML = `<div class="tool">
    <label>ឈ្មោះក្រុមហ៊ុនទេសចរណ៍របស់ក្រុម</label><input type="text" id="tbName" placeholder="ឧ. ដំណើរខ្មែរស្រស់">
    <label>គោលដៅ</label><select id="tbDest">${PRICES.dest.map((d, i) => `<option value="${i}">${esc(d.n)}</option>`).join("")}</select>
    <label>ចំនួនភ្ញៀវ: <span id="tbN">២០</span> នាក់</label><input class="range" type="range" id="tbPeople" min="5" max="25" value="20">
    <label>សេវាក្នុងកញ្ចប់</label>
    <div class="opts2">${SERVICES.map(s => `<label><input type="checkbox" value="${s.k}" ${s.core ? "checked" : ""}>${esc(s.n)}<span class="tag2 ${s.core ? "core" : "extra"}">${s.core ? "ចម្បង" : "បន្ថែម"}</span></label>`).join("")}</div>
    <label>ប្រាក់ចំណេញភ្នាក់ងារ: <span id="tbMv">១៥</span>%</label><input class="range" type="range" id="tbMargin" min="0" max="30" value="15">
    <div class="receipt" id="tbOut"></div>
    <p class="noprint"><button class="btn" id="tbPrint">🖨️ បោះពុម្ពកញ្ចប់</button></p></div>`;
  const calc = () => {
    const d = PRICES.dest[+$("#tbDest", el).value], n = +$("#tbPeople", el).value, m = +$("#tbMargin", el).value;
    $("#tbN", el).textContent = kh(n); $("#tbMv", el).textContent = kh(m);
    const chosen = $$(".opts2 input:checked", el).map(x => SERVICES.find(s => s.k === x.value));
    let cost = 0;
    const rows = chosen.map(s => { const unit = s.p(d), per = s.per === "group" ? unit / n : unit; cost += per; return `<div class="row"><span>${esc(s.n)}${s.per === "group" ? ` <small>($${unit} ÷ ${kh(n)})</small>` : ""}</span><span>$${per.toFixed(2)}</span></div>`; });
    const price = cost * (1 + m / 100), cores = chosen.filter(s => s.core).length;
    $("#tbOut", el).innerHTML = `<b style="font-family:var(--head)">${esc($("#tbName", el).value || "កញ្ចប់ដំណើរ១ថ្ងៃ")}</b> · ${esc(d.n)}<br>
      ${rows.join("") || "<p>មិនទាន់ជ្រើសសេវា</p>"}
      <div class="row"><span>ថ្លៃដើមក្នុងមនុស្សម្នាក់</span><span>$${cost.toFixed(2)}</span></div>
      <div class="row tot"><span>តម្លៃលក់ក្នុងមនុស្សម្នាក់</span><span>$${price.toFixed(2)}</span></div>
      <p>${chosen.length < 2 ? '<span class="warn">⚠️ ខ្សែទស្សនកិច្ចត្រូវមានសេវាយ៉ាងតិច២!</span>' : cores < 2 ? '<span class="warn">⚠️ គួរមានសេវាចម្បងយ៉ាងតិច២ (ដឹកជញ្ជូន ម្ហូបអាហារ មគ្គុទ្ទេសក៍...)</span>' : '<span class="good">✔ កញ្ចប់នេះត្រឹមត្រូវតាមនិយមន័យខ្សែទស្សនកិច្ច</span>'}<br>
      <small style="color:var(--muted)">តម្លៃទាំងអស់ជាឧទាហរណ៍សម្រាប់អនុវត្តប៉ុណ្ណោះ។ សួរតម្លៃពិតពីអ្នកផ្តល់សេវាក្នុងតំបន់។ ចំណេញសរុប ≈ $${((price - cost) * n).toFixed(0)}</small></p>`;
    if (chosen.length >= 2 && cores >= 2) done();
  };
  el.addEventListener("input", calc); el.addEventListener("change", calc);
  $("#tbPrint", el).onclick = () => window.print(); calc();
}

function toolMultiplier(el, a, done) {
  const first = [["🏨 ផ្ទះស្នាក់", 35], ["🍲 ហាងបាយ", 25], ["🛺 តុកតុក", 15], ["🧺 ហាងវត្ថុអនុស្សាវរីយ៍", 15], ["🎟️ សំបុត្រទស្សនា", 10]];
  const second = ["👨‍🌾 កសិករ", "🐟 អ្នកនេសាទ", "🧑‍🍳 អ្នកលក់ផ្សារ", "🪡 សិប្បករ", "👷 កម្មករ"];
  el.innerHTML = `<label style="font-family:var(--head)">អ្នកស្រុកចាយបន្តក្នុងសហគមន៍៖ <span id="mr">៥០</span>% នៃប្រាក់ដែលទទួលបាន</label>
    <input class="range" type="range" id="mrate" min="10" max="90" step="10" value="50">
    <div class="flowmoney" id="mflow">${first.map(f => `<div class="m"><b>$${f[1]}</b>${f[0]}</div>`).join("")}</div>
    <p><button class="btn" id="mgo">💸 អ្នកស្រុកចាយបន្ត</button> <button class="btn ghost" id="mreset">ចាប់ផ្តើមវិញ</button></p>
    <div class="box" style="box-shadow:none;border:1px solid var(--line)"><div>ជុំទី <b id="mround">១</b> · ចំណូលសរុបក្នុងសហគមន៍</div><div class="bignum" id="mtotal">$១០០</div><div id="mnote" style="color:var(--muted)"></div></div>`;
  let round = 1, last = 100, total = 100;
  const rate = () => +$("#mrate", el).value / 100;
  const show = () => { $("#mround", el).textContent = kh(round); $("#mtotal", el).textContent = "$" + kh(Math.round(total)); $("#mr", el).textContent = kh(Math.round(rate() * 100)); };
  $("#mgo", el).onclick = () => {
    last = last * rate(); total += last; round++;
    const parts = second.map(() => last / second.length);
    $("#mflow", el).innerHTML = second.map((s, i) => `<div class="m pulse"><b>$${parts[i].toFixed(1)}</b>${s}</div>`).join("");
    setTimeout(() => $$("#mflow .m", el).forEach(x => x.classList.remove("pulse")), 600);
    $("#mnote", el).innerHTML = last < 1 ? `ប្រាក់ ១០០ ដុល្លារ បង្កើតចំណូលសរុបប្រហែល <b>$${kh(Math.round(100 / (1 - rate())))}</b> ក្នុងសហគមន៍។ ចាយក្នុងស្រុកកាន់តែច្រើន → ផលប្រយោជន៍កាន់តែធំ!` : `ប្រាក់ដែលមិនចាយក្នុងស្រុក (${kh(Math.round((1 - rate()) * 100))}%) «លេចធ្លាយ» ចេញទៅទិញទំនិញនាំចូល ឬសន្សំ។`;
    if (round >= 3) done(); if (last < 1) $("#mgo", el).disabled = true; show();
  };
  $("#mreset", el).onclick = () => toolMultiplier(el, a, done);
  $("#mrate", el).oninput = () => { if (round === 1) show(); else toolMultiplier(el, a, done); };
  show();
}

const STANDARDS = ["ការរៀបចំ និងគ្រប់គ្រងបរិស្ថាន (ទឹក ខ្យល់ សំឡេង)", "ភាពស្អាត (អគារ សួន បង្គន់ ផ្លូវ)", "ការគ្រប់គ្រងសំណល់ (សំរាមរឹង រាវ បែងចែក)", "ការបណ្តុះបណ្តាលការយល់ដឹង", "តំបន់បៃតង (ដើមឈើ សួនច្បារ)", "សុវត្ថិភាព សុខាភិបាល សណ្តាប់ធ្នាប់", "ហេដ្ឋារចនាសម្ព័ន្ធ (ផ្លូវ ផ្លាកសញ្ញា ទីសម្រាក)"];
function toolClean(el, a, done) {
  const v = STANDARDS.map(() => 1);
  el.innerHTML = STANDARDS.map((s, i) => `<div class="stdrow"><span>${kh(i + 1)}. ${esc(s)}</span><div class="seg" data-i="${i}">${[0, 1, 2].map(x => `<button data-v="${x}" class="${x === 1 ? "on" : ""}">${kh(x)}</button>`).join("")}</div></div>`).join("")
    + `<div class="box" style="box-shadow:none;border:1px solid var(--line);margin-top:12px;text-align:center"><div class="bignum" id="cp"></div><div class="flowers" id="cf"></div><div id="ct"></div></div>`;
  const up = () => {
    const pct = Math.round(v.reduce((s, x) => s + x, 0) / (STANDARDS.length * 2) * 100);
    const lv = pct >= 75 ? 3 : pct >= 60 ? 2 : pct >= 40 ? 1 : 0;
    $("#cp", el).textContent = kh(pct) + "%"; $("#cf", el).textContent = lv ? "🌸".repeat(lv) : "🌱";
    $("#ct", el).innerHTML = lv ? `សាលាយើងអាចទទួល <b>ផ្ការំដួល ${kh(lv)}ទង</b>` : "មិនទាន់ដល់កម្រិតរង្វាន់ (ត្រូវការ ≥៤០%) — តោះកែលម្អ!";
    const weak = v.map((x, i) => x === 0 ? STANDARDS[i] : null).filter(Boolean);
    if (weak.length) $("#ct", el).innerHTML += `<br><small>ចំណុចត្រូវកែលម្អជាបន្ទាន់៖ ${weak.map(esc).join(" · ")}</small>`;
  };
  $$(".seg", el).forEach(sg => sg.onclick = e => { const b = e.target.closest("button"); if (!b) return; v[+sg.dataset.i] = +b.dataset.v; $$("button", sg).forEach(x => x.classList.toggle("on", x === b)); up(); done(); });
  up();
}

const PLEDGES = ["យកកាបូបក្រណាត់ទៅផ្សារ", "យកដបទឹកផ្ទាល់ខ្លួនមកសាលា", "បដិសេធបំពង់បឺត និងស្លាបព្រាប្លាស្ទិច", "បែងចែកសំរាមនៅផ្ទះ", "កែច្នៃដបប្លាស្ទិច១ជាវត្ថុប្រើប្រាស់"];
function toolPlastic(el, a, done) {
  el.innerHTML = `<div class="tool">
    <label>ថង់ប្លាស្ទិចដែលគ្រួសារខ្ញុំប្រើក្នុង១ថ្ងៃ</label><input type="number" id="pb" min="0" max="100" value="5">
    <label>ចំនួនសិស្សក្នុងថ្នាក់ (គ្រួសារ)</label><input type="number" id="pc" min="1" max="80" value="40">
    <div class="box" style="box-shadow:none;border:1px solid var(--line);margin-top:12px">
      <div>គ្រួសារខ្ញុំក្នុង១ឆ្នាំ</div><div class="bignum" id="py"></div><div class="bags" id="pbags"></div>
      <div>ថ្នាក់យើងទាំងមូលក្នុង១ឆ្នាំ</div><div class="bignum" id="pcl"></div>
      <div id="pnote" style="color:var(--muted)"></div></div>
    <h3 style="margin-top:16px">🤝 ការប្តេជ្ញាចិត្ត 3R របស់ខ្ញុំ</h3>
    <div class="check">${PLEDGES.map((t, i) => `<label><input type="checkbox" data-p="${i}" ${P.pledges.includes(i) ? "checked" : ""}><span>${esc(t)}</span></label>`).join("")}</div></div>`;
  const up = () => {
    const b = Math.max(0, +$("#pb", el).value || 0), c = Math.max(1, +$("#pc", el).value || 1), y = b * 365;
    $("#py", el).textContent = kh(y.toLocaleString("en")) + " ថង់"; $("#pcl", el).textContent = kh((y * c).toLocaleString("en")) + " ថង់";
    $("#pbags", el).textContent = "🛍️".repeat(Math.min(200, Math.round(y / 10)));
    $("#pnote", el).innerHTML = `(១ រូប 🛍️ = ១០ ថង់) · បើយកកាបូបក្រណាត់ទៅផ្សារ ហើយកាត់បន្ថយបានពាក់កណ្តាល ថ្នាក់យើងនឹងកាត់បន្ថយបាន <b>${kh(Math.round(y * c / 2).toLocaleString("en"))}</b> ថង់ក្នុង១ឆ្នាំ!`;
  };
  $("#pb", el).oninput = up; $("#pc", el).oninput = up;
  $$("[data-p]", el).forEach(x => x.onchange = () => { const i = +x.dataset.p; P.pledges = P.pledges.filter(p => p !== i); if (x.checked) P.pledges.push(i); save(); if (P.pledges.length >= 2) { done(); toast("♻️ អរគុណសម្រាប់ការប្តេជ្ញាចិត្ត!"); } });
  up();
}

/* ---------- glossary ---------- */
function renderGlossary() {
  document.documentElement.style.setProperty("--c", "#7A4FA0");
  app.innerHTML = `<h1>📇 កាតវាក្យសព្ទ ខ្មែរ–អង់គ្លេស</h1><p>ចុចលើកាតដើម្បីត្រឡប់មើលពាក្យអង់គ្លេស និងន័យ។</p>
    <div class="gtools"><input id="gq" placeholder="ស្វែងរកពាក្យ... / search"><button class="btn ghost" id="gs">🔀 លាយកាត</button><button class="btn ghost" id="gm">🔁 ប្តូរទិស (EN→KH)</button></div>
    <div class="flips" id="gl"></div>`;
  let list = GLOSSARY.slice(), rev = false;
  const draw = () => {
    const q = $("#gq").value.trim().toLowerCase();
    $("#gl").innerHTML = list.filter(g => !q || g.join(" ").toLowerCase().includes(q)).map(g => `<button class="flip"><div class="in"><div class="f">${esc(rev ? g[1] : g[0])}</div><div class="b"><div><b style="font-family:var(--head)">${esc(rev ? g[0] : g[1])}</b><br>${esc(g[2])}</div></div></div></button>`).join("") || "<p>រកមិនឃើញ</p>";
  };
  $("#gl").onclick = e => { const f = e.target.closest(".flip"); if (f) f.classList.toggle("on"); };
  $("#gq").oninput = draw; $("#gs").onclick = () => { list = shuffle(list); draw(); }; $("#gm").onclick = () => { rev = !rev; draw(); };
  draw();
}

/* ---------- review tests ---------- */
function renderReview(n) {
  document.documentElement.style.setProperty("--c", n === 1 ? "#1F6F99" : "#B5542D");
  const pool = LESSONS.filter(l => n === 1 ? l.semester === 1 : true).flatMap(l => l.quiz.map(q => Object.assign({ lid: l.id }, q)));
  const best = P.reviews[n];
  app.innerHTML = `<h1>${n === 1 ? "📝 តេស្តរំលឹកឆមាសទី១" : "🏆 តេស្តរំលឹកឆមាសទី២"}</h1>
    <p>${n === 1 ? "មេរៀនទី១-៦" : "មេរៀនទី១-១២"} · សំណួរ១៥ ជ្រើសដោយចៃដន្យ រាល់ពេលខុសគ្នា។ ${best != null ? `ពិន្ទុល្អបំផុតរបស់អ្នក៖ <b>${kh(best)}%</b>` : ""}</p>
    <p><a href="#/review/${n === 1 ? 2 : 1}">→ ${n === 1 ? "តេស្តរំលឹកឆមាសទី២" : "តេស្តរំលឹកឆមាសទី១"}</a></p><div id="rv"></div>`;
  runQuiz($("#rv"), shuffle(pool).slice(0, 15), pct => { P.reviews[n] = Math.max(P.reviews[n] || 0, pct); save(); if (pct >= 80) confetti(); });
}

/* ---------- passport ---------- */
function renderPassport() {
  const got = LESSONS.filter(l => hasStamp(l.id));
  const all = got.length === LESSONS.length;
  app.innerHTML = `<div class="passport">
    <h1>🛂 លិខិតឆ្លងដែនទេសចរ</h1><div class="sub">ព្រះរាជាណាចក្រនៃការរៀនសូត្រ · ថ្នាក់ទី១១</div>
    <input id="pname" placeholder="សរសេរឈ្មោះរបស់អ្នក" value="${esc(P.name)}" aria-label="ឈ្មោះ">
    <div class="stamps">${LESSONS.map((l, i) => hasStamp(l.id)
      ? `<a class="stamp got" href="#/lesson/${l.id}" style="--c:${l.color};--r:${(i % 3 - 1) * 9}deg"><span><span class="e">${l.icon}</span>មេរៀនទី${kh(l.id)}<br>${kh(P.quiz[l.id])}%</span></a>`
      : `<a class="stamp" href="#/lesson/${l.id}/quiz"><span><span class="e" style="filter:grayscale(1);opacity:.5">${l.icon}</span>មេរៀនទី${kh(l.id)}<br>ធ្វើតេស្ត</span></a>`).join("")}</div>
    <p style="text-align:center;margin-top:14px">${kh(got.length)} / ${kh(LESSONS.length)} ត្រា ${all ? "· 🎓 អ្នកបានបញ្ចប់គ្រប់មេរៀន!" : ""}</p>
    <p class="noprint" style="text-align:center"><button class="btn" id="pprint" style="--c:#D9A23B;color:#2A2522">🖨️ បោះពុម្ព / រក្សាទុក PDF</button>
    <button class="btn ghost" id="preset">លុបវឌ្ឍនភាព</button></p>
    <p class="noprint" style="text-align:center;font-size:.82rem;opacity:.75">វឌ្ឍនភាពរក្សាទុកក្នុងកម្មវិធីរុករក (browser) លើឧបករណ៍នេះប៉ុណ្ណោះ។ បោះពុម្ព ឬថតអេក្រង់ ដើម្បីបង្ហាញគ្រូ។</p></div>`;
  $("#pname").oninput = e => { P.name = e.target.value; save(); };
  $("#pprint").onclick = () => window.print();
  $("#preset").onclick = () => { if (confirm("លុបពិន្ទុ និងត្រាទាំងអស់?")) { P = { quiz: {}, acts: {}, name: P.name, pledges: [], reviews: {} }; save(); renderPassport(); } };
}

/* ---------- teacher ---------- */
function renderTeacher() {
  document.documentElement.style.setProperty("--c", "#2F7D5B");
  const url = location.href.split("#")[0];
  app.innerHTML = `<div class="teacher"><h1>👩‍🏫 សម្រាប់គ្រូ</h1>
    <div class="box"><h2>ចែករំលែកជាមួយសិស្ស</h2><p>ឱ្យសិស្សស្កេន QR ឬបើកតំណ៖ <a href="${url}">${esc(url)}</a></p><div id="qr"></div></div>
    <div class="box"><h2>របៀបប្រើក្នុងម៉ោងសិក្សា (៤៥នាទី)</h2>
      <ol><li><b>ចាប់ផ្តើម (៥នាទី)</b> — បង្ហាញ infographic នៅលើ «📖 មេរៀន»។</li><li><b>មេរៀនថ្មី (២០នាទី)</b> — ពន្យល់ «ចំណុចសំខាន់» និងសំណួរពិភាក្សា។</li><li><b>អនុវត្ត (១៥នាទី)</b> — សិស្សលេង «🎮 សកម្មភាព» ជាក្រុម ឬម្នាក់ៗ។</li><li><b>បូកសរុប (៥នាទី)</b> — «✅ តេស្ត» ហើយសិស្សបង្ហាញត្រាលើលិខិតឆ្លងដែន។</li></ol>
      <p>វឌ្ឍនភាពរក្សាទុកនៅលើទូរស័ព្ទ/កុំព្យូទ័ររបស់សិស្សម្នាក់ៗ (មិនត្រូវការចុះឈ្មោះ)។ ឱ្យសិស្សបោះពុម្ព ឬថតអេក្រង់លិខិតឆ្លងដែន ដើម្បីបញ្ជាក់។</p></div>
    <div class="box"><h2>ផែនការម៉ោងសិក្សា ៣៤ម៉ោង</h2><table><tr><th>ម៉ោង</th><th>មេរៀន</th><th>សកម្មភាពលើគេហទំព័រ</th></tr>
      ${LESSONS.map(l => `<tr><td>${l.sessions}</td><td><a href="#/lesson/${l.id}">${kh(l.id)}. ${esc(l.title)}</a></td><td>${l.activities.map(a => esc(a.title.replace(/^[^៖]*៖\s*/, ""))).join(" · ")}</td></tr>`).join("")}
      <tr><td>១៧</td><td><a href="#/review/1">រំលឹក និងប្រឡងឆមាសទី១</a></td><td>តេស្តរំលឹក មេរៀនទី១-៦</td></tr>
      <tr><td>៣៤</td><td><a href="#/review/2">រំលឹក និងប្រឡងឆមាសទី២</a></td><td>តេស្តរំលឹក មេរៀនទី១-១២</td></tr></table></div>
    <div class="box"><h2>កែប្រែខ្លឹមសារ</h2><p>អត្ថបទ សំណួរ តំណវីដេអូ និងទីតាំងលើផែនទីទាំងអស់ នៅក្នុងឯកសារ <code>js/data.js</code>។ កែនៅលើ GitHub ហើយចុច Commit — គេហទំព័រនឹងធ្វើបច្ចុប្បន្នភាពក្នុងរយៈពេលប៉ុន្មាននាទី។</p></div></div>`;
  if (window.QRCode) new QRCode($("#qr"), { text: url, width: 180, height: 180 });
}

updateStamps(); route();
})();
