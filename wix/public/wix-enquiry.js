'use strict';
// Sends the enquiry to Wix Forms in addition to the existing reviewable email draft.
// Purely additive: content.js still owns validation and the draft panel, so the page
// looks and behaves exactly as before. If Wix is unreachable the draft still works.
(() => {
  const form = document.querySelector('#enquiry-form');
  if (!form) return;

  form.addEventListener('submit', () => {
    if (!form.checkValidity()) return;

    const data = new FormData(form);
    const payload = {};
    for (const [name, value] of data) payload[name] = value;
    payload.eventUpdates = data.has('eventUpdates');

    // Fire-and-forget: the visitor's confirmation is the draft panel content.js shows,
    // so a slow or failed Wix call must never block or alter that.
    fetch('/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  });
})();
