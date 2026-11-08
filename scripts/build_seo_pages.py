#!/usr/bin/env python3
"""Builds the static SEO landing pages, sitemap.xml and robots.txt.

The app itself (index.html) uses hash routes, which Google does not index as
separate pages. These plain HTML pages give each kind of invitation its own
crawlable URL, title, description and structured data, and link into the app.

Run from the repo root:  python3 scripts/build_seo_pages.py
Edit the PAGES list below, then run it again and commit the output.
"""
import html
import json
import os
from datetime import date

SITE = "https://www.aradhanawa.com"
WA = "94764487857"
PRICE_PLUS = "Rs. 990"
PRICE_CUSTOM = "Rs. 4,900"
FREE_GUESTS = 5
TODAY = date.today().isoformat()

PAGES = [
    dict(
        slug="wedding-invitations", type="wedding", img="poruwa-couple",
        nav="Wedding",
        title="Digital Wedding Invitations Sri Lanka | Aradhanawa",
        desc="Send Sri Lankan wedding invitations on WhatsApp. Poruwa nekath time, venue map, countdown and RSVP in Sinhala, Singlish or English. Free for 5 guests.",
        si="විවාහ ආරාධනා පත්‍ර",
        h1="Wedding invitations your guests open on WhatsApp",
        lead="A wedding card that becomes a small website: the couple's names, the poruwa ceremony nekath time, the reception venue with a Google Maps pin, a countdown and an RSVP button. Every guest gets a link with their own name on it.",
        features=[
            ("Poruwa and nekath time", "Show the auspicious time for the poruwa ceremony, the church or temple ceremony and the reception, each in its place."),
            ("Both families named", "Add the groom's and the bride's parents, exactly the way a printed Sri Lankan wedding card reads."),
            ("Sinhala, Singlish or English", "Write the card in the language your relatives read. The guest sees Sinhala script that renders properly on any phone."),
            ("RSVP on WhatsApp", "Guests reply with how many are coming, and the answer lands straight in your WhatsApp."),
            ("Jayamangala Gatha music", "An optional soft Jayamangala Gatha plays while the card opens."),
            ("Designs drawn for Sri Lanka", "Poruwa Royal, Kandyan Gold, Galle Fort Sunset and more, made for Sri Lankan weddings."),
        ],
        si_block="ඔබේ විවාහ මංගල්‍යයට ආරාධනා පත්‍රය WhatsApp හරහා යවන්න. පෝරුවේ නැකත් වේලාව, ශාලාවේ සිතියම, ගණන් කිරීමේ ඔරලෝසුව සහ RSVP එකම ලින්ක් එකක. හැම අමුත්තෙකුටම තමන්ගේ නම සහිත ආරාධනාවක්.",
        faq=[
            ("Can I add the nekath time for the poruwa ceremony?", "Yes. The wedding form has a separate field for the poruwa ceremony nekath time, plus the church or temple ceremony and the reception time."),
            ("Will older relatives be able to open it?", "The link opens in the phone's browser straight from WhatsApp. There is nothing to install and no account needed to view it."),
            ("Can I still print cards for a few people?", "Yes. Many couples send the digital card to most guests and print a small number for elders. A custom design can be prepared for print as well."),
        ],
    ),
    dict(
        slug="homecoming-invitations", type="homecoming", img="th-sage-hero",
        nav="Homecoming",
        title="Homecoming Invitations Sri Lanka, WhatsApp E-Cards | Aradhanawa",
        desc="Digital homecoming invitations for Sri Lankan couples. Send on WhatsApp with venue map, time, countdown and RSVP. Sinhala, Singlish or English. Free for 5 guests.",
        si="හෝම්කමිං ආරාධනා පත්‍ර",
        h1="Homecoming invitations, sent in a minute",
        lead="The homecoming is often a few weeks after the wedding, with a guest list of its own. Make the card, send personal links on WhatsApp and see who is coming without a single phone call.",
        features=[
            ("Separate guest list", "Invite the groom's side for the homecoming without resending the wedding card."),
            ("Venue with a map pin", "Add the hotel or the family home with a Google Maps link so nobody gets lost."),
            ("Evening or day function", "Set the time, add a dress code or a note about dinner."),
            ("RSVP on WhatsApp", "Guests confirm with one tap and the reply comes to your WhatsApp."),
            ("Matches your wedding card", "Use the same design family as your wedding invitation, or pick Tea Country or Bentota Beach."),
            ("Personal for every guest", "Each link opens with the guest's name, for example 'Dear Nimal Uncle'."),
        ],
        si_block="හෝම්කමිං උත්සවයට ආරාධනා කරන්න WhatsApp ලින්ක් එකකින්. වේලාව, ශාලාව, සිතියම සහ RSVP එකම තැනක. අමුත්තන් කී දෙනෙක් එනවද කියලා ඔබට WhatsApp එකෙන්ම දැනගන්න පුළුවන්.",
        faq=[
            ("Can I make the homecoming card separately from the wedding card?", "Yes. Homecoming is its own event type with its own details and guest list."),
            ("Is the homecoming card free?", f"One design and {FREE_GUESTS} personal guest links are free. Plus ({PRICE_PLUS} per event) gives unlimited guests and a list of who is coming."),
            ("Can I write the card in Sinhala?", "Yes. You can write in Sinhala, Singlish or English, and switch at any time before sending."),
        ],
    ),
    dict(
        slug="engagement-invitations", type="other", img="ivory-couple",
        nav="Engagement",
        title="Engagement Invitations Sri Lanka, Digital Cards on WhatsApp | Aradhanawa",
        desc="Create an engagement ceremony invitation for WhatsApp. Families' names, date, time, venue map and RSVP, in Sinhala or English. Free for 5 guests.",
        si="විවාහ ගිවිසගැනීමේ ආරාධනා",
        h1="Engagement invitations for the families",
        lead="An engagement is usually close family and friends, and the invitation goes out fast. Put both families' names, the date, the time and the venue on one link and send it on WhatsApp the same day.",
        features=[
            ("Made for a small guest list", f"The first {FREE_GUESTS} personal links cost nothing, which covers many family engagements."),
            ("Families, date and venue", "Name the hosting family, add the time and a Google Maps pin for the house or hotel."),
            ("Sinhala, Singlish or English", "Write the invitation the way your family speaks."),
            ("RSVP on WhatsApp", "Know who is coming before you order the food."),
            ("Elegant designs", "Kandyan Gold, Perahera Night and a classic ivory card."),
            ("No app to install", "Guests open the card in their phone's browser from WhatsApp."),
        ],
        si_block="විවාහ ගිවිසගැනීමේ උත්සවයට පවුලේ අයට සහ යාළුවන්ට ආරාධනා කරන්න. දිනය, වේලාව, ස්ථානය සහ සිතියම WhatsApp ලින්ක් එකක.",
        faq=[
            ("Which event type do I choose for an engagement?", "Choose 'Other function' in the app and set the function name to Engagement Ceremony. All the same features work."),
            ("Can I send it on Viber or Messenger too?", "Yes. The invitation is a normal link, so you can paste it into any app. WhatsApp sending is built in."),
            ("Can I use the same design for the wedding later?", "Yes. Wedding designs come in matching families, so the engagement and wedding cards can look related."),
        ],
    ),
    dict(
        slug="birthday-invitations", type="birthday", img="birthday-table",
        nav="Birthday",
        title="Birthday Invitations Sri Lanka, Kids' Party E-Cards | Aradhanawa",
        desc="Sri Lankan birthday invitations for WhatsApp. Name, age, time, venue map and RSVP, with fun designs for kids and adults. Sinhala, Singlish or English. Free.",
        si="උපන්දින ආරාධනා පත්‍ර",
        h1="Birthday invitations the kids will love",
        lead="From a first birthday with kiribath to a fortieth with friends. Add the name and age, the time and the place, and send a bright birthday card to every parent's WhatsApp.",
        features=[
            ("Name and age on the card", "'Senuli turns 5' shows big on the card, with a countdown to the day."),
            ("Home or hall", "Add the house address or the hall with a Google Maps link."),
            ("Notes for parents", "Mention kiribath, cake, games or a drop-off time in the extra note."),
            ("RSVP on WhatsApp", "Parents reply with how many kids are coming."),
            ("Fun designs", "Kiribath Table, Tuk-tuk Ride, Pastel Balloons and more."),
            ("Happy birthday music", "An optional birthday tune plays when the card opens."),
        ],
        si_block="දරුවාගේ උපන්දින සාදයට ආරාධනා පත්‍රයක් විනාඩියකින් හදලා WhatsApp කරන්න. නම, වයස, වේලාව, ස්ථානය සහ RSVP එකම ලින්ක් එකක.",
        faq=[
            ("Is it suitable for a kid's birthday party?", "Yes. Most birthday cards on Aradhanawa are for children's parties, with bright designs and a countdown."),
            ("How many guests can I invite for free?", f"{FREE_GUESTS} personal links are free. For a whole class, Plus ({PRICE_PLUS}) gives unlimited guests for that event."),
            ("Can I change the time after sending?", "Yes. Update the details and send the link again. Guests always see the latest version."),
        ],
    ),
    dict(
        slug="party-invitations", type="party", img="vesak-lanterns",
        nav="Party",
        title="Party Invitations Sri Lanka, Reunions & Get-togethers | Aradhanawa",
        desc="Digital party invitations for batch reunions, office parties and get-togethers in Sri Lanka. Venue map, dress code and RSVP on WhatsApp. Free for 5 guests.",
        si="සාද ආරාධනා පත්‍ර",
        h1="Party invitations for reunions, office nights and get-togethers",
        lead="A batch reunion, a farewell, an office party or a Vesak night. Give it a name, add the venue, the dress code and the time, and drop one link into the WhatsApp group or send personal ones.",
        features=[
            ("Party name and host", "'Batch Reunion 2026, hosted by the Royal College 2010 batch' reads right at the top."),
            ("Dress code", "Smart casual, white, or a theme. It shows clearly on the card."),
            ("Venue with a map pin", "The hotel or the beach spot, one tap away in Google Maps."),
            ("RSVP on WhatsApp", "Get a head count for the buffet before you book."),
            ("Night-time designs", "Vesak Lanterns, Colombo Streets, Midnight Gold and more."),
            ("Group or personal links", "Share one link in a group chat, or send each guest a link with their name."),
        ],
        si_block="බැච් රියූනියන්, ඔෆිස් පාටි, විශේෂ සාද වලට ආරාධනා WhatsApp හරහා. ස්ථානය, ඇඳුම් ක්‍රමය, වේලාව සහ RSVP එකම ලින්ක් එකක.",
        faq=[
            ("Can I share one link in a WhatsApp group?", "Yes. You can share a general link in a group, or send personal links so each guest sees their own name."),
            ("Can I add a dress code?", "Yes. The party form has a dress code field that shows on the card."),
            ("How do I see who is coming?", f"Guests reply on WhatsApp. With Plus ({PRICE_PLUS} per event) you also get a list of who is coming in your account."),
        ],
    ),
    dict(
        slug="dana-invitations", type="dana", img="card-flatlay",
        nav="Dana",
        title="Dana & Almsgiving Invitations Sri Lanka, Pinkama Cards | Aradhanawa",
        desc="Invite family to a dana, almsgiving or pinkama on WhatsApp. Temple or home, date, time, map and an 'in memory of' line, in Sinhala or English. Free for 5 guests.",
        si="දාන ආරාධනා පත්‍ර",
        h1="Dana and almsgiving invitations, calm and respectful",
        lead="A sanghika dana, a seven-day or three-month dana, or a pinkama at the temple. Add the family's name, an optional 'in memory of' line, the place and the time, and let relatives know on WhatsApp.",
        features=[
            ("In memory of", "An optional line to remember the person the dana is offered for."),
            ("Temple or home", "Add the temple or the house with a Google Maps link for relatives coming from far away."),
            ("Sinhala first", "Write the whole invitation in Sinhala so elders read it easily."),
            ("Quiet designs", "Pahana, Bodhi Leaf and Dagaba White, in soft colours that suit the occasion."),
            ("RSVP on WhatsApp", "Know how many are coming so the dana can be prepared."),
            ("No music by default", "The card stays silent unless you choose otherwise."),
        ],
        si_block="සාංඝික දානය, සත්දින දානය, තෙමසේ දානය හෝ පින්කමකට ඥාතීන්ට ආරාධනා කරන්න WhatsApp හරහා. පවුලේ නම, සිහිවීම සඳහා නම, පන්සල හෝ නිවස, වේලාව සහ සිතියම එකම ලින්ක් එකක.",
        faq=[
            ("Can I write the dana invitation fully in Sinhala?", "Yes. Choose Sinhala and the card, the buttons and the RSVP all show in Sinhala."),
            ("Can I add the name of the person the dana is in memory of?", "Yes. There is an optional 'In memory of' field on the almsgiving form."),
            ("Is it free?", f"One design and {FREE_GUESTS} personal links are free. Plus ({PRICE_PLUS} per event) covers unlimited relatives."),
        ],
    ),
]

FONTS = "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@1,600&family=Noto+Sans+Sinhala:wght@400..700&display=swap"

LOTUS = ('<svg class="wm-ic" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor"/>'
         '<g fill="#EBD29A" stroke="currentColor" stroke-width=".9">'
         + "".join(f'<path transform="rotate({i*45} 20 20)" d="M20 17C17.5 13.5 18 9 20 6C22 9 22.5 13.5 20 17Z"/>' for i in range(8))
         + '</g><circle cx="20" cy="20" r="3" fill="currentColor"/></svg>')

e = html.escape


def wa_link(text):
    from urllib.parse import quote
    return f"https://wa.me/{WA}?text={quote(text)}"


def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + "</script>"


ICONS = """<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/img/icons/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">"""

LEGAL_LINKS = '<a href="/terms">Terms</a><a href="/privacy">Privacy</a><a href="/refunds">Refunds</a>'


def footer():
    return f"""<footer class="foot"><div class="in">
  <a class="wm" href="/">{LOTUS}<b>Aradhanawa</b></a>
  <nav aria-label="Footer">{''.join(f'<a href="/{q["slug"]}">{e(q["nav"])}</a>' for q in PAGES)}<a href="/#pricing">Pricing</a>{LEGAL_LINKS}</nav>
  <p>Sri Lankan digital invitations · WhatsApp <a href="{wa_link('Hi Aradhanawa!')}" target="_blank" rel="noopener">+94 76 448 7857</a></p>
</div></footer>"""


def header(cta="/#create"):
    return f"""<header class="nav"><div class="in">
  <a class="wm" href="/" aria-label="Aradhanawa home">{LOTUS}<b>Aradhanawa</b><span lang="si">ආරාධනාව</span></a>
  <nav aria-label="Main"><a href="/#designs">Designs</a><a href="/#pricing">Pricing</a><a class="btn sm" href="{cta}">Create free</a></nav>
</div></header>"""


def page(p):
    url = f"{SITE}/{p['slug']}"
    create = f"/#create/{p['type']}"
    img = f"{SITE}/img/og/{p['img']}.jpg"   # JPG 1200x630: WhatsApp and Facebook link previews don't reliably show WebP
    others = [q for q in PAGES if q is not p]
    schema = [
        {"@context": "https://schema.org", "@type": "Service", "name": p["title"].split(" | ")[0],
         "serviceType": "Digital invitation", "areaServed": {"@type": "Country", "name": "Sri Lanka"},
         "provider": {"@type": "Organization", "name": "Aradhanawa", "url": SITE + "/"},
         "url": url, "description": p["desc"], "image": img,
         "offers": [{"@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "LKR",
                     "description": f"One design and {FREE_GUESTS} personal guest links"},
                    {"@type": "Offer", "name": "Plus", "price": PRICE_PLUS.replace("Rs. ", "").replace(",", ""),
                     "priceCurrency": "LKR", "description": "Unlimited guests for one event"}]},
        {"@context": "https://schema.org", "@type": "FAQPage",
         "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in p["faq"]]},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Aradhanawa", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": p["nav"] + " invitations", "item": url}]},
    ]
    feats = "".join(f'<li><h3>{e(t)}</h3><p>{e(d)}</p></li>' for t, d in p["features"])
    faq = "".join(f'<details><summary>{e(q)}</summary><p>{e(a)}</p></details>' for q, a in p["faq"])
    more = "".join(f'<a href="/{q["slug"]}"><b>{e(q["nav"])} invitations</b><span lang="si">{e(q["si"])}</span></a>' for q in others)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(p['title'])}</title>
<meta name="description" content="{e(p['desc'])}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#FFF3E3">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Aradhanawa">
<meta property="og:title" content="{e(p['title'])}">
<meta property="og:description" content="{e(p['desc'])}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{img}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_LK">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="/seo.css">
{ICONS}
{''.join(ld(s) for s in schema)}
</head>
<body>
{header(create)}
<main>
  <section class="hero"><div class="in">
    <div class="copy">
      <nav class="crumb" aria-label="Breadcrumb"><a href="/">Home</a> / <span>{e(p['nav'])} invitations</span></nav>
      <p class="eyebrow" lang="si">{e(p['si'])}</p>
      <h1>{e(p['h1'])}</h1>
      <p class="lead">{e(p['lead'])}</p>
      <div class="cta"><a class="btn" href="{create}">Create your {e(p['nav'].lower())} invitation, free</a><a class="link" href="/#designs">See the designs</a></div>
      <p class="note">Free for {FREE_GUESTS} guests. No app to install.</p>
    </div>
    <figure class="pic"><img src="/img/{p['img']}-960.webp" srcset="/img/{p['img']}-480.webp 480w, /img/{p['img']}-960.webp 960w" sizes="(max-width:820px) 100vw, 46vw" width="960" height="720" alt="{e(p['nav'])} invitation design from Aradhanawa" fetchpriority="high"></figure>
  </div></section>

  <section class="band"><div class="in">
    <h2>What your guests <em>get</em></h2>
    <ul class="feats">{feats}</ul>
  </div></section>

  <section class="band steps"><div class="in">
    <h2>Three steps, about two <em>minutes</em></h2>
    <ol><li><b>Fill in the details</b><span>Names, date, time and venue. Pick Sinhala, Singlish or English.</span></li>
    <li><b>Choose a design</b><span>Every function has a free design. Custom designs are {PRICE_CUSTOM}.</span></li>
    <li><b>Send on WhatsApp</b><span>Each guest gets a personal link. Replies come back to your WhatsApp.</span></li></ol>
  </div></section>

  <section class="band si" lang="si"><div class="in">
    <h2>{e(p['si'])}</h2>
    <p>{e(p['si_block'])}</p>
  </div></section>

  <section class="band"><div class="in narrow">
    <h2>Questions</h2>
    <div class="faq">{faq}
      <details><summary>How much does it cost?</summary><p>One design and {FREE_GUESTS} personal guest links are free for every function. Plus is {PRICE_PLUS} per event for unlimited guests, a list of who is coming and no Aradhanawa name on the card. A custom design is {PRICE_CUSTOM}.</p></details>
    </div>
  </div></section>

  <section class="band end"><div class="in">
    <h2>Ready when you <em>are</em></h2>
    <div class="cta"><a class="btn" href="{create}">Create your invitation</a><a class="link" href="{e(wa_link('Hi Aradhanawa! I have a question about ' + p['nav'].lower() + ' invitations.'))}" target="_blank" rel="noopener">Ask us on WhatsApp</a></div>
  </div></section>

  <section class="band"><div class="in">
    <h2 class="sm">Other invitations</h2>
    <div class="more">{more}</div>
  </div></section>
</main>
{footer()}
</body>
</html>
"""


# ---------------------------------------------------------------- legal pages + 404
# Plain-language drafts. Read them before relying on them, and change anything that does not match how you work.
UPDATED = "8 November 2026"
CONTACT = f'<a href="{wa_link("Hi Aradhanawa!")}" target="_blank" rel="noopener">WhatsApp +94 76 448 7857</a>'

LEGAL = [
    dict(slug="terms", title="Terms of use | Aradhanawa", h1="Terms of use",
         desc="The terms for using Aradhanawa digital invitations: accounts, your content, payments and guest links.",
         body=f"""
<p>These terms apply when you use aradhanawa.com to make and send digital invitations. By creating an account or an invitation you agree to them. If you do not agree, please do not use the site.</p>
<h2>1. The service</h2>
<p>Aradhanawa lets you make an invitation for a wedding, homecoming, engagement, birthday, party or dana and send each guest a personal link, usually on WhatsApp. Each function gets one free design and {FREE_GUESTS} free personal guest links. Paid options are listed on the <a href="/#pricing">pricing page</a>.</p>
<h2>2. Your account</h2>
<p>You need an account to create an invitation. Give a real name and a working email or Google account, keep your password private, and tell us quickly if you think someone else is using your account. You must be at least 18, or have a parent's or guardian's permission.</p>
<h2>3. Your content</h2>
<p>You own the names, wording, photos and other details you add. You give us permission to store them and show them to the people you send links to, only so the invitation works. You confirm that you have the right to use any photo you upload, and that your invitation is not unlawful, hateful, misleading or someone else's private information shared without permission. We may remove content or close an account that breaks these rules.</p>
<h2>4. Guest links</h2>
<p>Anyone who has a guest link can open that invitation, so share links only with the people you mean to invite. Guests do not need an account. Replies a guest sends (RSVP) are passed to you.</p>
<h2>5. Prices and payment</h2>
<p>Prices are shown in Sri Lankan rupees before you pay. Online payments are handled by Dialog Genie Business; we never see or store your card number. Plus covers one function. A custom design is started after payment and is delivered as described on the pricing page. Refunds follow our <a href="/refunds">refund policy</a>.</p>
<h2>6. Availability</h2>
<p>We work hard to keep the site and your links online, but we cannot promise it will never be down or that nothing will go wrong. Please keep your own copy of important details (date, time, venue) and check your invitation before you send it.</p>
<h2>7. Limits on our responsibility</h2>
<p>To the extent the law allows, Aradhanawa is not responsible for indirect losses, such as a guest who does not see a message, and our total responsibility for a paid order is limited to the amount you paid for it. Nothing in these terms takes away rights you have under Sri Lankan consumer law.</p>
<h2>8. Changes</h2>
<p>We may update these terms. The date at the top shows the latest version. If a change is important we will tell you on the site.</p>
<h2>9. Law</h2>
<p>These terms are governed by the laws of Sri Lanka.</p>
<h2>Contact</h2>
<p>Questions about these terms: {CONTACT}.</p>
"""),
    dict(slug="privacy", title="Privacy policy | Aradhanawa", h1="Privacy policy",
         desc="What Aradhanawa collects when you make or open a digital invitation, why, who it is shared with and how to delete it.",
         body=f"""
<p>This policy explains what personal information aradhanawa.com collects, why, and what you can do about it. We follow the Personal Data Protection Act, No. 9 of 2022, of Sri Lanka.</p>
<h2>What we collect</h2>
<ul>
<li><b>Your account:</b> name, email address, WhatsApp number if you give it, and your Google profile photo if you log in with Google. Passwords are handled by Google Firebase Authentication; we never see them.</li>
<li><b>Your invitations:</b> the event details you type (names, date, time, venue, messages), the guest names you add and any photos you upload to the gallery.</li>
<li><b>Guest replies:</b> when a guest RSVPs we store their name, whether they are coming, how many people and any message.</li>
<li><b>Orders and payments:</b> what you bought, the amount and the payment status. Card details go straight to Dialog Genie Business and are not stored by us.</li>
<li><b>Basic technical data:</b> our server keeps short-lived logs (IP address, browser, pages requested) to keep the site secure and working.</li>
</ul>
<h2>Why we use it</h2>
<p>To run your account, show your invitation to the guests you send it to, pass guest replies to you, take payments, answer your questions, and keep the service safe. We do not sell your information and we do not use it for advertising.</p>
<h2>Who can see it</h2>
<ul>
<li><b>Your guests:</b> anyone with a guest link can see that invitation and its gallery photos. They cannot see your guest list or other guests' replies.</li>
<li><b>Service providers:</b> Google Firebase (login and database), DigitalOcean (web hosting), Dialog Genie Business (payments), and Google Fonts and Google Maps (fonts and venue maps on the page). Some of these may store data outside Sri Lanka.</li>
<li><b>The law:</b> if we are required to by law.</li>
</ul>
<h2>How long we keep it</h2>
<p>We keep your account and invitations until you delete them or ask us to. Order records are kept as long as needed for accounting. Server logs are deleted within a few weeks.</p>
<h2>Your choices</h2>
<p>You can edit or delete an invitation from your account at any time. To get a copy of your information, correct it, or delete your account and everything in it, message us at {CONTACT} and we will do it within 30 days.</p>
<h2>Children</h2>
<p>The site is meant for adults. A child's name may appear on an invitation (for example a birthday) only when a parent or guardian creates it.</p>
<h2>Cookies and storage</h2>
<p>We use your browser's storage to keep you logged in and remember your draft invitation. We do not use advertising cookies.</p>
<h2>Changes</h2>
<p>If we change this policy we will update the date at the top.</p>
<h2>Contact</h2>
<p>Privacy questions or requests: {CONTACT}.</p>
"""),
    dict(slug="refunds", title="Refund policy | Aradhanawa", h1="Refund policy",
         desc="When Aradhanawa refunds a Plus or custom design payment, and how to ask for one.",
         body=f"""
<p>We want you to be happy with your invitation. This page explains when we give your money back.</p>
<h2>Aradhanawa Plus ({PRICE_PLUS} per function)</h2>
<p>If Plus does not work for you, ask within 7 days of paying and before the function date, and we will refund it in full. After the function has taken place, Plus is not refundable.</p>
<h2>Custom design ({PRICE_CUSTOM})</h2>
<ul>
<li>Before we start work on your design: full refund.</li>
<li>After we have sent the first version: 50% refund, if you decide not to go ahead.</li>
<li>After you have approved the final design: no refund.</li>
</ul>
<h2>Payment problems</h2>
<p>If you were charged twice, or charged but your order did not go through, we will refund the extra payment in full as soon as we confirm it.</p>
<h2>How to ask</h2>
<p>Message us at {CONTACT} with the email on your account and the date you paid. Approved refunds go back to the card or account you paid with, normally within 7 to 14 working days, depending on your bank.</p>
"""),
]


def simple_page(slug, title, desc, h1, body, noindex=False, canonical=True):
    url = f"{SITE}/{slug}"
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
{'<meta name="robots" content="noindex">' if noindex else ''}{f'<link rel="canonical" href="{url}">' if canonical else ''}
<meta name="theme-color" content="#FFF3E3">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="/seo.css">
{ICONS}
</head>
<body>
{header()}
<main>
{body}
</main>
{footer()}
</body>
</html>
"""


def legal_page(d):
    body = f"""  <article class="band doc"><div class="in narrow">
    <nav class="crumb" aria-label="Breadcrumb"><a href="/">Home</a> / <span>{e(d['h1'])}</span></nav>
    <h1>{e(d['h1'])}</h1>
    <p class="note">Last updated {UPDATED}</p>
{d['body']}
  </div></article>"""
    return simple_page(d["slug"], d["title"], d["desc"], d["h1"], body)


def not_found_page():
    more = "".join(f'<a href="/{q["slug"]}"><b>{e(q["nav"])} invitations</b><span lang="si">{e(q["si"])}</span></a>' for q in PAGES)
    body = f"""  <section class="hero lost"><div class="in narrow">
    <p class="eyebrow" lang="si">පිටුව හමු නොවීය</p>
    <h1>This page is not <em>here</em></h1>
    <p class="lead">The link may be old or mistyped. If someone sent you an invitation, ask them to send the link again.</p>
    <div class="cta"><a class="btn" href="/">Go to the home page</a><a class="link" href="{e(wa_link('Hi Aradhanawa! A link did not open for me.'))}" target="_blank" rel="noopener">Ask us on WhatsApp</a></div>
  </div></section>
  <section class="band"><div class="in">
    <h2 class="sm">Make an invitation</h2>
    <div class="more">{more}</div>
  </div></section>"""
    # Served at any missing URL, so links must be absolute (they are) and there is no canonical.
    return simple_page("404", "Page not found | Aradhanawa", "This page could not be found.", "Page not found", body, noindex=True, canonical=False)


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for p in PAGES:
        d = os.path.join(root, p["slug"])
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
            f.write(page(p))
    for d in LEGAL:
        os.makedirs(os.path.join(root, d["slug"]), exist_ok=True)
        with open(os.path.join(root, d["slug"], "index.html"), "w", encoding="utf-8") as f:
            f.write(legal_page(d))
    with open(os.path.join(root, "404.html"), "w", encoding="utf-8") as f:
        f.write(not_found_page())
    with open(os.path.join(root, "site.webmanifest"), "w", encoding="utf-8") as f:
        json.dump({"name": "Aradhanawa", "short_name": "Aradhanawa", "start_url": "/", "display": "standalone",
                   "background_color": "#FFF3E3", "theme_color": "#FFF3E3",
                   "icons": [{"src": "/img/icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
                             {"src": "/img/icons/icon-512.png", "sizes": "512x512", "type": "image/png"}]}, f, indent=2)
        f.write("\n")
    urls = ([(SITE + "/", "1.0")] + [(f"{SITE}/{p['slug']}", "0.8") for p in PAGES]
            + [(f"{SITE}/{d['slug']}", "0.3") for d in LEGAL])
    with open(os.path.join(root, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for u, pr in urls:
            f.write(f"  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod><priority>{pr}</priority></url>\n")
        f.write("</urlset>\n")
    with open(os.path.join(root, "robots.txt"), "w", encoding="utf-8") as f:
        f.write(f"User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: {SITE}/sitemap.xml\n")
    print(f"Wrote {len(PAGES)} pages, {len(LEGAL)} legal pages, 404.html, site.webmanifest, sitemap.xml, robots.txt")


if __name__ == "__main__":
    main()
