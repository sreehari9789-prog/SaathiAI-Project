/* Shared UI wiring used on every page. Include after gsap + api.js. */

// Safety net: if the GSAP CDN is blocked or slow, fall back to a no-op
// stub so every core feature still works — only animation is skipped.
if (typeof gsap === 'undefined') {
  const noop = new Proxy(function(){ return noop; }, { get: () => noop, apply: () => noop });
  window.gsap = noop;
  window.ScrollTrigger = noop;
  console.warn('Saathi: animation library unavailable, running without animations.');
}
try { gsap.registerPlugin(ScrollTrigger); } catch(e) {}

function saathiInitNav(){
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  if (toggle && nav){
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }
  // mark active link
  const here = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#mainNav a[data-page]').forEach(a => {
    if (a.dataset.page === here) a.classList.add('active');
  });
  // auth-aware right side
  const right = document.getElementById('navRight');
  if (right){
    const user = Saathi.getUser();
    if (user && Saathi.isLoggedIn()){
      right.innerHTML = `
        <a href="dashboard.html" class="user-pill"><span class="avatar">${user.name.charAt(0).toUpperCase()}</span>${user.name.split(' ')[0]}</a>
        <button class="btn btn-ghost btn-sm" id="logoutBtn">Log out</button>`;
      document.getElementById('logoutBtn').addEventListener('click', () => Saathi.logout());
    } else {
      right.innerHTML = `
        <a href="login.html" class="btn btn-ghost btn-sm">Log in</a>
        <a href="signup.html" class="btn btn-accent btn-sm">Sign up</a>`;
    }
  }
}

function saathiInitTilt(selector, intensity=6){
  document.querySelectorAll(selector).forEach(el => {
    el.style.transformStyle = 'preserve-3d';
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      try { gsap.to(el, { rotationY: px*intensity, rotationX: -py*intensity, transformPerspective:800, duration:0.4, ease:'power2.out' }); } catch(e) {}
    });
    el.addEventListener('mouseleave', () => {
      try { gsap.to(el, { rotationY:0, rotationX:0, duration:0.6, ease:'power3.out' }); } catch(e) {}
    });
  });
}

function saathiScrollReveal(){
  document.querySelectorAll('.section, .page-hero').forEach(sec => {
    const targets = sec.querySelectorAll('.section-head, .section-sub, .card, .feature-card, .stat-card, h1, p');
    if (!targets.length) return;
    try {
      gsap.from(targets, {
        scrollTrigger:{ trigger:sec, start:'top 82%' },
        opacity:0, y:32, duration:0.7, stagger:0.06, ease:'power2.out'
      });
    } catch(e) {}
  });
}

function saathiFooterClock(){
  const el = document.getElementById('clock');
  if (el) el.textContent = new Date().toLocaleDateString('en-IN', {year:'numeric', month:'short', day:'numeric'});
}

document.addEventListener('DOMContentLoaded', () => {
  saathiInitNav();
  saathiFooterClock();
});
