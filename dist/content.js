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
  const draft = $('#enquiry-draft');
  function updateContactFields() {
    const phone = $('#enquiry-method').value === 'Phone';
    $('#callback-field').hidden = !phone;
    $('#enquiry-time').disabled = !phone;
    $('#sponsor-ticket-note').hidden = $('#enquiry-sponsor').value !== 'Yes';
  }
  form.addEventListener('change', updateContactFields);
  updateContactFields();
  function buildEnquiry(data) {
    const value = key => String(data.get(key) || '').trim();
    const lines = [
      'Hello Elena,', '', 'I would like to enquire about the AI in Marketing Conference on 15 October 2026.', '',
      'Name: ' + value('firstName') + ' ' + value('lastName'),
      'Email: ' + value('email'), 'Phone: ' + value('phone'),
      'Company: ' + (value('company') || 'Not provided'),
      'Professional title: ' + (value('professionalTitle') || 'Not provided'), '',
      'Interested in sponsoring: ' + (value('sponsoring') || 'Not specified'),
      'Interested in attending: ' + (value('attending') || 'Not specified'),
      'Preferred contact method: ' + value('contactMethod')
    ];
    if (value('contactMethod') === 'Phone') lines.push('Best time to call: ' + (value('callbackTime') || 'Please arrange with me'));
    lines.push('', 'Opt-in to receiving information about this summit from BOUSSIAS Cyprus: ' + (data.has('eventUpdates') ? 'Yes' : 'No'));
    return lines.join('\n');
  }
  const submitButton = form.querySelector('.enquiry-submit');
  const submitLabel = submitButton.innerHTML;
  let sentLastTime = false;

  // Posts to the Wix Forms backend. Resolves false on any failure — including a
  // host with no backend, where the email draft below is the fallback.
  async function sendEnquiry(data) {
    const payload = {};
    for (const [name, value] of data) payload[name] = value;
    payload.eventUpdates = data.has('eventUpdates');
    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) return false;
      const result = await response.json().catch(() => null);
      return Boolean(result && result.ok);
    } catch (error) {
      return false;
    }
  }

  function showResult(sent, body) {
    sentLastTime = sent;
    if (sent) {
      $('#draft-heading').textContent = 'Thank you — your enquiry has been sent.';
      $('#draft-lede').textContent = 'The BOUSSIAS Cyprus team has received your details and will be in touch shortly.';
      $('#draft-fallback').hidden = true;
      $('#draft-note').textContent = '';
      $('#edit-enquiry').textContent = 'Send another enquiry';
    } else {
      $('#draft-heading').textContent = 'Your enquiry is ready to review.';
      $('#draft-lede').textContent = 'We could not reach the team automatically. Open the draft in your email app and press Send instead.';
      $('#draft-preview').textContent = body;
      $('#draft-email-link').href = 'mailto:elenah@boussias.cy?subject=' + encodeURIComponent('AI in Marketing 2026 — conference enquiry') + '&body=' + encodeURIComponent(body);
      $('#draft-fallback').hidden = false;
      $('#draft-note').textContent = 'Nothing has been sent yet.';
      $('#edit-enquiry').textContent = 'Edit your details';
    }
    form.hidden = true;
    draft.hidden = false;
    $('#draft-heading').focus();
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const body = buildEnquiry(data);
    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    const sent = await sendEnquiry(data);
    submitButton.disabled = false;
    submitButton.innerHTML = submitLabel;
    showResult(sent, body);
  });

  $('#edit-enquiry').addEventListener('click', () => {
    if (sentLastTime) {
      form.reset();
      updateContactFields();
    }
    draft.hidden = true;
    form.hidden = false;
    $('#enquiry-first').focus();
  });
})();
