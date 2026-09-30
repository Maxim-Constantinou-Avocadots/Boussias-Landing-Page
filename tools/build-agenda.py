"""Build dist/agenda.html from the site's existing shell plus the agenda content.

Run from anywhere:  python3 tools/build-agenda.py
Then:               python3 wix/sync-from-dist.py

Content is reproduced verbatim from futureofmarketing.cy, including its errors,
because the page is meant to be diffable against the original. As published on
2026-09-30 those are: both of the last two sessions labelled "SESSION 2"; the
stray colon in "12:50:"; the unclosed quote opening the panel title; Session 1
headed 09:45-11:40 while its last talk runs to 11:45; a Greek capital tau
opening "Theodoros"; "SDK (TBC)" where the body above it is abbreviated ΣΔΕΚ;
and the panel listing both Andreas Hadjigeorgiou of Avocadots and a separate
"Representative from AVOCADOTS".
"""
import html
import pathlib
import re

D = pathlib.Path(__file__).resolve().parent.parent / 'dist'
src = (D / 'index.html').read_text(encoding='utf-8')

ARROW = ('<svg class="gi" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
         '<path d="M7 17 17 7"/><path d="M8.5 7H17v8.5"/></svg>')

def block(tag):
    a = src.find('<' + tag)
    b = src.find('</' + tag + '>') + len(tag) + 3
    return src[a:b]

header = block('header')
footer = block('footer')
i = src.find('<div class="mobile-ticket-bar">')
ticketbar = src[i:src.find('</div>\n', i) + 6]

# On a sub-page the nav's in-page anchors have to point back at the home page.
def home_anchors(markup):
    return re.sub(r'href="#(?!top")', 'href="index.html#', markup)

header = home_anchors(header).replace('href="#top"', 'href="index.html"')
footer = home_anchors(footer).replace('href="#top"', 'href="index.html"')

# Mark the current page in both navs.
header = header.replace(
    '<a href="agenda.html">Agenda</a>',
    '<a href="agenda.html" aria-current="page">Agenda</a>')

E = html.escape

def speakers(rows):
    """A person is a (name, role) pair; a bare string is a heading within the list
    (the panel slot uses "Panelists:" and "Moderator:")."""
    if not rows:
        return ''
    out = []
    for row in rows:
        if isinstance(row, str):
            out.append(f'<li class="agenda-people-label">{E(row)}</li>')
            continue
        name, role = row
        r = f' <span class="agenda-role">{E(role)}</span>' if role else ''
        out.append(f'<li><span class="agenda-name">{E(name)}</span>{r}</li>')
    return '<ul class="agenda-people">' + ''.join(out) + '</ul>'

def slot(time, track, title, people=(), index=0, block=False, flag=''):
    """One row. `block` marks it as a standalone card; `flag` is a sponsor badge."""
    brk = track == 'Networking'
    cls = 'agenda-slot' + (' is-break' if brk else '')
    if block:
        cls += ' agenda-block'
    t = 'agenda-track' + (' is-networking' if brk else '')
    badge = f'<span class="agenda-flag">{E(flag)}</span>' if flag else ''
    return (f'<li class="{cls}" style="--i:{index}">'
            f'<div class="agenda-when"><span class="agenda-time">{E(time)}</span>'
            f'<span class="{t}">{E(track)}</span>{badge}</div>'
            f'<div class="agenda-what"><h3>{E(title)}</h3>{speakers(people)}</div>'
            f'</li>')

def session(sid, label, time, track, title, slots):
    """`label` is the source's own wording, `sid` keeps the anchor unique — the
    source numbers its last two sessions identically, so the two cannot be one."""
    no = label.split()[-1]
    return (f'<section class="agenda-session agenda-block" aria-labelledby="s{sid}">'
            f'<div class="agenda-session-head" data-no="{E(no)}">'
            f'<span class="agenda-session-no">{E(label)}</span>'
            f'<h2 id="s{sid}">{E(title)}</h2>'
            f'<div class="agenda-when"><span class="agenda-time">{E(time)}</span>'
            f'<span class="agenda-track">{E(track)}</span></div>'
            f'</div><ol class="agenda-slots">' + ''.join(slots) + '</ol></section>')

def standalone(*rows):
    return '<ol class="agenda-slots agenda-standalone">' + ''.join(rows) + '</ol>'

opening = standalone(*[
    slot('09:00-09:30', 'Networking', 'Registration and Welcome Coffee', block=True),
    slot('09:30-09:45', 'On Stage', 'Welcoming Remarks', [
        ('Introduction Conference Moderator', ''),
        ('Maria Kyriakou,', 'CEO BOUSSIAS Cyprus'),
        ('Κώστας Ντάλτας,', 'Πρόεδρος, Σύνδεσμος Διαφήμισης-Επικοινωνίας Κύπρου (ΣΔΕΚ)'),
        ('Τheodoros Loukaidis', '– Director General, Research and Innovation Foundation'),
        ('SDK (TBC)', ''),
    ], block=True),
])

s1 = session(1, 'SESSION 1', '09:45 –  11:40', 'On Stage', 'THE NEW RULES OF MARKETING', [
    slot('09:45-10:20', 'On Stage',
         '“From Best Practice to Next Practice: Marketing Agility in the AI Era”',
         [('Crystal Carter,', 'Head of AI Search & SEO Communications, Wix')], index=0),
    slot('10:20 – 10:30', 'On Stage', '“Beyond Content: End-to-End AI Marketing”',
         [('Pantelis Vladimirou,', 'Co-Founder, Webarts Limited')], index=1,
         flag='GOLD SPONSOR'),
    slot('10:30 – 11:05', 'On Stage',
         '“Beyond Hello $Firstname – The Real Meaning of Personalization and How AI Helps Scale It”',
         [('Rasmus Houlind,', 'Author of Hello $Firstname and CXO, Agillic')], index=2),
    slot('11:05 – 11:20', 'On Stage', '“Topic TBC”',
         [('Tasos Antoniades', 'Lecturer in Artificial Intelligence and Machine Learning, Neapolis University Pafos')],
         index=3),
    slot('11:20 – 11:45', 'On Stage',
         '“Don’t Be Romantic About the Past – marketeers are built for what comes next”',
         [('Oliver Yonchev,', 'Speaker & Founder, cocreatd – Co-founder, Potentially')], index=4),
])

brk = standalone(slot('11:45-12:30', 'Networking', 'Coffee Break – Networking', block=True))

s2 = session(2, 'SESSION 2', '12:30 –  13:25', 'On Stage',
             'FROM AI EXPERIMENTS TO BUSINESS IMPACT & TRUST', [
    slot('12:30 – 12:50', 'On Stage',
         '“PANEL DISCUSSION: “AI in Marketing: Efficiency vs. Creativity – Finding the Right Balance”',
         ['Panelists:',
          ('Tasos Antoniades', '– Lecturer in Artificial Intelligence and Machine Learning, Neapolis University Pafos'),
          ('Andreas Hadjigeorgiou', '– Founder & CEO, Avocadots'),
          ('Maria Odysseos', '– Marketing Manager, KEAN'),
          ('Representative from AVOCADOTS', ''),
          'Moderator:',
          ('Eliza Soufli – Conference Producer & Hostess', '')], index=0),
    slot('12:50: – 13:25', 'On Stage',
         '“From AI Experiments to Measurable ROI: What It Actually Takes to Make AI Pay Off in Marketing”',
         [('Valeriya Pilkevic,', 'Founder, AI Made Simple')], index=1),
])

# The source labels this one "SESSION 2" as well; reproduced as published.
s3 = session(3, 'SESSION 2', '13:25 – 14:30', 'On Stage',
             'TRUST, CREATIVITY & THE HUMAN ADVANTAGE', [
    slot('13:25 – 14:00', 'On Stage',
         '“The Trust Dividend: How Ethical AI Outperforms Creepy Marketing Every Time”',
         [('Gilbert Hill,', 'Privacy Technologist & Commissioner, UK Data & Marketing Regulator')], index=0),
    slot('14:00 – 14:25', 'On Stage',
         'IN CONVERSATION: “The algorithm made me do it”',
         [('Tina Marinaki,', 'Architect & Creator, Athens Surreal'),
          ('Eliza Soufli,', 'Conference Producer & Hostess')], index=1),
    slot('14:25 – 14:30', 'On Stage', 'Closing Remarks', index=2),
])

TICKET = ('https://www.eventora.com/en/Events/Cyprus-AI-Marketing-2026#TICKETS')

page = f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Agenda | AI in Marketing Conference 2026 | BOUSSIAS Cyprus</title>
  <meta name="description" content="The full agenda for AI in Marketing 2026 — three sessions across AI discovery and personalization, trust and ROI, and human creativity. 15 October 2026, 360 Tower Nicosia.">
  <meta name="theme-color" content="#081c42">
  <meta property="og:title" content="Agenda | AI in Marketing Conference 2026">
  <meta property="og:description" content="From AI Hype to Marketing Results — the full conference agenda for 15 October 2026 at 360 Tower, Nicosia.">
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="fonts.css"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="experience.css"><link rel="stylesheet" href="content.css"><link rel="stylesheet" href="agenda.css">
  <script src="app.js" defer></script><script src="agenda.js" defer></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<div class="reading-progress" aria-hidden="true"><span></span></div>
{header}
<main id="main">
  <section class="agenda-hero">
    <div class="agenda-hero-glow" aria-hidden="true"></div>
    <div class="wrap agenda-hero-grid">
      <div class="agenda-hero-copy">
        <div class="eyebrow light rise" style="--i:0">A.I. IN MARKETING / 360 TOWER, NICOSIA</div>
        <h1 class="rise" style="--i:1"><span>Agenda</span></h1>
        <p class="agenda-lede rise" style="--i:2">From AI Hype to Marketing Results</p>
        <p class="agenda-date rise" style="--i:3">October 15th, 2026</p>
        <a class="button button-white rise" style="--i:4" data-ticket href="{TICKET}" target="_blank" rel="noopener">Book your ticket now {ARROW}</a>
      </div>
      <div class="agenda-art" aria-hidden="true"><div class="daystrip"><div class="daystrip-head"><span>ONE DAY</span><span>15 OCT 2026</span></div><ol class="daystrip-rows"><li class="daystrip-row is-break" style="--i:0"><span class="daystrip-time">09:00</span><span class="daystrip-label">Registration</span></li><li class="daystrip-row" style="--i:1"><span class="daystrip-time">09:30</span><span class="daystrip-label">Welcoming Remarks</span></li><li class="daystrip-row is-lead" style="--i:2"><span class="daystrip-time">09:45</span><span class="daystrip-label">The New Rules of Marketing</span></li><li class="daystrip-row is-break" style="--i:3"><span class="daystrip-time">11:45</span><span class="daystrip-label">Coffee Break</span></li><li class="daystrip-row is-lead" style="--i:4"><span class="daystrip-time">12:30</span><span class="daystrip-label">From AI Experiments to Business Impact &amp; Trust</span></li><li class="daystrip-row is-lead" style="--i:5"><span class="daystrip-time">13:25</span><span class="daystrip-label">Trust, Creativity &amp; the Human Advantage</span></li><li class="daystrip-row" style="--i:6"><span class="daystrip-time">14:25</span><span class="daystrip-label">Closing Remarks</span></li></ol><div class="daystrip-beam"></div></div></div>
    </div>
  </section>
  <section class="agenda-section">
    <div class="wrap">
      <div class="agenda-intro">
        <span class="section-label">THE DAY</span>
        <h2>Hour by hour</h2>
        <p>Three sessions, two networking breaks and a full stage programme. Times and titles are as published by the organiser.</p>
        <ul class="agenda-meta">
          <li><span class="agenda-meta-k">09:00 — 14:30</span><span class="agenda-meta-v">Doors to close</span></li>
          <li><span class="agenda-meta-k">3</span><span class="agenda-meta-v">Stage sessions</span></li>
          <li><span class="agenda-meta-k">2</span><span class="agenda-meta-v">Networking breaks</span></li>
        </ul>
      </div>
      <div class="agenda-timeline">
        {opening}
        {s1}
        {brk}
        {s2}
        {s3}
      </div>
      <div class="agenda-foot">
        <p>Agenda subject to change. Speakers and sessions are confirmed on the conference page.</p>
        <div class="agenda-foot-actions">
          <a class="button button-blue" data-ticket href="{TICKET}" target="_blank" rel="noopener">Book your ticket now {ARROW}</a>
          <a class="button button-ghost" href="index.html#speakers">Discover the speakers {ARROW}</a>
        </div>
      </div>
    </div>
  </section>
</main>
{footer}
{ticketbar}
</body>
</html>
'''

(D / 'agenda.html').write_text(page, encoding='utf-8')
print('wrote dist/agenda.html —', len(page), 'bytes')
print('sessions:', page.count('class="agenda-session '),
      '| slots:', len(re.findall(r'class="agenda-slot[ "]', page)),
      '| blocks:', page.count('agenda-block'))
