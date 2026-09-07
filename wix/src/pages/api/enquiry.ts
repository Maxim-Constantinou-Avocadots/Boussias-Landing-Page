import type { APIRoute } from 'astro';
import { auth } from '@wix/essentials';
import { submissions } from '@wix/forms';

// Schema seeded by the wix-headless setup run.
const FORM_ID = 'c822ac41-8a45-4d89-88bd-6167146a166f';

// The page's input names, mapped onto the seeded field targets.
const TARGETS: Record<string, string> = {
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  phone: 'phone',
  company: 'company',
  professionalTitle: 'position',
  sponsoring: 'sponsoring',
  attending: 'attending',
  contactMethod: 'contact_method',
  callbackTime: 'callback_time',
  eventUpdates: 'event_updates',
};

export const prerender = false;

function redirect(outcome: 'sent' | 'error') {
  // 303 so the browser re-issues a GET — refreshing won't resubmit the form.
  return new Response(null, {
    status: 303,
    headers: { Location: `/?enquiry=${outcome}#enquiry` },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const contentType = request.headers.get('content-type') ?? '';
  // A plain <form method="post"> sends form-encoded data and expects a redirect;
  // a fetch() caller sends JSON and expects JSON back.
  const isFormPost = contentType.includes('form');

  let raw: Record<string, unknown> = {};
  try {
    if (isFormPost) {
      const data = await request.formData();
      for (const [key, value] of data) raw[key] = value;
      // An unchecked checkbox is simply absent from the payload.
      raw.eventUpdates = data.has('eventUpdates');
    } else {
      raw = await request.json();
    }
  } catch {
    return isFormPost
      ? redirect('error')
      : new Response(JSON.stringify({ ok: false, error: 'bad_request' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
  }

  // Key by target and drop empties — an empty value is rejected before validation.
  const values: Record<string, unknown> = {};
  for (const [name, target] of Object.entries(TARGETS)) {
    const value = raw[name];
    if (value === undefined || value === null || value === '') continue;
    values[target] = target === 'event_updates' ? Boolean(value) : value;
  }

  try {
    // Positional args: createSubmission(submission, options) — not { submission }.
    const result = await submissions.createSubmission({
      formId: FORM_ID,
      submissions: values,
    });

    // Creating over the API yields PENDING, which is NOT recorded: it stays
    // invisible in the dashboard and is auto-deleted if it isn't confirmed in
    // time. Confirming is owner-only, so it runs elevated.
    let status = result.status;
    if (status !== 'CONFIRMED' && result._id) {
      const confirmSubmission = auth.elevate(submissions.confirmSubmission);
      const confirmed = await confirmSubmission(result._id);
      status = confirmed?.submission?.status ?? confirmed?.status ?? status;
    }

    if (status !== 'CONFIRMED') {
      console.error('[enquiry] submission not confirmed', { id: result._id, status });
      return isFormPost
        ? redirect('error')
        : new Response(JSON.stringify({ ok: false, error: 'not_confirmed', status }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
          });
    }

    console.log('[enquiry] confirmed', result._id);
    return isFormPost
      ? redirect('sent')
      : new Response(JSON.stringify({ ok: true, id: result._id, status }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
  } catch (error) {
    console.error('[enquiry] submission failed', error);
    return isFormPost
      ? redirect('error')
      : new Response(JSON.stringify({ ok: false, error: 'submit_failed' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
  }
};
