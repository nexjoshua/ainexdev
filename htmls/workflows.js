/* Ainex · Automations page — vanilla JS, no dependencies */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Year */
  const year = $('#axYear');
  if (year) year.textContent = new Date().getFullYear();

  /* Header shadow on scroll */
  const header = $('#axHeader');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  const burger = $('#axBurger');
  const nav = $('#axNav');
  const setMenu = open => {
    if (!burger || !nav) return;
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('ax-menu-open', open);
  };
  if (burger && nav) {
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
    $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  }

  /* Marquee: duplicate the items once for a seamless loop */
  const track = $('#axMarquee');
  if (track) {
    [...track.children].forEach(node => {
      const clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  }

  /* Reveal on scroll */
  const reveals = $$('.ax-reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-in'));
  }

  /* Count-up stats */
  const counters = $$('[data-count]');
  const runCount = el => {
    const end = parseInt(el.dataset.count, 10);
    if (reduceMotion) { el.textContent = end.toLocaleString('en-US'); return; }
    const start = performance.now();
    const step = now => {
      const p = Math.min(1, (now - start) / 1600);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { runCount(entry.target); co.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => co.observe(el));
  }

  /* Missing screenshots: show a placeholder instead of a broken image */
  $$('.ax-shot img').forEach(img => {
    const markMissing = () => {
      img.style.display = 'none';
      img.closest('.ax-shot').classList.add('is-missing');
    };
    if (img.complete && img.naturalWidth === 0) markMissing();
    img.addEventListener('error', markMissing);
  });

  /* Pause background/phone videos when off screen to save data */
  if ('IntersectionObserver' in window) {
    const vo = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const v = entry.target;
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      });
    }, { threshold: 0.15 });
    $$('.ax-phone video').forEach(v => vo.observe(v));
  }

  /* Lightbox for screenshots and videos */
  const lb = $('#axLightbox');
  const lbBody = $('#axLightboxBody');
  const closeBtn = lb ? $('.ax-lightbox-close', lb) : null;
  let lastFocus = null;

  const openLightbox = (src, type, alt) => {
    if (!lb || !src) return;
    lastFocus = document.activeElement;
    lbBody.innerHTML = '';
    let el;
    if (type === 'video') {
      el = document.createElement('video');
      el.src = src;
      el.controls = true;
      el.playsInline = true;
      el.loop = true;
      el.autoplay = true;
    } else {
      el = document.createElement('img');
      el.src = src;
      el.alt = alt || '';
    }
    lbBody.appendChild(el);
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    document.body.classList.add('ax-lb-open');
    if (closeBtn) closeBtn.focus();
    if (type === 'video') el.play().catch(() => { el.muted = true; el.play().catch(() => {}); });
  };

  const closeLightbox = () => {
    if (!lb || lb.hidden) return;
    lb.classList.remove('is-open');
    document.body.classList.remove('ax-lb-open');
    const v = $('video', lbBody);
    if (v) v.pause();
    setTimeout(() => { lb.hidden = true; lbBody.innerHTML = ''; }, 250);
    if (lastFocus) lastFocus.focus();
  };

  $$('[data-full]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-missing')) return;
      const img = $('img', btn);
      openLightbox(btn.dataset.full, btn.dataset.type, img ? img.alt : '');
    });
  });
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (lb) lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLightbox(); setMenu(false); }
  });
})();
