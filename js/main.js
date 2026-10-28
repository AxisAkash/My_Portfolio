import { projects } from '../data/projects.js';

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;

const renderProjects = () => {
  const list = $('#projectsList');
  if (!list) return;

  list.innerHTML = projects.map((project) => `
    <article class="project-card${['sofol', 'car-rent'].includes(project.id) ? ' project-card--featured' : ''}" data-project-id="${project.id}" data-reveal>
      <div class="project-visual" aria-label="${project.placeholder}: replace with a project screenshot">
        <div class="project-visual__frame">
          <div class="project-visual__top"><span class="project-visual__eyebrow">${project.visualLabel}</span><span class="project-visual__mark" aria-hidden="true"></span></div>
          <div class="project-visual__rows" aria-hidden="true"><span class="project-visual__bar"></span><span class="project-visual__bar"></span><span class="project-visual__bar"></span></div>
          <span class="project-visual__label">Product preview / ${project.number}</span>
        </div>
        <span class="project-visual__todo">${project.placeholder}</span>
      </div>
      <div class="project-card__content">
        <div>
          <div class="project-card__header"><div><span class="eyebrow">${project.subtitle}</span><h3 class="project-card__title">${project.title}</h3></div><span class="project-card__number">${project.number}</span></div>
          <p class="project-card__outcome">${project.outcome}</p>
          <ul class="tag-list" aria-label="${project.title} technology stack">${project.stack.map((item) => `<li class="tag">${item}</li>`).join('')}</ul>
        </div>
        <div class="project-card__footer"><span class="project-card__role">${project.role}</span><span class="project-card__date">${project.date}</span><button class="project-card__cta" type="button" data-open-project="${project.id}">Open case study ${icon('arrow-up-right')}</button></div>
      </div>
    </article>
  `).join('');
};

const renderCaseStudy = (project) => {
  const content = $('#caseStudyContent');
  if (!content) return;

  const links = project.links.map((link) => {
    const placeholder = link.url.startsWith('TODO_');
    return placeholder
      ? `<span class="button" aria-disabled="true">${link.label}: ${link.url}</span>`
      : `<a class="button" href="${link.url}" target="_blank" rel="noopener noreferrer">${link.label} ${icon('arrow-up-right')}</a>`;
  }).join('');

  content.innerHTML = `
    <p class="case-study__kicker">${project.date} / ${project.role}</p>
    <h2 class="case-study__title" id="caseStudyTitle">${project.title}</h2>
    <p class="case-study__summary">${project.outcome}</p>
    <div class="case-study__grid">
      <section class="case-study__section"><h3>Problem</h3><p>${project.problem}</p></section>
      <section class="case-study__section"><h3>My role</h3><p>${project.roleDetail}</p></section>
      <section class="case-study__section"><h3>Architecture / approach</h3><p>${project.architecture}</p></section>
      <section class="case-study__section"><h3>Key features</h3><ul>${project.features.map((feature) => `<li>${feature}</li>`).join('')}</ul></section>
      <section class="case-study__section"><h3>Stack</h3><ul>${project.stack.map((item) => `<li>${item}</li>`).join('')}</ul></section>
      <section class="case-study__section"><h3>What I would improve</h3><p>${project.improve}</p></section>
    </div>
    <div class="case-study__links">${links}</div>
  `;
};

const getProjectFromHash = () => {
  const id = window.location.hash.startsWith('#project-') ? window.location.hash.replace('#project-', '') : '';
  return projects.find((project) => project.id === id);
};

const initCaseStudies = () => {
  const dialog = $('#caseStudy');
  const close = $('#caseStudyClose');
  if (!dialog || !close) return;

  const open = (project, updateHash = true) => {
    renderCaseStudy(project);
    if (updateHash) history.pushState({ project: project.id }, '', `#project-${project.id}`);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    document.body.dataset.dialogOpen = 'true';
    close.focus();
  };

  const dismiss = (updateHash = true) => {
    if (dialog.open) dialog.close();
    dialog.removeAttribute('open');
    delete document.body.dataset.dialogOpen;
    if (updateHash && window.location.hash.startsWith('#project-')) history.pushState({}, '', `${window.location.pathname}${window.location.search}`);
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open-project]');
    const card = event.target.closest('[data-project-id]');
    const projectId = trigger?.dataset.openProject || card?.dataset.projectId;
    if (!projectId) return;
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    event.preventDefault();
    if (document.startViewTransition && !prefersReducedMotion.matches) document.startViewTransition(() => open(project));
    else open(project);
  });

  close.addEventListener('click', () => dismiss());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dismiss(); });
  dialog.addEventListener('cancel', () => dismiss());
  window.addEventListener('popstate', () => {
    const project = getProjectFromHash();
    if (project) open(project, false);
    else dismiss(false);
  });

  const initialProject = getProjectFromHash();
  if (initialProject) open(initialProject, false);
};

const initTheme = () => {
  const button = $('#themeToggle');
  if (!button) return;

  const apply = (theme) => {
    document.documentElement.dataset.theme = theme;
    const light = theme === 'light';
    button.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
    button.innerHTML = icon(light ? 'moon' : 'sun');
    localStorage.setItem('portfolio-theme', theme);
  };

  apply(document.documentElement.dataset.theme || 'dark');
  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    if (document.startViewTransition && !prefersReducedMotion.matches) document.startViewTransition(() => apply(next));
    else apply(next);
  });
};

const initMobileNav = () => {
  const toggle = $('#navToggle');
  const menu = $('#navMenu');
  if (!toggle || !menu) return;
  let lastFocused;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { lastFocused = document.activeElement; $('.nav-link', menu)?.focus(); }
    else lastFocused?.focus();
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('.nav-link', menu).forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
    if (event.key !== 'Tab' || !menu.classList.contains('is-open')) return;
    const focusable = $$('a, button', menu);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener('resize', () => { if (window.innerWidth > 760 && menu.classList.contains('is-open')) setOpen(false); });
};

const initScrollUI = () => {
  const header = $('#siteHeader');
  const progress = $('#scrollProgress');
  const sections = $$('main section[id]');
  const indexLinks = $$('[data-index-link]');
  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${scrollable > 0 ? window.scrollY / scrollable : 0})`;
    header?.classList.toggle('is-scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', update, { passive: true });
  update();

  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    indexLinks.forEach((link) => link.classList.toggle('is-active', link.dataset.indexLink === entry.target.id));
    $$('.nav-link').forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`));
  }), { rootMargin: '-35% 0px -55% 0px' });
  sections.forEach((section) => observer.observe(section));
};

const initReveal = () => {
  const items = $$('[data-reveal]');
  if (prefersReducedMotion.matches) { items.forEach((item) => item.classList.add('is-visible')); return; }
  const observer = new IntersectionObserver((entries, self) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); self.unobserve(entry.target); }
  }), { rootMargin: '0px 0px -48px' });
  items.forEach((item) => observer.observe(item));
};

const initDhakaTime = () => {
  const time = $('#dhakaTime');
  if (!time) return;
  const update = () => {
    const now = new Date();
    time.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now) + ' BST';
    time.dateTime = now.toISOString();
  };
  update();
  window.setInterval(update, 1000);
};

const initMagneticButton = () => {
  const button = $('[data-magnetic]');
  if (!button || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || prefersReducedMotion.matches) return;
  button.addEventListener('pointermove', (event) => {
    const rect = button.getBoundingClientRect();
    button.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * 0.08}px, ${(event.clientY - rect.top - rect.height / 2) * 0.12}px)`;
  });
  button.addEventListener('pointerleave', () => { button.style.transform = ''; });
};

const initCopyEmail = () => {
  const button = $('#copyEmail');
  if (!button) return;
  const label = $('span', button);
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.email);
      label.textContent = 'Email copied';
    } catch {
      label.textContent = button.dataset.email;
    }
    window.setTimeout(() => { label.textContent = 'Copy email'; }, 2400);
  });
};

const initForm = () => {
  const form = $('#contactForm');
  if (!form) return;
  const fields = [
    { input: $('#name'), error: $('#nameError'), message: 'Please enter your name.' },
    { input: $('#email'), error: $('#emailError'), message: 'Please enter a valid email.' },
    { input: $('#message'), error: $('#messageError'), message: 'Please add a message of at least 10 characters.' }
  ];
  const status = $('#formStatus');
  const validate = ({ input, error, message }) => {
    const valid = input.value.trim() && (input.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) && (input.id !== 'message' || input.value.trim().length >= 10);
    input.setAttribute('aria-invalid', String(!valid));
    error.textContent = valid ? '' : message;
    return Boolean(valid);
  };
  fields.forEach((field) => field.input.addEventListener('blur', () => validate(field)));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.textContent = '';
    status.removeAttribute('data-state');
    const valid = fields.map(validate).every(Boolean);
    if (!valid) { fields.find((field) => field.input.getAttribute('aria-invalid') === 'true')?.input.focus(); return; }
    if ($('#company').value) return;

    const button = $('#submitButton');
    button.disabled = true;
    button.firstChild.textContent = 'Sending... ';
    const endpoint = form.dataset.endpoint;
    try {
      if (endpoint.includes('ENDPOINT_TODO')) throw new Error('endpoint-placeholder');
      const response = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('request-failed');
      form.reset();
      status.dataset.state = 'success';
      status.textContent = 'Message sent. I will get back to you soon.';
    } catch (error) {
      const subject = encodeURIComponent(`Portfolio contact from ${$('#name').value.trim()}`);
      const body = encodeURIComponent(`${$('#message').value.trim()}\n\nFrom: ${$('#name').value.trim()} (${$('#email').value.trim()})`);
      window.location.href = `mailto:rakibulislamakash40@gmail.com?subject=${subject}&body=${body}`;
      status.dataset.state = 'error';
      status.textContent = 'Opening your email app as a fallback.';
    } finally {
      button.disabled = false;
      button.firstChild.textContent = 'Send message ';
    }
  });
};

const initFooter = () => { const year = $('#year'); if (year) year.textContent = new Date().getFullYear(); };

renderProjects();
initTheme();
initMobileNav();
initScrollUI();
initReveal();
initCaseStudies();
initDhakaTime();
initMagneticButton();
initCopyEmail();
initForm();
initFooter();
