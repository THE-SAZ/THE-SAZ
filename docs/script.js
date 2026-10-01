/* =====================================================
   THE SAZ // iOS-OPTIMIZED CYBERPUNK 2026
   ===================================================== */
(() => {
  'use strict';

  /* ---------- ENVIRONMENT DETECTION ---------- */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isTouch = matchMedia('(pointer: coarse)').matches;
  const isMobile = matchMedia('(max-width: 768px)').matches || isTouch;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowBattery = navigator.getBattery ? null : null;

  document.documentElement.classList.toggle('ios', isIOS);
  document.documentElement.classList.toggle('mobile', isMobile);

  /* ---------- LOW POWER MODE ---------- */
  const enableLowPower = () => {
    document.body.classList.add('low-power');
  };

  // Battery API (Chrome/Edge, iOS Safari doesn't support — graceful)
  if (navigator.getBattery) {
    navigator.getBattery().then(b => {
      const update = () => {
        if (b.level <= 0.15 && !b.charging) enableLowPower();
        else document.body.classList.remove('low-power');
      };
      update();
      b.addEventListener('levelchange', update);
      b.addEventListener('chargingchange', update);
    }).catch(() => {});
  }

  /* ---------- rAF LOOP MANAGER (pause when hidden) ---------- */
  const rafTasks = new Set();
  let rafActive = false;
  let lastFrame = 0;

  const loop = (now) => {
    if (!rafActive) return;
    // Throttle to ~60fps max on high refresh displays
    const dt = now - lastFrame;
    if (dt >= 15) {
      lastFrame = now;
      rafTasks.forEach(fn => { try { fn(now); } catch (_) {} });
    }
    requestAnimationFrame(loop);
  };

  const startRAF = () => {
    if (rafActive) return;
    rafActive = true;
    lastFrame = 0;
    requestAnimationFrame(loop);
  };

  const stopRAF = () => { rafActive = false; };

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stopRAF() : startRAF();
  });

  /* ---------- PRELOADER ---------- */
  const preloader = $('#preloader');
  const loaderText = $('#loader-text-content');
  const loaderBar = $('#loader-bar-fill');
  const loaderPct = $('#loader-percent');

  document.body.style.overflow = 'hidden';

  const phrases = [
    'BOOTING_NEXUS_CORE',
    'LOADING_MODULES',
    'SYNCING_GITHUB',
    'DECRYPTING_FEED',
    'READY'
  ];
  let pIdx = 0, load = 0;
  const phraseTimer = setInterval(() => {
    pIdx = Math.min(pIdx + 1, phrases.length - 1);
    if (loaderText) loaderText.textContent = phrases[pIdx];
  }, 280);

  const progressTimer = setInterval(() => {
    load = Math.min(load + Math.random() * 15 + 5, 100);
    if (loaderBar) loaderBar.style.width = load + '%';
    if (loaderPct) loaderPct.textContent = Math.floor(load) + '%';
    if (load >= 100) {
      clearInterval(progressTimer);
      clearInterval(phraseTimer);
      setTimeout(() => {
        preloader?.classList.add('hidden');
        document.body.style.overflow = '';
        initAll();
      }, 300);
    }
  }, 160);

  /* ---------- MATRIX RAIN (DPR-aware + throttled) ---------- */
  let matrixRunning = false;
  const initMatrix = () => {
    if (reduceMotion || isMobile && document.body.classList.contains('low-power')) return;
    const canvas = $('#matrix-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    // Cap DPR to avoid huge back-buffers on retina
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    const fontSize = isMobile ? 12 : 14;
    const chars = 'アカサタナハマヤラワ0123456789<>/\\[]{}$#';
    let cols, drops, cssW, cssH;

    const resize = () => {
      cssW = window.innerWidth;
      cssH = window.innerHeight;
      canvas.width  = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width  = cssW + 'px';
      canvas.style.height = cssH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(cssW / fontSize);
      drops = new Array(cols).fill(1);
    };
    resize();

    // Debounced resize
    let resizeRaf;
    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(resize);
    }, { passive: true });

    let acc = 0;
    const tickInterval = isMobile ? 100 : 60; // slower on mobile

    const draw = (now) => {
      if (now - acc < tickInterval) return;
      acc = now;

      ctx.fillStyle = 'rgba(5, 5, 10, 0.09)';
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      const step = isMobile ? 20 : 14;
      for (let i = 0; i < drops.length; i++) {
        const ch = chars[(Math.random() * chars.length) | 0];
        ctx.fillText(ch, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > cssH && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };

    rafTasks.add(draw);
    matrixRunning = true;
  };

  /* ---------- CUSTOM CURSOR (desktop only) ---------- */
  const initCursor = () => {
    if (isTouch || isMobile) return;
    const dot = $('#cursor-dot');
    const ring = $('#cursor-ring');
    const trail = $('#cursor-trail');
    if (!dot || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0, tx = 0, ty = 0, hasMoved = false;

    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      if (!hasMoved) { rx = mx; ry = my; tx = mx; ty = my; hasMoved = true; }
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
    };
    document.addEventListener('mousemove', onMove, { passive: true });

    const tick = () => {
      if (!hasMoved) return;
      rx += (mx - rx) * 0.2;
      ry += (my - ry) * 0.2;
      tx += (mx - tx) * 0.08;
      ty += (my - ty) * 0.08;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      if (trail) trail.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%)`;
    };
    rafTasks.add(tick);

    const hoverSel = 'a, button, .post-card, .repo-card, [data-tilt]';
    document.addEventListener('mouseover', e => {
      if (e.target.closest?.(hoverSel)) ring.classList.add('hover');
    }, { passive: true });
    document.addEventListener('mouseout', e => {
      if (e.target.closest?.(hoverSel)) ring.classList.remove('hover');
    }, { passive: true });
  };

  /* ---------- HUD CLOCK ---------- */
  const initClock = () => {
    const clock = $('#hud-clock');
    if (!clock) return;
    let last = '';
    const tick = () => {
      const d = new Date();
      const s = String(d.getHours()).padStart(2, '0') + ':' +
                String(d.getMinutes()).padStart(2, '0') + ':' +
                String(d.getSeconds()).padStart(2, '0');
      if (s !== last) { clock.textContent = s; last = s; }
    };
    tick();
    setInterval(tick, 1000);
  };

  /* ---------- NAV + BACK-TOP (passive scroll) ---------- */
  const initScrollFX = () => {
    const nav = $('#topnav');
    const backTop = $('#back-top');
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY;
      nav?.classList.toggle('scrolled', y > 30);
      backTop?.classList.toggle('visible', y > 500);
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    }, { passive: true });

    backTop?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    }, { passive: true });
  };

  /* ---------- MOBILE MENU ---------- */
  const initMenu = () => {
    const btn = $('#menu-btn');
    const menu = $('#mobile-menu');
    if (!btn || !menu) return;

    const close = () => {
      btn.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
      menu.setAttribute('aria-hidden', 'true');
    };

    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      if (open) close();
      else {
        btn.setAttribute('aria-expanded', 'true');
        menu.classList.add('open');
        menu.setAttribute('aria-hidden', 'false');
      }
    }, { passive: true });

    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close, { passive: true }));

    document.addEventListener('click', e => {
      if (!menu.classList.contains('open')) return;
      if (!menu.contains(e.target) && !btn.contains(e.target)) close();
    }, { passive: true });
  };

  /* ---------- 3D TILT (desktop-only, throttled) ---------- */
  const initTilt = () => {
    if (isTouch || reduceMotion) return;
    const els = $$('[data-tilt]');
    els.forEach(el => {
      let rect, raf = null, tx = 0, ty = 0;
      const update = () => {
        el.style.transform =
          `perspective(900px) rotateY(${tx}deg) rotateX(${ty}deg) translateZ(0)`;
        raf = null;
      };
      el.addEventListener('mouseenter', () => { rect = el.getBoundingClientRect(); }, { passive: true });
      el.addEventListener('mousemove', e => {
        if (!rect) rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;
        tx = x * 10;
        ty = -y * 10;
        if (!raf) raf = requestAnimationFrame(update);
      }, { passive: true });
      el.addEventListener('mouseleave', () => {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(update);
      }, { passive: true });
    });
  };

  /* ---------- TERMINAL TYPING ---------- */
  const initTerminal = () => {
    const el = $('#terminal-typing');
    if (!el || reduceMotion) return;
    const text = 'cat identity.json | jq .role';
    let i = 0;
    const type = () => {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        i++;
        setTimeout(type, 55 + Math.random() * 40);
      }
    };
    setTimeout(type, 1400);
  };

  /* ---------- COUNT UP ---------- */
  const animateCount = (el, target) => {
    if (!el) return;
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now();
    const dur = 1400;
    const step = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- RENDER FEED ---------- */
  const renderFeed = (posts) => {
    const c = $('#feed-container');
    if (!c) return;
    if (!posts?.length) {
      c.innerHTML = `<div class="post-card" style="display:flex;align-items:center;justify-content:center;color:var(--text-3);font-family:var(--font-mono);font-size:12px;letter-spacing:2px;">NO_POSTS</div>`;
      return;
    }
    const frag = document.createDocumentFragment();
    posts.forEach((p, idx) => {
      const card = document.createElement('article');
      card.className = 'post-card';
      card.style.animationDelay = (idx * 60) + 'ms';

      const photo = p.photo_url
        ? `<img src="${p.photo_url}" class="post-photo" alt="" loading="lazy" decoding="async" onerror="this.remove()">`
        : '';
      const link = p.post_url
        ? `<a href="${p.post_url}" target="_blank" rel="noopener noreferrer" class="post-link">OPEN_IN_TELEGRAM →</a>`
        : '';

      card.innerHTML = `
        <header class="post-header">
          <div class="post-date">${p.date || 'UNKNOWN'}</div>
          <div class="post-badge">POST</div>
        </header>
        ${photo}
        <div class="post-text">${p.text_html || '<em>Media post</em>'}</div>
        ${link}
      `;
      frag.appendChild(card);
    });
    c.innerHTML = '';
    c.appendChild(frag);
  };

  /* ---------- RENDER REPOS ---------- */
  const renderRepos = (repos) => {
    const c = $('#repos-container');
    if (!c) return;
    if (!repos?.length) {
      c.innerHTML = `<div class="repo-card" style="grid-column:1/-1;text-align:center;color:var(--text-3);font-family:var(--font-mono);font-size:12px;">NO_REPOS</div>`;
      return;
    }
    const frag = document.createDocumentFragment();
    repos.forEach((r, i) => {
      const card = document.createElement('article');
      card.className = 'repo-card';
      card.style.animationDelay = (i * 50) + 'ms';
      card.innerHTML = `
        <header class="repo-header">
          <div class="repo-name"><a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.name}</a></div>
          <div class="repo-icon">◆</div>
        </header>
        <p class="repo-description">${r.description || 'No description.'}</p>
        <div class="repo-meta">
          <span><b>⭐</b> ${r.stars}</span>
          <span><b>🍴</b> ${r.forks}</span>
          <span><span class="repo-lang-dot"></span> ${r.language || 'N/A'}</span>
          <span><b>📅</b> ${r.updated || 'N/A'}</span>
        </div>
      `;
      frag.appendChild(card);
    });
    c.innerHTML = '';
    c.appendChild(frag);
  };

  /* ---------- LOAD DATA ---------- */
  const loadData = async () => {
    try {
      const res = await fetch('data.json?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      renderFeed(data.posts);
      renderRepos(data.repos);

      const tsEl = $('#timestamp');
      if (tsEl) tsEl.textContent = data.updated_at || '--';

      const stars = (data.repos || []).reduce((s, r) => s + (r.stars || 0), 0);
      animateCount($('#stat-repos'), data.repos?.length || 0);
      animateCount($('#stat-posts'), data.posts?.length || 0);
      animateCount($('#stat-stars'), stars);
    } catch (err) {
      console.error('[DATA_ERROR]', err);
      const fc = $('#feed-container');
      const rc = $('#repos-container');
      if (fc) fc.innerHTML = `<div class="post-card" style="display:flex;align-items:center;justify-content:center;color:var(--neon-pink);font-family:var(--font-mono);font-size:12px;">ERROR</div>`;
      if (rc) rc.innerHTML = `<div class="repo-card" style="grid-column:1/-1;text-align:center;color:var(--neon-pink);font-family:var(--font-mono);font-size:12px;">ERROR</div>`;
    }
  };

  /* ---------- SWIPE HINT (first visit only) ---------- */
  const initSwipeHint = () => {
    if (!isMobile) return;
    const hint = $('#swipe-hint');
    if (!hint) return;
    try {
      if (localStorage.getItem('tsz_hint_seen')) return;
    } catch (_) {}
    hint.classList.add('visible');
    const hide = () => {
      hint.classList.remove('visible');
      try { localStorage.setItem('tsz_hint_seen', '1'); } catch (_) {}
    };
    const feed = $('#feed-container');
    feed?.addEventListener('scroll', hide, { passive: true, once: true });
    setTimeout(hide, 8000);
  };

  /* ---------- SCROLL TO SECTIONS (smooth) ---------- */
  const initAnchors = () => {
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      }, { passive: false });
    });
  };

  /* ---------- iOS visualViewport keyboard fix ---------- */
  if (isIOS && window.visualViewport) {
    const vv = window.visualViewport;
    let lastH = vv.height;
    vv.addEventListener('resize', () => {
      const dh = Math.abs(vv.height - lastH);
      if (dh > 100) {
        document.documentElement.style.setProperty('--vh', vv.height + 'px');
        lastH = vv.height;
      }
    }, { passive: true });
  }

  /* ---------- SCROLL-DRIVEN AOS (IntersectionObserver) ---------- */
  const initAOS = () => {
    const els = $$('[data-aos]');
    if (!els.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('aos-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  };

  /* ---------- INIT ALL ---------- */
  const initAll = () => {
    initMatrix();
    initCursor();
    initClock();
    initScrollFX();
    initMenu();
    initTilt();
    initTerminal();
    initSwipeHint();
    initAnchors();
    initAOS();
    loadData();
    startRAF();
  };
})();
