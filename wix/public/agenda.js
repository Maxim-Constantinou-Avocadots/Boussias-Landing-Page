/* Agenda timeline: reveal blocks on entry, and light the rail up to the
   reading line as the page scrolls. Loaded on the agenda page only. */
(() => {
  const timeline = document.querySelector('.agenda-timeline');
  if (!timeline) return;

  const blocks = [...timeline.querySelectorAll('.agenda-block')];
  const nodes = [...timeline.querySelectorAll('.agenda-node')];
  const fill = timeline.querySelector('.agenda-rail-fill');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Only hide anything once we know we can bring it back.
  timeline.classList.add('js-reveal');

  if (still.matches || !('IntersectionObserver' in window)) {
    blocks.forEach(block => block.classList.add('is-in'));
  } else {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      entry.target.classList.add('is-in');
    }), {threshold: .1, rootMargin: '0px 0px -6% 0px'});
    blocks.forEach(block => observer.observe(block));
  }

  // Safety net: if an observer never fires (a block already past the fold on a
  // restored scroll position, say), nothing stays hidden for long.
  setTimeout(() => blocks.forEach(block => block.classList.add('is-in')), 2600);

  if (!fill) return;
  let frame = 0;
  function draw() {
    frame = 0;
    const rail = timeline.getBoundingClientRect();
    const line = window.innerHeight * .58;
    fill.style.height = Math.max(0, Math.min(rail.height, line - rail.top)) + 'px';
    nodes.forEach(node => {
      const top = node.getBoundingClientRect().top;
      node.classList.toggle('is-past', top < line);
    });
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  draw();
})();
