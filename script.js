/* ═══════════════════════════════════════════════════════════════
   RAKIBUL ISLAM AKASH — PORTFOLIO SCRIPT v3
   Vanilla JS · No frameworks · Modern ES6+
   Features: Custom Cursor · Scroll Reveal · Typewriter
             Nav · Parallax · Card Tilt · Back-to-Top
             Smooth Scroll · Active Nav · Form Validation
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   UTILITIES
────────────────────────────────────────────────────────────── */
const $ = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];

const throttle = (fn, ms = 100) => {
  let last = 0;
  return (...args) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...args); } };
};

const debounce = (fn, ms = 150) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

/* ──────────────────────────────────────────────────────────────
   1. CUSTOM CURSOR — smooth dot + trailing circle
────────────────────────────────────────────────────────────── */
const initCustomCursor = () => {
  // Skip on touch-only devices
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const dot    = $('#cursorDot');
  const circle = $('#cursorCircle');
  if (!dot || !circle) return;

  // Position state
  let dotX = -100, dotY = -100;       // dot tracks mouse instantly
  let circX = -100, circY = -100;     // circle lags behind (lerp)
  let rafId;
  let isVisible = false;

  // Hover targets that expand the cursor circle
  const hoverSelectors = 'a, button, .btn, .project-card, .skill-card, .research-card, .nav-link, .social-btn, .contact-item, .skill-tag, .project-link, input, textarea';

  const show = () => {
    if (!isVisible) {
      dot.classList.remove('hidden');
      circle.classList.remove('hidden');
      isVisible = true;
    }
  };

  const hide = () => {
    dot.classList.add('hidden');
    circle.classList.add('hidden');
    isVisible = false;
  };

  // Immediately position the dot, lag the circle via lerp
  const render = () => {
    // Move dot instantly
    dot.style.left = `${dotX}px`;
    dot.style.top  = `${dotY}px`;

    // Lerp the trailing circle (0.12 = smoothness; lower = more lag)
    circX += (dotX - circX) * 0.12;
    circY += (dotY - circY) * 0.12;
    circle.style.left = `${circX}px`;
    circle.style.top  = `${circY}px`;

    rafId = requestAnimationFrame(render);
  };

  document.addEventListener('mousemove', (e) => {
    dotX = e.clientX;
    dotY = e.clientY;
    show();
  }, { passive: true });

  document.addEventListener('mouseleave', hide);
  document.addEventListener('mouseenter', show);

  // Expand circle on hoverable elements
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverSelectors)) document.body.classList.add('cursor-hover');
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverSelectors)) document.body.classList.remove('cursor-hover');
  }, { passive: true });

  // Start render loop
  hide();
  rafId = requestAnimationFrame(render);
};

/* ──────────────────────────────────────────────────────────────
   2. STICKY NAVBAR
────────────────────────────────────────────────────────────── */
const initStickyNav = () => {
  const navbar = $('#navbar');
  if (!navbar) return;

  const update = throttle(() => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, 80);

  window.addEventListener('scroll', update, { passive: true });
  update();
};

/* ──────────────────────────────────────────────────────────────
   3. MOBILE NAV TOGGLE
────────────────────────────────────────────────────────────── */
const initNavToggle = () => {
  const toggle = $('#navToggle');
  const menu   = $('#navMenu');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  toggle.addEventListener('click', () => setOpen(!menu.classList.contains('open')));

  $$('.nav-link', menu).forEach(link => link.addEventListener('click', () => setOpen(false)));

  document.addEventListener('click', (e) => {
    if (menu.classList.contains('open') && !menu.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) { setOpen(false); toggle.focus(); }
  });

  window.addEventListener('resize', debounce(() => {
    if (window.innerWidth > 768 && menu.classList.contains('open')) setOpen(false);
  }, 200));
};

/* ──────────────────────────────────────────────────────────────
   4. SMOOTH SCROLL — all internal anchor links
────────────────────────────────────────────────────────────── */
const initSmoothScroll = () => {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const target = $(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 70;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH, behavior: 'smooth' });
    history.pushState(null, '', link.getAttribute('href'));
  });
};

/* ──────────────────────────────────────────────────────────────
   5. ACTIVE NAV HIGHLIGHT (IntersectionObserver)
────────────────────────────────────────────────────────────── */
const initActiveNav = () => {
  const sections = $$('main section[id]');
  const links    = $$('.nav-link[href^="#"]');
  if (!sections.length || !links.length) return;

  const map = new Map(links.map(l => [l.getAttribute('href').slice(1), l]));
  const setActive = (id) => { links.forEach(l => l.classList.remove('active')); map.get(id)?.classList.add('active'); };

  new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
    { rootMargin: '-20% 0px -70% 0px' }
  ).observe.bind(new IntersectionObserver((entries) => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: '-20% 0px -70% 0px' }));

  // Simpler direct approach:
  const obs = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
  );
  sections.forEach(s => obs.observe(s));
};

/* ──────────────────────────────────────────────────────────────
   6. TYPEWRITER ANIMATION
────────────────────────────────────────────────────────────── */
const initTypewriter = () => {
  const el = $('#typewriter');
  if (!el) return;

  const phrases     = ['CSE Student', 'Software Developer', 'AI Enthusiast'];
  const TYPE_SPEED  = 80;   // ms per char while typing
  const ERASE_SPEED = 42;   // ms per char while erasing
  const PAUSE_FULL  = 1900; // pause when fully typed
  const PAUSE_EMPTY = 380;  // pause before next phrase

  let pIdx = 0, cIdx = 0, erasing = false;

  const tick = () => {
    const phrase = phrases[pIdx];
    if (!erasing) {
      cIdx++;
      el.textContent = phrase.slice(0, cIdx);
      if (cIdx === phrase.length) { erasing = true; setTimeout(tick, PAUSE_FULL); return; }
      setTimeout(tick, TYPE_SPEED);
    } else {
      cIdx--;
      el.textContent = phrase.slice(0, cIdx);
      if (cIdx === 0) { erasing = false; pIdx = (pIdx + 1) % phrases.length; setTimeout(tick, PAUSE_EMPTY); return; }
      setTimeout(tick, ERASE_SPEED);
    }
  };

  setTimeout(tick, 900);
};

/* ──────────────────────────────────────────────────────────────
   7. SCROLL REVEAL (IntersectionObserver)
────────────────────────────────────────────────────────────── */
const initScrollReveal = () => {
  const elements = $$('.scroll-reveal');
  if (!elements.length) return;

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.10, rootMargin: '0px 0px -48px 0px' }
  );

  elements.forEach(el => obs.observe(el));
};

/* ──────────────────────────────────────────────────────────────
   8. HERO MOUSE PARALLAX — subtle grid & orb shift
────────────────────────────────────────────────────────────── */
const initHeroParallax = () => {
  const hero = $('.hero');
  const grid = $('.hero__bg-grid');
  const orb1 = $('.hero__orb--1');
  const orb2 = $('.hero__orb--2');
  if (!hero || !grid) return;

  // Skip on touch or reduced motion
  if (!window.matchMedia('(hover: hover)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let rafId;

  const onMove = (e) => {
    const rect = hero.getBoundingClientRect();
    // Normalise to -1 … 1
    targetX = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    targetY = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
  };

  const render = () => {
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;

    // Very subtle parallax — grid moves slightly opposite to cursor
    if (grid) grid.style.transform = `translate(${currentX * -8}px, ${currentY * -6}px)`;
    if (orb1) orb1.style.transform  = `translate(${currentX * 14}px, ${currentY * 10}px)`;
    if (orb2) orb2.style.transform  = `translate(${currentX * -10}px, ${currentY * 14}px)`;

    rafId = requestAnimationFrame(render);
  };

  hero.addEventListener('mousemove', onMove, { passive: true });
  hero.addEventListener('mouseleave', () => {
    targetX = 0; targetY = 0;
  });

  rafId = requestAnimationFrame(render);
};

/* ──────────────────────────────────────────────────────────────
   9. PROJECT CARD 3-D TILT on mousemove
────────────────────────────────────────────────────────────── */
const initCardTilt = () => {
  const cards = $$('.project-card, .skill-card, .research-card');
  if (!window.matchMedia('(hover: hover)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MAX = 7; // degrees

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r   = card.getBoundingClientRect();
      const rX  = -(((e.clientY - r.top)  / r.height) - 0.5) * MAX * 2;
      const rY  =  (((e.clientX - r.left) / r.width)  - 0.5) * MAX * 2;
      card.style.transform = `perspective(900px) rotateX(${rX}deg) rotateY(${rY}deg) translateZ(6px) translateY(-7px)`;
    }, { passive: true });

    const reset = () => { card.style.transform = ''; };
    card.addEventListener('mouseleave', reset);
    card.addEventListener('blur', reset);
  });
};

/* ──────────────────────────────────────────────────────────────
   10. BACK TO TOP BUTTON
────────────────────────────────────────────────────────────── */
const initBackToTop = () => {
  const btn = $('#backToTop');
  if (!btn) return;

  window.addEventListener('scroll', throttle(() => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, 120), { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
};

/* ──────────────────────────────────────────────────────────────
   11. CONTACT FORM VALIDATION
────────────────────────────────────────────────────────────── */
const initContactForm = () => {
  const form      = $('#contactForm');
  if (!form) return;

  const fields = {
    name: {
      el: $('#cf-name'), errId: 'nameError',
      validate: v => {
        if (!v.trim())           return 'Name is required.';
        if (v.trim().length < 2) return 'Name must be at least 2 characters.';
        return null;
      }
    },
    email: {
      el: $('#cf-email'), errId: 'emailError',
      validate: v => {
        if (!v.trim()) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return 'Enter a valid email address.';
        return null;
      }
    },
    message: {
      el: $('#cf-message'), errId: 'messageError',
      validate: v => {
        if (!v.trim())            return 'Message cannot be empty.';
        if (v.trim().length < 10) return 'Message must be at least 10 characters.';
        return null;
      }
    }
  };

  const showErr  = (f, msg) => { const e = $(`#${f.errId}`); f.el.classList.add('input-error'); f.el.setAttribute('aria-invalid','true'); if (e) e.textContent = msg; };
  const clearErr = (f)      => { const e = $(`#${f.errId}`); f.el.classList.remove('input-error'); f.el.removeAttribute('aria-invalid'); if (e) e.textContent = ''; };
  const validate = (f)      => { const err = f.validate(f.el.value); err ? showErr(f, err) : clearErr(f); return !err; };

  Object.values(fields).forEach(f => {
    f.el.addEventListener('blur', () => validate(f));
    f.el.addEventListener('input', debounce(() => { if (f.el.classList.contains('input-error')) validate(f); }, 280));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const valid = Object.values(fields).map(validate).every(Boolean);
    if (!valid) { form.querySelector('.input-error')?.focus(); return; }

    const submitBtn  = $('#submitBtn');
    const btnText    = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const successBox = $('#formSuccess');

    submitBtn.disabled = true;
    btnText.hidden     = true;
    btnLoading.hidden  = false;

    try {
      await new Promise(r => setTimeout(r, 1600)); // simulate network
      form.reset();
      Object.values(fields).forEach(clearErr);
      if (successBox) successBox.hidden = false;
      setTimeout(() => { if (successBox) successBox.hidden = true; }, 6000);
    } catch (err) {
      console.error('Form error:', err);
    } finally {
      submitBtn.disabled = false;
      btnText.hidden     = false;
      btnLoading.hidden  = true;
    }
  });
};

/* ──────────────────────────────────────────────────────────────
   12. FOOTER YEAR
────────────────────────────────────────────────────────────── */
const initFooterYear = () => {
  const el = $('#year');
  if (el) el.textContent = new Date().getFullYear();
};

/* ──────────────────────────────────────────────────────────────
   13. LIGHT / DARK MODE TOGGLE
────────────────────────────────────────────────────────────── */
const initThemeToggle = () => {
  const btn = document.createElement('button');
  btn.id = 'themeToggle';
  btn.setAttribute('aria-label', 'Toggle light / dark mode');
  btn.setAttribute('title', 'Toggle theme');
  btn.innerHTML = '<i class="fa-solid fa-moon" aria-hidden="true"></i>';

  const style = document.createElement('style');
  style.textContent = `
    #themeToggle {
      position: fixed; bottom: 5.6rem; right: var(--space-8, 2rem);
      z-index: 998; width: 48px; height: 48px; border-radius: 50%;
      border: 1px solid var(--clr-border, rgba(99,179,237,0.15));
      background: var(--clr-surface, #0c1428);
      color: var(--clr-accent-1, #38bdf8); font-size: 1rem;
      cursor: pointer; display: grid; place-items: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      transition: transform 300ms cubic-bezier(0.34,1.56,0.64,1),
                  box-shadow 300ms ease, background 300ms ease, border-color 300ms ease;
    }
    #themeToggle:hover {
      transform: translateY(-4px) rotate(22deg);
      box-shadow: 0 8px 28px rgba(56,189,248,0.3);
      border-color: var(--clr-accent-1, #38bdf8);
    }
    body.light-mode {
      --clr-bg: #f0f4f8; --clr-bg-alt: #e8edf5;
      --clr-surface: #ffffff; --clr-surface-2: #f7f9fc;
      --clr-border: rgba(56,100,168,0.12); --clr-border-hover: rgba(56,100,168,0.28);
      --grad-card: linear-gradient(145deg,rgba(255,255,255,0.92) 0%,rgba(240,244,248,0.8) 100%);
      --grad-hero: radial-gradient(ellipse 80% 60% at 50% -10%,rgba(56,189,248,0.10) 0%,transparent 70%),
                   radial-gradient(ellipse 60% 50% at 80% 80%,rgba(129,140,248,0.07) 0%,transparent 60%),#f0f4f8;
      --txt-primary: #0f172a; --txt-secondary: #374151; --txt-muted: #6b7280;
      --shadow-card: 0 0 0 1px var(--clr-border), 0 8px 32px rgba(0,0,0,0.08);
      --shadow-glow: 0 0 32px rgba(56,189,248,0.12);
    }
    body.light-mode .navbar.scrolled { background: rgba(240,244,248,0.90) !important; }
    body.light-mode .nav-menu        { background: rgba(240,244,248,0.97); }
    body.light-mode .form-input      { background: rgba(0,0,0,0.03); }
    body.light-mode .form-input:focus{ background: rgba(56,189,248,0.05); }
    body.light-mode .hero__bg-grid   { background-image: radial-gradient(rgba(56,100,168,0.08) 1px, transparent 1px); }
    @media (max-width: 768px) { #themeToggle { bottom: 9rem; right: 1.25rem; } }
  `;
  document.head.appendChild(style);
  document.body.appendChild(btn);

  const stored  = localStorage.getItem('portfolio-theme');
  const isDarkOS = window.matchMedia('(prefers-color-scheme: dark)').matches;
  let dark = stored ? stored === 'dark' : isDarkOS;

  const apply = (isDark) => {
    dark = isDark;
    document.body.classList.toggle('light-mode', !isDark);
    btn.innerHTML = isDark
      ? '<i class="fa-solid fa-moon" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-sun"  aria-hidden="true"></i>';
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    localStorage.setItem('portfolio-theme', isDark ? 'dark' : 'light');
  };

  apply(dark);
  btn.addEventListener('click', () => apply(!dark));
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('portfolio-theme')) apply(e.matches);
  });
};

/* ──────────────────────────────────────────────────────────────
   14. GPA COUNTER ANIMATION
────────────────────────────────────────────────────────────── */
const initGpaCounter = () => {
  const el = $('.gpa-value');
  if (!el) return;
  const target = parseFloat(el.textContent) || 3.38;
  const dur    = 1500;

  new IntersectionObserver(([entry], obs) => {
    if (!entry.isIntersecting) return;
    obs.unobserve(entry.target);
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = (p * target).toFixed(2);   // ease-out cubic
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(2);
    };
    requestAnimationFrame(step);
  }, { threshold: 0.5 }).observe(el);
};

/* ──────────────────────────────────────────────────────────────
   15. PRELOADER
────────────────────────────────────────────────────────────── */
const initPreloader = () => {
  const pl = document.createElement('div');
  pl.id = 'preloader';
  pl.setAttribute('role', 'status');
  pl.setAttribute('aria-label', 'Loading portfolio');

  const s = document.createElement('style');
  s.textContent = `
    #preloader {
      position: fixed; inset: 0; z-index: 9999;
      background: #050b18; display: grid; place-items: center;
      transition: opacity 0.55s ease, visibility 0.55s ease;
    }
    #preloader.gone { opacity: 0; visibility: hidden; }
    .pl-logo {
      font-family: 'Poppins', sans-serif; font-size: 1.4rem; font-weight: 700; color: #f0f6ff;
      animation: plPulse 1s ease-in-out infinite alternate;
    }
    .pl-logo span { background: linear-gradient(135deg,#38bdf8,#818cf8); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
    @keyframes plPulse { from { opacity: 0.4; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
  `;
  pl.innerHTML = `<div class="pl-logo"><span>&lt;</span>Akash<span>/&gt;</span></div>`;
  document.head.appendChild(s);
  document.body.prepend(pl);

  const dismiss = () => {
    pl.classList.add('gone');
    pl.addEventListener('transitionend', () => pl.remove(), { once: true });
  };

  if (document.readyState === 'complete') setTimeout(dismiss, 200);
  else window.addEventListener('load', () => setTimeout(dismiss, 200), { once: true });
};

/* ──────────────────────────────────────────────────────────────
   16. NAV MAGNETIC EFFECT
────────────────────────────────────────────────────────────── */
const initNavMagnetic = () => {
  if (!window.matchMedia('(hover: hover)').matches) return;
  $$('.nav-link:not(.nav-link--cta)').forEach(link => {
    link.addEventListener('mousemove', (e) => {
      const r = link.getBoundingClientRect();
      const x = e.clientX - r.left - r.width  / 2;
      const y = e.clientY - r.top  - r.height / 2;
      link.style.transform = `translate(${x * 0.14}px, ${y * 0.22}px)`;
    }, { passive: true });
    link.addEventListener('mouseleave', () => { link.style.transform = ''; });
  });
};

/* ──────────────────────────────────────────────────────────────
   BOOT
────────────────────────────────────────────────────────────── */
const boot = () => {
  initPreloader();
  initCustomCursor();
  initStickyNav();
  initNavToggle();
  initSmoothScroll();
  initActiveNav();
  initTypewriter();
  initScrollReveal();
  initHeroParallax();
  initCardTilt();
  initBackToTop();
  initThemeToggle();
  initNavMagnetic();
  initContactForm();
  initGpaCounter();
  initFooterYear();

  console.info(
    '%c⚡ Portfolio v3 — Rakibul Islam Akash',
    'color:#38bdf8;font-family:monospace;font-size:11px;font-weight:bold;'
  );
};

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', boot)
  : boot();