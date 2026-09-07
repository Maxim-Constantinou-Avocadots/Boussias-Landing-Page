'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const clock = $('.countdown-clock');
  const deadline = Number(clock.dataset.deadline);
  let countdownInterval;
  function countdownParts(now) {
    const total = Math.max(0, Math.ceil((deadline - now) / 1000));
    return [Math.floor(total / 86400), Math.floor(total / 3600) % 24, Math.floor(total / 60) % 60, total % 60];
  }
  function updateCountdown() {
    const parts = countdownParts(Date.now());
    ['days', 'hours', 'minutes', 'seconds'].forEach((unit, i) => {
      const value = String(parts[i]).padStart(2, '0');
      const node = $('#count-' + unit);
      if (node.textContent !== value) node.textContent = value;
    });
    if (Date.now() >= deadline) {
      clearInterval(countdownInterval);
      $('#countdown-status').textContent = 'The countdown is complete. Explore the conference programme.';
    }
  }
  function resumeCountdown() {
    clearInterval(countdownInterval);
    updateCountdown();
    if (!document.hidden && Date.now() < deadline) countdownInterval = setInterval(updateCountdown, 1000);
  }
  document.addEventListener('visibilitychange', resumeCountdown);
  resumeCountdown();

  const topics = [...document.querySelectorAll('.topic-detail')];
  topics.forEach(detail => detail.addEventListener('toggle', () => {
    if (!detail.open) return;
    topics.forEach(other => { if (other !== detail) other.open = false; });
    const body = detail.querySelector('.topic-detail-body');
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !document.documentElement.classList.contains('motion-paused')) {
      body.animate?.([{ opacity: .3, transform: 'translateY(-7px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 330, easing: 'ease-out' });
    }
  }));

  const form = $('#enquiry-form');
  function updateContactFields() {
    const phone = $('#enquiry-method').value === 'Phone';
    $('#callback-field').hidden = !phone;
    $('#enquiry-time').disabled = !phone;
    $('#sponsor-ticket-note').hidden = $('#enquiry-sponsor').value !== 'Yes';
  }
  form.addEventListener('change', updateContactFields);
  updateContactFields();

})();
