(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const fmt = n => n.toLocaleString('fr-FR') + ' €';
  const dur = m => m >= 480 ? (m / 480 > 1 ? Math.round(m / 480 * 2) / 2 + ' jours' : '1 jour') : m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) : ''}` : `${m} min`;
  const ref = () => 'VCL-DEMO-' + Math.random().toString(36).slice(2, 6).toUpperCase();

  /* ---------- Menu mobile ---------- */
  const burger = $('#burger'), nav = $('#nav'), hd = $('#hd');
  const setMenu = open => {
    if (open) document.documentElement.style.setProperty('--hd-bottom', hd.getBoundingClientRect().bottom + 'px');
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    nav.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => e.target.closest('a') && setMenu(false));
  addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); burger.focus(); } });
  matchMedia('(min-width: 861px)').addEventListener('change', e => e.matches && setMenu(false));

  /* ---------- Apparition au scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; el.classList.add('in'); io.unobserve(el);
    el.addEventListener('transitionend', function end(ev) { if (ev.target === el && ev.propertyName === 'transform') { el.removeEventListener('transitionend', end); el.classList.remove('rv', 'in'); el.style.transitionDelay = ''; } });
  }), { threshold: .1, rootMargin: '0px 0px -30px 0px' });
  $$('.rv').forEach(el => {
    const sib = [...el.parentElement.children].filter(c => c.classList.contains('rv'));
    const i = sib.indexOf(el); if (i > 0) el.style.transitionDelay = Math.min(i * .08, .32) + 's';
    io.observe(el);
  });

  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  /* ---------- Horaires : jour courant + ouvert/fermé ---------- */
  const openNow = $('#openNow');
  if (openNow) {
    const d = new Date(), day = d.getDay(), t = d.getHours() + d.getMinutes() / 60;
    const row = $(`.hours tr[data-day="${day}"]`); row && row.classList.add('today');
    const open = (day >= 1 && day <= 5 && t >= 8 && t < 18.5) || (day === 6 && t >= 9 && t < 12);
    openNow.textContent = open ? 'Ouvert en ce moment' : 'Fermé en ce moment';
    openNow.classList.toggle('is-open', open);
  }

  /* ---------- Onglets prestations ---------- */
  const tabs = $$('.tabs a');
  if (tabs.length) {
    const spy = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) tabs.forEach(a => a.classList.toggle('is-active', a.hash === '#' + e.target.id));
    }), { rootMargin: '-40% 0px -55% 0px' });
    tabs.forEach(a => spy.observe($(a.hash)));
  }

  /* ---------- Galerie + visionneuse ---------- */
  const gal = $('#gal');
  if (gal) {
    const items = $$('.g', gal), chips = $$('.chip'), count = $('#count');
    chips.forEach(c => c.addEventListener('click', () => {
      chips.forEach(x => x.setAttribute('aria-pressed', x === c));
      const f = c.dataset.f; let n = 0;
      items.forEach(it => { const show = f === 'all' || it.dataset.c === f; it.classList.toggle('is-hidden', !show); n += show; });
      count.textContent = n + (n > 1 ? ' photos' : ' photo');
    }));
    const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbCredit = $('#lbCredit');
    let cur = 0, opener = null;
    const visible = () => items.filter(i => !i.classList.contains('is-hidden')).map(i => $('button', i));
    const show = btn => {
      lbImg.src = btn.dataset.full; lbImg.alt = btn.querySelector('img').alt;
      lbCap.textContent = `${btn.dataset.cat} — ${btn.dataset.title} · photo d’illustration`;
      lbCredit.href = btn.dataset.credit;
    };
    gal.addEventListener('click', e => {
      const b = e.target.closest('button[data-full]'); if (!b) return;
      opener = b; cur = visible().indexOf(b); show(b);
      lb.showModal();
    });
    const step = d => { const v = visible(); cur = (cur + d + v.length) % v.length; show(v[cur]); };
    lb.addEventListener('click', e => {
      if (e.target === lb || e.target.closest('[data-close]')) lb.close();
      const s = e.target.closest('[data-step]'); if (s) step(+s.dataset.step);
    });
    lb.addEventListener('keydown', e => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
    // WebKit restaure lui-même le focus après 'close' : on repasse derrière lui.
    lb.addEventListener('close', () => setTimeout(() => opener && opener.focus(), 0));
    // balayage tactile
    let x0 = null;
    lb.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
    lb.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); x0 = null; });
  }

  /* ---------- Validation partagée ---------- */
  const RULES = {
    name: v => v.trim().length >= 2 || 'Indiquez votre nom.',
    phone: v => /^(\+33\s?|0)[1-9]([\s.-]?\d{2}){4}$/.test(v.trim()) || 'Numéro français attendu, ex. 06 12 34 56 78.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Adresse e-mail invalide.',
    consent: (v, el) => el.checked || 'Votre accord est nécessaire.',
    make: v => !!v || 'Choisissez la marque.',
    model: v => v.trim().length >= 2 || 'Indiquez le modèle.',
    year: v => !!v || 'Choisissez l’année.',
    km: v => !v.trim() || /^\d[\d\s]{0,8}$/.test(v.trim()) || 'Chiffres uniquement.',
    plate: v => !v.trim() || /^[A-Z]{2}-?\d{3}-?[A-Z]{2}$/i.test(v.trim()) || 'Format attendu : AB-123-CD.'
  };
  const check = (el, rule, errId) => {
    const r = rule(el.value, el), bad = r !== true, err = $('#' + errId);
    if (err) err.textContent = bad ? r : '';
    el.classList.toggle('bad', bad); el.setAttribute('aria-invalid', bad);
    if (err) el.setAttribute('aria-describedby', errId);
    return !bad;
  };
  // Validation "vivante" sans décalage de mise en page pendant un clic :
  // - un champ en erreur est revalidé à chaque frappe (le message disparaît avant le clic suivant) ;
  // - à la sortie du champ, on n'affiche une erreur que si l'utilisateur ne clique pas sur un bouton de formulaire.
  const live = (el, rule, errId) => {
    el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => el.classList.contains('bad') && check(el, rule, errId));
    el.addEventListener('blur', e => {
      if (!el.value || el.type === 'checkbox') return;
      if (e.relatedTarget && e.relatedTarget.closest('button, .pick, .consent')) return;
      check(el, rule, errId);
    });
  };

  /* ---------- Prise de rendez-vous ---------- */
  const book = $('#book');
  if (book) {
    const SVC = JSON.parse($('#svcData').textContent);
    const steps = $$('.step', book), bars = $$('.progress i', book);
    const prev = $('#prev'), next = $('#next'), label = $('#stepLabel');
    let cur = 1, pick = { day: null, slot: null };
    const years = $('#year'), Y = new Date().getFullYear();
    for (let y = Y; y >= 1990; y--) years.add(new Option(y, y));

    const pre = new URLSearchParams(location.search).get('service');
    if (pre) { const c = $(`input[name=svc][value="${CSS.escape(pre)}"]`, book); if (c) c.checked = true; }

    // Calendrier : 21 jours à partir de demain ; dimanche fermé ; samedi matin.
    const cal = $('#cal'), slots = $('#slots');
    const days = []; const start = new Date(); start.setHours(0, 0, 0, 0);
    for (let i = 1; days.length < 21; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); }
    $('#calMonth').textContent = days[0].toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) + (days[0].getMonth() !== days[20].getMonth() ? ' – ' + days[20].toLocaleDateString('fr-FR', { month: 'long' }) : '');
    ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].forEach(d => cal.insertAdjacentHTML('beforeend', `<span class="cal__dow" aria-hidden="true">${d}</span>`));
    const lead = (days[0].getDay() + 6) % 7;
    for (let i = 0; i < lead; i++) cal.insertAdjacentHTML('beforeend', '<span></span>');
    const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
    const slotsFor = d => { const w = d.getDay(); if (w === 0) return []; const hrs = w === 6 ? ['9:00', '9:30', '10:00', '10:30', '11:00'] : ['8:00', '8:30', '9:00', '10:00', '11:00', '13:30', '14:00', '15:00', '16:00', '17:00']; return hrs.map(h => ({ h, full: hash(d.toDateString() + h) % 10 < 3 })); };
    const long = d => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    days.forEach((d, i) => {
      const s = slotsFor(d), closed = !s.length, full = !closed && s.every(x => x.full);
      cal.insertAdjacentHTML('beforeend', `<button type="button" class="day" data-i="${i}" aria-pressed="false" ${closed || full ? 'disabled' : ''}><span class="sr">${d.toLocaleDateString('fr-FR', { weekday: 'long' })} </span>${d.getDate()}<small> ${d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</small><span class="sr">${closed ? ', fermé' : full ? ', complet' : ''}</span></button>`);
    });
    const renderSlots = () => {
      slots.innerHTML = '';
      if (pick.day === null) return;
      slotsFor(days[pick.day]).forEach(s => slots.insertAdjacentHTML('beforeend', `<button type="button" class="slot" data-h="${s.h}" aria-pressed="${pick.slot === s.h}" ${s.full ? 'disabled' : ''}>${s.h.replace(':', ' h ')}${s.full ? '<span class="sr">, complet</span>' : ''}</button>`));
    };
    cal.addEventListener('click', e => {
      const b = e.target.closest('.day'); if (!b || b.disabled) return;
      pick = { day: +b.dataset.i, slot: null };
      $$('.day', cal).forEach(x => x.setAttribute('aria-pressed', x === b));
      renderSlots(); summary(); $('#e-when').textContent = '';
    });
    slots.addEventListener('click', e => {
      const b = e.target.closest('.slot'); if (!b || b.disabled) return;
      pick.slot = b.dataset.h;
      $$('.slot', slots).forEach(x => x.setAttribute('aria-pressed', x === b));
      summary(); $('#e-when').textContent = '';
    });

    const chosen = () => $$('input[name=svc]:checked', book).map(i => ({ id: i.value, ...SVC[i.value] }));
    const summary = () => {
      const c = chosen();
      $('#sSvc').innerHTML = c.length ? c.map(s => s.n).join('<br>') : '—';
      const m = c.reduce((a, s) => a + s.d, 0);
      $('#sDur').textContent = m ? dur(m) : '—';
      $('#sTot').textContent = fmt(c.reduce((a, s) => a + s.p, 0));
      const car = [book.elements.make.value, book.elements.model.value.trim(), book.elements.year.value].filter(Boolean).join(' ');
      $('#sCar').textContent = car || '—';
      $('#sWhen').textContent = pick.day !== null ? long(days[pick.day]) + (pick.slot ? ' à ' + pick.slot.replace(':', ' h ') : '') : '—';
    };
    book.addEventListener('input', summary); book.addEventListener('change', summary);

    const validate = n => {
      if (n === 1) { const ok = chosen().length > 0; $('#e-svc').textContent = ok ? '' : 'Sélectionnez au moins une prestation.'; return ok; }
      if (n === 2) return ['make', 'model', 'year', 'km', 'plate'].map(k => check(book.elements[k], RULES[k], 'e-' + k)).every(Boolean);
      if (n === 3) { const ok = pick.day !== null && !!pick.slot; $('#e-when').textContent = ok ? '' : pick.day === null ? 'Choisissez un jour.' : 'Choisissez un horaire.'; return ok; }
      if (n === 4) return ['name', 'phone', 'email', 'consent'].map(k => check(book.elements[k], RULES[k], 'e-' + k)).every(Boolean);
    };
    const go = n => {
      cur = n;
      steps.forEach(s => s.hidden = +s.dataset.step !== n);
      bars.forEach((b, i) => b.classList.toggle('on', i < n));
      label.textContent = `Étape ${n} sur 4`;
      prev.hidden = n === 1;
      next.textContent = n === 4 ? 'Confirmer la demande' : 'Continuer →';
      const h = $(`.step[data-step="${n}"] h2`); h && h.focus({ preventScroll: true });
      const top = book.getBoundingClientRect().top + scrollY - 110; if (scrollY > top) scrollTo({ top, behavior: 'smooth' });
    };
    next.addEventListener('click', () => {
      if (!validate(cur)) { const bad = $(`.step[data-step="${cur}"] [aria-invalid=true]`, book); bad && bad.focus(); return; }
      if (cur < 4) return go(cur + 1);
      $('#doneTxt').textContent = `${chosen().map(s => s.n).join(', ')} — ${$('#sWhen').textContent}.`;
      $('#doneRef').textContent = ref();
      book.hidden = true; const d = $('#bookDone'); d.hidden = false; d.focus();
    });
    prev.addEventListener('click', () => go(cur - 1));
    $$('input,select,textarea', book).forEach(el => { if (RULES[el.name]) live(el, RULES[el.name], 'e-' + el.name); });
    $('#restart').addEventListener('click', () => {
      book.reset(); pick = { day: null, slot: null };
      $$('.day', cal).forEach(x => x.setAttribute('aria-pressed', 'false')); renderSlots();
      $$('.bad', book).forEach(x => x.classList.remove('bad'));
      $('#bookDone').hidden = true; book.hidden = false; summary(); go(1);
    });
    summary();
  }

  /* ---------- Demande de devis ---------- */
  const quote = $('#quote');
  if (quote) {
    const t = new URLSearchParams(location.search).get('type');
    if (t) { const r = $(`input[name=type][value="${CSS.escape(t)}"]`, quote); if (r) r.checked = true; }
    const desc = $('#qdesc'), cnt = $('#qcount');
    desc.addEventListener('input', () => cnt.textContent = desc.value.trim().length);
    // Photos : aperçu local uniquement
    const input = $('#files'), drop = $('#drop'), thumbs = $('#thumbs'), eF = $('#e-files');
    let files = [];
    const render = () => {
      thumbs.innerHTML = '';
      files.forEach((f, i) => {
        const u = URL.createObjectURL(f);
        thumbs.insertAdjacentHTML('beforeend', `<div class="thumb"><img src="${u}" alt="Photo ajoutée ${i + 1}"><button type="button" data-rm="${i}" aria-label="Retirer la photo ${i + 1}">×</button></div>`);
        thumbs.lastElementChild.querySelector('img').onload = () => URL.revokeObjectURL(u);
      });
    };
    const add = list => {
      const msgs = [];
      [...list].forEach(f => {
        if (!f.type.startsWith('image/')) return msgs.push(`« ${f.name} » n’est pas une image.`);
        if (f.size > 10 * 1024 * 1024) return msgs.push(`« ${f.name} » dépasse 10 Mo.`);
        if (files.length >= 6) return msgs.push('6 photos maximum.');
        files.push(f);
      });
      eF.textContent = [...new Set(msgs)].join(' ');
      render();
    };
    input.addEventListener('change', () => { add(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
    drop.addEventListener('drop', e => add(e.dataTransfer.files));
    drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    drop.addEventListener('click', () => input.click());
    thumbs.addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (b) { files.splice(+b.dataset.rm, 1); render(); eF.textContent = ''; } });

    const QR = {
      car: v => v.trim().length >= 2 || 'Indiquez la marque et le modèle.',
      year: v => !v.trim() || (/^\d{4}$/.test(v.trim()) && +v >= 1950 && +v <= new Date().getFullYear() + 1) || 'Année invalide.',
      desc: v => v.trim().length >= 20 || 'Décrivez votre besoin (20 caractères minimum).',
      name: RULES.name, phone: RULES.phone, email: RULES.email, consent: RULES.consent
    };
    const ids = { car: 'e-car', year: 'e-year', desc: 'e-desc', name: 'e-name', phone: 'e-phone', email: 'e-email', consent: 'e-consent' };
    Object.keys(QR).forEach(k => live(quote.elements[k], QR[k], ids[k]));
    quote.addEventListener('submit', e => {
      e.preventDefault();
      const typeOk = !!quote.elements.type.value; $('#e-type').textContent = typeOk ? '' : 'Choisissez un type de travaux.';
      const res = Object.keys(QR).map(k => check(quote.elements[k], QR[k], ids[k]));
      if (!typeOk) return quote.querySelector('input[name=type]').focus();
      const first = Object.keys(QR)[res.indexOf(false)];
      if (first) return quote.elements[first].focus();
      const lbl = quote.querySelector('input[name=type]:checked').closest('.pick').querySelector('b').textContent;
      $('#qDoneTxt').textContent = `${lbl} — ${quote.elements.car.value.trim()}${files.length ? ` — ${files.length} photo${files.length > 1 ? 's' : ''} jointe${files.length > 1 ? 's' : ''}` : ''}. Rappel par ${quote.elements.cb.value === 'tel' ? 'téléphone' : 'e-mail'}.`;
      $('#qRef').textContent = ref();
      quote.hidden = true; const d = $('#quoteDone'); d.hidden = false; d.focus();
    });
    $('#qRestart').addEventListener('click', () => {
      quote.reset(); files = []; render(); cnt.textContent = '0';
      $$('.bad', quote).forEach(x => x.classList.remove('bad'));
      $('#quoteDone').hidden = true; quote.hidden = false; quote.elements.type[0].focus();
    });
  }
})();
