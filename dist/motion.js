'use strict';
(() => {
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const toggle = document.querySelector('.motion-toggle');
  const hero = document.querySelector('.hero');
  const art = document.querySelector('.hero-art');
  const venue = document.querySelector('.venue-image');
  const canvas = document.querySelector('#atmosphere');
  const ctx = canvas.getContext('2d');
  let manualPause = false;
  let enabled = !preference.matches;
  let heroVisible = true;
  let frame = 0;
  let width = 1, height = 1, lastTime = 0;
  let pointerX = 0, pointerY = 0, easedX = 0, easedY = 0;
  const runningAnimations = new Set();
  const particles = Array.from({length: 34}, (_, i) => ({x: ((i * 0.61803398875) % 1), y: ((i * 0.381966 + 0.13) % 1), size: 0.6 + (i % 4) * 0.3, phase: i * 2.13, speed: .005 + (i % 5) * .002}));

  function applyMotion() {
    enabled = !manualPause && !preference.matches;
    root.classList.toggle('motion-enabled', enabled);
    root.classList.toggle('motion-paused', !enabled);
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(!enabled));
      const label = preference.matches ? 'Reduced motion is enabled on your device' : enabled ? 'Pause animations' : 'Resume animations';
      toggle.setAttribute('aria-label', label);
      toggle.title = label;
      toggle.querySelector('span').textContent = enabled ? 'Ⅱ' : '▷';
      toggle.disabled = preference.matches;
    }
    runningAnimations.forEach(animation => enabled ? animation.play() : animation.finish());
    if (!enabled) {
      cancelAnimationFrame(frame); frame = 0;
      art.style.removeProperty('--art-x'); art.style.removeProperty('--art-y');
      document.querySelectorAll('.speaker-card').forEach(card => {card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');});
      if (ctx) ctx.clearRect(0, 0, width, height);
    } else start();
  }
  toggle?.addEventListener('click', () => {manualPause = !manualPause; applyMotion();});
  preference.addEventListener('change', applyMotion);

  function resize() {
    width = hero.clientWidth; height = hero.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    if (ctx) ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  new ResizeObserver(resize).observe(hero);
  hero.addEventListener('pointermove', event => {
    if (!enabled || !finePointer.matches) return;
    const rect = hero.getBoundingClientRect();
    pointerX = (event.clientX - rect.left) / rect.width - .5;
    pointerY = (event.clientY - rect.top) / rect.height - .5;
  }, {passive: true});
  hero.addEventListener('pointerleave', () => {pointerX = 0; pointerY = 0;});

  function draw(time) {
    frame = 0;
    if (!enabled || !heroVisible || document.hidden) return;
    const delta = Math.min((time - lastTime) / 1000 || .016, .05); lastTime = time;
    easedX += (pointerX - easedX) * .04; easedY += (pointerY - easedY) * .04;
    const scrollShift = Math.min(window.scrollY, height) * .1;
    art.style.setProperty('--art-x', `${easedX * 25}px`);
    art.style.setProperty('--art-y', `${easedY * 18 + scrollShift}px`);
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      const points = [];
      particles.forEach(p => {
        p.y -= delta * p.speed; if (p.y < -.05) p.y = 1.05;
        const x = (.35 + p.x * .65) * width + Math.sin(time * .00015 + p.phase) * 16 + easedX * 16;
        const y = p.y * height;
        const alpha = .22 + (Math.sin(time * .0005 + p.phase) + 1) * .13;
        ctx.beginPath();ctx.arc(x, y, p.size, 0, Math.PI * 2);ctx.fillStyle = `rgba(159,202,255,${alpha})`;ctx.fill();
        points.push({x, y});
      });
      if (width > 700) {
        for(let i = 0; i < points.length; i++) for(let j = i + 1; j < points.length; j++) {
          const a = points[i], b = points[j], distance = Math.hypot(a.x - b.x, a.y - b.y);
          if(distance < 100) {ctx.beginPath();ctx.moveTo(a.x, a.y);ctx.lineTo(b.x, b.y);ctx.lineWidth = .5;ctx.strokeStyle = `rgba(152,200,255,${.12 * (1-distance/100)})`;ctx.stroke();}
        }
      }
    }
    frame = requestAnimationFrame(draw);
  }
  function start() {if (!frame && enabled && heroVisible && !document.hidden) {lastTime = performance.now();frame = requestAnimationFrame(draw);}}
  new IntersectionObserver(([entry]) => {heroVisible = entry.isIntersecting;if(heroVisible)start();else{cancelAnimationFrame(frame);frame=0;}}, {threshold:0}).observe(hero);
  document.addEventListener('visibilitychange', () => {if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});

  let scrollFrame = 0;
  function updateScroll() {
    scrollFrame = 0;
    if (enabled && venue) {
      const rect = venue.getBoundingClientRect();
      if(rect.bottom > 0 && rect.top < window.innerHeight) venue.style.setProperty('--venue-y', `${Math.max(-22, Math.min(22, (window.innerHeight * .5 - rect.top - rect.height * .5) * .055))}px`);
    }
  }
  window.addEventListener('scroll', () => {if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);}, {passive:true});
  window.addEventListener('resize', updateScroll, {passive:true});

  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    revealObserver.unobserve(entry.target);
    if (!enabled || typeof entry.target.animate !== 'function') return;
    const animation = entry.target.animate([{opacity:.15,transform:'translateY(34px)'},{opacity:1,transform:'translateY(0)'}], {duration:850,delay:Number(entry.target.dataset.motionDelay||0),easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
    runningAnimations.add(animation);
    animation.finished.then(()=>runningAnimations.delete(animation)).catch(()=>runningAnimations.delete(animation));
  }), {threshold:.1});
  document.querySelectorAll('.section-label,.intro-grid,.facts-row,.section-heading,.moderator,.audience-grid,.benefits-grid,.venue-panel,.sponsor-leads,.sponsor-secondary,.ticket-grid,.countdown-layout,.sponsorship-intro,.enquiry-intro,.enquiry-form-card').forEach(el=>revealObserver.observe(el));
  document.querySelectorAll('.speaker-card,.topic,.sponsor-opportunity,.topic-detail').forEach((el,i)=>{el.dataset.motionDelay=String((i%3)*90);revealObserver.observe(el);});

  document.querySelectorAll('.speaker-card,.topic').forEach(card => {
    let queued = 0;
    card.addEventListener('pointermove', event => {
      if (!enabled || !finePointer.matches || queued) return;
      const clientX = event.clientX, clientY = event.clientY;
      queued = requestAnimationFrame(() => {
        queued = 0;
        const rect = card.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width, y = (clientY - rect.top) / rect.height;
        card.style.setProperty('--shine-x', `${x*100}%`);card.style.setProperty('--shine-y', `${y*100}%`);
        if(card.classList.contains('speaker-card')){card.style.setProperty('--tilt-x',`${(y-.5)*-3}deg`);card.style.setProperty('--tilt-y',`${(x-.5)*4}deg`);}
      });
    }, {passive:true});
    card.addEventListener('pointerleave',()=>{cancelAnimationFrame(queued);queued=0;card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');});
  });
  applyMotion();updateScroll();
})();
