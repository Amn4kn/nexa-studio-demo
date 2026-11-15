(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  document.documentElement.classList.add('js');

  /* Nav: scrolled state + mobile menu + mobile CTA */
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu'), mcta = $('#mcta');
  const contact = $('#contact'), devis = $('#devis');
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 20);
    if (y < 300) $$('.menu a.is-active').forEach(l => l.classList.remove('is-active'));
    const nearForm = contact.getBoundingClientRect().top < innerHeight || devis.getBoundingClientRect().top < innerHeight * .6 && devis.getBoundingClientRect().bottom > 0;
    mcta.classList.toggle('show', y > 600 && !nearForm);
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

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

  /* Active link */
  const links = $$('.menu a[href^="#"]:not(.btn)');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(l => { const t = $(l.getAttribute('href')); t && spy.observe(t); });

  /* Reveal on scroll with stagger */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add('in'); io.unobserve(el);
      // une fois apparu, on rend la main aux transitions propres de l'élément (hover des cartes)
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

  /* Pointer glow on cards (desktop only) */
  if (matchMedia('(hover:hover)').matches) {
    $$('.glow').forEach(c => c.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--x', e.clientX - r.left + 'px');
      c.style.setProperty('--y', e.clientY - r.top + 'px');
    }));
  }

  /* Simulator */
  const sim = $('#sim'), range = $('#pages'), pagesOut = $('#pagesOut');
  const TYPES = {
    landing: { label: 'Landing page', base: 690, incl: 1, weeks: [2, 3] },
    vitrine: { label: 'Site vitrine', base: 1490, incl: 5, weeks: [4, 6] },
    refonte: { label: 'Refonte', base: 1790, incl: 5, weeks: [5, 7] },
    ecom: { label: 'Boutique légère', base: 2990, incl: 5, weeks: [6, 9] }
  };
  const OPTS = { identite: ['Identité visuelle', 590], redac: ['Rédaction', 390], seo: ['SEO avancé', 290], resa: ['Réservation', 450], multi: ['Bilingue', 480] };
  const PAGE = 120;
  const fmt = n => n.toLocaleString('fr-FR') + ' €';
  const round = n => Math.round(n / 10) * 10;
  let summary = '';

  const calc = () => {
    const t = TYPES[sim.type.value];
    // une landing page = 1 page, comme dans l'offre Essentiel
    const isLanding = sim.type.value === 'landing';
    if (isLanding) range.value = 1;
    range.disabled = isLanding;
    const pages = +range.value;
    pagesOut.textContent = pages;
    range.style.setProperty('--p', ((pages - 1) / 14 * 100) + '%');
    const extra = Math.max(0, pages - t.incl);
    const rows = [[t.label, t.base]];
    if (extra) rows.push([`${extra} page${extra > 1 ? 's' : ''} supplémentaire${extra > 1 ? 's' : ''}`, extra * PAGE]);
    $$('input[name=opt]:checked', sim).forEach(o => rows.push(OPTS[o.value]));
    let total = rows.reduce((s, r) => s + r[1], 0);
    const rush = sim.rush.value === '1';
    if (rush) { rows.push(['Délai prioritaire (+25 %)', round(total * .25)]); total = round(total * 1.25); }
    // borne basse = tarif "dès" des offres, jamais en dessous
    const lo = round(total), hi = round(total * 1.2);
    let [w1, w2] = t.weeks;
    const add = Math.floor(extra / 4) + $$('input[name=opt]:checked', sim).length * .5;
    w1 += Math.floor(add); w2 += Math.ceil(add);
    if (rush) { w1 = Math.max(1, Math.round(w1 * .7)); w2 = Math.max(w1 + 1, Math.round(w2 * .7)); }
    $('#simPrice').textContent = `${fmt(lo)} – ${fmt(hi)}`;
    $('#simDelay').textContent = `Délai estimé : ${w1} à ${w2} semaines`;
    $('#simSum').innerHTML = rows.map(r => `<li><span>${r[0]}</span><b>${fmt(r[1])}</b></li>`).join('');
    summary = `Estimation simulateur : ${t.label}, ${pages} page${pages > 1 ? 's' : ''}` +
      (rows.length > 1 ? `, options : ${rows.slice(1).map(r => r[0]).join(', ')}` : '') +
      `. Fourchette : ${fmt(lo)} – ${fmt(hi)}, ${w1} à ${w2} semaines.`;
    return t;
  };
  sim.addEventListener('input', calc);
  calc();

  /* Prefill contact from simulator / plans */
  const kind = $('#kind'), msg = $('#msg');
  const kindMap = { landing: 'Landing page', vitrine: 'Site vitrine', refonte: 'Refonte de site', ecom: 'Autre' };
  $('#simGo').addEventListener('click', () => {
    kind.value = kindMap[sim.type.value];
    msg.value = summary + '\n\n';
  });
  $$('[data-plan]').forEach(b => b.addEventListener('click', () => {
    const p = b.dataset.plan;
    kind.value = p === 'Essentiel' ? 'Landing page' : p === 'Premium' ? 'Site vitrine' : 'Autre';
    msg.value = `Je suis intéressé(e) par la formule ${p}.\n\n`;
  }));

  /* Contact form
     Envoi réel : créez un formulaire sur https://formspree.io, puis collez son URL ci-dessous
     (ex. 'https://formspree.io/f/abcdwxyz'). Vide = mode démonstration, rien n'est envoyé. */
  const FORM_ENDPOINT = '';
  const LIVE = /^https:\/\/formspree\.io\/f\/\w+$/.test(FORM_ENDPOINT);
  const form = $('#contactForm'), ok = $('#ok');
  if (LIVE) {
    $$('[data-demo]').forEach(el => el.hidden = true);
    $$('[data-live]').forEach(el => el.hidden = false);
  }
  const rules = {
    name: v => v.trim().length >= 2 || 'Indiquez votre nom.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Adresse e-mail invalide.',
    phone: v => !v.trim() || /^[+\d][\d\s.\-()]{7,}$/.test(v.trim()) || 'Numéro de téléphone invalide.',
    kind: v => !!v || 'Choisissez un type de projet.',
    msg: v => v.trim().length >= 15 || 'Décrivez votre projet en quelques mots (15 caractères min.).',
    rgpd: (v, el) => el.checked || 'Votre accord est nécessaire pour vous répondre.'
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
    el.addEventListener('blur', () => el.value && check(el));
    el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => el.classList.contains('is-invalid') && check(el));
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (form.elements.website.value) return; // honeypot
    const els = Object.keys(rules).map(n => form.elements[n]);
    const valid = els.map(check);
    const first = els[valid.indexOf(false)];
    if (first) { first.focus(); return; }
    const btn = form.querySelector('[type=submit]');
    const sendErr = $('#e-send');
    sendErr.textContent = '';
    btn.disabled = true; btn.textContent = 'Envoi…';
    const done = () => { btn.disabled = false; btn.textContent = 'Envoyer ma demande'; };
    const success = () => { form.hidden = true; ok.hidden = false; ok.focus(); done(); };
    if (!LIVE) { setTimeout(success, 700); return; }
    const data = new FormData(form);
    data.delete('website');
    data.set('_subject', `Nouvelle demande — ${data.get('kind')} — ${data.get('name')}`);
    data.set('_replyto', data.get('email'));
    fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(async r => {
        if (r.ok) return success();
        const j = await r.json().catch(() => ({}));
        throw new Error(j.errors?.map(x => x.message).join(' ') || 'HTTP ' + r.status);
      })
      .catch(err => {
        console.warn('Envoi formulaire :', err.message);
        sendErr.textContent = "L'envoi a échoué. Vérifiez votre connexion et réessayez, ou écrivez-nous directement par e-mail.";
        done();
      });
  });
  $('#again').addEventListener('click', () => {
    form.reset(); ok.hidden = true; form.hidden = false;
    $$('.is-invalid', form).forEach(el => el.classList.remove('is-invalid'));
    form.elements.name.focus();
  });
})();
