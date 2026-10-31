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


def page(p):
    url = f"{SITE}/{p['slug']}"
    create = f"/#create/{p['type']}"
    img = f"{SITE}/img/{p['img']}-960.webp"
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
<meta property="og:locale" content="en_LK">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="/seo.css">
{''.join(ld(s) for s in schema)}
</head>
<body>
<header class="nav"><div class="in">
  <a class="wm" href="/" aria-label="Aradhanawa home">{LOTUS}<b>Aradhanawa</b><span lang="si">ආරාධනාව</span></a>
  <nav aria-label="Main"><a href="/#designs">Designs</a><a href="/#pricing">Pricing</a><a class="btn sm" href="{create}">Create free</a></nav>
</div></header>
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
<footer class="foot"><div class="in">
  <a class="wm" href="/">{LOTUS}<b>Aradhanawa</b></a>
  <nav aria-label="Footer">{''.join(f'<a href="/{q["slug"]}">{e(q["nav"])}</a>' for q in PAGES)}<a href="/#pricing">Pricing</a></nav>
  <p>Sri Lankan digital invitations · WhatsApp <a href="{wa_link('Hi Aradhanawa!')}" target="_blank" rel="noopener">+94 76 448 7857</a></p>
</div></footer>
</body>
</html>
"""


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for p in PAGES:
        d = os.path.join(root, p["slug"])
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
            f.write(page(p))
    urls = [(SITE + "/", "1.0")] + [(f"{SITE}/{p['slug']}", "0.8") for p in PAGES]
    with open(os.path.join(root, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for u, pr in urls:
            f.write(f"  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod><priority>{pr}</priority></url>\n")
        f.write("</urlset>\n")
    with open(os.path.join(root, "robots.txt"), "w", encoding="utf-8") as f:
        f.write(f"User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: {SITE}/sitemap.xml\n")
    print(f"Wrote {len(PAGES)} pages, sitemap.xml, robots.txt")


if __name__ == "__main__":
    main()
