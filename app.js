(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  document.documentElement.classList.add('js');
  const CFG = window.NEXA_CONFIG || {};
  const has = k => typeof CFG[k] === 'string' && CFG[k].trim() !== '';

  /* ---------- Identité : remplissage depuis config.js ----------
     [data-cfg="champ"] reçoit la valeur ; si elle manque, un encadré « À fournir » (data-todo) s'affiche.
     [data-cfg-if="champ"] n'est affiché que si le champ est renseigné. */
  const missing = new Set();
  $$('[data-cfg]').forEach(el => {
    const k = el.dataset.cfg;
    const cond = el.closest('[data-cfg-if]');
    if (cond && !has(cond.dataset.cfgIf)) return; // bloc masqué : rien à signaler
    if (has(k)) {
      const v = CFG[k].trim();
      if (el.dataset.cfgHref === 'mailto') el.href = 'mailto:' + v;
      if (el.dataset.cfgHref === 'tel') el.href = 'tel:' + v.replace(/[^\d+]/g, '');
      el.textContent = v;
      el.classList.remove('todo');
    } else {
      missing.add(k);
      el.textContent = 'À fournir : ' + (el.dataset.todo || k);
      el.classList.add('todo');
      if (el.tagName === 'A') el.removeAttribute('href');
    }
  });
  $$('[data-cfg-if]').forEach(el => { el.hidden = !has(el.dataset.cfgIf); });
  $$('[data-cfg-unless]').forEach(el => { el.hidden = has(el.dataset.cfgUnless); });
  const avatar = $('#avatar');
  if (avatar) {
    if (has('founderPhoto')) { avatar.innerHTML = ''; const im = new Image(); im.src = CFG.founderPhoto; im.alt = CFG.founderName || ''; im.width = im.height = 160; im.decoding = 'async'; avatar.append(im); }
    else if (has('founderName')) avatar.textContent = CFG.founderName.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
  if (missing.size) console.info('[Nexa] Informations à compléter dans config.js :', [...missing].join(', '));

  /* ---------- Navigation ---------- */
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu'), mcta = $('#mcta');
  const contact = $('#contact'), simBox = $('#simulateur');
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    nav && nav.classList.toggle('is-scrolled', y > 20);
    if (y < 300) $$('.menu a.is-active').forEach(l => l.classList.remove('is-active'));
    if (mcta && contact) {
      // masquée près du formulaire et sur le simulateur (qui a son propre bouton)
      const sr = simBox && simBox.getBoundingClientRect();
      const nearForm = contact.getBoundingClientRect().top < innerHeight || (sr && sr.top < innerHeight * .8 && sr.bottom > innerHeight * .2);
      mcta.classList.toggle('show', y > 600 && !nearForm);
    }
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  if (burger && menu) {
    const setMenu = open => {
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      menu.classList.toggle('open', open);
      nav.classList.toggle('menu-open', open);
    };
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });
    matchMedia('(min-width: 961px)').addEventListener('change', e => e.matches && setMenu(false));

    const links = $$('.menu a[href^="#"]:not(.btn)');
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(l => { const t = $(l.getAttribute('href')); t && spy.observe(t); });
  }

  /* ---------- Apparition au défilement ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('in'); io.unobserve(el);
      // une fois apparu, on rend la main aux transitions propres de l'élément (survol des cartes)
      const end = e => { if (e.target !== el || e.propertyName !== 'transform') return; el.removeEventListener('transitionend', end); el.classList.remove('reveal', 'in'); el.style.removeProperty('--d'); };
      el.addEventListener('transitionend', end);
    });
  }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', Math.min(i * .07, .35) + 's');
    io.observe(el);
  });

  /* ---------- Hero : écrans réels de la démo sur le téléphone (fondu enchaîné sobre) ---------- */
  const stage = $('#stage');
  if (stage) {
    const shots = $$('.phone__screens img', stage), tabs = $$('.stage__tabs button', stage);
    // écrans secondaires chargés après la page (ils ne sont pas visibles au premier affichage)
    const loadRest = () => shots.forEach(im => { if (im.dataset.src) { if (im.dataset.srcset) { im.srcset = im.dataset.srcset; im.removeAttribute('data-srcset'); } im.src = im.dataset.src; im.removeAttribute('data-src'); } });
    if (document.readyState === 'complete') loadRest(); else addEventListener('load', loadRest);
    let cur = 0, auto = !matchMedia('(prefers-reduced-motion: reduce)').matches, hold = false;
    const show = n => { loadRest(); cur = n; shots.forEach((im, k) => im.classList.toggle('is-on', k === n)); tabs.forEach((t, k) => { t.classList.toggle('is-on', k === n); t.setAttribute('aria-pressed', k === n); }); };
    tabs.forEach((t, k) => t.addEventListener('click', () => { auto = false; show(k); }));
    stage.addEventListener('pointerenter', () => hold = true); stage.addEventListener('pointerleave', () => hold = false);
    stage.addEventListener('focusin', () => hold = true); stage.addEventListener('focusout', () => hold = false);
    setInterval(() => { if (auto && !hold && !document.hidden) show((cur + 1) % shots.length); }, 3800);
  }

  if (matchMedia('(hover:hover)').matches) {
    $$('.glow').forEach(c => c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--x', e.clientX - r.left + 'px');
      c.style.setProperty('--y', e.clientY - r.top + 'px');
    }));
  }

  /* ---------- Préparation de la demande (sans prix : chaque devis est établi après échange) ---------- */
  let summary = '';
  const sim = $('#sim');
  if (sim) {
    const range = $('#pages'), pagesOut = $('#pagesOut');
    const TYPES = {
      starter: { label: 'Site Starter (dès 500 €)', kind: 'Site Starter', delay: 'Délai indicatif : 1 semaine après réception de vos informations', max: 1 },
      landing: { label: 'Landing page premium', kind: 'Landing page', delay: 'Délai indicatif : 2 à 3 semaines après réception des contenus', max: 1 },
      vitrine: { label: 'Site vitrine professionnel', kind: 'Site vitrine', delay: 'Délai indicatif : 4 à 6 semaines après réception des contenus', max: 5 },
      refonte: { label: 'Refonte de site vitrine', kind: 'Refonte de site', delay: 'Délai indicatif : 4 à 6 semaines après réception des contenus', max: 5 },
      mesure: { label: 'Site sur mesure', kind: 'Site sur mesure', delay: 'Délai défini dans le devis, après étude de faisabilité', max: 15 }
    };
    const HAS = { textes: ['Textes', 'aide à la rédaction à prévoir'], photos: ['Photos', 'photos à prévoir (les vôtres de préférence)'], logo: ['Logo', 'logo à fournir'], domaine: ['Nom de domaine', 'domaine à acheter à votre nom (≈ 10 à 15 €/an)'] };
    const calc = () => {
      const k = sim.type.value, t = TYPES[k];
      if (k === 'landing' || k === 'starter') range.value = 1;
      range.disabled = k === 'landing' || k === 'starter';
      const pf = sim.querySelector('.sim__pages'); if (pf) pf.hidden = range.disabled;
      const pages = +range.value;
      pagesOut.textContent = pages;
      range.style.setProperty('--p', ((pages - 1) / 14 * 100) + '%');
      const over = pages > t.max;
      $('#simPrice').textContent = over ? 'Site sur mesure' : t.label;
      $('#simDelay').textContent = over ? 'Plus de 5 pages : étude de faisabilité puis devis' : t.delay;
      const have = [], todo = [];
      Object.keys(HAS).forEach(h => (sim.querySelector(`input[value=${h}]`).checked ? have : todo).push(h));
      const rows = [
        ['Pages', String(pages)],
        ['Déjà prêt', have.length ? have.map(h => HAS[h][0]).join(', ') : 'rien pour l\u2019instant'],
        ...(todo.length ? [['À prévoir', todo.map(h => HAS[h][0].toLowerCase()).join(', ')]] : []),
        ['Échéance', sim.when.value === 'date' ? 'date précise (à indiquer)' : 'souple']
      ];
      $('#simSum').innerHTML = rows.map(r => `<li><span>${r[0]}</span><b>${r[1]}</b></li>`).join('');
      summary = `Projet : ${over ? 'Site sur mesure' : t.label}, ${pages} page${pages > 1 ? 's' : ''}. ` +
        `Déjà prêt : ${have.length ? have.map(h => HAS[h][0].toLowerCase()).join(', ') : 'rien'}. ` +
        `Échéance : ${sim.when.value === 'date' ? 'date précise : …' : 'souple'}.`;
      sim.dataset.kind = over ? 'Site sur mesure' : t.kind;
    };
    sim.addEventListener('input', calc);
    calc();
    $('#simGo').addEventListener('click', () => {
      const f = $('#contactForm'); if (!f) return;
      f.elements.kind.value = sim.dataset.kind;
      f.elements.msg.value = summary + '\n\n';
    });
  }
  $$('[data-plan]').forEach(b => b.addEventListener('click', () => {
    const f = $('#contactForm'); if (!f) return;
    const p = b.dataset.plan;
    f.elements.kind.value = /Starter/.test(p) ? 'Site Starter' : /Landing/.test(p) ? 'Landing page' : /vitrine/.test(p) ? 'Site vitrine' : 'Site sur mesure';
    f.elements.msg.value = `Je souhaite un devis pour l\u2019offre « ${p} ».\n\n`;
  }));

  /* ---------- Formulaire de contact ----------
     Envoi réel via Formspree (URL dans config.js). Sans URL valide : aucun envoi, et le visiteur en est informé.
     Antispam : champ piège (_gotcha), délai minimal de remplissage, anti double-envoi, limites de longueur ;
     Formspree applique en plus son propre filtrage. */
  const form = $('#contactForm');
  if (!form) return;
  const ENDPOINT = (CFG.formEndpoint || '').trim();
  const KEY = (CFG.formAccessKey || '').trim();
  const W3F = ENDPOINT === 'https://api.web3forms.com/submit';
  const LIVE = /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(ENDPOINT) || (W3F && /^[0-9a-f-]{36}$/i.test(KEY));
  const ok = $('#ok'), sendErr = $('#e-send'), btn = form.querySelector('[type=submit]');
  const BTN_TXT = btn.textContent;
  $$('[data-live]').forEach(el => el.hidden = !LIVE);
  $$('[data-offline]').forEach(el => el.hidden = LIVE);
  const opened = Date.now();
  let lastSent = 0;

  const rules = {
    name: v => (v.trim().length >= 2 && v.trim().length <= 100) || 'Indiquez votre nom (2 caractères minimum).',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Adresse e-mail invalide (ex. nom@domaine.fr).',
    phone: v => !v.trim() || /^[+\d][\d\s.\-()]{7,19}$/.test(v.trim()) || 'Numéro de téléphone invalide.',
    kind: v => !!v || 'Choisissez un type de projet.',
    msg: v => (v.trim().length >= 15 && v.length <= 3000) || (v.length > 3000 ? 'Message trop long (3 000 caractères max.).' : 'Décrivez votre projet en quelques mots (15 caractères min.).'),
    rgpd: (v, el) => el.checked || 'Votre accord est nécessaire pour traiter votre demande.'
  };
  const check = el => {
    const res = rules[el.name](el.value, el);
    const err = $('#e-' + el.name);
    const bad = res !== true;
    err.textContent = bad ? res : '';
    el.classList.toggle('is-invalid', bad);
    el.setAttribute('aria-invalid', bad);
    return !bad;
  };
  Object.keys(rules).forEach(n => {
    const el = form.elements[n];
    el.addEventListener('blur', () => el.value && el.type !== 'checkbox' && check(el));
    el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => el.classList.contains('is-invalid') && check(el));
  });
  const count = $('#msgCount');
  if (count) form.elements.msg.addEventListener('input', () => { count.textContent = `${form.elements.msg.value.length} / 3000`; });

  const setBusy = busy => { btn.disabled = busy; btn.textContent = busy ? 'Envoi en cours…' : BTN_TXT; form.setAttribute('aria-busy', busy); };
  const fail = msg => { sendErr.textContent = msg; setBusy(false); };

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (btn.disabled) return;
    sendErr.textContent = '';
    const els = Object.keys(rules).map(n => form.elements[n]);
    const valid = els.map(check);
    const first = els[valid.indexOf(false)];
    if (first) { first.focus(); return; }
    // champ piège rempli = robot : rien n'est envoyé
    if (form.elements._gotcha.value) return fail("Votre demande n'a pas pu être envoyée.");
    if (Date.now() - opened < 3000) return fail('Merci de patienter quelques secondes avant d’envoyer.');
    if (Date.now() - lastSent < 30000) return fail('Une demande vient d’être envoyée. Patientez 30 secondes avant d’en envoyer une autre.');
    if (!LIVE) {
      return fail(has('email')
        ? `L'envoi en ligne n'est pas encore activé : votre message n'a pas été transmis. Écrivez-nous directement à ${CFG.email.trim()}.`
        : "L'envoi en ligne n'est pas encore activé : votre message n'a pas été transmis.");
    }
    if (!navigator.onLine) return fail('Vous semblez hors connexion. Vérifiez votre réseau puis réessayez : votre saisie est conservée.');
    setBusy(true);
    const data = new FormData(form);
    const subject = `Nouvelle demande — ${data.get('kind')} — ${data.get('name')}`;
    data.set('rgpd', 'Consentement donné le ' + new Date().toLocaleString('fr-FR'));
    data.delete('_gotcha');
    if (W3F) { data.set('access_key', KEY); data.set('subject', subject); data.set('from_name', 'Site Nexa Studio'); data.set('replyto', data.get('email')); data.set('botcheck', ''); }
    else { data.set('_subject', subject); data.set('_replyto', data.get('email')); data.set('_gotcha', ''); }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    fetch(ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: ctrl.signal })
      .then(async r => {
        const j = await r.clone().json().catch(() => ({}));
        if (r.ok && (!W3F || j.success === true)) {
          lastSent = Date.now();
          $('#okMail').textContent = data.get('email');
          form.reset(); if (count) count.textContent = '0 / 3000';
          form.hidden = true; ok.hidden = false; ok.focus(); setBusy(false);
          return;
        }
        throw new Error(j.errors?.map(x => x.message).join(' ') || j.message || 'HTTP ' + r.status);
      })
      .catch(err => {
        console.warn('Envoi formulaire :', err.message);
        fail(err.name === 'AbortError'
          ? "Le serveur met trop de temps à répondre. Votre message n'a pas été envoyé : réessayez dans un instant."
          : "L'envoi a échoué et votre message n'a pas été transmis. Réessayez dans un instant" + (has('email') ? ` ou écrivez-nous à ${CFG.email.trim()}.` : '.'));
      })
      .finally(() => clearTimeout(timer));
  });
  $('#again').addEventListener('click', () => {
    ok.hidden = true; form.hidden = false;
    $$('.is-invalid', form).forEach(el => { el.classList.remove('is-invalid'); el.removeAttribute('aria-invalid'); });
    form.elements.name.focus();
  });
})();
