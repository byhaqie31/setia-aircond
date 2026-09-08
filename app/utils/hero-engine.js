/* ============================================================
   Setia Air-Cond & Electrical (v2) — interactions

   The landing is ONE cinematic section inside native scroll: a 700vh runway with
   a position:sticky stage. Nothing hijacks the wheel — scroll position is simply
   read as a 0..1 progress value.

     HERO  the building composition holds still while THREE chapters — promise,
           proof, action — arrive over the sky above it. The building's only
           motion is a slow scale and a downward drift; the skyline behind and
           the tree mass in front travel by different amounts, and that
           differential is the entire sense of depth. No WebGL, no video, no
           canvas — DOM, CSS and one SVG rect that draws itself.

   ScrubTrack owns progress smoothing and the fallback ladder, so the section
   supplies only a render(p) function.

   Also here: IntersectionObserver reveals, the drawer menu, the grain toggle,
   and the fixed-header reveal.
   ============================================================ */
/* PORT NOTE
   Derived mechanically from the mockup's main.js so every timing, window and
   easing is the one that was signed off. What changed is only the wiring:
   - exported as startLanding(opts) and started from the landing's onMounted
   - GSAP arrives through opts.loadGsap() (a lazy import), never a CDN global
   - every window/document listener is recorded so destroy() can remove it
     when the visitor navigates away from the landing client-side
   - the drawer, grain and .reveal observer live in Vue now and were removed
   Everything else is the mockup, comments included. */
export function startLanding(opts) {
  'use strict';
  var listeners = [];
  var destroyed = false;
  function on(target, type, fn, o) { target.addEventListener(type, fn, o); listeners.push([target, type, fn, o]); }

  /* -------- tweakable config -------- */
  var CONFIG = {
    heroEnabled: true,       // false → static composed hero, no scroll choreography
    /* Touch devices scrub too. This was false-by-omission for a long time: the
       engine gated on (hover:hover) and (pointer:fine), which is false on every
       phone and tablet, so real devices always fell to the stacked layout — even
       though the narrow-width scrub layout is fully authored (see the
       max-width:900px block in styles.css, which positions all three chapters
       for a phone). The gate only ever passed on a resized desktop browser, so
       that work never shipped. Set false to go back to the stacked fallback. */
    scrubOnTouch: true,
    texture: true,           // grain overlay on/off
    /* The optional "system wakes" beat in chapter 3: a soft mint bloom over the
       real rooftop plant plus a slight dim on the rest. Photoreal only — the old
       vector riser/nodes/ring read as a mismatch against the render and is gone.
       Off by default so it can be judged on its own during review. */
    systemGlow: false
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  /* set by the head script in index.html, which owns the sessionStorage flag so
     the answer is known before first paint — see setupPreloader */
  var introSeen = document.documentElement.classList.contains('intro-seen');
  var $ = function (id) { return document.getElementById(id); };

  /* -------- progress math -------- */
  function clampN(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function seg(p, a, b) { return clampN((p - a) / (b - a)); }
  /* a chapter's opacity across its window, with a short fade at each edge */
  function win(p, a, b, fade) {
    var f = fade || 0.045;
    return Math.max(0, Math.min(seg(p, a, a + f), 1 - seg(p, b - f, b)));
  }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* THE VIEWPORT HEIGHT, HELD STILL.
     On a phone window.innerHeight is the *visual* viewport, so it grows and
     shrinks by 60–100px as the URL bar hides and shows. CSS `vh` does not — it
     resolves against the large viewport and stays put. Measuring a runway with
     one and sizing it with the other means the denominator below changes
     mid-scroll, and the whole choreography jumps by several percent every time
     the bar moves. So the height is cached and only re-read when the viewport
     genuinely changes shape (a rotation or a real resize), never on the
     height-only churn the URL bar produces. */
  var viewH = window.innerHeight;
  var viewW = window.innerWidth;
  function refreshViewport() {
    /* a desktop window has no URL bar, so a height-only resize there is a real
       resize and must be taken; only coarse pointers get the benefit of the
       doubt */
    if (fine || window.innerWidth !== viewW) {
      viewW = window.innerWidth;
      viewH = window.innerHeight;
    }
  }
  on(window, 'resize', refreshViewport);
  on(window, 'orientationchange', function () {
    setTimeout(function () { viewW = window.innerWidth; viewH = window.innerHeight; }, 240);
  });

  /* where a runway sits in the document, as 0..1 */
  function trackProgress(el) {
    var top = el.getBoundingClientRect().top + window.pageYOffset;
    var h = el.offsetHeight - viewH;
    return h > 0 ? clampN((window.pageYOffset - top) / h) : 0;
  }

  /* GSAP is a lazy npm import (plugins/gsap.client.ts). The mockup polled a CDN
     global; the rest of this file still reads window.gsap / window.ScrollTrigger,
     so the loaded modules are placed there once. */
  function waitForGsap() {
    return opts.loadGsap().then(function (m) {
      if (!m || !m.gsap) return null;
      window.gsap = m.gsap;
      window.ScrollTrigger = m.ScrollTrigger;
      return m.gsap;
    });
  }
  var activeLoop = null;

  /* ---------------- the header ----------------
     One header, two forms. On every interior page — corporate included — the
     mastbar is a static bar in the markup; on the landing it is the masthead
     itself, which the scrub is already driving. All this has to do there is
     decide when the bar needs a ground under it. */
  function setupHeader() {
    var bar = $('mastbar');
    var masthead = $('masthead');

    function measure() {
      document.documentElement.style.setProperty(
        '--header-h', (bar ? bar.offsetHeight : 64) + 'px');
    }
    measure();
    on(window, 'load', measure);
    on(window, 'resize', measure);

    /* the static mastbar is up from the start — nothing to reveal */
    if (bar) { document.body.classList.add('header-revealed'); return; }

    var hero = $('hero');
    var tracks = [hero].filter(function (el) {
      return el && window.getComputedStyle(el).display !== 'none';
    });
    var tracksOff = !tracks.length || reduced || !CONFIG.heroEnabled;
    if (tracksOff) {
      if (masthead) masthead.classList.add('is-solid');
      document.body.classList.add('header-revealed');
      return;
    }

    function update() {
      var total = tracks.reduce(function (sum, el) { return sum + el.offsetHeight; }, 0);
      /* the masthead finishes collapsing at ~14% of the hero, so anything that
         rides the handover takes it from there rather than waiting out the
         whole section */
      var shown = window.pageYOffset >= total * 0.135;
      document.body.classList.toggle('header-revealed', shown);  // the mobile quote FAB rides the same reveal

      /* The bar stays unfilled for as long as it is over the night sky — that is
         what keeps the zoom seamless. It only takes a ground once the sticky
         stage has released and paper-white sections are running underneath. */
      if (masthead) {
        var released = window.pageYOffset >= total - viewH * 1.15;
        masthead.classList.toggle('is-solid', released);
      }
    }
    on(window, 'scroll', update, { passive: true });
    on(window, 'resize', update);
    update();
  }

  /* ============================================================
     SCRUBTRACK — the one scroll engine both tracks run on

     The fallback ladder, in order:
       1. GSAP + ScrollTrigger                 → full scrub (touch included)
       2. GSAP present, ScrollTrigger late     → poll, then native-scroll rAF
       3. no GSAP                              → native-scroll rAF
       4. scrubOnTouch off + coarse pointer    → collapse to 100vh, play once
       5. reduced motion or disabled           → static poster stage, header up

     Note that touch is no longer a rung of its own: pointer type says nothing
     about whether a device can scrub, and treating it as a proxy for "weak"
     cost every phone the entire hero. Reduced motion — which is what a visitor
     who does not want this actually sets — still lands on step 5.
     ============================================================ */
  function ScrubTrack(cfg) {
    var el = cfg.el;
    var prog = { target: 0, current: 0 };
    var ease = cfg.ease || 0.12;
    var running = false;

    function loop() {
      prog.current += (prog.target - prog.current) * ease;
      cfg.render(prog.current);
      if (cfg.source) {
        cfg.source.seek(prog.current);
        cfg.source.tick();
      }
      if (cfg.onProgress) cfg.onProgress(prog.current);
    }

    function nativeLoop() {
      if (running) return;
      running = true;
      (function raf() { if (destroyed) return; loop(); requestAnimationFrame(raf); })();
      function onScroll() { prog.target = trackProgress(el); }
      on(window, 'scroll', onScroll, { passive: true });
      on(window, 'resize', onScroll);
      onScroll();
    }

    function initScrollTrigger(gsap) {
      gsap.registerPlugin(window.ScrollTrigger);
      /* the same URL-bar problem trackProgress guards against, but inside
         ScrollTrigger: without this it refreshes on every address-bar show/hide
         and the pinned stage visibly re-seats itself mid-scroll */
      window.ScrollTrigger.config({ ignoreMobileResize: true });
      window.ScrollTrigger.create({
        trigger: el, start: 'top top', end: 'bottom bottom', scrub: true,
        onUpdate: function (self) { prog.target = self.progress; }
      });
      activeLoop = loop;
      gsap.ticker.add(loop);
      window.ScrollTrigger.refresh();
    }

    /* every path reports first paint, so nothing downstream (the preloader) can
       hang waiting on a picture that arrived down a different branch */
    function ready() { if (cfg.onFirstPaint) cfg.onFirstPaint(); }

    /* step 5 — nothing moves; the stage is a poster-backed still */
    function goStatic() {
      el.classList.add('is-static');
      cfg.render(cfg.staticAt === undefined ? 0 : cfg.staticAt);
      if (cfg.source) {
        cfg.source.prime(function () { cfg.source.seek(0); cfg.source.tick(); ready(); });
      } else ready();
    }

    /* step 4 — one pass, driven by playback rather than scroll */
    function goPlayOnce() {
      el.classList.add('is-playonce');
      el.style.height = '100vh';
      if (cfg.onPlayOnce) cfg.onPlayOnce();
      cfg.render(0);
      if (!cfg.source) { ready(); return; }
      cfg.source.prime(function () {
        ready();
        cfg.source.playOnce(function (p) { cfg.render(p); }, cfg.playSeconds);
      });
    }

    return {
      progress: function () { return prog.current; },
      start: function () {
        if (cfg.skipEl) cfg.skipEl.addEventListener('click', cfg.onSkip);

        if (reduced || cfg.enabled === false) { goStatic(); return; }
        if (!fine && !CONFIG.scrubOnTouch) { goPlayOnce(); return; }

        if (cfg.source) cfg.source.prime(ready); else ready();
        cfg.render(0);

        waitForGsap().then(function (gsap) {
          if (gsap && window.ScrollTrigger) {
            initScrollTrigger(gsap);
          } else if (gsap) {
            var n = 0;
            var t = setInterval(function () {
              n++;
              if (window.ScrollTrigger || n > 40) {
                clearInterval(t);
                if (window.ScrollTrigger) initScrollTrigger(gsap); else nativeLoop();
              }
            }, 50);
          } else {
            nativeLoop();
          }
        });
      }
    };
  }

  /* ============================================================
     THE LANDING
     ============================================================ */
  function setupLanding() {
    var heroEl = $('hero');
    if (!heroEl) return;                    // an interior page

    var hero = buildHero(heroEl);
    hero.track.start();
    setupPreloader(hero);
  }

  /* ---------------- PRELOADER ----------------
     The counter is real: it runs a minimum 1.8s eased sweep AND waits for the
     building plates to actually decode, whichever finishes last, with a 6s
     hard timeout so a slow connection can never strand anyone on the card. */
  function setupPreloader(hero) {
    var loader = $('preloader');
    if (!loader) return;

    var pctEl = $('preloaderPct'), barEl = $('preloaderBar');
    if (!introSeen) applyMastheadCard();
    on(window, 'resize', function () {
      if (!$('masthead')) return;
      if (mastheadPhase === 'card') applyMastheadCard();
      else if (mastheadPhase === 'bar') applyMasthead(MASTHEAD.shut(), 1);
    });
    /* Second visit this session: the counter has been earned once already, and
       making someone sit through it on every refresh turns an entrance into a
       tollgate. The box opens straight into its masthead state and scroll takes
       over from there: the same destination playIntro reaches, none of the wait. */
    if (introSeen) { openMastheadNow(hero); return; }

    var pictureReady = false, counterDone = false, entered = false;
    /* reduced motion or a disabled hero: no cinema to wait for, but the box is
       still the header — so it goes straight to the bar rather than away */
    if (reduced || !CONFIG.heroEnabled) { retireMastheadToBar(); return; }

    if (hero) hero.onReady(function () { pictureReady = true; maybeEnter(); });
    else pictureReady = true;
    setTimeout(function () { pictureReady = true; maybeEnter(); }, 6000);   // hard safety

    var start = performance.now();
    (function count(ts) {
      if (destroyed) return;
      var t = clampN(((ts || performance.now()) - start) / 1800);
      var v = Math.round(100 * easeInOut(t));
      if (pctEl) pctEl.textContent = String(v);
      if (barEl) barEl.style.width = v + '%';
      if (t < 1) requestAnimationFrame(count);
      else { counterDone = true; maybeEnter(); }
    })(performance.now());

    function maybeEnter() {
      if (destroyed || entered || !pictureReady || !counterDone) return;
      entered = true;
      waitForGsap().then(function (gsap) {
        if (gsap) playIntro(gsap, loader, hero);
        else {
          retireMastheadToBar();
          if (hero) hero.showIntro();
        }
      });
    }
  }

  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ---------------- the masthead ----------------
     Three geometries for one box: the loading card, the opened masthead, and the
     collapsed bar it becomes on scroll. Both the load tween and the scroll driver
     write through applyMasthead, so they can never disagree about where it is. */
  /* The gutter every masthead state aligns to. Deliberately a FULL-BLEED edge
     inset rather than the centred .wrap column: tied to .wrap, the wordmark
     drifted inward toward the middle of the screen as the box collapsed, which
     read as the header shrinking away from the page instead of settling onto it.
     Held constant from the opened masthead through to the bar, the wordmark now
     only ever scales — it never travels sideways.
     Kept in step with --bar-pad in styles.css; change both together. */
  function gutter() {
    return Math.max(24, Math.min(56, window.innerWidth * 0.031));
  }

  var MASTHEAD = {
    /* With no fill behind it the box is invisible, so its height is no longer a
       shape anyone sees — it is just the leading of the lockup. Kept tight, so
       the wordmark, the sub-line, the count and the rule read as one stack
       instead of four things adrift in a card that is not there. */
    card: function () {
      var w = Math.min(430, window.innerWidth * 0.82);
      return centred({ w: w, h: w * 0.21, brand: 30,
                       sub: Math.min(9, w * 0.021), pad: w * 0.08 });
    },
    /* Opens IN PLACE, still centred. The loading lockup grows where it already
       stands rather than expanding and flying to the corner in the same breath —
       the wordmark gets the middle of the screen to itself, and the journey to
       the header is a separate move the scroll owns.

       The box is sized FROM the wordmark rather than picked: contents sit at 6%
       inside a centred box, so a box of lockupWidth / 0.88 is exactly the one
       that lands the wordmark on the middle of the screen at any viewport. Pick
       a round width instead and the lockup reads visibly left of centre.

       On phones the SUB-LINE is the wider element: sized off the wordmark alone
       the box came out ~120px and the sub overflowed the viewport. So the box is
       sized to whichever of the two needs more room, the wordmark grows to fill
       it (a proper title card instead of a 30px whisper), and the sub shrinks
       only if even the full width cannot seat it at 12px. */
    open: function () {
      var brand = Math.min(140, window.innerWidth * 0.078);
      var w = Math.min(window.innerWidth * 0.92,
                       Math.max(brandRatio() * brand, subRatio() * 12) / 0.88);
      brand = Math.min(140, (w * 0.88) / brandRatio());
      return centred({ w: w,
                       h: Math.max(230, window.innerHeight * 0.32),
                       brand: brand,
                       sub: Math.min(12, (w * 0.88) / subRatio()),
                       pad: w * 0.06 });
    },
    /* the bar the masthead ends as — full width, because it is the header now */
    shut: function () {
      return { w: window.innerWidth, h: 64, x: 0, y: 0,
               brand: 22, sub: 8, pad: gutter() };
    }
  };

  /* the two pre-scroll states sit in the middle of the screen; only the bar is
     pinned to the corner, and the scrub interpolates the whole trip */
  function centred(g) {
    g.x = (window.innerWidth - g.w) / 2;
    g.y = (window.innerHeight - g.h) / 2;
    return g;
  }

  /* How wide the wordmark renders per pixel of font-size. Text width and the
     .14em tracking are both proportional to font-size, so one measurement is
     enough and the rest is arithmetic — no layout read in the scroll loop. The
     display face is a system serif, so there is no webfont to wait for. */
  var _brandRatio = 0;
  function brandRatio() {
    if (_brandRatio) return _brandRatio;
    var el = $('mastheadBrand');
    if (!el) return 3.5;
    var prev = el.style.fontSize;
    el.style.fontSize = '100px';
    var w = el.offsetWidth;
    el.style.fontSize = prev;
    _brandRatio = w > 0 ? w / 100 : 3.5;
    return _brandRatio;
  }

  /* same measurement for the sub-line — it is the WIDER element on phones, so
     the open masthead sizes its box off both. Space Mono may still be loading
     when this first runs; the metric-compatible monospace fallback is close
     enough, and the result is clamped to 12px anyway. */
  var _subRatio = 0;
  function subRatio() {
    if (_subRatio) return _subRatio;
    var el = $('mastheadSub');
    if (!el) return 28;
    var prev = el.style.fontSize;
    el.style.fontSize = '100px';
    var w = el.offsetWidth;
    el.style.fontSize = prev;
    _subRatio = w > 0 ? w / 100 : 28;
    return _subRatio;
  }

  function applyMasthead(g, alpha) {
    var el = $('masthead');
    if (!el) return;
    el.style.width = g.w + 'px';
    el.style.height = g.h + 'px';
    el.style.left = g.x + 'px';
    el.style.top = g.y + 'px';
    el.style.transform = 'none';
    el.style.setProperty('--mast-pad', g.pad + 'px');
    var brand = $('mastheadBrand'), sub = $('mastheadSub');
    if (brand) brand.style.fontSize = g.brand + 'px';
    if (sub) sub.style.fontSize = g.sub + 'px';
    if (alpha !== undefined) el.style.opacity = String(clampN(alpha));
  }

  function applyMastheadCard() {
    applyMasthead(MASTHEAD.card());
  }

  /* Which of the three states the box is in. A resize has to re-derive geometry
     from the CURRENT one — before this existed the resize handler re-applied the
     loading card unconditionally, which dropped the finished bar back into the
     middle of the screen on any viewport change. 'scrub' needs no handling: the
     render loop rewrites the geometry every frame anyway. */
  var mastheadPhase = 'card';

  /* Snap the masthead straight to its bar state and light the controls. Used by
     every path that never gets to scrub: reduced motion, a disabled hero, the
     stacked touch layout, and a missing GSAP. The box is never hidden — it is
     the landing's only header, so hiding it would ship a page with no nav. */
  function retireMastheadToBar() {
    var pre = $('preloader');
    if (!pre) return;
    var veil = $('preloaderVeil');
    if (veil) veil.style.display = 'none';
    var pct = $('mastheadPct'), rule = $('mastheadRule');
    if (pct) pct.style.display = 'none';
    if (rule) rule.style.display = 'none';
    mastheadPhase = 'bar';
    applyMasthead(MASTHEAD.shut(), 1);
    setMastheadActions(1);
    var el = $('masthead');
    if (el) el.classList.add('is-solid');
  }

  /* The intro's end state, arrived at instantly: used by a repeat visit in the
     same session, where the loading card and the veil never existed (the CSS
     hides both off the .intro-seen class, so nothing has to be un-drawn here).
     The layouts that never scrub have no opened masthead to hand to the scroll,
     so they take the bar directly rather than sitting on a title card. */
  function openMastheadNow(hero) {
    var stage = hero && hero.el;
    if (!hero || !stage || stage.classList.contains('is-stacked')
                        || stage.classList.contains('is-static')) {
      retireMastheadToBar();
      return;
    }
    applyMasthead(MASTHEAD.open(), 1);
    hero.mastheadReady();          // hands the box to the scroll driver
  }

  /* The corner instrument — the temperature readout, now the only one. It starts
     hidden (see styles.css) and is raised once the wordmark has left the middle
     of the screen, so the opening frame carries the lockup alone. Every layout
     that never scrubs calls this with 1: there the opening is already over. */
  function setInstruments(alpha) {
    var el = document.querySelector('.hero-hud__temp');
    if (el) el.style.opacity = String(clampN(alpha));
  }

  /* the header controls only exist once the box is a bar */
  function setMastheadActions(alpha) {
    var a = $('mastheadActions');
    if (!a) return;
    a.style.opacity = String(clampN(alpha));
    a.classList.toggle('is-live', alpha > 0.5);
  }

  function mastheadBlend(a, b, t) {
    return { w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t),
             x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t),
             brand: lerp(a.brand, b.brand, t), sub: lerp(a.sub, b.sub, t),
             pad: lerp(a.pad, b.pad, t) };
  }

  /* The card does not lift away — it OPENS OUT in place, staying centred, while
     the dark veil behind it dissolves to reveal the building underneath. It does
     NOT travel to the corner here: that trip belongs to the scroll, so the
     opening is one idea (the wordmark arriving) rather than two at once. */
  function playIntro(gsap, loader, hero) {
    var card = MASTHEAD.card(), open = MASTHEAD.open();
    var proxy = { t: 0 };
    var el = $('masthead');
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    /* the counter and the loading rule are the only parts that belong to loading
       — they leave first, so what expands is purely the wordmark */
    tl.to(['#mastheadPct', '#mastheadRule'], { opacity: 0, duration: 0.3 })
      .set(['#mastheadPct', '#mastheadRule'], { display: 'none' })
      .to(proxy, {
        t: 1, duration: 1.1, ease: 'expo.inOut',
        onUpdate: function () {
          applyMasthead(mastheadBlend(card, open, proxy.t));
        }
      }, 0.12)
      .to('#preloaderVeil', { opacity: 0, duration: 0.95, ease: 'power2.inOut' }, 0.4)
      .set('#preloaderVeil', { display: 'none' })
      .add(function () { if (hero && hero.mastheadReady) hero.mastheadReady(); });

    if (hero && hero.playOpening) hero.playOpening(gsap, tl);
  }

  /* ============================================================
     HERO — the sticky building

     The composition holds still and the information arrives over the sky above
     it. The building's only motion is a slow scale and a downward drift; the
     skyline behind it and the tree mass in front travel by different amounts,
     and that differential is the entire sense of depth. Nothing here is 3D — it
     is three layers moving at three speeds.
     ============================================================ */
  function buildHero(el) {
    var stage = $('heroStage');
    var city = $('heroCity'), building = $('heroBuilding'), fg = $('heroFg');
    var lit = $('heroLit'), release = $('heroRelease');
    var tempEl = $('heroTemp'), modeEl = $('heroMode'), hint = $('heroHint');
    var glow = $('heroGlow'), dim = $('heroDim');
    var chips = $('heroChips'), logos = $('heroLogos'), fork = $('heroFork');
    var spaces = $('heroSpaces'), card = $('heroCard');
    var frame = $('heroFrame');
    var frameL = $('heroFrameL'), frameT = $('heroFrameT'), frameR = $('heroFrameR');

    /* The frame draws in three moves rather than one: the left leg climbs out
       from behind the building, the top runs across, the right leg drops back
       down into it. Overlapping windows keep it one continuous gesture. */
    function drawFrame(k) {
      if (frameL) frameL.style.transform = 'scaleY(' + seg(k, 0, 0.42) + ')';
      if (frameT) frameT.style.transform = 'scaleX(' + seg(k, 0.34, 0.72) + ')';
      if (frameR) frameR.style.transform = 'scaleY(' + seg(k, 0.64, 1) + ')';
    }

    /* THREE chapters — promise, proof, action — and the window each one owns.
       The first stretch still belongs to the opening (the masthead walking to
       the bar, the lights coming up, the building pulling in), so chapter one
       overlaps its tail rather than waiting for it. */
    var chapters = [
      { el: $('heroCh1'), a: 0.12, b: 0.34 },   // promise
      { el: $('heroCh2'), a: 0.38, b: 0.60 },   // proof
      { el: $('heroCh3'), a: 0.64, b: 0.90 }    // action
    ];
    var mastheadOpen = false;
    var quotePulsed = false;

    /* an element rising into place inside its chapter's window */
    function stagger(node, k) {
      if (!node) return;
      node.style.opacity = String(k);
      node.style.transform = 'translateY(' + ((1 - k) * 14) + 'px)';
    }

    /* The still used by reduced-motion and by a disabled hero: the promise and
       the call to action together over a lit building. It has to be composed
       explicitly rather than by rendering some progress value, because every
       chapter window is zero at p=0 — the scroll logic would blank the page.
       The proof beat is the one that drops: it is the only one whose whole point
       is a drawing animation, and its fork link also lives in the menu. */
    function composeStill() {
      retireMastheadToBar();                   // no loading phase, but the bar stays
      setInstruments(1);                       // nothing to hold them back for
      if (lit) lit.style.opacity = '1';
      drawFrame(1);
      /* the staggered pieces have no scroll to arrive on, so they are simply up */
      [chips, logos, fork, spaces, card].forEach(function (n) { stagger(n, 1); });
      chapters.forEach(function (ch, i) {
        var on = i !== 1;                    // promise + action, no proof
        if (!ch.el) return;
        ch.el.style.opacity = on ? '1' : '0';
        ch.el.style.visibility = on ? 'visible' : 'hidden';
        ch.el.style.transform = 'none';
        ch.el.classList.toggle('is-live', on);
      });
    }

    function render(p) {
      /* Neither fallback layout is scroll-driven, and both would be wrecked by
         this function writing inline opacity over them: every chapter window is
         zero at p=0, so a single render(0) would blank the page. */
      if (el.classList.contains('is-static')) return composeStill();
      if (el.classList.contains('is-stacked')) return;
      p = clampN(p);

      /* --- THE APPROACH. The building starts small and distant and is pulled in
             until it fills the lower half of the frame, which is the move that
             makes the section feel like a camera rather than a backdrop. Most of
             the travel happens early; after that it only creeps, so the later
             chapters read as a held shot. --- */
      var scale = p < 0.34
        ? lerp(0.86, 1.52, easeOut(seg(p, 0, 0.34)))
        : lerp(1.52, 1.72, seg(p, 0.34, 1));
      if (building) {
        building.style.transform = 'translateY(' + (4 * p) + 'vh) scale(' + scale.toFixed(4) + ')';
        building.style.transformOrigin = '50% 100%';
      }
      /* the layers behind and in front travel by different amounts — the
         differential is the whole sense of depth */
      if (city) city.style.transform = 'translateY(' + (2 * p) + 'vh) scale(' + (1 + 0.06 * p).toFixed(4) + ')';
      if (fg) {
        fg.style.transform = 'translateY(' + (14 * p) + 'vh)';
        fg.style.opacity = String(1 - seg(p, 0.06, 0.35));
      }

      /* --- THE LIGHTS. They come up as you scroll in, not on load: the building
             is dark when you arrive and wakes as it approaches. --- */
      if (lit) lit.style.opacity = String(easeOut(seg(p, 0.03, 0.22)) * (1 - 0.45 * win(p, 0.65, 0.81, 0.03)));

      /* --- THE MASTHEAD. It opened in the middle of the screen and STAYS on the
             page: the scroll walks it out of the centre and into the top-left,
             where it becomes the bar. On this register there is no second header
             to hand the corner to. Its controls arrive at the end of the trip,
             once it is small enough to read as a header rather than a title
             card. --- */
      if (mastheadOpen) {
        var mk = easeInOut(seg(p, 0.01, 0.12));
        applyMasthead(mastheadBlend(MASTHEAD.open(), MASTHEAD.shut(), mk), 1);
        setMastheadActions(seg(p, 0.09, 0.14));
      }
      if (hint) hint.style.opacity = String(1 - seg(p, 0.02, 0.08));

      /* --- THE READOUT. Held back through the opening so the wordmark has the
             frame to itself, then brought up once the masthead has left the
             middle and settled into the bar. --- */
      setInstruments(seg(p, 0.13, 0.20));

      /* --- THE READOUT'S DESCENT. One counter across the whole hero, in two
             movements, and it no longer depends on a system beat that no longer
             exists:
               33        held from arrival through the promise
               33 → 29   from 0.35, the approach — KL's evening ambient easing
                         off as the building draws near. Linear on purpose: an
                         eased fall dumps most of its degrees in one chapter and
                         then crawls, which reads as a stuck instrument
               29 → 24   steepening through the action beat, landing on 24 at
                         0.85 and holding — the hero's last number is the
                         comfortable one, arriving just as the CTAs do --- */
      if (tempEl) {
        var degrees = p < 0.64
          ? 33 - 4 * seg(p, 0.35, 0.64)
          : 29 - 5 * seg(p, 0.64, 0.85);
        tempEl.textContent = String(Math.round(degrees));
      }
      if (modeEl) {
        modeEl.textContent = p < 0.60 ? 'KL · Evening'
                           : p < 0.85 ? 'Cooling · Auto'
                                      : 'Comfortable · 24°';
      }

      /* --- CHAPTER 2's internal stagger. One beat, three arrivals: the frame
             draws itself, the client plates land, then the way through. Landing
             them together would read as a slide rather than an argument.
             The frame is a scene layer (z-3, behind the building), so its own
             fade is driven here rather than by the chapter's window. --- */
      if (frame) frame.style.opacity = String(win(p, 0.36, 0.62, 0.04));
      drawFrame(easeOut(seg(p, 0.39, 0.55)));
      stagger(logos, seg(p, 0.46, 0.55));
      stagger(fork, seg(p, 0.52, 0.61));

      /* --- CHAPTER 1's chips follow the sub rather than arriving with it --- */
      stagger(chips, seg(p, 0.18, 0.26));

      /* --- CHAPTER 3's twin cards rise last: every-space first, the corporate
             register a beat behind it. --- */
      stagger(spaces, seg(p, 0.76, 0.84));
      stagger(card, seg(p, 0.80, 0.88));
      /* and the header's quote button answers it, once — a nudge that the same
         action is permanently available up there. Never loops. */
      if (!quotePulsed && p > 0.80 && !reduced) {
        quotePulsed = true;
        var q = document.querySelector('#mastheadActions .mastbar__quote');
        if (q) {
          q.classList.add('is-pulse');
          setTimeout(function () { q.classList.remove('is-pulse'); }, 900);
        }
      }

      /* --- OPTIONAL: the system wakes, photoreal. A mint bloom over the actual
             rooftop plant and a slight dim on everything else, so the eye goes
             up. No labels, no nodes, no drawn paths. --- */
      if (CONFIG.systemGlow) {
        var glowK = win(p, 0.66, 0.82, 0.05);
        var breathe = 0.82 + 0.18 * Math.sin(seg(p, 0.66, 0.82) * Math.PI);
        if (glow) glow.style.opacity = String(glowK * breathe);
        if (dim) dim.style.opacity = String(glowK);
      }

      /* --- chapters fade in and out over their own windows. The last one (the
             action) is the exception: it HOLDS once it arrives and never fades
             out, staying overlaid on the building right up to the seam. The
             release wash rises behind it (chapters sit above it, see the CSS),
             so the cards stay crisp while the building dims underneath, then the
             whole pinned stage scrolls away into the stat ribbon. --- */
      chapters.forEach(function (ch, i) {
        if (!ch.el) return;
        var hold = i === chapters.length - 1;
        var o = hold ? seg(p, ch.a, ch.a + 0.04) : win(p, ch.a, ch.b, 0.035);
        ch.el.style.opacity = String(o);
        ch.el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
        ch.el.style.transform = 'translateY(' + ((1 - o) * 22) + 'px)';
        /* only a fully-present chapter takes clicks, so neither the corporate
           fork nor the CTAs can be hit while they are ghosting */
        ch.el.classList.toggle('is-live', o > 0.9);
      });

      /* --- release: a pine wash rises from the floor so the building hands off
             into the stat ribbon below with no paper in between --- */
      if (release) release.style.opacity = String(seg(p, 0.92, 1.0));
    }

    /* first-paint subscribers — the preloader waits on both plates */
    var readyCbs = [], isReady = false;
    function markReady() {
      if (isReady) return;
      isReady = true;
      readyCbs.forEach(function (fn) { fn(); });
      readyCbs = [];
    }
    /* both plates are decoded before the curtain lifts, so the lights-on
       crossfade can't stutter on a half-loaded image */
    (function preloadPlates() {
      var imgs = Array.prototype.slice.call(el.querySelectorAll('.hero-plate img'));
      if (!imgs.length) return markReady();
      var left = imgs.length;
      imgs.forEach(function (img) {
        function done() { if (--left <= 0) markReady(); }
        if (img.complete && img.naturalWidth) return done();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
      setTimeout(markReady, 7000);
    })();

    var track = ScrubTrack({
      el: el,
      enabled: CONFIG.heroEnabled,
      source: null,                       // this hero is DOM and CSS, there is no film
      render: render,
      ease: 0.12,
      /* no skipEl: the control used to sit top-right, which the header's menu
         button now owns. ScrubTrack treats it as optional. */
      onFirstPaint: markReady,
      /* touch: the stage stops sticking and the chapters become ordinary stacked
         sections under a still hero, revealed on their own as you scroll past */
      onPlayOnce: function () {
        el.style.height = '';
        el.classList.remove('is-playonce');
        el.classList.add('is-stacked');
        if (lit) lit.style.opacity = '1';
        /* the staggered pieces are scroll-driven, and there is no scrub here —
           the chapters reveal as whole blocks instead, so their contents are up */
        [chips, logos, fork, spaces, card].forEach(function (n) { stagger(n, 1); });
        drawFrame(1);
          /* the hero is a plain still here, so there is no cinematic reason to keep
           the quote CTA hidden — it rides the same class the header reveal uses */
        document.body.classList.add('header-revealed');
        stackChapters();
      }
    });

    function stackChapters() {
      var els = chapters.map(function (c) { return c.el; }).filter(Boolean);
      if (!('IntersectionObserver' in window)) {
        els.forEach(function (n) { n.classList.add('is-in'); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
      els.forEach(function (n) { io.observe(n); });
    }

    return {
      el: el,
      track: track,
      render: render,
      onReady: function (fn) { if (isReady) fn(); else readyCbs.push(fn); },

      /* the load choreography: the layers rise at different rates (which sells the
         depth before a single scroll happens), the building wakes up, then the
         headline arrives */
      /* The building arrives DARK and distant. The lights are deliberately not
         part of this — they come up on scroll, so the first thing the visitor
         does is wake the building. The layers rise at different rates, which
         sells the depth before a single scroll happens. */
      /* The readout is deliberately NOT in this chain: on load the frame belongs
         to the wordmark and nothing else, so it arrives on scroll instead (see
         the readout block in render). */
      playOpening: function (gsap, tl) {
        tl.from(city, { yPercent: 6, opacity: 0, duration: 1.3 }, '-=.55')
          .from(building, { yPercent: 12, opacity: 0, duration: 1.4 }, '<')
          .from(fg, { yPercent: 16, opacity: 0, duration: 1.5 }, '<')
          .from('#heroHint', { opacity: 0, duration: 0.5 }, '-=.6');
      },

      /* The load tween is done. On the scrubbing path scroll owns the masthead
         from here; in the stacked and static layouts there is no scroll to
         collapse it against, so it simply retires after a beat. */
      mastheadReady: function () {
        if (el.classList.contains('is-stacked') || el.classList.contains('is-static')) {
          setTimeout(retireMastheadToBar, 1000);
          return;
        }
        mastheadOpen = true;
        mastheadPhase = 'scrub';
        render(track.progress());
      },

      /* no GSAP: nothing can be animated, so just make sure the composition is
         in its opened state rather than stuck mid-choreography */
      showIntro: function () {
        if (lit) lit.style.opacity = '1';
        [city, building, fg].forEach(function (n) {
          if (n) { n.style.opacity = ''; n.style.transform = ''; }
        });
      }
    };
  }


  /* ---- boot (was DOMContentLoaded) ---- */
  setupHeader();
  setupLanding();

  return {
    destroy: function () {
      destroyed = true;
      listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
      listeners = [];
      if (window.ScrollTrigger) window.ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
      if (window.gsap && activeLoop) window.gsap.ticker.remove(activeLoop);
    }
  };
}
