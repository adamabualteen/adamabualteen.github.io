'use strict';

// ── Theme toggle ──────────────────────────────────────────────────────────────

(function () {
  const root   = document.documentElement;
  const btn    = document.querySelector('.theme-toggle');
  const stored = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (stored === 'dark' || (!stored && prefersDark)) {
    root.classList.add('dark');
  }

  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = root.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }
}());

// ── Lightbox ──────────────────────────────────────────────────────────────────

(function () {
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Photo viewer');

  const img = document.createElement('img');
  box.appendChild(img);
  document.body.appendChild(box);

  function open(src, alt) {
    img.src  = src;
    img.alt  = alt || '';
    box.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    box.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { img.src = ''; }, 200);
  }

  // Click any masonry photo to open
  document.querySelectorAll('.masonry-item img').forEach(el => {
    el.addEventListener('click', () => open(el.src, el.alt));
  });

  // Click backdrop to close
  box.addEventListener('click', e => {
    if (e.target !== img) close();
  });

  // Escape to close
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });
}());
