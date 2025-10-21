
/* ========= Small utilities ========= */
const cssMs = (name, fallback) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if(!raw) return fallback;
  const n = parseFloat(raw);
  if (isNaN(n)) return fallback;
  return raw.endsWith('s') && !raw.endsWith('ms') ? n * 1000 : n;
};

/* ========= Parallax Pills ========= */
(function(){
  const pills = Array.from(document.querySelectorAll('.pill'));
  let w = window.innerWidth, h = window.innerHeight;
  let mx = w/2, my = h/2;
  
  // Check if device supports hover (not touch)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobile = window.innerWidth <= 768;

  function onMove(e){
    mx = e.clientX; my = e.clientY;
    const cx = (mx / w - .5) * 2; // -1..1
    const cy = (my / h - .5) * 2;
    
    // Reduce movement on mobile/touch devices
    const movementMultiplier = isMobile ? 0.3 : 1;
    
    pills.forEach((el, i) => {
      const depth = (i+1) * 6 * movementMultiplier; // vary
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
(function(){
  const c = document.getElementById('spark');
  const ctx = c.getContext('2d');
  let w, h, id;
  const particles = [];
  
  // Responsive particle count based on device
  const isMobile = window.innerWidth <= 768;
  const isSmallMobile = window.innerWidth <= 480;
  const MAX = isSmallMobile ? 30 : isMobile ? 50 : 70;

  function resize(){
    w = c.width = window.innerWidth;
    h = c.height = window.innerHeight;
  }
  function rand(a,b){ return Math.random()*(b-a)+a }
  function init(){
    particles.length = 0;
    for(let i=0;i<MAX;i++){
      particles.push({
        x: rand(0,w), y: rand(0,h),
        vx: rand(-.15,.15), vy: rand(-.15,.15),
        r: rand(0.6,1.6), o: rand(.3,.8)
      });
    }
  }
  function step(){
    ctx.clearRect(0,0,w,h);
    ctx.globalCompositeOperation = 'lighter';
    particles.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>w) p.vx*=-1;
      if(p.y<0||p.y>h) p.vy*=-1;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${p.o})`;
      ctx.fill();
    });
    id = requestAnimationFrame(step);
  }
  const start = ()=>{ resize(); init(); cancelAnimationFrame(id); step(); }
  start();
  window.addEventListener('resize', start);
})();

/* ========= Cursor dot (kept, smoother) ========= */
(function() {
  const cursorDot = document.getElementById('cursorDot');
  const ticker = document.getElementById('ticker');
  let mouseX=0, mouseY=0, dotX=0, dotY=0;
  
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
  document.addEventListener('mousemove', (e)=>{ mouseX=e.clientX; mouseY=e.clientY; });

  ticker.addEventListener('mouseenter', ()=> cursorDot.classList.add('active'));
  ticker.addEventListener('mouseleave', ()=> { cursorDot.classList.remove('active'); cursorDot.classList.remove('hover'); });

  ticker.querySelectorAll('span').forEach(el=>{
    el.addEventListener('mouseenter', ()=> cursorDot.classList.add('hover'));
    el.addEventListener('mouseleave', ()=> cursorDot.classList.remove('hover'));
  });

  animate();
})();

/* ========= BUILD ticker + interlude (kept, with small polish) ========= */
(function () {
  const root = document.getElementById('ticker');
  const track = root.querySelector('.track');
  let items = Array.from(track.children);
  let index = 0;
  let lineH = 0;
  let timer = null;

  const SPEED_MS = () => cssMs('--speed', 1200);
  const TRANSITION_MS = () => cssMs('--transition-speed', 400);

  // Clone first for seamless loop
  const firstClone = items[0].cloneNode(true);
  track.appendChild(firstClone);
  items = Array.from(track.children);

  function measure() {
    const ref = items[0].getBoundingClientRect().height || root.getBoundingClientRect().height * 0.9;
    if (ref > 0) lineH = ref;
    track.style.transition = 'none';
    track.style.transform = `translateY(${-index * lineH}px)`;
  }

  function step() {
    items.forEach(el=> el.classList.remove('active'));
    index++;
    track.style.transition = `transform ${TRANSITION_MS()}ms cubic-bezier(0.25,0.46,0.45,0.94)`;
    track.style.transform = `translateY(${-index * lineH}px)`;

    const activeIndex = index === items.length - 1 ? 0 : index;
    items[activeIndex]?.classList.add('active');

    // Hit clone?
    if (index === items.length - 1) {
      setTimeout(() => {
        track.style.transition = 'none';
        index = 0;
        track.style.transform = 'translateY(0)';
        items[0].classList.add('active');
        showCenterText();
      }, TRANSITION_MS() + 20);
    }
  }

  function play() {
    if (timer) return;
    timer = setInterval(step, SPEED_MS());
  }
  function pause() {
    clearInterval(timer);
    timer = null;
  }

   function showCenterText() {
     pause();
     root.style.visibility = 'hidden';

     const center = document.createElement('div');
     center.className = 'center-text';
     center.textContent = "Let's BUILD TOGETHER";
     document.body.appendChild(center);
     
     // Smooth entrance animation
     setTimeout(() => {
       center.classList.add('animate-in');
     }, 100);

     const holdMs = 3200;
     setTimeout(() => {
       center.style.opacity='0';
       center.style.transform = 'translate(-50%,-50%) scale(0.8) translateY(-30px)';
       setTimeout(() => { center.remove(); showLogo(); }, 1000);
     }, holdMs);
   }

  function showLogo() {
    const logoSrc = 'new_logo_white.svg';

    const box = document.createElement('div');
    box.style.cssText = `
      position:fixed; inset:50% auto auto 50%; transform:translate(-50%,-50%);
      opacity:0; transition:opacity 900ms ease-in-out; z-index:3; text-align:center;
    `;

    const img = document.createElement('img');
    img.alt = 'Logo';
    img.style.cssText = `max-width:600px; height:600px; display:inline-block;`

    const apply = () => {
      if (innerWidth <= 768) {
        img.style.cssText = `max-width:72vw; height:auto; display:inline-block;`
      } else {
        img.style.cssText = `max-width:600px; height:600px; display:inline-block; object-fit:contain;`
      }
    };
    apply(); addEventListener('resize', apply);

    const test = new Image();
    test.onload = ()=>{ img.src=logoSrc; attach(); }
    test.onerror = ()=>{
      const fallback = document.createElement('div');
      fallback.textContent = 'Your Logo';
      fallback.style.cssText = 'font-weight:800;font-size:clamp(24px,6vw,64px);color:#fff;';
      box.appendChild(fallback);
      attach();
    }
    test.src = logoSrc;

    box.appendChild(img);
    document.body.appendChild(box);

    function attach(){
      requestAnimationFrame(()=> box.style.opacity='1');
      setTimeout(()=> {
        box.style.opacity='0';
        setTimeout(()=> {
          removeEventListener('resize', apply);
          box.remove();
          restart();
        }, 900);
      }, 2800);
    }
  }

  function restart() {
    index = 0;
    track.style.transition = 'none';
    track.style.transform = 'translateY(0)';
    root.style.visibility = 'visible';
    setTimeout(()=>{ measure(); play(); }, 250);
  }

   function start(){
     measure();
     items[0]?.classList.add('active');
     
     // Animate the wrap container first
     const wrap = document.querySelector('.wrap');
     setTimeout(()=> wrap.classList.add('animate-in'), 100);
     
     // Then animate the ticker
     setTimeout(()=> root.classList.add('animate-in'), 300);
     setTimeout(()=> play(), 1200);
   }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
  } else {
    window.addEventListener('load', start, { once:true });
  }

  root.addEventListener('mouseenter', pause);
  root.addEventListener('mouseleave', play);
  window.addEventListener('resize', () => measure(), { passive:true });
})();
