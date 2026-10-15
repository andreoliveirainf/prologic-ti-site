// ============ ProLogic TI — script ============

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Header shadow + scroll progress
const header = document.getElementById('header');
const progress = document.getElementById('scrollProgress');
let ticking = false;
function onScroll() {
  header.classList.toggle('scrolled', window.scrollY > 8);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progress && max > 0) progress.style.transform = `scaleX(${Math.min(1, window.scrollY / max)})`;
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');
navToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('mobile-open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
});
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('mobile-open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', false);
  });
});

// Active section in nav
const navLinks = [...nav.querySelectorAll('a')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
['sobre', 'servicos', 'portfolio', 'contato'].forEach(id => {
  const el = document.getElementById(id);
  if (el) sectionObserver.observe(el);
});

// Scroll reveal (with per-element stagger via --d)
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add('in-view');
    revealObserver.unobserve(el);
    // libera o delay depois da entrada, para o hover não herdar o atraso
    setTimeout(() => el.style.removeProperty('--d'), 1400);
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Count-up nos números da seção Sobre
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    countObserver.unobserve(el);
    const target = Number(el.dataset.count);
    const node = el.firstChild;
    if (reduceMotion || !node || node.nodeType !== Node.TEXT_NODE) return;
    const start = performance.now();
    const dur = 1100;
    (function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      node.nodeValue = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    })(start);
  });
}, { threshold: 0.6 });
document.querySelectorAll('.stat-num[data-count]').forEach(el => countObserver.observe(el));

// Spotlight que segue o mouse nos cards de serviço
const bento = document.querySelector('.bento');
if (bento && !reduceMotion) {
  bento.addEventListener('pointermove', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}

// Marquee: duplica o conteúdo para o loop contínuo
const track = document.querySelector('.marquee-track');
if (track) {
  [...track.children].forEach(child => {
    const clone = child.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  });
}

// Hero: feed ilustrativo
const feed = document.getElementById('heroFeed');
const orders = document.getElementById('kpiOrders');
if (feed && !reduceMotion) {
  const events = [
    'pedido recebido · atendimento via WhatsApp',
    'chamado aberto · categoria infraestrutura',
    'cotação concluída · melhor preço por item',
    'equipamento movimentado · inventário atualizado',
    'chamado resolvido · dentro do SLA',
    'relatório de vendas gerado automaticamente',
    'backup diário concluído',
  ];
  let i = 0;
  let count = Number(orders ? orders.textContent : 0);
  setInterval(() => {
    if (document.hidden) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const li = document.createElement('li');
    li.className = 'new';
    li.innerHTML = `<span class="t">${hh}:${mm}</span><span class="m">${events[i++ % events.length]}</span>`;
    feed.prepend(li);
    while (feed.children.length > 4) feed.lastElementChild.remove();
    if (orders && i % 2 === 1) orders.textContent = String(++count);
  }, 3400);
}

// Vitrine de cases: monta a partir dos cards (que ficam como fallback sem JS)
(function buildShowcase() {
  const mount = document.getElementById('showcase');
  const cards = [...document.querySelectorAll('#pfData .pf-card')];
  if (!mount || !cards.length) return;

  const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const projects = cards.map(card => {
    const overview = card.querySelector('.pf-thumb svg');
    const tiles = [...card.querySelectorAll('.screen-tile')].map(t => ({
      label: t.querySelector('.screen-label').textContent.trim(),
      svg: t.querySelector('svg'),
    }));
    return {
      title: card.querySelector('h3').textContent.trim(),
      tag: card.querySelector('.pf-tag').textContent.trim(),
      live: !!card.querySelector('.pf-live'),
      descHtml: card.querySelector('.pf-body > p:not(.screens-label):not(.pf-note)').innerHTML,
      note: card.querySelector('.pf-note') ? card.querySelector('.pf-note').textContent.trim() : '',
      link: card.querySelector('.pf-link') ? card.querySelector('.pf-link').getAttribute('href') : '',
      // data-shot="assets/shots/x.png" no card: captura real vira a primeira tela da vitrine
      screens: [
        ...(card.dataset.shot ? [{ label: 'Tela real', img: card.dataset.shot }] : []),
        { label: 'Visão geral', svg: overview },
        ...tiles,
      ],
      hasShot: !!card.dataset.shot,
    };
  });

  const tabs = document.createElement('div');
  tabs.className = 'sc-tabs';
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', 'Escolha um projeto');

  const view = document.createElement('div');
  view.className = 'sc-view';
  view.innerHTML = `
    <div class="sc-frame">
      <div class="sc-frame-bar"><span class="dots"><i></i><i></i><i></i></span><span class="sc-url"></span></div>
      <div class="sc-canvas" aria-live="polite"></div>
    </div>
    <div class="sc-screens" role="group" aria-label="Telas do projeto"></div>
    <div class="sc-info"></div>`;
  const canvas = view.querySelector('.sc-canvas');
  const urlBar = view.querySelector('.sc-url');
  const screensBox = view.querySelector('.sc-screens');
  const info = view.querySelector('.sc-info');

  let current = 0;
  let currentScreen = 0;

  function showScreen(p, idx) {
    currentScreen = idx;
    const s = p.screens[idx];
    urlBar.textContent = `${slug(p.title)} › ${slug(s.label)}`;
    screensBox.querySelectorAll('.sc-screen').forEach((b, k) => {
      b.classList.toggle('is-active', k === idx);
      b.setAttribute('aria-pressed', k === idx);
    });
    if (s.img) {
      const img = document.createElement('img');
      img.src = s.img; img.alt = `${p.title} — ${s.label}`;
      img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
      canvas.replaceChildren(img);
      return;
    }
    const svg = s.svg.cloneNode(true);
    svg.setAttribute('class', 'stage-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${p.title} — ${s.label}`);
    [...svg.children].forEach((c, i) => c.style.setProperty('--i', i));
    canvas.replaceChildren(svg);
  }

  function showProject(idx) {
    current = idx;
    const p = projects[idx];
    tabs.querySelectorAll('.sc-tab').forEach((b, k) => {
      b.classList.toggle('is-active', k === idx);
      b.setAttribute('aria-pressed', k === idx);
    });
    screensBox.replaceChildren(...p.screens.map((s, k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sc-screen';
      b.textContent = s.label;
      b.addEventListener('click', () => showScreen(p, k));
      return b;
    }));
    screensBox.hidden = p.screens.length < 2;
    info.innerHTML = `
      <div class="sc-meta">
        <span class="pf-tag">${p.tag}</span>
        ${p.live ? '<span class="pf-live"><span class="status-dot"></span>Em produção</span>' : ''}
      </div>
      <h3></h3>
      <p>${p.descHtml}</p>
      ${p.link ? `<a href="${p.link}" target="_blank" rel="noopener" class="pf-link">Ver projeto ↗</a>` : ''}
      ${p.note ? '<p class="pf-note"></p>' : ''}`;
    info.querySelector('h3').textContent = p.title;
    if (p.note) info.querySelector('.pf-note').textContent = p.note;
    showScreen(p, p.hasShot ? 0 : (p.screens.length > 1 ? 1 : 0));
  }

  projects.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sc-tab';
    b.innerHTML = `<span class="sc-tab-idx">${String(i + 1).padStart(2, '0')}</span><span class="sc-tab-name"></span><span class="sc-tab-tag"></span>`;
    b.querySelector('.sc-tab-name').textContent = p.title;
    b.querySelector('.sc-tab-tag').textContent = p.tag;
    b.addEventListener('click', () => showProject(i));
    tabs.appendChild(b);
  });

  mount.append(tabs, view);
  showProject(0);
})();

// Contact form -> mailto (no backend required)
const form = document.getElementById('contactForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

  const subject = encodeURIComponent(`Contato pelo site — ${name}`);
  const body = encodeURIComponent(
    `Nome: ${name}\nE-mail: ${email}\n\nMensagem:\n${message}`
  );

  window.location.href = `mailto:andreoliveirainf@gmail.com?subject=${subject}&body=${body}`;
});
