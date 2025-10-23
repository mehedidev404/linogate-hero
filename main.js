
/* ========= Small utilities ========= */
const cssMs = (name, fallback) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return fallback;
  const n = parseFloat(raw);
  if (isNaN(n)) return fallback;
  return raw.endsWith('s') && !raw.endsWith('ms') ? n * 1000 : n;
};

/* ========= Parallax Pills ========= */
(function () {
  const pills = Array.from(document.querySelectorAll('.pill'));
  let w = window.innerWidth, h = window.innerHeight;
  let mx = w / 2, my = h / 2;

  // Check if device supports hover (not touch)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobile = window.innerWidth <= 768;

  function onMove(e) {
    mx = e.clientX; my = e.clientY;
    const cx = (mx / w - .5) * 2; // -1..1
    const cy = (my / h - .5) * 2;

    // Reduce movement on mobile/touch devices
    const movementMultiplier = isMobile ? 0.3 : 1;

    pills.forEach((el, i) => {
      const depth = (i + 1) * 6 * movementMultiplier; // vary
      el.style.transform = `translate3d(${cx * depth}px, ${cy * depth}px, 0)`;
    });
  }

  // Only add mouse events on non-touch devices
  if (!isTouchDevice) {
    window.addEventListener('mousemove', onMove);
  }

  window.addEventListener('resize', () => {
    w = innerWidth;
    h = innerHeight;
  });
})();

/* ========= Particle Sparkle Canvas ========= */
(function () {
  const c = document.getElementById('spark');
  const ctx = c.getContext('2d');
  let w, h, id;
  const particles = [];

  // Responsive particle count based on device
  const isMobile = window.innerWidth <= 768;
  const isSmallMobile = window.innerWidth <= 480;
  const MAX = isSmallMobile ? 30 : isMobile ? 50 : 70;

  function resize() {
    w = c.width = window.innerWidth;
    h = c.height = window.innerHeight;
  }
  function rand(a, b) { return Math.random() * (b - a) + a }
  function init() {
    particles.length = 0;
    for (let i = 0; i < MAX; i++) {
      particles.push({
        x: rand(0, w), y: rand(0, h),
        vx: rand(-.15, .15), vy: rand(-.15, .15),
        r: rand(0.6, 1.6), o: rand(.3, .8)
      });
    }
  }
  function step() {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.o})`;
      ctx.fill();
    });
    id = requestAnimationFrame(step);
  }
  const start = () => { resize(); init(); cancelAnimationFrame(id); step(); }
  start();
  window.addEventListener('resize', start);
})();

/* ========= Cursor dot (kept, smoother) ========= */
(function () {
  const cursorDot = document.getElementById('cursorDot');
  const ticker = document.getElementById('ticker');
  let mouseX = 0, mouseY = 0, dotX = 0, dotY = 0;

  // Check if device supports hover (not touch)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Hide cursor dot on touch devices
  if (isTouchDevice) {
    cursorDot.style.display = 'none';
    return;
  }

  function animate() {
    dotX += (mouseX - dotX) * 0.12;
    dotY += (mouseY - dotY) * 0.12;
    cursorDot.style.left = dotX + 'px';
    cursorDot.style.top = dotY + 'px';
    requestAnimationFrame(animate);
  }
  document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

  ticker.addEventListener('mouseenter', () => cursorDot.classList.add('active'));
  ticker.addEventListener('mouseleave', () => { cursorDot.classList.remove('active'); cursorDot.classList.remove('hover'); });

  ticker.querySelectorAll('span, a').forEach(el => {
    el.addEventListener('mouseenter', () => cursorDot.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursorDot.classList.remove('hover'));
  });

  animate();
})();

/* ========= BUILD ticker + interlude (kept, with small polish) ========= */

(function () {
  const root = document.getElementById('ticker');
  const track = root.querySelector('.track');
  let items = Array.from(track.children);
  let currentIndex = 0;
  let lineH = 0;
  let isAnimating = false;

  const TRANSITION_MS = () => cssMs('--transition-speed', 600);

  function measure() {
    // Ensure accurate height even if not visible yet
    const first = items[0];
    if (first) {
      const rect = first.getBoundingClientRect();
      if (rect.height > 0) lineH = rect.height;
    }
  }

  function setActive(i) {
    items.forEach(el => el.classList.remove('active'));
    if (items[i]) items[i].classList.add('active');
  }

  function scrollToIndex(index, smooth = true) {
    if (isAnimating) return;
    index = Math.max(0, Math.min(items.length - 1, index));
    currentIndex = index;
    track.style.transition = smooth ? `transform ${TRANSITION_MS()}ms cubic-bezier(0.4,0.0,0.2,1)` : 'none';
    track.style.transform = `translateY(${-currentIndex * lineH}px)`;
    setActive(currentIndex);
    if (smooth) {
      isAnimating = true;
      setTimeout(() => { isAnimating = false; }, TRANSITION_MS());
    }
  }

  function next() { if (currentIndex < items.length - 1) scrollToIndex(currentIndex + 1); }
  function prev() { if (currentIndex > 0) scrollToIndex(currentIndex - 1); }

  // Listen globally so wheel works anywhere on hero
  let wheelLock = false;
  function onWheel(e) {
    e.preventDefault();
    if (wheelLock || isAnimating) return;
    wheelLock = true;
    (e.deltaY > 0 ? next : prev)();
    setTimeout(() => wheelLock = false, TRANSITION_MS() * 0.65);
  }
  window.addEventListener('wheel', onWheel, { passive: false });

  // Keyboard arrows
  function onKey(e) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); next(); }
    if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); prev(); }
  }
  window.addEventListener('keydown', onKey);

  // Touch swipe
  let startY = 0;
  window.addEventListener('touchstart', (e) => { startY = e.changedTouches[0].screenY; }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (isAnimating) return;
    const diff = startY - e.changedTouches[0].screenY;
    if (Math.abs(diff) > 50) (diff > 0 ? next : prev)();
  }, { passive: true });

  function start() {
    measure();
    scrollToIndex(0, false);
    // Keep previous GSAP entrance; our logic is independent.
  }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(start); }
  else { window.addEventListener('load', start, { once: true }); }

  window.addEventListener('resize', () => { measure(); scrollToIndex(currentIndex, false); }, { passive: true });
})();
// ===== GSAP polish timeline =====
(function () {
  // Fallback: show text immediately if GSAP fails
  const showTextFallback = () => {
    const wrap = document.querySelector('.wrap');
    const row = document.getElementById('ticker');
    if (wrap) wrap.style.opacity = '1';
    if (row) row.style.opacity = '1';
  };

  if (!window.gsap) {
    // If GSAP is not available, show text immediately
    setTimeout(showTextFallback, 100);
    return;
  }

  // Wait for DOM to be ready
  const initAnimation = () => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    const decor = document.querySelectorAll('.blob, .ring');
    const wrap = document.querySelector('.wrap');
    const row = document.getElementById('ticker');
    const pills = document.querySelectorAll('.pill');
    const mouse = document.querySelector('.mouse-indicator');

    // Initial states - hide everything for smooth entrance
    gsap.set(decor, { autoAlpha: 0, y: 20, scale: 0.98 });
    gsap.set(wrap, { autoAlpha: 0, y: 30 });
    gsap.set(pills, { y: 12, autoAlpha: 0, scale: 0.98 });
    gsap.set(mouse, { autoAlpha: 0, y: 10 });

    // Beautiful entrance animation sequence
    tl.to(decor, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8, stagger: 0.08 }, 0)
      .to(wrap, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.15)
      .from(row.querySelectorAll('.build, .track span'), { y: 20, autoAlpha: 0, stagger: 0.06, duration: 0.6 }, 0.25)
      .to(pills, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1 }, 0.35)
      .to(mouse, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.6);

    // Mouse bobbing animation
    if (mouse) {
      gsap.to(mouse, { y: "-=10", repeat: -1, yoyo: true, ease: "sine.inOut", duration: 1.2 });
    }
  };

  // Initialize animation when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimation);
  } else {
    initAnimation();
  }

  // Fallback timeout - show text after 2 seconds if animation doesn't work
  setTimeout(showTextFallback, 2000);
})();
