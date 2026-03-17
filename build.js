#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');
const matter         = require('gray-matter');
const { marked }     = require('marked');

// ── Config ────────────────────────────────────────────────────────────────────

const SITE_AUTHOR  = 'Adam Abualteen';
const SITE_DESC    = 'Photography and writing by Adam Abualteen.';
const SITE_URL     = 'https://appletini.dev';
const GA_ID        = 'G-N0SRDP75RC';

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// ── Build ─────────────────────────────────────────────────────────────────────

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// Static assets
copyDir(path.join(ROOT, 'assets'), path.join(DIST, 'assets'));
copyFile(path.join(ROOT, 'fav.png'), path.join(DIST, 'fav.png'));
copyFile(path.join(ROOT, 'CNAME'),   path.join(DIST, 'CNAME'));
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

// Content
const posts  = loadPosts();
const albums = loadAlbums();

// Copy photo images into dist
for (const album of albums) {
  copyDir(
    path.join(ROOT, 'photos', album.slug),
    path.join(DIST, 'photos', album.slug),
    ['.jpg', '.jpeg', '.png', '.webp']
  );
}

// Pages
write('index.html',          homePage(posts, albums));
write('about/index.html',    page({ title: 'About',  content: aboutPage() }));
write('blog/index.html',     page({ title: 'Blog',   content: blogListPage(posts) }));
write('photos/index.html',   page({ title: 'Photos', content: photosListPage(albums) }));

for (const post of posts) {
  write(`blog/${post.slug}/index.html`, page({
    title:       post.title,
    description: post.description,
    content:     blogPostPage(post),
  }));
}

for (const album of albums) {
  write(`photos/${album.slug}/index.html`, page({
    title:       album.title,
    description: album.description,
    content:     albumPage(album),
  }));
}

console.log(`\nDone. ${posts.length} post(s), ${albums.length} album(s).\n`);

// ── Loaders ───────────────────────────────────────────────────────────────────

function loadPosts() {
  const dir = path.join(ROOT, 'src', 'posts');
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, f), 'utf8'));
      return {
        slug:        f.replace(/\.md$/, ''),
        title:       data.title       || 'Untitled',
        date:        data.date        ? new Date(data.date) : new Date(),
        description: data.description || '',
        html:        marked(content),
      };
    })
    .sort((a, b) => b.date - a.date);
}

function loadAlbums() {
  const dir = path.join(ROOT, 'photos');
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => {
      const metaPath = path.join(dir, e.name, 'meta.json');
      const meta = fs.existsSync(metaPath)
        ? JSON.parse(fs.readFileSync(metaPath, 'utf8'))
        : {};

      // Use photos from meta, or auto-discover images in the folder
      const imgDir = path.join(dir, e.name);
      const photos = meta.photos
        || fs.readdirSync(imgDir)
            .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
            .sort()
            .map(f => ({ src: f, alt: '' }));

      return {
        slug:        e.name,
        title:       meta.title       || e.name,
        date:        meta.date        ? new Date(meta.date) : new Date(),
        description: meta.description || '',
        cover:       meta.cover       || photos[0]?.src || null,
        photos,
      };
    })
    .sort((a, b) => b.date - a.date);
}

// ── Layout ────────────────────────────────────────────────────────────────────

function base({ title, description = SITE_DESC, body, isHome = false }) {
  const pageTitle = isHome ? SITE_AUTHOR : `${title} — ${SITE_AUTHOR}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="icon" href="/fav.png" type="image/png">

  <script>if(localStorage.getItem('theme')==='dark'||(!localStorage.getItem('theme')&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')</script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">

  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
  <script>
    window.dataLayer=window.dataLayer||[];
    function gtag(){dataLayer.push(arguments);}
    gtag('js',new Date());
    gtag('config','${GA_ID}');
  </script>

  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
  ${nav()}
  <main>${body}</main>
  ${footer()}
  <script src="/assets/js/main.js"></script>
</body>
</html>`;
}

function page({ title, description, content }) {
  return base({ title, description, body: content });
}

function nav() {
  return `<header>
  <a href="/" class="nav-logo" aria-label="Home">
    <img src="/fav.png" alt="${SITE_AUTHOR}">
  </a>
  <div class="nav-right">
    <nav class="nav-links" aria-label="Main">
      <a href="/photos/">Photos</a>
      <a href="/blog/">Blog</a>
      <a href="/about/">About</a>
    </nav>
    <button class="theme-toggle" aria-label="Toggle dark mode">
      <svg class="icon-moon" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      <svg class="icon-sun"  viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2"  x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2"  y1="12" x2="5"  y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93"  x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.07" y2="19.07"/><line x1="4.93" y1="19.07" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05"  x2="19.07" y2="4.93"/></svg>
    </button>
  </div>
</header>`;
}

function footer() {
  return `<footer>
  <p>&copy; ${new Date().getFullYear()} ${SITE_AUTHOR}</p>
</footer>`;
}

// ── Pages ─────────────────────────────────────────────────────────────────────

function homePage(posts, albums) {
  const recentAlbums = albums.slice(0, 6);
  const recentPosts  = posts.slice(0, 3);

  const albumsSection = recentAlbums.length > 0 ? `
  <section class="section">
    <div class="section-header">
      <span class="section-title">Recent Work</span>
      <a href="/photos/" class="section-link">View all</a>
    </div>
    <div class="albums-grid">
      ${recentAlbums.map(albumCard).join('\n      ')}
    </div>
  </section>` : '';

  const postsSection = recentPosts.length > 0 ? `
  <section class="section section--narrow">
    <div class="section-header">
      <span class="section-title">Writing</span>
      <a href="/blog/" class="section-link">View all</a>
    </div>
    <ul class="post-list">
      ${recentPosts.map(postItem).join('\n      ')}
    </ul>
  </section>` : '';

  return base({
    isHome: true,
    title:  SITE_AUTHOR,
    body: `
  <section class="hero">
    <h1 class="hero-name">${SITE_AUTHOR}</h1>
    <p class="hero-tagline">Engineering &middot; Photography &middot; Writing</p>
    <div class="hero-social">
      <a href="https://linkedin.com/in/adamabualteen" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      </a>
      <a href="https://instagram.com/appletiniarchive" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
      </a>
    </div>
  </section>
  ${albumsSection}
  ${postsSection}`,
  });
}

function blogListPage(posts) {
  const content = posts.length > 0
    ? `<ul class="post-list">${posts.map(postItem).join('')}</ul>`
    : `<p class="empty-state">No posts yet.</p>`;

  return `
  <div class="page-header">
    <h1 class="page-title">Blog</h1>
  </div>
  <div class="section section--narrow">
    ${content}
  </div>`;
}

function photosListPage(albums) {
  const content = albums.length > 0
    ? `<div class="albums-grid">${albums.map(albumCard).join('')}</div>`
    : `<p class="empty-state">No albums yet.</p>`;

  return `
  <div class="page-header">
    <h1 class="page-title">Photos</h1>
  </div>
  <div class="section">
    ${content}
  </div>`;
}

function blogPostPage(post) {
  return `
  <article class="post-content">
    <header class="post-header">
      <h1 class="post-title">${esc(post.title)}</h1>
      <p class="post-meta">${formatDate(post.date)}</p>
    </header>
    <div class="prose">
      ${post.html}
    </div>
  </article>`;
}

function albumPage(album) {
  const grid = album.photos.length > 0
    ? album.photos.map(p => `
    <div class="masonry-item">
      <img src="/photos/${album.slug}/${p.src}" alt="${esc(p.alt || '')}" loading="lazy">
    </div>`).join('')
    : '<p class="empty-state">No photos yet.</p>';

  return `
  <div class="page-header">
    <h1 class="page-title">${esc(album.title)}</h1>
    ${album.description ? `<p class="page-description">${esc(album.description)}</p>` : ''}
    <p class="post-meta">${formatDate(album.date)}</p>
  </div>
  <div class="section">
    <div class="masonry">
      ${grid}
    </div>
  </div>`;
}

function aboutPage() {
  const src = path.join(ROOT, 'src', 'pages', 'about.md');
  const html = fs.existsSync(src)
    ? marked(fs.readFileSync(src, 'utf8'))
    : '<p>About page coming soon.</p>';

  return `
  <div class="about-content">
    <h1 class="page-title">About</h1>
    <div class="prose">${html}</div>
  </div>`;
}

// ── Partials ──────────────────────────────────────────────────────────────────

function albumCard(album) {
  const cover = album.cover
    ? `<img src="/photos/${album.slug}/${album.cover}" alt="${esc(album.title)}" loading="lazy">`
    : `<div class="album-placeholder"></div>`;

  return `<a href="/photos/${album.slug}/" class="album-card">
    ${cover}
    <div class="album-info">
      <div class="album-title">${esc(album.title)}</div>
      <div class="album-date">${shortDate(album.date)}</div>
    </div>
  </a>`;
}

function postItem(post) {
  return `<li>
    <time datetime="${post.date.toISOString()}">${formatDate(post.date)}</time>
    <a href="/blog/${post.slug}/">${esc(post.title)}</a>
  </li>`;
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function write(rel, html) {
  const full = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html, 'utf8');
  console.log('  ✓', rel);
}

function copyDir(src, dest, exts = null) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      copyDir(s, d, exts);
    } else if (!exts || exts.includes(path.extname(e.name).toLowerCase())) {
      fs.copyFileSync(s, d);
    }
  }
}

function copyFile(src, dest) {
  if (fs.existsSync(src)) fs.copyFileSync(src, dest);
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function shortDate(d) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}
