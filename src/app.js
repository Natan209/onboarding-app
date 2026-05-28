// =====================
// TOOLTIP
// =====================

const _tip = (() => {
  const el = document.createElement('div');
  el.className = 'note-tip';
  document.body.appendChild(el);
  return {
    show(e, text) { el.textContent = text; el.classList.add('show'); this.move(e); },
    move(e) {
      const x = e.clientX, y = e.clientY;
      el.style.left = x + 'px';
      el.style.top  = (y - el.offsetHeight - 10) + 'px';
    },
    hide() { el.classList.remove('show'); }
  };
})();

// =====================
// STATE
// =====================

const SEL = { cat: DB.cats[0], focusApp: null };
const DEV = { app: null, cap: null, sub: null };
let devSent = false;

// =====================
// HELPERS
// =====================

function mk(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function chkSVG() {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 12 10');
  s.setAttribute('width', '11');
  s.setAttribute('height', '11');
  s.setAttribute('fill', 'none');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  p.setAttribute('points', '1,5 4.5,9 11,1');
  p.setAttribute('stroke', 'white');
  p.setAttribute('stroke-width', '2.2');
  p.setAttribute('stroke-linecap', 'round');
  p.setAttribute('stroke-linejoin', 'round');
  s.appendChild(p);
  return s;
}

function dc(s) { return s === 'e' ? '#3B6D11' : s === 'a' ? '#BA7517' : '#A32D2D'; }
function bt(s) { return s === 'e' ? 'קיים' : s === 'a' ? 'התאמה' : 'פיתוח'; }

function getSelApps() {
  const res = [];
  DB.cats.forEach(c => c.apps.forEach(a => { if (a.sel) res.push({ cat: c, app: a }); }));
  return res;
}

// =====================
// RIGHT-CLICK MENU
// =====================

const _cm = { ef: null, df: null };
const cmEl = document.getElementById('ctxm');

function showCtx(e, ef, df) {
  e.preventDefault();
  e.stopPropagation();
  _cm.ef = ef;
  _cm.df = df;
  document.getElementById('cm-edit').style.display = ef ? 'flex' : 'none';
  cmEl.style.left = e.clientX + 'px';
  cmEl.style.top = e.clientY + 'px';
  cmEl.classList.add('show');
  const r = cmEl.getBoundingClientRect();
  if (r.right > window.innerWidth) cmEl.style.left = (e.clientX - r.width) + 'px';
  if (r.bottom > window.innerHeight) cmEl.style.top = (e.clientY - r.height) + 'px';
}

function hideCtx() { cmEl.classList.remove('show'); }

document.getElementById('cm-edit').onclick = () => { hideCtx(); if (_cm.ef) _cm.ef(); };
document.getElementById('cm-del').onclick  = () => { hideCtx(); if (_cm.df) _cm.df(); };
document.addEventListener('click', hideCtx);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { hideCtx(); closePop(); } });

// =====================
// UI UPDATES
// =====================

function updateUI() {
  const n = getSelApps().length;
  document.getElementById('gen-receipt-btn').disabled = n === 0;

  const hasCat = DB.cats.some(c => c.sel);
  document.getElementById('sd1').style.background = hasCat ? '#639922' : '#185FA5';
  document.getElementById('sd2').style.background = n > 0 ? '#639922' : hasCat ? '#185FA5' : 'var(--border-light)';
  document.getElementById('sd3').style.background = n > 0 ? '#185FA5' : 'var(--border-light)';
}

// =====================
// RENDER — PM VIEW
// =====================

function rCat() {
  const el = document.getElementById('c-cat');
  el.innerHTML = '';
  DB.cats.forEach(c => {
    const wrap = mk('div', 'cat-card' + (c === SEL.cat ? ' sel' : ''));
    const r = mk('div', 'row' + (c === SEL.cat ? ' sel' : ''));
    const ch = mk('div', 'chk'); ch.appendChild(chkSVG()); r.appendChild(ch);
    const b = mk('div', 'row-body');
    const l = mk('span', 'lbl'); l.textContent = c.icon + '  ' + c.name; b.appendChild(l);
    const cnt = c.apps.filter(a => a.sel).length;
    if (cnt) { const sl = mk('div', 'sublbl'); sl.textContent = cnt + ' נבחרו'; b.appendChild(sl); }
    r.appendChild(b);
    r.oncontextmenu = e => showCtx(e,
      () => openEditItem(c),
      () => { if (!confirm('מחק ' + c.name + '?')) return; DB.cats = DB.cats.filter(x => x !== c); if (SEL.cat === c) SEL.cat = DB.cats[0] || null; render(); }
    );
    r.onclick = () => { SEL.cat = c; c.sel = true; const s = document.getElementById('app-search'); if (s) s.value = ''; render(); };
    wrap.appendChild(r);
    el.appendChild(wrap);
  });
}

function rApp() {
  const el = document.getElementById('c-app');
  el.innerHTML = '';
  if (!SEL.cat) { el.innerHTML = '<div class="empty">בחר קטגוריה</div>'; return; }
  const q = (document.getElementById('app-search')?.value || '').trim().toLowerCase();
  const apps = SEL.cat.apps.filter(a => !q || a.name.toLowerCase().includes(q) || (a.desc || '').toLowerCase().includes(q));
  if (!apps.length) { el.innerHTML = `<div class="empty">${q ? 'לא נמצאו תוצאות' : 'אין אפליקציות'}</div>`; return; }
  apps.forEach(a => {
    const r = mk('div', 'row' + (a.sel ? ' sel' : ''));
    const ch = mk('div', 'chk'); ch.appendChild(chkSVG()); r.appendChild(ch);
    const b = mk('div', 'row-body');
    const l = mk('span', 'lbl'); l.textContent = a.name; b.appendChild(l);
    if (a.desc) { const d = mk('div', 'sublbl'); d.textContent = a.desc; b.appendChild(d); }
    r.appendChild(b);
    r.oncontextmenu = e => showCtx(e,
      () => openEditItem(a),
      () => { if (!confirm('מחק ' + a.name + '?')) return; SEL.cat.apps = SEL.cat.apps.filter(x => x !== a); render(); }
    );
    r.onclick = () => { a.sel = !a.sel; SEL.cat.sel = SEL.cat.apps.some(x => x.sel); if (a.sel) SEL.focusApp = a; render(); };

    const nb = mk('div', 'note-btn' + (a.note ? ' has-note' : ''));
    nb.title = '';
    nb.textContent = a.note ? '✎' : '+';
    if (a.note) {
      nb.onmouseenter = e => { e.stopPropagation(); _tip.show(e, a.note); };
      nb.onmousemove  = e => _tip.move(e);
      nb.onmouseleave = () => _tip.hide();
    }
    nb.onclick = e => { e.stopPropagation(); _tip.hide(); openPopNote(a); };
    r.appendChild(nb);

    el.appendChild(r);
  });
}

function rCap() {
  const el = document.getElementById('c-cap');
  el.innerHTML = '';
  const sv = getSelApps();
  if (!sv.length) { el.innerHTML = '<div class="empty">בחר אפליקציה</div>'; SEL.focusApp = null; return; }
  if (!SEL.focusApp || !sv.find(x => x.app === SEL.focusApp)) SEL.focusApp = sv[sv.length - 1].app;

  sv.forEach(({ app: a }) => {
    const isFocus = SEL.focusApp === a;
    const sh = mk('div', 'cap-sec-hd');
    const sn = mk('span', 'cap-sec-lbl'); sn.textContent = a.name; sh.appendChild(sn);
    const btns = mk('div', 'cap-sec-btns');
    if (!isFocus) {
      const sb = mk('span', 'mini-btn'); sb.textContent = 'הצג'; sb.onclick = () => { SEL.focusApp = a; rCap(); }; btns.appendChild(sb);
    }
    const ab = mk('span', 'mini-btn'); ab.textContent = '+ יכולת'; ab.onclick = () => openPopAddCap(a, false); btns.appendChild(ab);
    sh.appendChild(btns);
    el.appendChild(sh);

    if (isFocus) {
      if (!a.caps || !a.caps.length) {
        const em = mk('div'); em.style.cssText = 'padding:8px 14px;font-size:11px;color:var(--text-tertiary)'; em.textContent = 'אין יכולות'; el.appendChild(em);
      } else {
        a.caps.forEach(cap => {
          const ci = mk('div', 'cap-row');
          const cl = mk('span', 'cap-lbl'); cl.textContent = cap.n; ci.appendChild(cl);
          ci.oncontextmenu = e => showCtx(e, null, () => { a.caps = a.caps.filter(x => x !== cap); rCap(); });

          const nb = mk('div', 'note-btn' + (cap.note ? ' has-note' : ''));
          nb.textContent = cap.note ? '✎' : '+';
          if (cap.note) {
            nb.onmouseenter = e => { e.stopPropagation(); _tip.show(e, cap.note); };
            nb.onmousemove  = e => _tip.move(e);
            nb.onmouseleave = () => _tip.hide();
          }
          nb.onclick = e => { e.stopPropagation(); _tip.hide(); openPopNote(cap); };
          ci.appendChild(nb);

          el.appendChild(ci);
        });
      }
    }
    el.appendChild(mk('div', 'div'));
  });
}

function render() { rCat(); rApp(); rCap(); updateUI(); }

// =====================
// RECEIPT
// =====================

function showReceipt() {
  document.getElementById('pm-grid-wrap').style.display = 'none';
  const rec = document.getElementById('receipt');
  rec.classList.add('show');
  document.getElementById('receipt-bar').style.display = '';

  const sv = getSelApps();
  const now = new Date().toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const secBlock = (dotColor, title, items, renderFn) => {
    if (!items.length) return '';
    let h = `<div class="rec-sec"><div class="rec-sh"><div class="rec-sh-dot" style="background:${dotColor}"></div><span class="rec-sh-title">${title}</span><span class="rec-sh-cnt">${items.length}</span></div>`;
    items.forEach(it => { h += renderFn(it); });
    return h + '</div>';
  };

  let html = `<div class="rec-hd"><div class="rec-hd-text"><div class="rec-title">קבלת ניסוי — סיכום לקוח</div><div class="rec-meta">איום אווירי 2026-A · ${now}</div></div><span class="rec-stamp" style="background:#E6F1FB;color:#185FA5">ממתין לאישור</span></div><div class="rec-body">`;

  const recItem = (dotColor, badgeCls, badgeTxt, a, extraContent) => {
    // app-level meta row
    const appMeta = (() => {
      const parts = [];
      if (a.requester) parts.push(`מבקש: ${a.requester}`);
      if (a.note)      parts.push(`הערה: ${a.note}`);
      return parts.length ? `<div class="ri-app-meta">${parts.join(' | ')}</div>` : '';
    })();

    // capabilities
    const capsHTML = (a.caps || []).length
      ? (a.caps || []).map((c, ci) => {
          const capId = `cap-st-${a.id}-${ci}`;
          const sel = (s) => s === c.s ? ' selected' : '';
          const dropdown = `<select class="ri-cap-sel ${c.s}" id="${capId}" onchange="updateCapStatus('${a.id}',${ci},this.value)"><option value="e"${sel('e')}>קיים</option><option value="a"${sel('a')}>התאמה</option><option value="d"${sel('d')}>פיתוח</option></select>`;
          const capMetaParts = [];
          if (c.requester) capMetaParts.push(`מבקש: ${c.requester}`);
          if (c.note)      capMetaParts.push(`הערה: ${c.note}`);
          const capMeta = capMetaParts.length ? `<div class="ri-cap-sub">${capMetaParts.join(' | ')}</div>` : '';
          return `<div class="ri-cap-item"><div class="ri-cap-top"><span class="ri-cap-name">${c.n}</span>${dropdown}</div>${capMeta}</div>`;
        }).join('')
      : '';

    return `<div class="rec-item">` +
      `<div class="ri-header"><div class="ri-dot" style="background:${dotColor}"></div><div class="ri-name">${a.name}</div><span class="ri-badge ${badgeCls}">${badgeTxt}</span></div>` +
      `${a.desc ? `<div class="ri-sub">${a.desc}</div>` : ''}` +
      `${appMeta}` +
      `${extraContent || ''}` +
      `${capsHTML ? `<div class="ri-caps-grid">${capsHTML}</div>` : ''}` +
      `</div>`;
  };

  html += secBlock('#185FA5', 'אפליקציות לניסוי', sv, ({ app: a }) =>
    recItem(a.exists ? '#3B6D11' : '#BA7517', a.exists ? 'ri-be' : 'ri-bn', a.exists ? 'קיים' : 'חדש', a, '')
  );

  html += secBlock('#3B6D11', 'אפליקציות קיימות', sv.filter(x => x.app.exists), ({ app: a, cat }) =>
    recItem('#3B6D11', 'ri-be', 'קיים', a, `<div class="ri-sub">${cat.name} — קיים במערכת</div>`)
  );

  const missing = sv.filter(x => !x.app.exists);
  if (missing.length) {
    html += secBlock('#BA7517', 'אפליקציות חדשות — דורש פיתוח', missing, ({ app: a }) => {
      const devCaps   = (a.caps || []).filter(c => c.s === 'd').map(c => c.n);
      const adaptCaps = (a.caps || []).filter(c => c.s === 'a').map(c => c.n);
      let sub = '';
      if (devCaps.length)   sub += 'פיתוח: ' + devCaps.join(', ') + '. ';
      if (adaptCaps.length) sub += 'התאמה: ' + adaptCaps.join(', ') + '.';
      return recItem('#BA7517', 'ri-bn', 'חדש', a, sub ? `<div class="ri-sub">${sub}</div>` : '');
    });
  }

  html += '</div><div class="rec-legend"><div class="leg"><div class="leg-dot" style="background:#3B6D11"></div>קיים</div><div class="leg"><div class="leg-dot" style="background:#BA7517"></div>התאמה</div><div class="leg"><div class="leg-dot" style="background:#A32D2D"></div>פיתוח</div></div>';
  rec.innerHTML = html;
}

function updateCapStatus(appId, capIdx, newStatus) {
  const allApps = DB.cats.flatMap(c => c.apps);
  const app = allApps.find(a => a.id === appId);
  if (app && app.caps[capIdx]) {
    app.caps[capIdx].s = newStatus;
    const sel = document.getElementById(`cap-st-${appId}-${capIdx}`);
    if (sel) sel.className = `ri-cap-sel ${newStatus}`;
  }
}

function backToSelection() {
  document.getElementById('pm-grid-wrap').style.display = '';
  const rec = document.getElementById('receipt');
  rec.classList.remove('show');
  rec.innerHTML = '';
  document.getElementById('receipt-bar').style.display = 'none';
  updateUI();
}

function sendToDev() { devSent = true; switchTab('dev'); }

// =====================
// DEV VIEW
// =====================

function buildDevView() {
  const grid = document.getElementById('dev-grid');
  grid.innerHTML = '';
  const sv = getSelApps();

  const stamp = document.getElementById('dev-stamp');
  const meta  = document.getElementById('dev-meta');
  if (devSent) {
    stamp.textContent = 'נשלח לפיתוח'; stamp.style.background = '#EAF3DE'; stamp.style.color = '#3B6D11';
    meta.textContent = 'התקבל — ' + new Date().toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } else {
    stamp.textContent = 'טיוטה'; stamp.style.background = '#FAEEDA'; stamp.style.color = '#854F0B';
    meta.textContent = 'ממתין לשליחה מהלקוח';
  }

  if (!sv.length) { grid.innerHTML = '<div class="empty" style="flex:1;padding:24px">לא נבחרו אפליקציות</div>'; return; }
  if (!DEV.app || !sv.find(x => x.app === DEV.app)) DEV.app = sv[0].app;

  function devCol(stepTxt, titleTxt, bodyFn) {
    const c = mk('div', 'dev-col');
    const h = mk('div', 'dev-col-hd');
    h.innerHTML = `<div class="dev-col-step">${stepTxt}</div><div class="dev-col-title">${titleTxt}</div>`;
    c.appendChild(h);
    const b = mk('div', 'dev-col-body');
    bodyFn(b);
    c.appendChild(b);
    grid.appendChild(c);
  }

  function redraw() {
    grid.innerHTML = '';

    // Col 1 — Apps
    devCol('אפליקציה', 'נבחרים', b => {
      sv.forEach(({ app: a }) => {
        const isFoc = DEV.app === a;
        const r = mk('div', 'drow' + (isFoc ? ' focus' : ''));
        const dot = mk('div', 'drow-dot'); dot.style.background = a.exists ? '#3B6D11' : '#BA7517'; r.appendChild(dot);
        const bd = mk('div', 'drow-body');
        const n = mk('div', 'drow-name'); n.textContent = a.name; bd.appendChild(n);
        if (!a.exists && a.desc) { const ds = mk('div', 'drow-sub'); ds.textContent = a.desc; bd.appendChild(ds); }
        r.appendChild(bd);
        const bg = mk('span', 'drow-badge ' + (a.exists ? 'dbe' : 'dba')); bg.textContent = a.exists ? 'קיים' : 'חדש'; r.appendChild(bg);
        r.onclick = () => { DEV.app = a; DEV.cap = null; DEV.sub = null; redraw(); };
        b.appendChild(r);
      });
    });

    // Col 2 — Caps
    devCol('שלב 4', 'יכולות', b => {
      if (!DEV.app) { b.innerHTML = '<div class="empty">בחר אפליקציה</div>'; return; }
      (DEV.app.caps || []).forEach(cap => {
        const isFoc = DEV.cap === cap;
        const r = mk('div', 'drow' + (isFoc ? ' focus' : ''));
        const dot = mk('div', 'drow-dot'); dot.style.background = dc(cap.s); r.appendChild(dot);
        const bd = mk('div', 'drow-body'); const n = mk('div', 'drow-name'); n.textContent = cap.n; bd.appendChild(n); r.appendChild(bd);
        const bg = mk('span', 'drow-badge db' + cap.s); bg.textContent = bt(cap.s); r.appendChild(bg);
        r.onclick = () => { DEV.cap = isFoc ? null : cap; DEV.sub = null; redraw(); };
        b.appendChild(r);
      });
      const addC = mk('div', 'add-row'); addC.style.cssText = 'padding:7px 13px;font-size:11px';
      addC.innerHTML = '<span class="plus">+</span> יכולת';
      addC.onclick = () => openPopAddCap(DEV.app, true);
      b.appendChild(addC);
    });

    // Col 3 — Sub-caps
    devCol('שלב 5', 'תת-יכולות', b => {
      if (!DEV.cap) { b.innerHTML = '<div class="empty">בחר יכולת</div>'; return; }
      const cap = DEV.cap;
      if (cap.s === 'd' && (!cap.subs || !cap.subs.length)) {
        b.appendChild(Object.assign(mk('div', 'empty'), { textContent: 'יכולת חדשה' }));
      } else {
        (cap.subs || []).forEach(sub => {
          const isFoc = DEV.sub === sub;
          const r = mk('div', 'drow' + (isFoc ? ' focus' : ''));
          const dot = mk('div', 'drow-dot'); dot.style.background = dc(sub.s); r.appendChild(dot);
          const bd = mk('div', 'drow-body'); const n = mk('div', 'drow-name'); n.textContent = sub.n; bd.appendChild(n); r.appendChild(bd);
          const bg = mk('span', 'drow-badge db' + sub.s); bg.textContent = bt(sub.s); r.appendChild(bg);
          r.oncontextmenu = e => showCtx(e, null, () => { cap.subs = cap.subs.filter(x => x !== sub); if (DEV.sub === sub) DEV.sub = null; redraw(); });
          r.onclick = () => { DEV.sub = isFoc ? null : sub; redraw(); };
          b.appendChild(r);
        });
      }
      const addS = mk('div', 'add-row'); addS.style.cssText = 'padding:7px 13px;font-size:11px';
      addS.innerHTML = '<span class="plus">+</span> תת-יכולת';
      addS.onclick = () => openPopAddSub(cap);
      b.appendChild(addS);
    });

    // Col 4 — Params
    devCol('שלב 6', 'פרמטרים', b => {
      if (!DEV.sub) { b.innerHTML = '<div class="empty">בחר תת-יכולת</div>'; return; }
      const sub = DEV.sub;
      if (!sub.params) sub.params = [];
      const hd = mk('div', 'par-hd');
      const hl = mk('span', 'par-hd-lbl'); hl.textContent = sub.n; hd.appendChild(hl);
      const ap = mk('span', 'mini-btn'); ap.textContent = '+ פרמטר'; ap.onclick = () => openPopAddParam(sub); hd.appendChild(ap);
      b.appendChild(hd);

      const preds = PAR_CATALOG[sub.n] || [];
      preds.forEach(pn => {
        let ex = sub.params.find(p => p.n === pn);
        const row = mk('div', 'par-row');
        const nm = mk('div', 'par-name'); nm.textContent = pn; row.appendChild(nm);
        const inp = document.createElement('input');
        inp.className = 'par-in'; inp.placeholder = 'הזן ערך...';
        if (ex) inp.value = ex.val || '';
        inp.oninput = () => { if (!ex) { ex = { n: pn, val: inp.value }; sub.params.push(ex); } else ex.val = inp.value; };
        row.appendChild(inp); b.appendChild(row);
      });

      sub.params.filter(p => !preds.includes(p.n)).forEach(p => {
        const row = mk('div', 'par-row');
        const nm = mk('div', 'par-name'); nm.textContent = p.n; row.appendChild(nm);
        const inp = document.createElement('input');
        inp.className = 'par-in'; inp.placeholder = 'הזן ערך...'; inp.value = p.val || '';
        inp.oninput = () => { p.val = inp.value; };
        row.oncontextmenu = e => showCtx(e, null, () => { sub.params = sub.params.filter(x => x !== p); redraw(); });
        row.appendChild(inp); b.appendChild(row);
      });

      if (!preds.length && !sub.params.length) b.appendChild(Object.assign(mk('div', 'empty'), { textContent: 'לחץ + פרמטר' }));
    });
  }

  redraw();
}

// =====================
// TAB SWITCH
// =====================

function switchTab(t) {
  document.getElementById('tab-pm').className = 'vtab' + (t === 'pm' ? ' active' : '');
  document.getElementById('tab-dev').className = 'vtab' + (t === 'dev' ? ' active' : '');
  document.getElementById('pm-view').style.display = t === 'pm' ? '' : 'none';
  document.getElementById('dev-view').style.display = t === 'dev' ? '' : 'none';
  if (t === 'dev') buildDevView();
}

// =====================
// POPUP
// =====================

const _pop = { type: null, ctx: null, st: 'd', fromDev: false };

function showPop(title, okTxt, html) {
  document.getElementById('pop-title').textContent = title;
  document.querySelector('.pop-ok').textContent = okTxt || 'הוסף';
  document.getElementById('pop-body').innerHTML = html;
  document.getElementById('ov').classList.remove('h');
  setTimeout(() => {
    const i = document.getElementById('pop-i');
    if (i) { i.focus(); i.onkeydown = e => { if (e.key === 'Enter') confirmPop(); if (e.key === 'Escape') closePop(); }; }
    const s = document.getElementById('sub-search');
    if (s) { s.focus(); s.oninput = () => filterSubList(s.value); }
  }, 60);
}

function closePop() {
  document.getElementById('ov').classList.add('h');
  Object.assign(_pop, { type: null, ctx: null, st: 'd', fromDev: false });
}

function statHTML(sel) {
  return `<div class="pop-l">סטטוס</div><div class="stat-row" id="sr">
    <div class="stat-opt e${sel === 'e' ? ' chosen' : ''}" onclick="pSt('e')">קיים</div>
    <div class="stat-opt a${sel === 'a' ? ' chosen' : ''}" onclick="pSt('a')">התאמה</div>
    <div class="stat-opt d${sel === 'd' ? ' chosen' : ''}" onclick="pSt('d')">פיתוח</div>
  </div>`;
}

function pSt(s) {
  _pop.st = s;
  const sr = document.getElementById('sr');
  if (!sr) return;
  sr.querySelectorAll('.stat-opt').forEach(el => el.classList.remove('chosen'));
  const idx = { e: 0, a: 1, d: 2 }[s];
  if (sr.children[idx]) sr.children[idx].classList.add('chosen');
}

function openPop(t) {
  _pop.type = t;
  if (t === 'cat') { showPop('קטגוריה חדשה', 'הוסף', '<div class="pop-l">שם</div><input class="pop-i" id="pop-i" type="text" placeholder="למשל: ימי, סייבר...">'); return; }
  if (t === 'app') {
    const h = '<div class="pop-l">שם האפליקציה</div><input class="pop-i" id="pop-i" type="text" placeholder="למשל: רחפן מתאבד...">'
      + '<div class="pop-l">תיאור קצר (אופציונלי)</div><textarea class="pop-i" id="pop-desc" placeholder="מה האפליקציה הזו אמורה לעשות?"></textarea>'
      + '<div class="pop-l">שם המבקש (יופיע בקבלה בלבד)</div><input class="pop-i" id="pop-requester" type="text" placeholder="למשל: דן כהן, מחלקת מבצעים...">';
    showPop('אפליקציה חדשה', 'הוסף', h);
    return;
  }
}

function openEditItem(item) {
  _pop.type = 'edit'; _pop.ctx = item;
  showPop('עריכת שם', 'שמור', `<div class="pop-l">שם חדש</div><input class="pop-i" id="pop-i" type="text" value="${item.name}">`);
}

function openPopNote(app) {
  _pop.type = 'note'; _pop.ctx = app;
  showPop('הערה — ' + app.name, 'שמור',
    `<textarea class="pop-i" id="pop-i" rows="4" placeholder="הוסף הערה לאפליקציה זו...">${app.note || ''}</textarea>`
  );
}

function openPopAddCap(app, fromDev) {
  _pop.type = 'cap'; _pop.ctx = app; _pop.st = 'd'; _pop.fromDev = !!fromDev;
  const used = (app.caps || []).map(c => c.n);
  let list = '<div class="pop-l">בחר מהקטלוג <span style="color:var(--amber);font-size:11px">(סטטוס: התאמה)</span></div>'
    + '<input class="pop-search" id="cap-search" type="text" placeholder="חיפוש יכולת...">'
    + '<div class="pop-list" id="cap-list">';
  CAP_CATALOG.forEach(n => {
    const u = used.includes(n);
    list += `<div class="pop-li${u ? ' used' : ''}" data-name="${n}" onclick="quickAddCap('${n}')">${u ? '✓ ' : ''}${n}</div>`;
  });
  list += '</div>'
    + '<div class="pop-sep">או יכולת חדשה <span style="color:var(--red);font-size:11px">(סטטוס: פיתוח)</span></div>'
    + '<div class="pop-l">שם יכולת</div><input class="pop-i" id="pop-i" type="text" placeholder="שם...">'
    + '<div class="pop-l">שם המבקש (אופציונלי)</div><input class="pop-i" id="pop-cap-requester" type="text" placeholder="למשל: דן כהן...">'
    + '<div class="pop-l">הערה/תיאור (אופציונלי)</div><textarea class="pop-i" id="pop-cap-desc" placeholder="תיאור קצר של היכולת..."></textarea>';
  showPop('הוסף יכולת', 'הוסף', list);
  setTimeout(() => {
    const s = document.getElementById('cap-search');
    if (s) { s.focus(); s.oninput = () => filterCapList(s.value); }
  }, 60);
}

function filterCapList(q) {
  const list = document.getElementById('cap-list');
  if (!list) return;
  q = q.toLowerCase();
  list.querySelectorAll('.pop-li').forEach(item => {
    item.style.display = (item.getAttribute('data-name') || '').toLowerCase().includes(q) ? '' : 'none';
  });
}

function quickAddCap(n) {
  const app = _pop.ctx; if (!app) return;
  if (!app.caps) app.caps = [];
  if (!app.caps.find(c => c.n === n)) app.caps.push({ id: uid(), n, s: 'a', subs: [] });
  const fd = _pop.fromDev;
  closePop();
  if (fd) buildDevView(); else render();
}

function openPopAddSub(cap) {
  _pop.type = 'sub'; _pop.ctx = cap; _pop.st = 'd';
  const used = (cap.subs || []).map(s => s.n);
  let html = '<div class="pop-l">חיפוש תת-יכולת</div><input class="pop-search" id="sub-search" type="text" placeholder="חפש...">';
  html += '<div class="pop-list" id="sub-list">';
  ALL_SUBS.forEach(item => {
    const u = used.includes(item.n);
    html += `<div class="pop-li${u ? ' used' : ''}" data-name="${item.n}" data-cap="${item.cap}" onclick="quickAddSub('${item.n}')">`;
    html += `<span>${item.n}</span><span class="pop-li-cap">${item.cap}</span></div>`;
  });
  html += '</div><div class="pop-sep">או חדש</div><div class="pop-l">שם תת-יכולת חדשה</div><input class="pop-i" id="pop-i" type="text" placeholder="שם...">';
  html += statHTML('d');
  showPop('הוסף תת-יכולת', 'הוסף', html);
}

function filterSubList(q) {
  const list = document.getElementById('sub-list');
  if (!list) return;
  q = q.toLowerCase();
  list.querySelectorAll('.pop-li').forEach(item => {
    const name = (item.getAttribute('data-name') || '').toLowerCase();
    const cap  = (item.getAttribute('data-cap')  || '').toLowerCase();
    item.style.display = (name.includes(q) || cap.includes(q)) ? '' : 'none';
  });
}

function quickAddSub(n) {
  const cap = _pop.ctx; if (!cap) return;
  if (!cap.subs) cap.subs = [];
  if (!cap.subs.find(s => s.n === n)) cap.subs.push({ id: uid(), n, s: 'd', params: [] });
  closePop();
  buildDevView();
}

function openPopAddParam(sub) {
  _pop.type = 'param'; _pop.ctx = sub;
  showPop('פרמטר חדש', 'הוסף', '<div class="pop-l">שם הפרמטר</div><input class="pop-i" id="pop-i" type="text" placeholder=\'למשל: טווח (ק"מ)...\'>');
}

function confirmPop() {
  const inp = document.getElementById('pop-i');
  const val = inp ? inp.value.trim() : '';
  const descEl = document.getElementById('pop-desc');
  const desc = descEl ? descEl.value.trim() : '';
  const requesterEl = document.getElementById('pop-requester');
  const requester = requesterEl ? requesterEl.value.trim() : '';
  const { type: t, ctx: c } = _pop;

  if (t === 'note' && c) { c.note = val || undefined; closePop(); render(); return; }
  if (t === 'edit' && c) { if (val) c.name = val; closePop(); render(); return; }
  if (!val) { closePop(); return; }

  if (t === 'cat') DB.cats.push({ id: uid(), name: val, icon: '📌', sel: false, apps: [] });
  else if (t === 'app' && SEL.cat) SEL.cat.apps.push({ id: uid(), name: val, exists: false, sel: false, desc, requester, caps: [] });
  else if (t === 'cap' && c) {
    const capReq  = (document.getElementById('pop-cap-requester') || {}).value?.trim() || '';
    const capDesc = (document.getElementById('pop-cap-desc')      || {}).value?.trim() || '';
    if (!c.caps) c.caps = [];
    if (!c.caps.find(x => x.n === val)) c.caps.push({ id: uid(), n: val, s: 'd', requester: capReq || undefined, desc: capDesc || undefined, subs: [] });
  }
  else if (t === 'sub' && c) { if (!c.subs) c.subs = []; if (!c.subs.find(x => x.n === val)) c.subs.push({ id: uid(), n: val, s: _pop.st || 'd', params: [] }); }
  else if (t === 'param' && c) { if (!c.params) c.params = []; c.params.push({ n: val, val: '' }); }

  closePop();
  if (t === 'sub' || t === 'param') buildDevView(); else render();
}

document.getElementById('ov').onclick = e => { if (e.target === document.getElementById('ov')) closePop(); };

// =====================
// INIT
// =====================
render();
