/* Teacher tools: teaching log, student lists, monthly tests, answer-sheet scanner, score book.
   All data stays in this browser (localStorage) — use Backup to save/move it. */
(function () {
"use strict";
const KEY = "t11-teacher-v1";
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KD = "០១២៣៤៥៦៧៨៩", kh = n => String(n).replace(/\d/g, d => KD[d]), unkh = s => String(s).replace(/[០-៩]/g, d => KD.indexOf(d));
const MONTHS = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];
const DAYS = ["អាទិត្យ", "ច័ន្ទ", "អង្គារ", "ពុធ", "ព្រហស្បតិ៍", "សុក្រ", "សៅរ៍"];
const L4 = ["A", "B", "C", "D"];
const LIBS = { jsqr: "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js", xlsx: "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js" };
const app = () => $("#app");

/* ---------- storage ---------- */
const DEF = () => ({
  v: 1, school: "", teacher: "",
  classes: [{ id: "11L", day: 6, time: "13:00" }, { id: "11C", day: 6, time: "14:00" }, { id: "11H", day: 6, time: "15:00" }, { id: "11M", day: 6, time: "16:00" }],
  log: [], students: {}, tests: [], scores: {}, backupAt: null, savedAt: null
});
let D;
try { D = Object.assign(DEF(), JSON.parse(localStorage.getItem(KEY) || "null") || {}); } catch (e) { D = DEF(); }
function save() { D.savedAt = new Date().toISOString(); try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { alert("រក្សាទុកមិនបាន៖ អង្គចងចាំកម្មវិធីរុករកពេញ។ សូមធ្វើ Backup។"); } }
function toast(m) { const t = document.getElementById("toast"); if (t) { t.textContent = m; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 2400); } }

/* ---------- dates ---------- */
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const pdate = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = pdate(s); d.setDate(d.getDate() + n); return iso(d); };
const monday = s => { const d = pdate(s); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return iso(d); };
const khDate = s => { const d = pdate(s); return `${DAYS[d.getDay()]} ${kh(d.getDate())} ${MONTHS[d.getMonth()]} ${kh(d.getFullYear())}`; };
const khShort = s => { const d = pdate(s); return `${kh(d.getDate())} ${MONTHS[d.getMonth()]}`; };

/* ---------- sessions (from the lesson plans) ---------- */
let SESS = null;
function sessions() {
  if (SESS) return SESS;
  SESS = {};
  if (typeof PLANS !== "undefined") for (let n = 1; n <= 12; n++) {
    (PLANS[n].html.match(/<h4>(.*?)<\/h4>/g) || []).forEach(h => {
      const m = h.replace(/<\/?h4>/g, "").match(/^ម៉ោងទី([០-៩0-9]+)\s*·\s*(.*)$/);
      if (m) SESS[+unkh(m[1])] = { n: +unkh(m[1]), t: m[2].replace(/&amp;/g, "&"), L: n };
    });
  }
  SESS[17] = { n: 17, t: "រំលឹក និងប្រឡងឆមាសទី១", L: 0 };
  SESS[34] = { n: 34, t: "រំលឹក និងប្រឡងឆមាសទី២", L: 0 };
  for (let n = 1; n <= 34; n++) if (!SESS[n]) SESS[n] = { n, t: "ម៉ោងទី" + kh(n), L: 0 };
  return SESS;
}
const sLabel = n => `ម៉ោងទី${kh(n)} · ${sessions()[n] ? sessions()[n].t : ""}`;

/* ---------- log helpers ---------- */
const entry = (c, d) => D.log.find(e => e.c === c && e.d === d);
const doneSessions = (c, until) => [...new Set(D.log.filter(e => e.c === c && e.st === "done" && (!until || e.d <= until)).map(e => e.s))].sort((a, b) => a - b);
function nextSession(c, beforeDate) {
  const done = D.log.filter(e => e.c === c && e.st === "done" && e.d < beforeDate).map(e => e.s);
  const last = done.length ? Math.max(...done) : 0;
  return Math.min(34, last + 1);
}
const cls = id => D.classes.find(c => c.id === id);

/* ---------- small UI helpers ---------- */
const head = (title, sub) => `<div class="thead"><span class="tbadge">🧑‍🏫 ទំព័រគ្រូ</span><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div>`;
const back = (h = "#/teacher", t = "ផ្ទាំងគ្រូ") => `<p class="noprint"><a href="${h}">← ${t}</a></p>`;
function backupNag() {
  const has = D.log.length || D.tests.length || Object.keys(D.students).length;
  if (!has) return "";
  const days = D.backupAt ? (Date.now() - new Date(D.backupAt)) / 864e5 : 999;
  return days > 7 ? `<div class="box warnbox noprint">💾 ទិន្នន័យទាំងអស់រក្សាទុកតែក្នុងទូរស័ព្ទ/កុំព្យូទ័រនេះ។ ${D.backupAt ? `Backup ចុងក្រោយ ${kh(Math.floor(days))} ថ្ងៃមុន។` : "មិនទាន់ធ្លាប់ Backup ទេ។"} <button class="btn" data-act="backup">💾 Backup ឥឡូវ</button></div>` : "";
}
function loadLib(name) {
  const g = name === "jsqr" ? "jsQR" : "XLSX";
  if (window[g]) return Promise.resolve(window[g]);
  return new Promise((ok, no) => { const s = document.createElement("script"); s.src = LIBS[name]; s.onload = () => ok(window[g]); s.onerror = () => no(new Error("load " + name)); document.head.appendChild(s); });
}
function download(name, data, type) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: type || "application/octet-stream" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function doBackup() {
  D.backupAt = new Date().toISOString(); save();
  download(`tourism11-teacher-backup-${today()}.json`, JSON.stringify(D, null, 1), "application/json");
  toast("💾 បានរក្សាទុកឯកសារ Backup");
}
document.addEventListener("click", e => { const b = e.target.closest("[data-act=backup]"); if (b) { e.preventDefault(); doBackup(); route(); } });
const route = () => window.dispatchEvent(new HashChangeEvent("hashchange"));

/* ---------- seeded random ---------- */
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const shuffle = (arr, r) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* =====================================================================
   1. TEACHING LOG
   ===================================================================== */
function renderLog(week) {
  const wk = monday(week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : today());
  const S = sessions();
  const periods = [];
  D.classes.filter(c => c.day != null && c.day !== "").forEach(c => {
    const off = (+c.day + 6) % 7; periods.push({ c: c.id, d: addDays(wk, off), time: c.time || "" });
  });
  periods.sort((a, b) => (a.d + a.time).localeCompare(b.d + b.time));
  const card = p => {
    const e = entry(p.c, p.d), sug = nextSession(p.c, p.d), future = p.d > today();
    const opts = n => Array.from({ length: 34 }, (_, i) => `<option value="${i + 1}" ${i + 1 === n ? "selected" : ""}>${esc(sLabel(i + 1))}</option>`).join("");
    const st = e ? (e.st === "done" ? `<span class="pill2 ok">✓ បានបង្រៀន</span>` : `<span class="pill2 off">✗ ឈប់${e.note ? " · " + esc(e.note) : ""}</span>`) : (future ? `<span class="pill2">មិនទាន់ដល់</span>` : `<span class="pill2 todo">មិនទាន់កត់</span>`);
    return `<div class="lcard ${e ? e.st : ""}" data-c="${p.c}" data-d="${p.d}">
      <div class="lc-top"><b class="lc-cls">${esc(p.c)}</b><span>${khDate(p.d)}${p.time ? " · " + kh(p.time) : ""}</span>${st}</div>
      <label class="lc-sel">ម៉ោងសិក្សា <select data-f="s">${opts(e && e.s ? e.s : sug)}</select></label>
      <div class="lc-btns"><button class="btn" data-f="done">✓ បានបង្រៀន</button><button class="btn ghost" data-f="off">✗ ឈប់ (បុណ្យ/ប្រជុំ)</button>${e ? `<button class="btn ghost" data-f="del">↺ លុប</button>` : ""}</div></div>`;
  };
  const prog = D.classes.map(c => {
    const done = doneSessions(c.id), last = done.length ? Math.max(...done) : 0, nx = Math.min(34, last + 1);
    return `<div class="prow"><b>${esc(c.id)}</b><div class="pbar"><span style="width:${done.length / 34 * 100}%"></span></div><span class="pnum">${kh(done.length)}/៣៤</span><small>បន្ទាប់៖ ${esc(sLabel(nx))}</small></div>`;
  }).join("");
  const recent = D.log.filter(e => !e.bulk).slice().sort((a, b) => b.d.localeCompare(a.d) || a.c.localeCompare(b.c)).slice(0, 30);
  app().innerHTML = back() + head("📅 កំណត់ហេតុបង្រៀនប្រចាំសប្តាហ៍", "កត់ម៉ោងដែលបានបង្រៀនរៀងរាល់សប្តាហ៍ — តេស្តប្រចាំខែនឹងចេញសំណួរតែពីម៉ោងដែលថ្នាក់នីមួយៗបានរៀនពិតប្រាកដ។") + backupNag()
  + `<div class="weeknav noprint"><a class="btn ghost" href="#/teacher/log/${addDays(wk, -7)}">« សប្តាហ៍មុន</a><b>${khShort(wk)} – ${khShort(addDays(wk, 6))} ${kh(pdate(wk).getFullYear())}</b><a class="btn ghost" href="#/teacher/log/${addDays(wk, 7)}">សប្តាហ៍ក្រោយ »</a> <a class="btn ghost" href="#/teacher/log">ថ្ងៃនេះ</a></div>
  <div class="lgrid">${periods.length ? periods.map(card).join("") : `<div class="box">មិនទាន់មានកាលវិភាគ — កំណត់នៅខាងក្រោម។</div>`}</div>
  <div class="box"><h2>📈 វឌ្ឍនភាពតាមថ្នាក់</h2>${prog}</div>
  <details class="box"><summary><h2 style="display:inline">⏩ ថ្នាក់បានបង្រៀនខ្លះៗរួចហើយ មុនប្រើកម្មវិធីនេះ?</h2></summary>
    <p>កត់ថាថ្នាក់បានបង្រៀនដល់ម៉ោងទីប៉ុន្មាន និងនៅថ្ងៃណា (សម្រាប់ជ្រើសសំណួរតេស្ត)។</p>
    <div class="frow"><select id="cuC">${D.classes.map(c => `<option>${esc(c.id)}</option>`).join("")}</select>
    <label>ដល់ម៉ោងទី <input id="cuN" type="number" min="1" max="34" value="4" style="width:5em"></label>
    <label>បញ្ចប់នៅថ្ងៃ <input id="cuD" type="date" value="${addDays(today(), -1)}"></label><button class="btn" id="cuGo">រក្សាទុក</button></div></details>
  <details class="box"><summary><h2 style="display:inline">⚙️ កាលវិភាគ (ថ្នាក់ ថ្ងៃ ម៉ោង)</h2></summary>
    <table class="ttable" id="ttab">${D.classes.map((c, i) => `<tr data-i="${i}"><td><input data-k="id" value="${esc(c.id)}" style="width:6em"></td>
      <td><select data-k="day"><option value="">—</option>${DAYS.map((d, j) => `<option value="${j}" ${+c.day === j && c.day !== "" ? "selected" : ""}>${d}</option>`).join("")}</select></td>
      <td><input data-k="time" type="time" value="${esc(c.time || "")}"></td><td><button class="btn ghost" data-del="${i}">លុប</button></td></tr>`).join("")}</table>
    <p><button class="btn ghost" id="tAdd">+ បន្ថែមថ្នាក់</button> <button class="btn" id="tSave">រក្សាទុកកាលវិភាគ</button></p></details>
  <details class="box"><summary><h2 style="display:inline">🗒️ កំណត់ត្រាថ្មីៗ</h2></summary>
    <table class="ttable">${recent.map(e => `<tr><td>${khShort(e.d)}</td><td><b>${esc(e.c)}</b></td><td>${e.st === "done" ? esc(sLabel(e.s)) : "✗ ឈប់ " + esc(e.note || "")}</td></tr>`).join("") || "<tr><td>—</td></tr>"}</table></details>
  ${backupBox()}`;
  $$(".lcard").forEach(el => el.addEventListener("click", ev => {
    const f = ev.target.dataset.f; if (!f || f === "s") return;
    const c = el.dataset.c, d = el.dataset.d, s = +$("select", el).value;
    D.log = D.log.filter(e => !(e.c === c && e.d === d));
    if (f === "done") D.log.push({ c, d, s, st: "done" });
    if (f === "off") { const note = prompt("មូលហេតុ (ឧ. ថ្ងៃបុណ្យ ប្រជុំ ប្រឡង)៖", "") ?? ""; D.log.push({ c, d, s: null, st: "off", note }); }
    save(); renderLog(wk);
  }));
  $("#cuGo").onclick = () => {
    const c = $("#cuC").value, n = Math.max(1, Math.min(34, +$("#cuN").value || 0)), d = $("#cuD").value;
    if (!d) return;
    D.log = D.log.filter(e => !(e.c === c && e.bulk));
    for (let s = 1; s <= n; s++) if (!D.log.some(e => e.c === c && e.st === "done" && e.s === s)) D.log.push({ c, d, s, st: "done", bulk: true });
    save(); toast(`✓ ${c}៖ ម៉ោងទី១-${kh(n)}`); renderLog(wk);
  };
  $("#tAdd").onclick = () => { D.classes.push({ id: "11?", day: 6, time: "" }); save(); renderLog(wk); };
  $$("#ttab [data-del]").forEach(b => b.onclick = () => { if (confirm("លុបថ្នាក់នេះពីកាលវិភាគ?")) { D.classes.splice(+b.dataset.del, 1); save(); renderLog(wk); } });
  $("#tSave").onclick = () => {
    $$("#ttab tr").forEach(tr => { const c = D.classes[+tr.dataset.i]; $$("[data-k]", tr).forEach(inp => { c[inp.dataset.k] = inp.dataset.k === "id" ? inp.value.trim().toUpperCase() : inp.value; }); });
    save(); toast("✓ បានរក្សាទុកកាលវិភាគ"); renderLog(wk);
  };
  wireBackup();
}

/* ---------- backup box ---------- */
function backupBox() {
  return `<details class="box noprint" id="bk"><summary><h2 style="display:inline">💾 Backup / ផ្ទេរទិន្នន័យ</h2></summary>
    <p>កំណត់ហេតុ បញ្ជីឈ្មោះ តេស្ត និងពិន្ទុ រក្សាទុកតែក្នុងកម្មវិធីរុករកនេះ។ ចុច Backup ដើម្បីរក្សាទុកជាឯកសារ (ផ្ញើទៅ Telegram ខ្លួនឯង ឬ Google Drive)។ ដើម្បីប្តូរទូរស័ព្ទ៖ បើកគេហទំព័រលើទូរស័ព្ទថ្មី ហើយ «ស្តារពីឯកសារ»។</p>
    <p><button class="btn" data-act="backup">💾 Backup</button> <label class="btn ghost">📂 ស្តារពីឯកសារ<input type="file" id="rsF" accept=".json,application/json" hidden></label>
    ${D.backupAt ? `<small>Backup ចុងក្រោយ៖ ${khShort(D.backupAt.slice(0, 10))}</small>` : ""}</p>
    <p class="legend">ឈ្មោះសាលា (លើក្បាលសន្លឹក)៖ <input id="schN" value="${esc(D.school)}" placeholder="វិទ្យាល័យ..." style="width:16em"> គ្រូ៖ <input id="tchN" value="${esc(D.teacher)}" style="width:10em"> <button class="btn ghost" id="schS">រក្សាទុក</button></p></details>`;
}
function wireBackup() {
  const f = $("#rsF"); if (f) f.onchange = async () => {
    const file = f.files[0]; if (!file) return;
    try { const j = JSON.parse(await file.text()); if (!j || !Array.isArray(j.classes)) throw 0;
      if (confirm("ជំនួសទិន្នន័យទាំងអស់ក្នុងកម្មវិធីនេះ ដោយទិន្នន័យពីឯកសារ?")) { D = Object.assign(DEF(), j); save(); toast("✓ បានស្តារទិន្នន័យ"); route(); }
    } catch (e) { alert("ឯកសារមិនត្រឹមត្រូវ"); }
  };
  const s = $("#schS"); if (s) s.onclick = () => { D.school = $("#schN").value.trim(); D.teacher = $("#tchN").value.trim(); save(); toast("✓ បានរក្សាទុក"); };
}

/* =====================================================================
   2. STUDENT LISTS
   ===================================================================== */
const normG = g => /^(f|female|ស្រី|ស|girl|w)$/i.test(String(g).trim()) ? "F" : /^(m|male|ប្រុស|ប|boy)$/i.test(String(g).trim()) ? "M" : "";
const normC = c => { c = String(c || "").trim().toUpperCase().replace(/\s+/g, ""); c = unkh(c); return /^[A-Z]$/.test(c) ? "11" + c : c; };
function parseRows(rows, defClass) {
  const out = [];
  rows.forEach(r => {
    r = r.map(x => String(x ?? "").trim()).filter((x, i, a) => !(i === 0 && /^[0-9០-៩]+\.?$/.test(x) && a.length > 2));
    if (!r.length || !r[0]) return;
    if (/^(name|ឈ្មោះ|គោត្តនាម|no|ល\.?រ)/i.test(r[0])) return;
    const g = r.find((x, i) => i > 0 && normG(x)) || "";
    const c = r.find((x, i) => i > 0 && !normG(x) && /^(11)?\s*[A-Za-zក-ឳ]{1,2}$|^11/.test(x)) || defClass;
    out.push({ name: r[0], g: normG(g), c: normC(c) });
  });
  return out;
}
function importStudents(list) {
  const by = {};
  list.forEach(s => { if (!s.c) return; (by[s.c] = by[s.c] || []).push(s); });
  Object.entries(by).forEach(([c, arr]) => {
    if (!cls(c)) D.classes.push({ id: c, day: "", time: "" });
    const old = D.students[c] || [];
    let max = old.reduce((m, s) => Math.max(m, +s.id.split("-").pop() || 0), 0);
    D.students[c] = arr.map((s, i) => {
      const o = old.find(x => x.name === s.name);
      return { id: o ? o.id : `${c}-${pad(++max)}`, no: i + 1, name: s.name, g: s.g || (o && o.g) || "" };
    });
  });
  save();
  return Object.keys(by);
}
function renderStudents(sel) {
  const ids = [...new Set([...D.classes.map(c => c.id), ...Object.keys(D.students)])];
  const cur = sel && ids.includes(sel) ? sel : ids[0];
  const list = D.students[cur] || [];
  const f = list.filter(s => s.g === "F").length;
  app().innerHTML = back() + head("👥 បញ្ជីឈ្មោះសិស្ស", "ឈ្មោះ ភេទ ថ្នាក់ — សម្រាប់សន្លឹកចម្លើយផ្ទាល់ខ្លួន និងសៀវភៅពិន្ទុ")
  + `<div class="ctabs">${ids.map(c => `<a class="${c === cur ? "on" : ""}" href="#/teacher/students/${encodeURIComponent(c)}">${esc(c)} <small>${kh((D.students[c] || []).length)}</small></a>`).join("")}</div>
  <div class="box"><h2>${esc(cur || "")} · សិស្ស ${kh(list.length)} នាក់ (ស្រី ${kh(f)})</h2>
    ${list.length ? `<table class="ttable stab"><tr><th>ល.រ</th><th>ឈ្មោះ</th><th>ភេទ</th><th></th></tr>${list.map((s, i) => `<tr><td>${kh(i + 1)}</td><td>${esc(s.name)}</td><td>${s.g === "F" ? "ស្រី" : s.g === "M" ? "ប្រុស" : "—"}</td><td><button class="btn ghost sm" data-rm="${i}">✕</button></td></tr>`).join("")}</table>` : `<p>មិនទាន់មានឈ្មោះ — នាំចូលនៅខាងក្រោម។</p>`}</div>
  <div class="box"><h2>📥 នាំចូលបញ្ជីឈ្មោះ</h2>
    <p>ចម្លងពី Excel (ជួរឈរ៖ <b>ឈ្មោះ · ភេទ · ថ្នាក់</b>) ហើយបិទភ្ជាប់ខាងក្រោម ឬជ្រើសឯកសារ Excel/CSV។ បើគ្មានជួរឈរថ្នាក់ នឹងដាក់ចូលថ្នាក់ <b>${esc(cur || "")}</b>។</p>
    <textarea id="stT" rows="7" placeholder="សុខ ចន្ទា\tស្រី\t11L&#10;វណ្ណ រតនា\tប្រុស\t11L"></textarea>
    <p><button class="btn" id="stGo">នាំចូលអត្ថបទ</button> <label class="btn ghost">📂 ជ្រើសឯកសារ Excel/CSV<input type="file" id="stF" accept=".xlsx,.xls,.csv,.txt" hidden></label></p>
    <p class="legend">ការនាំចូលម្តងទៀត នឹងជំនួសបញ្ជីថ្នាក់នោះ ប៉ុន្តែរក្សាពិន្ទុរបស់សិស្សដែលមានឈ្មោះដូចគ្នា។</p></div>`;
  $$("[data-rm]").forEach(b => b.onclick = () => { if (confirm("លុបឈ្មោះនេះ?")) { list.splice(+b.dataset.rm, 1); list.forEach((s, i) => s.no = i + 1); save(); renderStudents(cur); } });
  const done = cs => { toast("✓ បាននាំចូល៖ " + cs.join(", ")); renderStudents(cs[0]); };
  $("#stGo").onclick = () => {
    const rows = $("#stT").value.split(/\r?\n/).map(l => l.includes("\t") ? l.split("\t") : l.split(/[,;]/));
    const cs = importStudents(parseRows(rows, cur)); if (cs.length) done(cs); else alert("រកមិនឃើញឈ្មោះ");
  };
  $("#stF").onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    let rows;
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      const X = await loadLib("xlsx"); const wb = X.read(await file.arrayBuffer());
      rows = wb.SheetNames.flatMap(n => X.utils.sheet_to_json(wb.Sheets[n], { header: 1, defval: "" }).map(r => (r.length && r.some(Boolean)) ? r : []));
    } else rows = (await file.text()).split(/\r?\n/).map(l => l.includes("\t") ? l.split("\t") : l.split(/[,;]/));
    const cs = importStudents(parseRows(rows, cur)); if (cs.length) done(cs); else alert("រកមិនឃើញឈ្មោះ");
  };
}

/* =====================================================================
   3. MONTHLY TESTS
   ===================================================================== */
function coverage(classIds, from, to) {
  const per = {};
  classIds.forEach(c => { per[c] = [...new Set(D.log.filter(e => e.c === c && e.st === "done" && e.d >= from && e.d <= to).map(e => e.s))].sort((a, b) => a - b); });
  const all = classIds.length ? per[classIds[0]].filter(s => classIds.every(c => per[c].includes(s))) : [];
  return { per, common: all };
}
function makeTest(o) {
  const r = rng(o.seed);
  const tested = o.sessions.filter(s => BANK.some(q => q.s === s));
  const pools = tested.map(s => shuffle(BANK.filter(q => q.s === s), r));
  const reviewPool = o.review ? shuffle(BANK.filter(q => q.s < Math.min(...tested) && o.prior.includes(q.s)), r) : [];
  const nRev = Math.min(reviewPool.length, Math.round(o.n * o.review / 100));
  const pick = [];
  let i = 0;
  while (pick.length < o.n - nRev && pools.some(p => p.length)) { const p = pools[i % pools.length]; if (p.length) pick.push(p.shift()); i++; }
  pick.push(...reviewPool.slice(0, o.n - pick.length));
  const qs = shuffle(pick, r).map(q => q.id);
  const ver = {};
  L4.slice(0, o.versions).forEach((V, vi) => {
    const order = vi === 0 ? qs.map((_, k) => k) : shuffle(qs.map((_, k) => k), r);
    ver[V] = order.map(k => [qs[k], shuffle([0, 1, 2, 3], r)]);
  });
  return ver;
}
const Q = id => BANK.find(q => q.id === id);
const keyOf = (t, V) => t.ver[V].map(([id, perm]) => perm.indexOf(Q(id).a));
const score20 = (raw, n) => Math.round(raw * 20 / n * 100) / 100;
const testById = id => D.tests.find(t => t.id === id);

function renderTests(sub) {
  const t0 = today(), m0 = t0.slice(0, 8) + "01";
  const list = D.tests.slice().sort((a, b) => b.date.localeCompare(a.date));
  app().innerHTML = back() + head("📝 តេស្តប្រចាំខែ", "ជ្រើសថ្នាក់ និងរយៈពេល → កម្មវិធីយកសំណួរពីម៉ោងដែលថ្នាក់បានរៀនពិតប្រាកដ → បោះពុម្ពសន្លឹកសំណួរ ៤កំណែ និងសន្លឹកចម្លើយផ្ទាល់ខ្លួន") + backupNag()
  + `<div class="box" id="mk"><h2>➕ បង្កើតតេស្តថ្មី</h2>
    <div class="fgrid">
      <label>ចំណងជើង <input id="tT" value="តេស្តប្រចាំខែ${MONTHS[pdate(t0).getMonth()]} ឆ្នាំ${kh(pdate(t0).getFullYear())}"></label>
      <label>ថ្ងៃប្រឡង <input id="tD" type="date" value="${t0}"></label>
      <label>មេរៀនពីថ្ងៃ <input id="tF" type="date" value="${m0}"></label>
      <label>ដល់ថ្ងៃ <input id="tTo" type="date" value="${t0}"></label>
      <label>ចំនួនសំណួរ <select id="tN">${[20, 25, 30, 35, 40].map(n => `<option ${n === 30 ? "selected" : ""}>${n}</option>`).join("")}</select></label>
      <label>ចំនួនកំណែ <select id="tV"><option value="4" selected>៤ (A-D)</option><option value="2">២ (A-B)</option><option value="1">១</option></select></label>
      <label>រយៈពេល (នាទី) <input id="tMin" type="number" value="45" style="width:5em"></label>
      <label>សំណួររំលឹកពីខែមុន <select id="tR"><option value="0">០%</option><option value="20">២០%</option><option value="30">៣០%</option></select></label>
    </div>
    <p><b>ថ្នាក់៖</b> ${D.classes.map(c => `<label class="chk"><input type="checkbox" class="tC" value="${esc(c.id)}" checked> ${esc(c.id)}</label>`).join(" ")}</p>
    <p><b>ថ្នាក់ច្រើន៖</b> <label class="chk"><input type="radio" name="tM" value="common" checked> តេស្តតែមួយ (ម៉ោងដែលគ្រប់ថ្នាក់បានរៀន)</label> <label class="chk"><input type="radio" name="tM" value="each"> តេស្តដាច់ដោយឡែកតាមថ្នាក់</label></p>
    <div id="cov" class="covbox"></div>
    <p><button class="btn big" id="tGo">✨ បង្កើតតេស្ត</button></p></div>
  <div class="box"><h2>📚 តេស្តដែលបានបង្កើត</h2>${list.length ? list.map(testCard).join("") : "<p>មិនទាន់មាន</p>"}</div>
  <div class="box"><h2>🔎 ធនាគារសំណួរ</h2><p>សំណួរជ្រើសរើសចម្លើយ ${kh(BANK.length)} សំណួរ តាមម៉ោងសិក្សាទាំង ៣២ (ផ្អែកលើសៀវភៅ)។ <a href="#/teacher/bank">មើលធនាគារសំណួរ »</a></p></div>`;
  const upd = () => {
    const cs = $$(".tC:checked").map(i => i.value), from = $("#tF").value, to = $("#tTo").value;
    const cv = coverage(cs, from, to), mode = $("input[name=tM]:checked").value;
    const S = sessions();
    const row = (c, ss) => `<div><b>${esc(c)}</b> ${ss.length ? ss.map(s => `<span class="schip" title="${esc(S[s].t)}">${kh(s)}</span>`).join("") : `<span class="muted">មិនទាន់កត់ម៉ោងក្នុងរយៈពេលនេះ</span>`}</div>`;
    const nq = ss => BANK.filter(q => ss.includes(q.s)).length;
    $("#cov").innerHTML = `<p><b>ម៉ោងដែលបានរៀន (តាមកំណត់ហេតុ)៖</b></p>${cs.map(c => row(c, cv.per[c])).join("")}
      ${mode === "common" ? `<p>→ តេស្តតែមួយ៖ ម៉ោង ${cv.common.length ? cv.common.map(kh).join(", ") : "—"} · មានសំណួរ ${kh(nq(cv.common))}</p>` : `<p>→ តេស្តតាមថ្នាក់៖ ${cs.map(c => `${esc(c)} (${kh(nq(cv.per[c]))} សំណួរ)`).join(" · ")}</p>`}
      <p class="legend">មិនទាន់កត់ម៉ោង? ទៅ <a href="#/teacher/log">កំណត់ហេតុបង្រៀន</a>។</p>`;
  };
  $$("#mk input, #mk select").forEach(i => i.addEventListener("change", upd)); upd();
  $("#tGo").onclick = () => {
    const cs = $$(".tC:checked").map(i => i.value); if (!cs.length) return alert("ជ្រើសថ្នាក់");
    const from = $("#tF").value, to = $("#tTo").value, cv = coverage(cs, from, to), mode = $("input[name=tM]:checked").value;
    const groups = mode === "common" ? [{ cs, ss: cv.common }] : cs.map(c => ({ cs: [c], ss: cv.per[c] }));
    const made = [];
    for (const g of groups) {
      if (!g.ss.filter(s => BANK.some(q => q.s === s)).length) { alert(`${g.cs.join(", ")}៖ មិនមានម៉ោងដែលបានរៀនក្នុងរយៈពេលនេះ — សូមកត់កំណត់ហេតុជាមុន។`); continue; }
      const n = +$("#tN").value, versions = +$("#tV").value, review = +$("#tR").value;
      const prior = [...new Set(g.cs.flatMap(c => doneSessions(c, to)))];
      const seed = Date.now() % 1e9 + made.length;
      const id = "T" + Date.now().toString(36).slice(-5) + made.length;
      const ver = makeTest({ sessions: g.ss, n, versions, review, prior, seed });
      const t = { id, title: $("#tT").value.trim() + (mode === "each" ? " · " + g.cs[0] : ""), date: $("#tD").value, from, to, classes: g.cs, sessions: g.ss, n: ver.A.length, versions, minutes: +$("#tMin").value || 45, ver, created: new Date().toISOString() };
      if (t.n < n) alert(`${t.title}៖ សំណួរមានតែ ${kh(t.n)} (ម៉ោងតិចពេក)`);
      D.tests.push(t); made.push(t);
    }
    if (made.length) { save(); toast("✓ បានបង្កើតតេស្ត"); renderTests(); }
  };
  wireTestCards();
}
function testCard(t) {
  const sc = D.scores[t.id] || {}, nS = Object.keys(sc).length, nT = t.classes.reduce((a, c) => a + (D.students[c] || []).length, 0);
  return `<div class="tcard2"><div><b>${esc(t.title)}</b><small>${khDate(t.date)} · ${t.classes.map(esc).join(", ")} · ${kh(t.n)} សំណួរ · ${kh(t.versions)} កំណែ · ម៉ោង ${t.sessions.map(kh).join(",")}</small><small>បានស្កេន ${kh(nS)}${nT ? "/" + kh(nT) : ""}</small></div>
    <div class="tbtns"><a class="btn" href="#/teacher/print/${t.id}/paper">📄 សន្លឹកសំណួរ</a>
      ${t.classes.map(c => `<a class="btn ghost" href="#/teacher/print/${t.id}/sheets/${encodeURIComponent(c)}">🧾 សន្លឹកចម្លើយ ${esc(c)}</a>`).join("")}
      <a class="btn ghost" href="#/teacher/print/${t.id}/blank">🧾 សន្លឹកទទេ</a>
      <a class="btn ghost" href="#/teacher/print/${t.id}/key">🔑 ចម្លើយ</a>
      <a class="btn" href="#/teacher/scan/${t.id}">📷 ស្កេន</a>
      <a class="btn ghost" href="#/teacher/scores/${t.id}">📊 ពិន្ទុ</a>
      <button class="btn ghost" data-delt="${t.id}">🗑</button></div></div>`;
}
function wireTestCards() {
  $$("[data-delt]").forEach(b => b.onclick = () => {
    const t = testById(b.dataset.delt);
    if (confirm(`លុប «${t.title}» និងពិន្ទុទាំងអស់របស់វា?`)) { D.tests = D.tests.filter(x => x.id !== t.id); delete D.scores[t.id]; save(); renderTests(); }
  });
}
function renderBank() {
  const S = sessions();
  const by = {}; BANK.forEach(q => (by[q.s] = by[q.s] || []).push(q));
  app().innerHTML = back("#/teacher/tests", "តេស្តប្រចាំខែ") + head("🔎 ធនាគារសំណួរ", `${kh(BANK.length)} សំណួរ · ចម្លើយត្រូវ ✓ (ជម្រើសនឹងត្រូវលាយតាមកំណែនីមួយៗ)`)
  + Object.keys(by).map(s => `<details class="box"><summary><b>${esc(sLabel(+s))}</b> <small>(${kh(by[s].length)})</small></summary><ol class="akey">${by[s].map(q => `<li>${esc(q.q)}<small>${q.o.map((o, i) => (i === q.a ? "✓ " : "· ") + esc(o)).join("  ")}</small></li>`).join("")}</ol></details>`).join("");
}

/* ---------- answer-sheet layout (mm, one half of A4 = 210 × 148.5) ---------- */
const SH = { W: 210, H: 148.5, M: 9, mk: [[7, 7], [194, 7], [194, 132.5], [7, 132.5]] };
SH.c = SH.mk.map(([x, y]) => [x + SH.M / 2, y + SH.M / 2]); // marker centres TL, TR, BR, BL
SH.qr = { x: 163, y: 9, s: 26 };
function sheetLayout(n) {
  const cols = Math.ceil(n / 10), colW = cols >= 4 ? 45 : 58, x0 = cols >= 4 ? 22 : 26, y0 = 54, dy = 7.6, dx = 7.6, r = 2.5;
  const b = [];
  for (let i = 0; i < n; i++) { const c = Math.floor(i / 10), row = i % 10; for (let k = 0; k < 4; k++) b.push({ q: i, k, x: x0 + c * colW + 11 + k * dx, y: y0 + row * dy }); }
  return { cols, colW, x0, y0, dy, dx, r, b };
}

/* =====================================================================
   4. PRINT VIEWS
   ===================================================================== */
function printShell(title, body, note) {
  document.body.classList.add("printing");
  app().innerHTML = `<div class="printbar noprint"><a class="btn ghost" href="#/teacher/tests">← ត្រឡប់</a> <button class="btn" onclick="window.print()">🖨️ បោះពុម្ព</button>
    <span>${title}</span><small>${note || "ការកំណត់បោះពុម្ព៖ A4 · Scale 100% · Margins: None/Default"}</small></div><div class="pages">${body}</div>`;
}
function renderPrint(id, kind, c) {
  const t = testById(id); if (!t) { app().innerHTML = back("#/teacher/tests", "តេស្ត") + "<p>រកមិនឃើញតេស្ត</p>"; return; }
  if (kind === "paper") return printPaper(t);
  if (kind === "key") return printKey(t);
  if (kind === "sheets") return printSheets(t, decodeURIComponent(c || t.classes[0]));
  if (kind === "blank") return printSheets(t, null);
}
function printPaper(t) {
  const school = esc(D.school || "វិទ្យាល័យ.................................");
  const body = Object.keys(t.ver).map(V => `<section class="page paper">
    <div class="ph"><div><b>${school}</b><br>មុខវិជ្ជា៖ ទេសចរណ៍ ថ្នាក់ទី១១<br>${esc(t.title)}</div><div class="vbig">${V}</div>
      <div style="text-align:right">ថ្ងៃ៖ ${khDate(t.date)}<br>រយៈពេល៖ ${kh(t.minutes)} នាទី<br>ពិន្ទុ៖ ២០</div></div>
    <p class="pinst">ចូរជ្រើសរើសចម្លើយត្រឹមត្រូវតែមួយ ហើយ <b>បំពេញរង្វង់ឱ្យខ្មៅពេញ</b> ក្នុងសន្លឹកចម្លើយ (កំណែ <b>${V}</b>)។ កុំសរសេរលើសន្លឹកសំណួរនេះ។</p>
    <ol class="pq">${t.ver[V].map(([qid, perm]) => { const q = Q(qid); return `<li><p>${esc(q.q)}</p><div class="po${perm.every(oi => q.o[oi].length <= 20) ? " short" : ""}">${perm.map((oi, k) => `<span><b>${L4[k]}.</b> ${esc(q.o[oi])}</span>`).join("")}</div></li>`; }).join("")}</ol>
  </section>`).join("");
  printShell(`សន្លឹកសំណួរ · ${Object.keys(t.ver).join(" ")}`, body, "១ក្រុមកំណែ = ១ក្បាល A4។ អាចប្រមូលសន្លឹកសំណួរមកវិញ ប្រើសម្រាប់ថ្នាក់ផ្សេង។");
}
function printKey(t) {
  const body = `<section class="page paper"><h2>🔑 ចម្លើយ · ${esc(t.title)}</h2><p>${t.classes.map(esc).join(", ")} · ${khDate(t.date)} · ម៉ោង ${t.sessions.map(kh).join(", ")}</p>
    <div class="keys">${Object.keys(t.ver).map(V => { const k = keyOf(t, V); return `<div class="kcol"><h3>កំណែ ${V}</h3><ol>${k.map(a => `<li>${L4[a]}</li>`).join("")}</ol></div>`; }).join("")}</div>
    <h3>សំណួរ (កំណែ A) និងម៉ោងសិក្សា</h3><ol class="akey">${t.ver.A.map(([qid, perm]) => { const q = Q(qid); return `<li>${esc(q.q)} <b class="ans">${L4[perm.indexOf(q.a)]} · ${esc(q.o[q.a])}</b><small>ម៉ោងទី${kh(q.s)}</small></li>`; }).join("")}</ol></section>`;
  printShell("ចម្លើយគំរូ", body);
}
function sheetHTML(t, V, st, cname) {
  const L = sheetLayout(t.n), mm = v => v + "mm";
  const code = ["T11", t.id, st ? st.id : "-", V].join("|");
  const bub = L.b.map(b => `<i class="bb" style="left:${mm(b.x - L.r)};top:${mm(b.y - L.r)};width:${mm(2 * L.r)};height:${mm(2 * L.r)}"></i>`).join("");
  const nums = Array.from({ length: t.n }, (_, i) => { const c = Math.floor(i / 10), r = i % 10; return `<span class="bn" style="left:${mm(L.x0 + c * L.colW - 1.5)};top:${mm(L.y0 + r * L.dy - 2.6)}">${kh(i + 1)}</span>`; }).join("");
  const hdr = Array.from({ length: L.cols }, (_, c) => L4.map((l, k) => `<span class="bh" style="left:${mm(L.x0 + c * L.colW + 11 + k * L.dx - 2)};top:${mm(L.y0 - 7.2)}">${l}</span>`).join("")).join("");
  return `<div class="sheet">${SH.mk.map(([x, y]) => `<i class="mk" style="left:${mm(x)};top:${mm(y)};width:${mm(SH.M)};height:${mm(SH.M)}"></i>`).join("")}
    <div class="sh-h"><b>សន្លឹកចម្លើយ · ${esc(t.title)}</b>
      <div>ឈ្មោះ៖ <span class="fill">${st ? esc(st.name) : ""}</span></div>
      <div>ថ្នាក់៖ <span class="fill sm">${esc(cname || "")}</span> ល.រ៖ <span class="fill xs">${st ? kh(st.no) : ""}</span> ភេទ៖ <span class="fill xs">${st ? (st.g === "F" ? "ស្រី" : st.g === "M" ? "ប្រុស" : "") : ""}</span></div></div>
    <div class="sh-v">កំណែ<b>${V}</b></div>
    <div class="sh-qr" data-code="${esc(code)}" style="left:${mm(SH.qr.x)};top:${mm(SH.qr.y)};width:${mm(SH.qr.s)};height:${mm(SH.qr.s)}"></div>
    <div class="sh-i">✏️ បំពេញរង្វង់ឱ្យខ្មៅពេញ ●  · កុំបត់ កុំធ្វើឱ្យប្រឡាក់ការ៉េខ្មៅទាំង៤</div>
    ${hdr}${nums}${bub}</div>`;
}
function printSheets(t, c) {
  let items;
  if (c) {
    const list = D.students[c] || [];
    if (!list.length) { app().innerHTML = back("#/teacher/tests", "តេស្ត") + `<div class="box">ថ្នាក់ ${esc(c)} មិនទាន់មានបញ្ជីឈ្មោះ។ <a href="#/teacher/students/${encodeURIComponent(c)}">នាំចូលបញ្ជីឈ្មោះ</a> ឬបោះពុម្ព <a href="#/teacher/print/${t.id}/blank">សន្លឹកទទេ</a>។</div>`; return; }
    const Vs = Object.keys(t.ver);
    items = list.map((s, i) => ({ V: Vs[i % Vs.length], st: s, c }));
  } else {
    const n = +(prompt("ចំនួនសន្លឹកទទេ ក្នុងមួយកំណែ?", "10") || 0); if (!n) return route();
    items = Object.keys(t.ver).flatMap(V => Array.from({ length: n }, () => ({ V, st: null, c: "" })));
  }
  const pages = []; for (let i = 0; i < items.length; i += 2) pages.push(items.slice(i, i + 2));
  const body = pages.map(p => `<section class="page sheets">${p.map(it => sheetHTML(t, it.V, it.st, it.c)).join('<div class="cut">✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</div>')}</section>`).join("");
  printShell(`សន្លឹកចម្លើយ ${c ? esc(c) + " · " + kh(items.length) + " នាក់" : "ទទេ"} (២ សន្លឹក/A4 — កាត់ពាក់កណ្តាល)`, body, c ? "កំណែ A B C D ត្រូវចែកជាវេនតាមលំដាប់ឈ្មោះ — អង្គុយជាប់គ្នាមិនដូចគ្នា។ Scale 100%" : "Scale 100%");
  if (window.QRCode) $$(".sh-qr").forEach(el => new QRCode(el, { text: el.dataset.code, width: 256, height: 256, correctLevel: QRCode.CorrectLevel.M }));
}

/* =====================================================================
   5. SCANNER (photo → corner markers → homography → bubbles)
   ===================================================================== */
function solve(A, b) { // Gaussian elimination
  const n = b.length; A = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]];
    for (let r = 0; r < n; r++) if (r !== i) { const f = A[r][i] / A[i][i]; for (let c = i; c <= n; c++) A[r][c] -= f * A[i][c]; }
  }
  return A.map((r, i) => r[n] / r[i]);
}
function homography(src, dst) { // maps src (sheet mm) -> dst (image px)
  const A = [], b = [];
  for (let i = 0; i < 4; i++) { const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); }
  const h = solve(A, b); h.push(1);
  return (x, y) => { const w = h[6] * x + h[7] * y + 1; return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w]; };
}
function toGray(img, maxSide) {
  const s = Math.min(1, maxSide / Math.max(img.width, img.height));
  const W = Math.round(img.width * s), H = Math.round(img.height * s);
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d", { willReadFrequently: true }); ctx.drawImage(img, 0, 0, W, H);
  const id = ctx.getImageData(0, 0, W, H), g = new Uint8Array(W * H);
  for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = (id.data[j] * 77 + id.data[j + 1] * 150 + id.data[j + 2] * 29) >> 8;
  return { W, H, g, cv, id };
}
function findMarkers(G) {
  const { W, H, g } = G, I = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) { let row = 0; for (let x = 0; x < W; x++) { row += g[y * W + x]; I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + row; } }
  const R = Math.max(8, Math.round(Math.max(W, H) / 30)), bin = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const x0 = Math.max(0, x - R), x1 = Math.min(W, x + R + 1), y0 = Math.max(0, y - R), y1 = Math.min(H, y + R + 1);
    const m = (I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0]) / ((x1 - x0) * (y1 - y0));
    bin[y * W + x] = g[y * W + x] < m * 0.72 && g[y * W + x] < 150 ? 1 : 0;
  }
  const lab = new Int32Array(W * H), comps = [], stack = new Int32Array(W * H);
  let L = 0;
  for (let p = 0; p < W * H; p++) {
    if (!bin[p] || lab[p]) continue;
    L++; let sp = 0, n = 0, minx = W, maxx = 0, miny = H, maxy = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
    stack[sp++] = p; lab[p] = L;
    while (sp) {
      const q = stack[--sp], x = q % W, y = (q / W) | 0; n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
      if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      if (x > 0 && bin[q - 1] && !lab[q - 1]) { lab[q - 1] = L; stack[sp++] = q - 1; }
      if (x < W - 1 && bin[q + 1] && !lab[q + 1]) { lab[q + 1] = L; stack[sp++] = q + 1; }
      if (y > 0 && bin[q - W] && !lab[q - W]) { lab[q - W] = L; stack[sp++] = q - W; }
      if (y < H - 1 && bin[q + W] && !lab[q + W]) { lab[q + W] = L; stack[sp++] = q + W; }
    }
    const bw = maxx - minx + 1, bh = maxy - miny + 1, side = Math.max(W, H);
    if (bw < side * 0.012 || bw > side * 0.11 || bh < side * 0.012 || bh > side * 0.11) continue;
    // rotation-invariant squareness from second moments: a filled square has equal eigenvalues a²/12 and area a²
    const mx = sx / n, my = sy / n, vxx = sxx / n - mx * mx, vyy = syy / n - my * my, vxy = sxy / n - mx * my;
    const tr = vxx + vyy, dt = Math.sqrt(Math.max(0, (vxx - vyy) ** 2 / 4 + vxy * vxy)), l1 = tr / 2 + dt, l2 = tr / 2 - dt;
    if (l2 <= 0) continue;
    const solid = n / (12 * Math.sqrt(l1 * l2)), elong = l1 / l2;
    if (elong < 1.6 && solid > 0.8 && solid < 1.25) comps.push({ x: mx, y: my, s: Math.sqrt(n), fill: solid });
  }
  if (comps.length < 4) return null;
  const med = comps.map(c => c.s).sort((a, b) => b - a)[Math.min(3, comps.length - 1)];
  const cand = comps.filter(c => c.s > med * 0.7 && c.s < med * 1.6);
  const pickBy = f => cand.reduce((best, c) => (!best || f(c) > f(best)) ? c : best, null);
  let set = [...new Set([pickBy(c => -(c.x + c.y)), pickBy(c => c.x + c.y), pickBy(c => c.x - c.y), pickBy(c => c.y - c.x)])];
  if (set.length < 4) { // fall back: the 4 candidates farthest from the centre
    const mx = cand.reduce((a, c) => a + c.x, 0) / cand.length, my = cand.reduce((a, c) => a + c.y, 0) / cand.length;
    set = cand.slice().sort((p, q) => Math.hypot(q.x - mx, q.y - my) - Math.hypot(p.x - mx, p.y - my)).slice(0, 4);
  }
  if (set.length < 4) return null;
  const cx = set.reduce((a, c) => a + c.x, 0) / 4, cy = set.reduce((a, c) => a + c.y, 0) / 4;
  set.sort((p, q) => Math.atan2(p.y - cy, p.x - cx) - Math.atan2(q.y - cy, q.x - cx)); // clockwise (image y down)
  const i0 = set.reduce((bi, c, i) => (c.x + c.y < set[bi].x + set[bi].y ? i : bi), 0);
  const quad = [0, 1, 2, 3].map(i => set[(i0 + i) % 4]);
  const [tl, tr, br, bl] = quad;
  return quad.map(c => [c.x, c.y]);
}
function readSheet(G, quad, n, qrPt) {
  // choose orientation: QR centre (if found) must land on the QR box of the sheet
  const qrC = [SH.qr.x + SH.qr.s / 2, SH.qr.y + SH.qr.s / 2];
  let best = null;
  for (let r = 0; r < 4; r++) {
    const dst = [0, 1, 2, 3].map(i => quad[(i + r) % 4]);
    const Hm = homography(SH.c, dst);
    const [u, v] = Hm(...qrC);
    const dist = qrPt ? Math.hypot(u - qrPt[0], v - qrPt[1]) : (r === 0 ? 0 : 1e9);
    if (!best || dist < best.dist) best = { Hm, dist, r };
  }
  const Hm = best.Hm, { W, g } = G, L = sheetLayout(n);
  const px = (x, y) => { const [u, v] = Hm(x, y); const xi = Math.round(u), yi = Math.round(v); return (xi < 0 || yi < 0 || xi >= W || yi >= G.H) ? 255 : g[yi * W + xi]; };
  const disc = (cx, cy, rr) => { let s = 0, k = 0; for (let dy = -rr; dy <= rr; dy += 0.35) for (let dx = -rr; dx <= rr; dx += 0.35) if (dx * dx + dy * dy <= rr * rr) { s += px(cx + dx, cy + dy); k++; } return s / k; };
  const ans = [], dark = [];
  for (let q = 0; q < n; q++) {
    const bs = L.b.filter(b => b.q === q);
    const paper = [disc(bs[0].x - 4.2, bs[0].y, 0.9), ...bs.map(b => disc(b.x + L.dx / 2, b.y + L.dy / 2, 0.6))].sort((a, b) => b - a)[1];
    const d = bs.map(b => Math.max(0, (paper - disc(b.x, b.y, L.r * 0.62)) / Math.max(60, paper)));
    dark.push(d);
    const o = d.map((v, k) => [v, k]).sort((a, b) => b[0] - a[0]);
    if (o[0][0] < 0.2) ans.push("-");
    else if (o[1][0] >= 0.2 && o[1][0] > o[0][0] * 0.6) ans.push("*");
    else ans.push(L4[o[0][1]]);
  }
  return { ans, dark, Hm, L };
}
async function analyzeImage(img) {
  const G = toGray(img, 1400);
  let code = null, qrPt = null;
  try {
    const jsQR = await loadLib("jsqr");
    let r = jsQR(G.id.data, G.W, G.H, { inversionAttempts: "dontInvert" });
    if (!r) { const G2 = toGray(img, 900); r = jsQR(G2.id.data, G2.W, G2.H, { inversionAttempts: "dontInvert" }); if (r) { const k = G.W / G2.W; r.location = Object.fromEntries(Object.entries(r.location).map(([a, p]) => [a, { x: p.x * k, y: p.y * k }])); } }
    if (r && /^T11\|/.test(r.data)) { code = r.data.split("|"); const L = r.location; qrPt = [(L.topLeftCorner.x + L.bottomRightCorner.x + L.topRightCorner.x + L.bottomLeftCorner.x) / 4, (L.topLeftCorner.y + L.bottomRightCorner.y + L.topRightCorner.y + L.bottomLeftCorner.y) / 4]; }
  } catch (e) { /* offline: QR library unavailable */ }
  const quad = findMarkers(G);
  return { G, code, qrPt, quad };
}
function gradeAns(t, V, ans) { const k = keyOf(t, V); return ans.reduce((s, a, i) => s + (a === L4[k[i]] ? 1 : 0), 0); }

function renderScan(id) {
  const tests = D.tests.slice().sort((a, b) => b.date.localeCompare(a.date));
  if (!tests.length) { app().innerHTML = back() + head("📷 ស្កេនសន្លឹកចម្លើយ") + `<div class="box">មិនទាន់មានតេស្ត។ <a href="#/teacher/tests">បង្កើតតេស្ត</a></div>`; return; }
  let t = testById(id) || tests[0];
  app().innerHTML = back() + head("📷 ស្កេនសន្លឹកចម្លើយ", "ថតរូបសន្លឹកចម្លើយម្តងមួយ ឱ្យឃើញការ៉េខ្មៅទាំង៤ — កម្មវិធីអាន QR (ឈ្មោះ និងកំណែ) និងរង្វង់ ហើយដាក់ពិន្ទុ")
  + `<div class="box noprint"><label>តេស្ត៖ <select id="scT">${tests.map(x => `<option value="${x.id}" ${x.id === t.id ? "selected" : ""}>${esc(x.title)} · ${khShort(x.date)}</option>`).join("")}</select></label>
    <p class="scbtns"><label class="btn big">📷 ថតរូប<input type="file" id="scCam" accept="image/*" capture="environment" hidden></label>
    <label class="btn ghost">🖼️ ជ្រើសរូបច្រើន<input type="file" id="scFiles" accept="image/*" multiple hidden></label></p>
    <p class="legend">គន្លឹះ៖ ដាក់សន្លឹកលើតុពន្លឺល្អ គ្មានស្រមោល · ថតពីលើត្រង់ៗ · ឱ្យសន្លឹកពេញរូប ឃើញការ៉េខ្មៅទាំង៤។</p>
    <div id="scQ"></div></div>
  <div id="scR"></div>
  <div class="box"><h2>បានស្កេន៖ <span id="scN"></span></h2><a class="btn ghost" href="#/teacher/scores/${t.id}">📊 មើលសៀវភៅពិន្ទុ</a></div>`;
  const cnt = () => { const sc = D.scores[t.id] || {}; $("#scN").textContent = kh(Object.keys(sc).length); };
  cnt();
  $("#scT").onchange = e => { location.hash = "#/teacher/scan/" + e.target.value; };
  const queue = [];
  const take = files => { queue.push(...files); $("#scQ").innerHTML = queue.length > 1 ? `<p>នៅសល់ ${kh(queue.length)} រូប</p>` : ""; if (queue.length === files.length) next(); };
  async function next() {
    const f = queue.shift(); $("#scQ").innerHTML = queue.length ? `<p>នៅសល់ ${kh(queue.length)} រូប</p>` : "";
    if (!f) return;
    $("#scR").innerHTML = `<div class="box">⏳ កំពុងអាន...</div>`;
    const img = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = URL.createObjectURL(f); });
    const A = await analyzeImage(img);
    review(A, img);
  }
  function review(A, img) {
    let tt = t, V = null, st = null, cName = null, msg = [];
    if (A.code) {
      const [, tid, sid, ver] = A.code;
      if (tid !== t.id && testById(tid)) { tt = testById(tid); msg.push(`QR ជារបស់តេស្ត «${tt.title}»`); }
      else if (tid !== t.id) msg.push("⚠️ QR មិនមែនរបស់តេស្តនេះ");
      V = ver; if (sid !== "-") { for (const c of tt.classes) { const s = (D.students[c] || []).find(x => x.id === sid); if (s) { st = s; cName = c; } } }
    } else msg.push("⚠️ អាន QR មិនបាន — ជ្រើសកំណែ និងឈ្មោះខាងក្រោម");
    if (!A.quad) {
      $("#scR").innerHTML = `<div class="box warnbox">❌ រកមិនឃើញការ៉េខ្មៅទាំង៤ — ថតម្តងទៀត ឱ្យឃើញសន្លឹកទាំងមូល ពន្លឺល្អ និងគ្មានស្រមោល។ <p class="scbtns"><label class="btn">📷 ថតម្តងទៀត<input type="file" accept="image/*" capture="environment" hidden id="scAgain"></label></p></div>`;
      $("#scAgain").onchange = e => take([...e.target.files]); return;
    }
    const R = readSheet(A.G, A.quad, tt.n, A.qrPt);
    let ans = R.ans.slice();
    const draw = () => {
      const cv = $("#scCv"), ctx = cv.getContext("2d"); ctx.drawImage(A.G.cv, 0, 0);
      const key = V && tt.ver[V] ? keyOf(tt, V) : null, S = Math.max(A.G.W, A.G.H) / 1000;
      R.L.b.forEach(b => {
        const [u, v] = R.Hm(b.x, b.y), [u2] = R.Hm(b.x + R.L.r, b.y), rad = Math.abs(u2 - u) + 2 * S;
        const a = ans[b.q], chosen = a === L4[b.k], right = key && key[b.q] === b.k;
        if (chosen || (right && a !== L4[b.k]) || ((a === "-" || a === "*") && b.k === 0)) {
          ctx.lineWidth = 3 * S; ctx.strokeStyle = chosen ? (key ? (right ? "#1F9D55" : "#D33") : "#2F6FEB") : right ? "#1F9D55" : "#F59E0B";
          if (!chosen && right) ctx.setLineDash([4 * S, 3 * S]); else ctx.setLineDash([]);
          ctx.beginPath(); ctx.arc(u, v, rad, 0, 7); ctx.stroke();
        }
      });
      A.quad.forEach(([x, y]) => { ctx.fillStyle = "rgba(47,111,235,.6)"; ctx.beginPath(); ctx.arc(x, y, 8 * S, 0, 7); ctx.fill(); });
      const raw = key ? gradeAns(tt, V, ans) : 0;
      $("#scS").innerHTML = key ? `<b>${kh(raw)}/${kh(tt.n)}</b> → <b class="big20">${kh(score20(raw, tt.n).toFixed(2))}</b>/២០` : "ជ្រើសកំណែ";
      $("#scGrid").innerHTML = ans.map((a, i) => `<button class="qa ${a === "-" ? "blank" : a === "*" ? "multi" : key && a === L4[key[i]] ? "ok" : key ? "bad" : ""}" data-q="${i}">${kh(i + 1)}<b>${a === "-" ? "∅" : a === "*" ? "២+" : a}</b></button>`).join("");
      $$("#scGrid .qa").forEach(b => b.onclick = () => { const i = +b.dataset.q, cyc = ["A", "B", "C", "D", "-"]; ans[i] = cyc[(cyc.indexOf(ans[i]) + 1) % 5]; draw(); });
    };
    const flags = ans.filter(a => a === "-" || a === "*").length;
    const studs = tt.classes.flatMap(c => (D.students[c] || []).map(s => ({ s, c })));
    $("#scR").innerHTML = `<div class="box scrv"><div class="scinfo">${msg.map(m => `<p class="muted">${m}</p>`).join("")}
      <p><label>សិស្ស៖ <select id="scSt"><option value="">— ជ្រើស —</option>${studs.map(({ s, c }) => `<option value="${s.id}" ${st && st.id === s.id ? "selected" : ""}>${esc(c)} · ${kh(s.no)}. ${esc(s.name)}${(D.scores[tt.id] || {})[s.id] ? " ✓" : ""}</option>`).join("")}</select></label>
      <label>កំណែ៖ <select id="scV"><option value="">—</option>${Object.keys(tt.ver).map(x => `<option ${x === V ? "selected" : ""}>${x}</option>`).join("")}</select></label></p>
      <p id="scS"></p>${flags ? `<p class="warn">⚠️ ${kh(flags)} សំណួរ ទទេ (∅) ឬបំពេញលើសមួយ (២+) — ពិនិត្យ ហើយចុចលេខដើម្បីកែ</p>` : ""}
      <div id="scGrid" class="qgrid"></div>
      <p class="scbtns"><button class="btn big" id="scSave">✓ រក្សាទុក ហើយថតបន្ទាប់</button> <label class="btn ghost">📷 ថតម្តងទៀត<input type="file" accept="image/*" capture="environment" hidden id="scRe"></label></p></div>
      <canvas id="scCv" width="${A.G.W}" height="${A.G.H}"></canvas></div>`;
    $("#scV").onchange = e => { V = e.target.value || null; draw(); };
    draw();
    $("#scRe").onchange = e => take([...e.target.files]);
    $("#scSave").onclick = () => {
      const sid = $("#scSt").value; V = $("#scV").value;
      if (!sid) return alert("ជ្រើសឈ្មោះសិស្ស"); if (!V) return alert("ជ្រើសកំណែ");
      const sc = D.scores[tt.id] = D.scores[tt.id] || {};
      if (sc[sid] && !confirm("សិស្សនេះមានពិន្ទុរួចហើយ — ជំនួស?")) return;
      const raw = gradeAns(tt, V, ans);
      sc[sid] = { v: V, ans: ans.join(""), raw, n: tt.n, at: new Date().toISOString() };
      save(); if (navigator.vibrate) navigator.vibrate(60);
      const s = studs.find(x => x.s.id === sid);
      toast(`✓ ${s ? s.s.name : ""} · ${kh(score20(raw, tt.n).toFixed(2))}/២០`); cnt();
      if (queue.length) next(); else { $("#scR").innerHTML = `<div class="box okbox">✓ បានរក្សាទុក ${esc(s ? s.s.name : "")} · ${kh(raw)}/${kh(tt.n)}។ ចុច «📷 ថតរូប» សម្រាប់សន្លឹកបន្ទាប់។</div>`; $("#scCam").value = ""; }
    };
  }
  $("#scCam").onchange = e => take([...e.target.files]);
  $("#scFiles").onchange = e => take([...e.target.files]);
}

/* =====================================================================
   6. SCORE BOOK
   ===================================================================== */
function renderScores(id, c) {
  const tests = D.tests.slice().sort((a, b) => a.date.localeCompare(b.date));
  if (!tests.length) { app().innerHTML = back() + head("📊 សៀវភៅពិន្ទុ") + `<div class="box">មិនទាន់មានតេស្ត។ <a href="#/teacher/tests">បង្កើតតេស្ត</a></div>`; return; }
  const allC = [...new Set(tests.flatMap(t => t.classes))];
  const t = testById(id);
  const cur = c ? decodeURIComponent(c) : (t ? t.classes[0] : allC[0]);
  const list = D.students[cur] || [];
  const tc = tests.filter(x => x.classes.includes(cur));
  const cell = (x, s) => { const r = (D.scores[x.id] || {})[s.id]; return r ? (r.absent ? "អវត្តមាន" : score20(r.raw, r.n).toFixed(2)) : ""; };
  const stats = x => {
    const rs = list.map(s => ({ s, r: (D.scores[x.id] || {})[s.id] })).filter(o => o.r && !o.r.absent);
    const v = rs.map(o => score20(o.r.raw, o.r.n)), avg = a => a.length ? (a.reduce((p, q) => p + q, 0) / a.length).toFixed(2) : "—";
    const f = rs.filter(o => o.s.g === "F").map(o => score20(o.r.raw, o.r.n));
    return { n: rs.length, avg: avg(v), favg: avg(f), pass: v.filter(z => z >= 10).length, fpass: f.filter(z => z >= 10).length, fn: f.length };
  };
  app().innerHTML = back() + head("📊 សៀវភៅពិន្ទុ", "ពិន្ទុគិតលើ ២០ · ជាប់ ≥ ១០")
  + `<div class="ctabs">${allC.map(x => `<a class="${x === cur ? "on" : ""}" href="#/teacher/scores/${t ? t.id : "-"}/${encodeURIComponent(x)}">${esc(x)}</a>`).join("")}</div>
  <div class="box"><p class="noprint"><button class="btn" id="xl">⬇️ Excel (គ្រប់ថ្នាក់)</button> <button class="btn ghost" onclick="window.print()">🖨️ បោះពុម្ព</button></p>
    ${list.length ? `<div class="tscroll"><table class="ttable sbook"><tr><th>ល.រ</th><th>ឈ្មោះ</th><th>ភេទ</th>${tc.map(x => `<th><a href="#/teacher/scores/${x.id}/${encodeURIComponent(cur)}">${esc(x.title)}</a><small>${khShort(x.date)}</small></th>`).join("")}${tc.length > 1 ? "<th>មធ្យម</th>" : ""}</tr>
      ${list.map(s => { const vs = tc.map(x => cell(x, s)), num = vs.filter(v => v && !isNaN(v)).map(Number);
        return `<tr><td>${kh(s.no)}</td><td>${esc(s.name)}</td><td>${s.g === "F" ? "ស្រី" : s.g === "M" ? "ប្រុស" : ""}</td>${tc.map((x, i) => `<td class="sc ${vs[i] === "" ? "miss" : +vs[i] >= 10 ? "pass" : "fail"}" data-t="${x.id}" data-s="${s.id}">${vs[i] === "" ? "·" : isNaN(vs[i]) ? vs[i] : kh(vs[i])}</td>`).join("")}${tc.length > 1 ? `<td><b>${num.length ? kh((num.reduce((a, b) => a + b, 0) / num.length).toFixed(2)) : ""}</b></td>` : ""}</tr>`; }).join("")}
      <tr class="sum"><td colspan="3">សិស្សប្រឡង / មធ្យម / ជាប់</td>${tc.map(x => { const z = stats(x); return `<td>${kh(z.n)} · ${kh(z.avg)} · ${kh(z.pass)}<small>ស្រី ${kh(z.fn)} · ${kh(z.favg)} · ${kh(z.fpass)}</small></td>`; }).join("")}${tc.length > 1 ? "<td></td>" : ""}</tr></table></div>
      <p class="legend noprint">ចុចលើក្រឡាពិន្ទុ ដើម្បីបញ្ចូលដោយដៃ ឬកត់អវត្តមាន។</p>` : `<p>ថ្នាក់ ${esc(cur)} មិនទាន់មានបញ្ជីឈ្មោះ។ <a href="#/teacher/students/${encodeURIComponent(cur)}">នាំចូល</a></p>`}</div>`;
  $$(".sbook .sc").forEach(td => td.onclick = () => {
    const x = testById(td.dataset.t), sid = td.dataset.s, sc = D.scores[x.id] = D.scores[x.id] || {}, r = sc[sid];
    const v = prompt(`ពិន្ទុត្រូវ (០-${x.n}) · «a» = អវត្តមាន · ទទេ = លុប\n${r && r.ans ? "ចម្លើយ៖ " + r.ans : ""}`, r ? (r.absent ? "a" : r.raw) : "");
    if (v === null) return;
    if (v.trim() === "") delete sc[sid];
    else if (/^a$/i.test(v.trim())) sc[sid] = { absent: true, raw: 0, n: x.n, at: new Date().toISOString() };
    else { const raw = Math.max(0, Math.min(x.n, +unkh(v.trim()) || 0)); sc[sid] = Object.assign({}, r, { raw, n: x.n, manual: true, absent: false, at: new Date().toISOString() }); }
    save(); renderScores(id, encodeURIComponent(cur));
  });
  const xb = $("#xl"); if (xb) xb.onclick = exportXlsx;
}
async function exportXlsx() {
  const X = await loadLib("xlsx").catch(() => null);
  if (!X) return alert("ត្រូវការអ៊ីនធឺណិត ដើម្បីបង្កើត Excel ជាលើកដំបូង");
  const wb = X.utils.book_new();
  const tests = D.tests.slice().sort((a, b) => a.date.localeCompare(b.date));
  const allC = [...new Set([...D.classes.map(c => c.id), ...tests.flatMap(t => t.classes)])].filter(c => (D.students[c] || []).length);
  allC.forEach(c => {
    const tc = tests.filter(t => t.classes.includes(c)), list = D.students[c];
    const rows = [["ល.រ", "ឈ្មោះ", "ភេទ", ...tc.flatMap(t => [t.title + " (/20)", "ត្រូវ/" + t.n, "កំណែ"]), "មធ្យម"]];
    list.forEach(s => {
      const vals = []; const num = [];
      tc.forEach(t => { const r = (D.scores[t.id] || {})[s.id]; if (!r) vals.push("", "", ""); else if (r.absent) vals.push("អវត្តមាន", "", ""); else { const v = score20(r.raw, r.n); num.push(v); vals.push(v, r.raw, r.v || ""); } });
      rows.push([s.no, s.name, s.g === "F" ? "ស្រី" : s.g === "M" ? "ប្រុស" : "", ...vals, num.length ? Math.round(num.reduce((a, b) => a + b, 0) / num.length * 100) / 100 : ""]);
    });
    const ws = X.utils.aoa_to_sheet(rows); ws["!cols"] = [{ wch: 5 }, { wch: 26 }, { wch: 6 }, ...tc.flatMap(() => [{ wch: 14 }, { wch: 8 }, { wch: 6 }]), { wch: 8 }];
    X.utils.book_append_sheet(wb, ws, c.slice(0, 30));
  });
  const det = [["តេស្ត", "ថ្ងៃ", "ថ្នាក់", "ល.រ", "ឈ្មោះ", "កំណែ", "ចម្លើយ", "ត្រូវ", "/20"]];
  tests.forEach(t => t.classes.forEach(c => (D.students[c] || []).forEach(s => { const r = (D.scores[t.id] || {})[s.id]; if (r && !r.absent) det.push([t.title, t.date, c, s.no, s.name, r.v || "", r.ans || "", r.raw, score20(r.raw, r.n)]); })));
  X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(det), "ចម្លើយលម្អិត");
  download(`tourism11-scores-${today()}.xlsx`, new Blob([X.write(wb, { type: "array", bookType: "xlsx" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
}

/* =====================================================================
   dashboard section + router hook
   ===================================================================== */
function dashCards() {
  const nS = Object.values(D.students).reduce((a, l) => a + l.length, 0);
  const lastLog = D.log.filter(e => !e.bulk).map(e => e.d).sort().pop();
  return `<div class="tgrid tools">
    <a class="tcard" href="#/teacher/log"><span>📅</span><b>កំណត់ហេតុបង្រៀន</b><small>${lastLog ? "ចុងក្រោយ " + khShort(lastLog) : "កត់ម៉ោងដែលបានបង្រៀនរៀងរាល់សប្តាហ៍"}</small></a>
    <a class="tcard" href="#/teacher/students"><span>👥</span><b>បញ្ជីឈ្មោះសិស្ស</b><small>${nS ? kh(nS) + " នាក់ · " + kh(Object.keys(D.students).length) + " ថ្នាក់" : "នាំចូលពី Excel"}</small></a>
    <a class="tcard" href="#/teacher/tests"><span>📝</span><b>តេស្តប្រចាំខែ</b><small>${D.tests.length ? kh(D.tests.length) + " តេស្ត" : "សំណួរតាមម៉ោងដែលបានរៀន"}</small></a>
    <a class="tcard" href="#/teacher/scan"><span>📷</span><b>ស្កេនសន្លឹកចម្លើយ</b><small>ថតរូប → ពិន្ទុ</small></a>
    <a class="tcard" href="#/teacher/scores"><span>📊</span><b>សៀវភៅពិន្ទុ</b><small>/២០ · Excel</small></a>
  </div>${backupNag()}`;
}
const ROUTES = { log: a => renderLog(a[1]), students: a => renderStudents(a[1] && decodeURIComponent(a[1])), tests: () => renderTests(), bank: () => renderBank(), print: a => renderPrint(a[1], a[2], a[3]), scan: a => renderScan(a[1]), scores: a => renderScores(a[1], a[2]) };
window.TT = {
  has: sub => !!ROUTES[sub],
  render(sub, args) { document.body.classList.remove("printing"); document.documentElement.style.setProperty("--c", "#2F3E66"); ROUTES[sub](args); },
  dash: dashCards, dashCards, backupBox, wireBackup, stop() {},
  route(sub, n, x, ctx) { if (!ROUTES[sub]) return false; this.render(sub, [sub, n, x, ctx && ctx.c]); return true; },
  nav: sub => ({ log: "log", students: "students", tests: "tests", bank: "tests", print: "tests", scan: "scan", scores: "scores" }[sub])
};
window.addEventListener("hashchange", () => { if (!/^#\/teacher\/print/.test(location.hash)) document.body.classList.remove("printing"); });
})();
