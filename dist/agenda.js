/* Agenda timeline: reveal each block as it comes into view. Loaded on the
   agenda page only. */
(() => {
  const timeline = document.querySelector('.agenda-timeline');
  if (!timeline) return;

  const blocks = [...timeline.querySelectorAll('.agenda-block')];
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
})();
