/* ========================================
   THE SAZ // CYBERPUNK 2026 ENGINE
   ======================================== */

(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const isTouch = matchMedia('(pointer: coarse)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- PRELOADER ---------- */
  const preloader = $('#preloader');
  const loaderText = $('#loader-text-content');
  const loaderBar = $('#loader-bar-fill');
  const loaderPct = $('#loader-percent');
  const loadingPhrases = [
    'BOOTING_NEXUS_CORE',
    'LOADING_NEURAL_MODULES',
    'SYNCING_GITHUB_API',
    'DECRYPTING_TELEGRAM_FEED',
    'CALIBRATING_UI',
    'READY'
  ];
  let loadProgress = 0;
  let phraseIdx = 0;
  const phraseTimer = setInterval(() => {
    phraseIdx = Math.min(phraseIdx + 1, loadingPhrases.length - 1);
    if (loaderText) loaderText.textContent = loadingPhrases[phraseIdx];
  }, 300);

  const progressTimer = setInterval(() => {
    loadProgress = Math.min(loadProgress + Math.random() * 12 + 3, 100);
    if (loaderBar) loaderBar.style.width = loadProgress + '%';
    if (loaderPct) loaderPct.textContent = Math.floor(loadProgress) + '%';
    if (loadProgress >= 100) {
      clearInterval(progressTimer);
      clearInterval(phraseTimer);
      setTimeout(() => {
        preloader?.classList.add('hidden');
        document.body.style.overflow = '';
        initAll();
      }, 400);
    }
  }, 180);

  document.body.style.overflow = 'hidden';

  /* ---------- MATRIX RAIN ---------- */
  function initMatrix() {
    const canvas = $('#matrix-canvas');
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    const chars = 'アカサタナハマヤラワ0123456789THE-SAZ<>/\\[]{}$#';
    let cols, drops, fontSize = 14;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      cols = Math.floor(canvas.width / fontSize);
      drops = Array(cols).fill(1);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 10, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    setInterval(draw, 55);
  }

  /* ---------- CUSTOM CURSOR ---------- */
  function initCursor() {
    if (isTouch) return;
    const dot = $('#cursor-dot');
    const ring = $('#cursor-ring');
    const trail = $('#cursor-trail');
    let mx = 0, my = 0, rx = 0, ry = 0, tx = 0, ty = 0;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });

    const animate = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      tx += (mx - tx) * 0.08;
      ty += (my - ty) * 0.08;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      trail.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
      requestAnimationFrame(animate);
    };
    animate();

    const hoverSelector = 'a, button, [data-tilt], .post-card, .repo-card';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hoverSelector)) ring.classList.add('hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hoverSelector)) ring.classList.remove('hover');
    });
  }

  /* ---------- HUD CLOCK ---------- */
  function initClock() {
    const clock = $('#hud-clock');
    if (!clock) return;
    const tick = () => {
      const d = new Date();
      clock.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map(n => String(n).padStart(2, '0')).join(':');
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- SCROLL EFFECTS ---------- */
  function initScroll() {
    const nav = $('.topnav');
    const backTop = $('#back-top');
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY;
      nav?.classList.toggle('scrolled', y > 40);
      backTop?.classList.toggle('visible', y > 600);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });

    backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // AOS
    const aosEls = $$('[data-aos]');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            en.target.classList.add('aos-in');
            io.unobserve(en.target);
          }
        });
      }, { threshold: 0.15 });
      aosEls.forEach(el => io.observe(el));
    } else {
      aosEls.forEach(el => el.classList.add('aos-in'));
    }
  }

  /* ---------- 3D TILT ---------- */
  function initTilt() {
    if (isTouch || reduceMotion) return;
    $$('[data-tilt]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(0)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(900px) rotateY(0) rotateX(0)';
      });
    });
  }

  /* ---------- TERMINAL TYPING ---------- */
  function initTerminal() {
    const el = $('#terminal-typing');
    if (!el) return;
    const text = 'cat identity.json | jq .role';
    let i = 0;
    const type = () => {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        i++;
        setTimeout(type, 60 + Math.random() * 40);
      }
    };
    setTimeout(type, 1200);
  }

  /* ---------- DATA COUNTER ---------- */
  function animateCount(el, target) {
    if (!el) return;
    const start = performance.now();
    const dur = 1600;
    const from = 0;
    const step = now => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (target - from) * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- RENDER FEED ---------- */
  function renderFeed(posts) {
    const c = $('#feed-container');
    if (!c) return;
    if (!posts?.length) {
      c.innerHTML = `<div class="post-card" style="display:flex;align-items:center;justify-content:center;flex:0 0 300px;color:var(--text-3);font-family:var(--font-mono);font-size:12px;letter-spacing:2px;">NO_POSTS_AVAILABLE</div>`;
      return;
    }
    c.innerHTML = posts.map(p => {
      const photo = p.photo_url
        ? `<img src="${p.photo_url}" class="post-photo" alt="post" loading="lazy" onerror="this.style.display='none'">`
        : '';
      const link = p.post_url
        ? `<a href="${p.post_url}" target="_blank" rel="noopener noreferrer" class="post-link">OPEN_IN_TELEGRAM <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M9 7h8v8"/></svg></a>`
        : '';
      return `
        <article class="post-card">
          <header class="post-header">
            <div class="post-date">${p.date || 'UNKNOWN'}</div>
            <div class="post-badge">POST</div>
          </header>
          ${photo}
          <div class="post-text">${p.text_html || '<em>Media post</em>'}</div>
          ${link}
        </article>`;
    }).join('');

    c.querySelectorAll('a').forEach(a => {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
  }

  /* ---------- RENDER REPOS ---------- */
  function renderRepos(repos) {
    const c = $('#repos-container');
    if (!c) return;
    if (!repos?.length) {
      c.innerHTML = `<div class="repo-card" style="grid-column:1/-1;text-align:center;color:var(--text-3);font-family:var(--font-mono);font-size:12px;letter-spacing:2px;">NO_REPOSITORIES_FOUND</div>`;
      return;
    }
    c.innerHTML = repos.map((r, i) => `
      <article class="repo-card" style="animation-delay:${i * 0.05}s">
        <header class="repo-header">
          <div class="repo-name"><a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.name}</a></div>
          <div class="repo-icon">◆</div>
        </header>
        <p class="repo-description">${r.description || 'No description provided.'}</p>
        <div class="repo-meta">
          <span><b>⭐</b> ${r.stars}</span>
          <span><b>🍴</b> ${r.forks}</span>
          <span><span class="repo-lang-dot"></span> ${r.language || 'N/A'}</span>
          <span><b>📅</b> ${r.updated || 'N/A'}</span>
        </div>
      </article>
    `).join('');
    c.querySelectorAll('a').forEach(a => {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
  }

  /* ---------- LOAD DATA ---------- */
  async function loadData() {
    try {
      const res = await fetch('data.json?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      renderFeed(data.posts);
      renderRepos(data.repos);

      const ts = data.updated_at || '--';
      const tsEl = $('#timestamp');
      if (tsEl) tsEl.textContent = ts;

      const reposCount = data.repos?.length || 0;
      const postsCount = data.posts?.length || 0;
      const starsSum = (data.repos || []).reduce((s, r) => s + (r.stars || 0), 0);

      animateCount($('#stat-repos'), reposCount);
      animateCount($('#stat-posts'), postsCount);
      animateCount($('#stat-stars'), starsSum);
    } catch (err) {
      console.error('[DATA_LOAD_ERROR]', err);
      const fc = $('#feed-container');
      const rc = $('#repos-container');
      if (fc) fc.innerHTML = '<div class="post-card" style="flex:0 0 300px;display:flex;align-items:center;justify-content:center;color:var(--neon-pink);font-family:var(--font-mono);font-size:12px;">ERROR_LOADING_FEED</div>';
      if (rc) rc.innerHTML = '<div class="repo-card" style="grid-column:1/-1;text-align:center;color:var(--neon-pink);font-family:var(--font-mono);font-size:12px;">ERROR_LOADING_REPOS</div>';
    }
  }

  /* ---------- FEED SCROLL BUTTONS ---------- */
  function initFeedControls() {
    const track = $('#feed-container');
    if (!track) return;
    $$('[data-scroll]').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.scroll === 'left' ? -1 : 1;
        track.scrollBy({ left: dir * 400, behavior: 'smooth' });
      });
    });
  }

  /* ---------- TEXT SCRAMBLE ---------- */
  function initScramble() {
    const els = $$('[data-scramble]');
    if (!els.length || reduceMotion) return;
    const chars = '!<>-_\\/[]{}—=+*^?#________';
    els.forEach(el => {
      const original = el.dataset.scramble;
      let frame = 0;
      const maxFrames = 24;
      const scramble = () => {
        let out = '';
        const progress = frame / maxFrames;
        for (let i = 0; i < original.length; i++) {
          if (i < original.length * progress) out += original[i];
          else out += chars[Math.floor(Math.random() * chars.length)];
        }
        el.textContent = out;
        if (frame < maxFrames) { frame++; requestAnimationFrame(scramble); }
        else el.textContent = original;
      };
      el.addEventListener('mouseenter', () => { frame = 0; scramble(); });
    });
  }

  /* ---------- SOUND TOGGLE ---------- */
  function initSound() {
    const btn = $('#sound-toggle');
    if (!btn) return;
    let muted = true;
    btn.classList.add('muted');
    btn.addEventListener('click', () => {
      muted = !muted;
      btn.classList.toggle('muted', muted);
    });
  }

  /* ---------- INIT ALL ---------- */
  function initAll() {
    initMatrix();
    initCursor();
    initClock();
    initScroll();
    initTilt();
    initTerminal();
    initFeedControls();
    initScramble();
    initSound();
    loadData();
  }
})();
