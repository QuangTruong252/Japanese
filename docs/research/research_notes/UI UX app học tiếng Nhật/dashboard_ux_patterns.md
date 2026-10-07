# Dashboard / Home "summary at a glance" UX patterns for mobile study & SRS apps (incl. Japanese-learning concept designs)

Research date: 2026-10-07. Source-age flags: [OLD] = published before 2022. Dribbble/Behance/Mobbin pages could not be fetched (JS-rendered / login-walled), so concept-design evidence is thin and comes from search-result descriptions; see Gaps.

## 1. What does UX research (NN/g, Apple, Material, practitioner analyses) say about glanceable mobile home/dashboard screens? How many items, what hierarchy?

### Takeaway
Authoritative guidance converges on: a home/dashboard is a fast "act on this now" surface, not an exploration or inventory page; pick the primary action from the user's current state, keep at most ~2 large/dominant elements, ≤3 type sizes, and let every block deep-link to where the detail lives. No source gives a hard "N blocks" number; the constraints come from hierarchy rules (≤2 big elements, ≤3 sizes, ≤3 contrast levels) and Apple's "minimal, no scrolling for the default set" stance.

### Cited Findings
- Dashboards are "collections of data visualizations, presented in a single-page view that imparts at-a-glance information on which users can act quickly"; they are "not intended as expansive views of complex data; their goal is not to facilitate exploration" — [NN/g, Dashboards: Making Charts and Graphs Easier to Understand, 2017 [OLD]](https://www.nngroup.com/articles/dashboards-preattentive/)
- Use preattentive encodings: length and 2D position for quantities (bars, lines); color only for categories, because "people do not perceive different colors as being in a particular order". Avoid pie/donut charts, gauges ("consume a lot of precious space"), 3D, treemaps on simple actionable dashboards — [NN/g 2017 [OLD]](https://www.nngroup.com/articles/dashboards-preattentive/)
- Visual hierarchy rules: use no more than 3 type sizes; limit big elements to a maximum of 2 so they stand out; make the most important element the largest; ≤3 contrast variations; whitespace/proximity before containers ("consider containers sparingly"); "If everything is contrasted, then nothing stands out." Recommends a squint/blur test (5–10 px blur) to check intended hierarchy — [NN/g, Visual Hierarchy in UX, Jan 2021 [OLD, borderline]](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)
- NN/g lists 5 visual-design principles affecting UX: scale, visual hierarchy, balance, contrast, Gestalt; bigger elements attract attention so size marks importance; hierarchy comes from contrast in value/saturation relative to context, not the hue itself — [NN/g, Principles of Visual Design (search snippet)](https://www.nngroup.com/articles/principles-visual-design/)
- Cards: "a container for a few short, related pieces of information" acting as an entry point to details. Good for browsing heterogeneous content (dashboards, feeds); bad for scanning, ranked/ordered information ("deemphasize the ranking of content"), comparison, and homogeneous items (use lists). Pitfall: using cards as a modern aesthetic replacement for lists — [NN/g, Cards: UI-Component Definition, 2016 [OLD]](https://www.nngroup.com/articles/cards-component/)
- Design-system guidance echoes this: "card layouts are less scannable than lists"; don't use cards if there's no compelling image/icon per item — use a list group instead; if content must be read in order, use a list or headed paragraphs — [Queensland Gov Design System, Card](https://www.designsystem.qld.gov.au/components/card) (aggregated via search)
- Apple HIG (Widgets; updated 16 Dec 2025): "Choose simple ideas that relate to your app's main purpose"; "Balance information density" — sparse looks unnecessary, dense is "less glanceable"; layout should give "essential information at a glance and allow people to view additional details by taking a longer look"; "Prefer dynamic information that changes throughout the day" (static content gets ignored); "Ensure that a widget interaction opens your app at the right location" — deep-link, don't make people navigate — [Apple HIG Widgets (JSON source)](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/widgets.json)
- Apple HIG also: "Avoid mirroring your widget's appearance within your app" (a widget-looking in-app element that doesn't behave like one confuses) — [Apple HIG Widgets](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/widgets.json)
- Practitioner analysis of 14 mobile home screens: a home screen is "a routing decision that must recognize the user's current state, elevate the most useful action, and keep alternate destinations available". Rules: "If everything is a dashboard card, nothing explains what matters now. Choose the first action from the user's state." For resume: "Show the object, current unit, progress, and action. A generic Continue button without that context shifts the recovery work back to the user." For tracking: "Name the period, target, unit, and current value, then provide the action that contributes to the metric." Pitfalls: home as product inventory; identical layout across user states; equal prominence for overdue/someday/completed items. Empty-state home should explain how to start — [Screensdesign, Mobile app home screen design (undated)](https://screensdesign.com/articles/mobile-app-home-screen-design/)
- Material 3 cards guidance page could not be extracted (JS-rendered) — [M3 Cards](https://m3.material.io/components/cards/guidelines)

### Inferences
- A defensible "glanceable home" = one dominant focal block (the state-derived next action, e.g. "Ôn 12 thẻ" or "Tiếp bài 7 · Từ vựng 3/5"), one secondary block (progress/forecast), and a short list of links — i.e. ≤2 big elements per NN/g, everything else as compact rows.
- The "summary-with-links" pattern is well supported: each summary block should deep-link to the exact place (Apple), carry its own context (object + unit + progress + action, Screensdesign), and not try to replicate the destination screen.
- Ranked/ordered info (what to do first) argues for a list or a single hero, not a grid of equal cards (NN/g cards).
- Use bars/segmented lines for progress and forecast; avoid ring/gauge/donut stat tiles (NN/g preattentive).

### Gaps
- No 2022–2026 NN/g article specifically on mobile home screens of learning apps was found; NN/g dashboard/cards pieces are 2016–2017.
- No primary source gives a numeric "max blocks on a mobile home"; any number (e.g. "3–5") would be folk wisdom.
- Material 3 card/list guidance and Baymard home-page findings not retrieved.

## 2. How do SRS/study apps present due reviews, "continue where you left off", and lesson progress on home — and how do they do it without anxiety?

### Takeaway
Dedicated SRS apps put two large count-driven actions (Lessons/Learn and Reviews) at the top, then a review forecast (day → hour) and level/SRS progress below; Anki stays a utilitarian deck list with colored New/Learn/Due counts. Anxiety mitigation in practice is mostly about framing (forecast instead of "available now", illustrations, capping new items, streak recovery), not hiding counts; heavy-users push back when big friendly buttons cost density.

### Cited Findings
- **WaniKani (Mar 2020 dashboard)**: added a review forecast that "shows when new reviews will show up, broken down by the day and then the hour in a simple, easy-to-scan format", and illustrated, prominent lesson/review buttons — "As the counts change, so do the illustrations". Removed the "available now", "next hour" and "next day" boxes to make room — [WaniKani Community, Forecasting Reviews on the Dashboard, 4 Mar 2020 [OLD]](https://community.wanikani.com/t/forecasting-reviews-on-the-dashboard/42305)
- Early criticism: "Due to the comically-oversized lesson/review buttons, and the removal of the next review box, it takes way more work to see the information I care about"; users with full-time jobs wanted to see how many kanji they could still miss while keeping pace — [same thread [OLD]](https://community.wanikani.com/t/forecasting-reviews-on-the-dashboard/42305); mixed reception also in [How's everyone like the new layout?](https://community.wanikani.com/t/hows-everyone-like-the-new-layout/42425?page=11)
- **WaniKani (6 Oct 2025 dashboard)**: customizable widgets (add/remove/reorder, color variants), auto-layout on mobile; widgets include level progress, lessons, reviews, recent mistakes, upcoming reviews, and a "24 Review Forecast" (hourly). Team explicitly chose "something that works well enough" over a perfect customizer. Complaints: lost kanji-hover review timing ("part of 95% of my workflow"), awkward vertical spacing / failing to recreate the old layout, animations ignoring reduced-motion, no dark mode — [WaniKani Community, The New Dashboard is Here, Oct 2025](https://community.wanikani.com/t/the-new-dashboard-is-here/71904)
- **Bunpro (Dashboard 2.0, 7 Aug 2023)**: rationale "the Dashboard is a Bunpro feature that most users will use every single day". Elements: Quicklinks (Learn/Review buttons with dropdowns for split reviews/decks), Forecast graph (daily/hourly, Total vs New-only toggle, grammar/vocab toggles, tooltips), 28-day Activity graph, SRS progress modal, community section, hotkeys L/R. Launch had performance complaints — [Bunpro Community, Dashboard 2.0 Released, Aug 2023](https://community.bunpro.jp/t/dashboard-2-0-released/68890); users later requested a rolling/cumulative forecast total — [Bunpro feature request](https://community.bunpro.jp/t/review-forecast-rolling-total-feature-request/67765)
- **Anki**: Decks screen lists decks with New, Learn and Due (To Review) counts for the day; tapping a deck opens an Overview showing counts split into New / Learning / To Review with a "Study Now" button; buried cards may appear in grey — [Anki Manual, Studying](https://docs.ankiweb.net/studying.html). Deck list combines review+learning counts in green; overview shows learning in red (forum-derived, via search snippet) — [Anki forums](https://forums.ankiweb.net/t/all-cards-move-from-due-to-learn-at-once/28645)
- **Readwise Daily Review**: one bounded daily session + streak calendar; missed days within the last 7 can be "recovered" so they count toward the streak; iOS widget shows the first highlight with a prompt before review is done, then rotates random highlights after completion — [Readwise changelog: stats](https://readwise.io/changelog/stats), [Readwise iOS widget](https://readwise.io/changelog/ios-widget)
- **Duolingo (path home, 1 Nov 2022)**: replaced a tree with a single linear path because learners "weren't sure whether they were using Duolingo the 'correct' or 'best' way"; goal: confidence that each step is the best next step; mixes concepts and folds stories/practice into one feed — [Duolingo Blog, new home screen design](https://blog.duolingo.com/new-duolingo-home-screen-design). Significant user backlash at launch (loss of choice/overview) — [PiunikaWeb, Nov 2022](https://piunikaweb.com/2022/11/22/duolingo-app-update-with-path-ui-faces-backlash-from-users/) (uxdesign.cc critique "Down the wrong path" exists but returned 403)
- **Renshuu**: mascot-centred (Kao-chan evolves as you learn, collectible coins, hand-made illustrations), learning paths per textbook/JLPT — home layout details not found — [App listing via AppFollow](https://apps.appfollow.io/ios/renshuu-japanese-learning/1542730063?country=ro)
- **Backlog anxiety**: when days are missed "the due pile compounds"; it reads as a debt and "most people quit rather than pay that debt" — [Unwait blog (vendor, low authority)](https://unwait.ai/blog/spaced-repetition-for-programmers). Overloading with new items leads to burnout "when all these reviews come back to haunt them"; advice: "limit the number of new items you allow yourself to do every day" — [Tofugu, SRS guide, 2017 [OLD]](https://www.tofugu.com/japanese/spaced-repetition/)
- FSRS ecosystem users ask for stable daily review counts (load smoothing) — [ts-fsrs issue #300](https://github.com/open-spaced-repetition/ts-fsrs/issues/300)

### Inferences
- Concrete, repeated layout for SRS homes: [Primary: Reviews N] [Secondary: Learn/next lesson] → forecast bar chart (next 24h / 7 days) → level/SRS progress bar. MaiPace can reuse this order but compress to one hero + compact rows on mobile.
- Anxiety mitigation that is actually shipped: (a) show the next-time/forecast so a big number has a horizon; (b) cap new items; (c) streak recovery windows; (d) friendly framing/illustration that changes with count (WaniKani). Hiding the count entirely is discussed but no mainstream app found doing it — frame, don't hide.
- Power users value density (hover/timing info, small boxes); oversized friendly buttons draw complaints. Make the hero big but keep the number + "next in X" visible in the same block.
- Duolingo shows the trade-off of a single prescribed path: clearer "next step", but loss of overview/choice angers existing users — a home should give the next step *and* a link to overview.

### Gaps
- No primary-source description of AnkiDroid/AnkiMobile home layout redesigns 2022–2026, Quizlet's current home, Brainscape's dashboard, or Satori Reader's home screen was retrieved (Brainscape screens exist on [Screensdesign](https://screensdesign.com/apps/brainscape-smart-flashcards/) but weren't analysed).
- No controlled study found measuring anxiety vs. due-count display; evidence is community anecdote.
- Renshuu "today" screen structure not confirmed.

## 3. What visual techniques make a summary layout feel less generic, and what recurs in Japanese-learning dashboard concepts (Dribbble/Behance/Mobbin)? Which are pretty-but-impractical?

### Takeaway
Retrievable evidence supports: asymmetric hierarchy via scale (one large element, ≤2 big), typographic contrast, illustration tied to state (WaniKani buttons change art with counts), and progress that "fills in" (greyed → colored lesson icons). Japanese-concept tropes (hero illustration + mascot speech bubble, word/kanji-of-the-day card, kana mnemonics, widget kanji) are visible in search descriptions, but Dribbble/Behance/Mobbin content itself could not be read.

### Cited Findings
- Kanji learning concept (Diancheng Hu, Dribbble): lessons themed (animal, flower) with simple culture-related icons that are greyed out and fill with color when the lesson is finished — [Dribbble shot (via search description)](https://dribbble.com/shots/14190184-Japanese-Kanji-learning-App-UI) [date unverified, likely 2020 [OLD]]
- "Kana" concept (Diana Woch for Netguru): mnemonic stories/illustrations connecting characters to images; among the most popular Japanese-learning shots — [Dribbble (via search)](https://dribbble.com/shots/10706187-Kana-japanese-syllabary-learning-app) [likely 2020 [OLD]]
- Kanji-widget case study: daily random sentence/kanji pushed to the iPhone widget as a lightweight daily touchpoint — [Medium, Japanese Kanji Widget UI/UX Study Case (via search; page fetch failed)](https://medium.com/@andrianekaputra3/japanese-kanji-widget-ui-ux-study-case-30658a12cc8a); shipping apps do this too (Moji: lock/home widgets with readings, meanings, JLPT level) — [App Store, Moji](https://apps.apple.com/us/app/moji-learn-japanese-kanji/id6782609868)
- Mascot + illustration integration in production: Renshuu's evolving Kao-chan and hand-made illustrations — [AppFollow listing](https://apps.appfollow.io/ios/renshuu-japanese-learning/1542730063?country=ro); WaniKani's count-dependent illustrated buttons — [WaniKani 2020 [OLD]](https://community.wanikani.com/t/forecasting-reviews-on-the-dashboard/42305)
- Hierarchy toolkit for non-generic layouts: scale ("bigger elements stand out"), ≤2 big elements, contrast in value/saturation, whitespace over containers — [NN/g 2021](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)

### Inferences (design judgment, not sourced fact)
- Less-generic techniques that remain practical: one asymmetric hero (big numeral or big kanji/word at display size next to small meta text), a single illustration anchored to the hero whose state changes with progress, list rows (not cards) for secondary links, and a thin forecast/progress bar instead of stat tiles.
- Likely pretty-but-impractical (from the evidence above): full-screen hero illustrations that push the due count below the fold (cf. WaniKani "comically-oversized" complaint); journey maps as the *only* overview (cf. Duolingo path backlash); progress rings/gauges/donuts (NN/g: hard to read, space-hungry); vertical Japanese typography for functional labels (decorative only — no source found either way); word-of-the-day cards that never change state or link nowhere (Apple: static content gets ignored; deep-link everything).

### Gaps
- Dribbble search/tag pages, Behance projects and Mobbin flows were not fetchable; claims about recurring "speech bubble hero", "vertical typography", "washi/ink aesthetic" in concepts could not be verified from sources and are left unsourced.
- No usability data on concept-design tropes; "impractical" judgments are inferred from heuristics and shipped-app complaints.

## 4. Common pitfalls (identical stacked cards, too many CTAs, admin-panel look)

### Takeaway
The sources consistently name the same failure modes: everything-as-card/equal prominence, home as inventory, generic "Continue" without context, too much emphasis, chart types that need reading, and ignoring user state; SRS-specific additions are lost density for power users, motion ignoring reduced-motion, and backlog-as-debt framing.

### Cited Findings
- "If everything is a dashboard card, nothing explains what matters now"; equal prominence for overdue/someday/completed; home as complete product inventory; same layout for every user state — [Screensdesign](https://screensdesign.com/articles/mobile-app-home-screen-design/)
- "If everything is contrasted, then nothing stands out"; >2 big elements dilute focus — [NN/g 2021](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/)
- Cards used as a stylistic substitute for lists; cards hide ranking — [NN/g 2016 [OLD]](https://www.nngroup.com/articles/cards-component/)
- Gauges, pies, donuts, 3D on dashboards — [NN/g 2017 [OLD]](https://www.nngroup.com/articles/dashboards-preattentive/)
- Generic Continue button "shifts the recovery work back to the user" — [Screensdesign](https://screensdesign.com/articles/mobile-app-home-screen-design/)
- Oversized friendly buttons hiding the timing info users need; reduced-motion not respected by widget animations; lost hover detail — [WaniKani 2020 [OLD]](https://community.wanikani.com/t/forecasting-reviews-on-the-dashboard/42305), [WaniKani 2025](https://community.wanikani.com/t/the-new-dashboard-is-here/71904)
- Dense widgets "less glanceable", sparse ones "unnecessary" — [Apple HIG](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/widgets.json)

### Inferences
- "Admin panel" feel comes from a grid of same-size stat tiles with labels+numbers and no action; the antidote is one stateful action hero, numbers embedded in sentences ("12 thẻ cần ôn · tiếp theo sau 3 giờ"), and links as list rows.
- Customizable widget dashboards (WaniKani 2025) shift design work to users and still get layout complaints; for a single-user app a fixed, state-aware layout is cheaper and likely better.

### Gaps
- No quantitative data on CTA count vs. conversion for study-app homes.
- Baymard research not retrieved (mostly e-commerce; relevance limited).
