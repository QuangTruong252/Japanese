# Illustration, characters and home-screen composition in mainstream illustrated language apps (Duolingo, Drops, Busuu, Memrise, LingoDeer, Babbel)

Research date: 2026-10-07. Scope: visual craft and home/dashboard composition, not gamification mechanics. Many primary design writeups are 2019–2022. Each is flagged with its date. Sources from 2023–2026 are thinner than hoped, and the Gaps sections say where.

## 1. What exactly appears on each app's home screen (first mobile viewport), in what order?

### Takeaway
The dominant pattern (Duolingo, and since 2024–2025 Memrise and Babbel) is a single "next step" path or recommendation as the hero, with a thin status strip of a few counters at the top and a bottom tab bar. Duolingo replaced a dense multi-route "tree" with one vertical path of round nodes grouped into units with plain-language unit headers. The others converge on the same pattern: a "continue / next up" entry plus a visible progress summary.

### Cited Findings
**Duolingo (path home, launched 2022; still current in 2023–2025 coverage)**
- The home is "a path that you'll follow step by step". It is a vertical scrolling sequence of circular level nodes, where each circle equals one crown level of the old tree. Levels from different skills are interleaved, and practice and Stories (book icon inside a circle) are built into the path instead of living in separate tabs. Post dated May 6, 2022, by Holly Munson, Anton Yu, Ananya Rajgarhia and AJ Noh. — [Duolingo blog: new home screen design](https://blog.duolingo.com/new-duolingo-home-screen-design)
- Lessons are grouped into smaller units. Unit headers use descriptive task language ("get directions" rather than "City 3"), and a guidebook icon at the top-right of each unit holds the tips. — [Duolingo blog](https://blog.duolingo.com/new-duolingo-home-screen-design)
- A floating arrow button in the bottom-right corner jumps back to your current position. The bottom navigation includes a Quests tab (chest icon) and a Practice Hub (barbell icon, Super only). — [Duolingo blog](https://blog.duolingo.com/new-duolingo-home-screen-design)
- The path shows "more of our cast of quirky characters cheering you along". Characters sit beside the path as companions. — [Duolingo blog](https://blog.duolingo.com/new-duolingo-home-screen-design)
- Top status strip: the streak count next to a flame at the top of the screen, and the gem count next to it (tap to open the Shop). Hearts also show here. — [Duolingo blog: Duolingo 101 / streak tips (search summary)](https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo); [Duolingo blog: tips for maintaining streak](https://blog.duolingo.com/tips-for-maintaining-streak)
- The stated aim was to feel less dense than the tree while keeping identical content. — [Duolingo blog](https://blog.duolingo.com/new-duolingo-home-screen-design)
- Apple's Behind the Design (June 5, 2023) calls the Tree "multiple exploratory routes" and the Path "a single unified route for all users", described internally as "a complete reboot of our product strategy". — [Apple Developer: Behind the Design – Duolingo](https://developer.apple.com/news/?id=jhkvppla)
- In the tree era, color encoded skill level and progress. After the path, color is used for the app's characters, not for progress. — [search summary of Apple Behind the Design / Silicon Republic coverage](https://www.siliconrepublic.com/?p=988615). This is the one tertiary source in the set and could not be confirmed against the primary article.

**Memrise (new home, July 2024; another "new experience" rolling out from about end of Oct 2025)**
- 2024 home, top to bottom:
  - Top band: the language you're learning, your current level and your points.
  - Three primary modes: "Learn Words", "Hear My Words" and "Use My Words".
  - A smart-recommendation section: swipeable suggested activities with a Start button.
  - Bottom bar: Scenarios, Videos and Conversations (an AI "MemBot" chat).
  - "My Words" opens from a book icon.
  - Courses (French 1–7) were replaced by "Scenarios", which are real-life situation units.

  Post dated July 18, 2024. — [Memrise blog: major update](https://www.memrise.com/blog/major-update-a-new-version-of-the-app-is-coming)
- The 2025 "new experience" adds:
  - "My Lessons", a learning path from pronunciation through sentences to conversations
  - goal-based Wordlists (travel, love, work)
  - "My Words", a personal dictionary
  - "My Activities", a dashboard to "visualise your progress".

  Update note dated Sept 17, 2025. Rollout was expected to start around the end of October 2025. — [Memrise: new experience](https://explore.memrise.com/new-experience)

**Busuu (undated redesign post, likely pre-2023)**
- After the redesign, a "Next up" button jumps straight to where you left off. The redesign also added clearer overall progress through each lesson, a new illustrated progress bar, "better quality images and a brighter design" and animations. — [Busuu blog: completely redesigned app](https://blog.busuu.com/?p=4601). I could not confirm the date. The "11 languages in one app" framing suggests it is older than 2023.

**LingoDeer (older sources)**
- The home tab is "LEARN": a list of lesson blocks on a white background with an amber-colored border, plus REVIEW and ME tabs. At launch an arm-waving cartoon deer with glasses greets the user. — [Pratt IXD design critique of LingoDeer, Jan 2018](https://ixd.prattsi.org/2018/01/design-critique-lingodeer-android-app/); [LingoDeer reviews (summary)](https://flexiclasses.com/lingodeer-review/)
- The dashboard tracks lesson progression and points toward a daily goal. — [Ling app review of LingoDeer](https://ling-app.com/blog/lingodeer-review/)

**Drops (older source, 2019)**
- The home is organized by topic modules, with a "status bar to assess their progress for the day" and encouraging messages. — [Desirability Lab: Drops, Mar 2019](https://desirabilitylab.com/posts/challenge-5-drops)

**Babbel**
- The 2019 course overview had a personalized syllabus, a clear split between completed and upcoming lessons, and progress circles. Its rationale: "Learners wanted a clearer path… more direction about what to do next". Principal Designer Natalia Volgina is quoted. Dated Sept 5, 2019. — [Babbel Magazine: Babbel's new look](https://www.babbel.com/en/magazine/course-overview-update)
- The 2023–24 rebrand in product (built from August 2023, released January 2024 on iOS and Android) introduced "product cards" as one of three core visual elements. — [Babbel press release, Feb 1, 2024](https://babbel.com/press/en-us/releases/babbel-unveils-a-bold-new-chapter-a-transformational-rebranding)

### Inferences
- Across apps, the first viewport tends to have three layers:
  1. A thin counter strip (streak, gems, points or level).
  2. One dominant "what's next" object: the current node on a path, or a "Next up" / Start card.
  3. A bottom tab bar.

  Progress is summarized compactly (counters, a progress bar, completed vs. upcoming nodes) rather than with charts.
- Duolingo's path makes "today/next" spatial: it is the highlighted node in your current position on a vertical trail, and the floating arrow brings you back to it. Memrise and Busuu make it a button or card.

### Gaps
- I found no primary 2024–2026 description of Duolingo's exact current top bar. It may also show a course flag or energy instead of hearts, and the unit-banner treatment (a colored banner with the unit title and a guidebook button) is my recollection, not cited. Mobbin screenshots were not accessed.
- I found no 2023–2026 primary source for the current Busuu, LingoDeer or Drops home screens.
- Memrise's 2025 home layout order is not described concretely in the source.

## 2. How does each use illustration and characters, in what style, and why?

### Takeaway
Duolingo is the reference case. It has a codified flat, geometric, rounded-shape illustration system and a named character cast. Characters act as companions beside the path and as animated reactors in lessons, and they are animated in Rive. Drops uses no characters: pictographic icons on jewel-tone gradients stand in for translation, which reads as "premium" rather than "cartoon". Babbel's 2024 rebrand chose cut-out photographic silhouettes over drawn characters. LingoDeer uses a single cute mascot plus illustrated vocabulary cards.

### Cited Findings
**Duolingo illustration system**
- All illustrations are built from three basic shapes: the rounded rectangle, the circle and the rounded triangle. Every shape has rounded edges, and "pointy shapes are off-brand". — [design.duolingo.com/illustration](https://design.duolingo.com/illustration), via search snippet. This URL now redirects to [blog.duolingo.com/hub/design](https://blog.duolingo.com/hub/design/).
- Rhythm: variation in shape sizes keeps the eye interested, while shapes of similar weight are "predictable and uninteresting". Simplicity: "make each shape matter" with the fewest shapes possible. — [design.duolingo.com](https://design.duolingo.com/illustration) (snippet)
- Perspective: characters and icons sit on a flat perspective. Shadows always fall below objects as a pill shape, never an oval, because ovals imply perspective. — [design.duolingo.com](https://design.duolingo.com/illustration) (snippet)
- Characters: head and body are each one or two basic shapes. Five main eye styles exist, and all must be geometric. — [design.duolingo.com/illustration/characters](https://design.duolingo.com/illustration/characters) (snippet)
- History: in 2018, work on Duolingo KIDS pushed the team toward brighter, rounder, friendlier art. The main app then moved from "static, hard-edged shapes on a light gray background" to vibrant colors and rounded buttons on white. The style is minimal vector work using "the fewest details needed to get the point across", with clear silhouettes framed by white space. — [Duolingo blog: Shape language, July 2, 2020, Megan Barker](https://blog.duolingo.com/shape-language-duolingos-art-style/)
- Three stated principles: quick to produce (vector scales across devices), clear to understand (readability for learning), and fun to learn with (exaggeration, humor, storytelling, cultural context, caricature-level exaggeration, animation). Art Director Greg Hartman: "language learning is more than just words on a screen: it's interesting characters, colorful experiences, and beautiful stories." — [Duolingo blog, 2020](https://blog.duolingo.com/shape-language-duolingos-art-style/)
- Cast and personalities:
  - Duo, the owl, in many moods
  - Lily, a perpetually unimpressed teen with a slow-clap
  - Oscar, a dramatic teacher
  - Eddy, an enthusiastic fitness buff

  Character animations were a major update shipped alongside the path. Subtle animations reward correct answers. A "story consistency" team keeps the characters' narratives consistent. Greg Hartman is Head of Art. — [Apple Behind the Design, June 5, 2023](https://developer.apple.com/news/?id=jhkvppla)
- VP of Design Ryan Sims: "we're not an education company. We're a fun and motivation company. Fun is the most important part of the work we do." — [Apple Behind the Design, 2023](https://developer.apple.com/news/?id=jhkvppla)
- Motion: wing-flaps for correct answers, celebratory spins at milestones, character confetti at lesson end, animated progress bars, and simple transitions along the path. — [60fps.design "Fun in Every Frame", Dec 29, 2024](https://60fpsdesign.substack.com/p/fun-in-every-frame)
- Rive: the World Characters are animated with Rive state machines, with separate pose states and mouth (viseme) states. This lets lip-sync scale across 40+ languages and 100+ courses while keeping files small on iOS, Android and web. — [Duolingo blog: World character visemes](https://blog.duolingo.com/world-character-visemes)
- Typography: the custom Feather Bold logotype and typeface (Johnson Banks with Fontsmith) is drawn from Duo's "feathery form": serif flicks from the plumage, a flicked lowercase "g" and wing-tipped stem junctions. Johnson Banks deliberately avoided "neutral typography alongside the symbol (like every other tech company)". The same refresh delivered revised core colors, a tone-of-voice guide and an illustration guide. — [Creative Bloq](https://www.creativebloq.com/news/feather-bold); [Design Week](https://www.designweek.co.uk/duolingo-rebrand-avoids-silicon-valley-tropes-and-reflects-companys-quirky-personality/); [Creative Review](https://www.creativereview.co.uk/duolingo-rebrand-johnson-banks/). The refresh is circa 2019 and older than the requested window.

**Drops**
- The app is "100% visual": words are matched exclusively with icons, never the English word, so meaning connects without translation. Each course has about 1,700 words with "crisp line illustrations" across 99 topics, plus vivid colors, minimal illustrations, micro-animations and pleasant sounds. — [YourStory, Jan 2019](https://yourstory.com/2019/01/app-fridays-drops-google-play-languages)
- Visual system:
  - Background: orange or teal gradients with "bright jewel tones", and white text on gradient.
  - Type: a simple sans serif.
  - Motion: eased ("logarithmic") transitions, a gently pulsing clock, and paintbrush-like transparency while scrolling.

  The reviewer says it "feels more sophisticated than apps like Duolingo, which present cartoon-like characters", and is "branded like it's a luxury good". — [Desirability Lab, Mar 2019](https://desirabilitylab.com/posts/challenge-5-drops)
- Illustration is a key design feature, with a "cheerful and friendly" aesthetic and a gradient palette. — [DesignRush](https://www.designrush.com/best-designs/apps/drops) (undated)

**Babbel (2023–2024 rebrand, Koto Studios)**
- The rebrand kept a contemporary version of Babbel orange, added a new primary font (Feature Text) for a "premium feel", and built the design system on three elements: cut-out imagery/silhouettes, product cards, and photography of real teachers and learners. Pablo La Rosa, Director of Brand Experience: the design language "makes Babbel feel more approachable and fun, but at the same time high-quality". Dated Feb 1, 2024. — [Babbel press release](https://babbel.com/press/en-us/releases/babbel-unveils-a-bold-new-chapter-a-transformational-rebranding)

**LingoDeer**
- A cute deer mascot (arm-waving, with glasses) appears at the greeting. Lesson pages use illustrated image blocks, four per exercise with captions. Reviewers call it "clean and visually appealing" with "very nice" illustrations and strong sound design. — [Flexi Classes review 2025](https://flexiclasses.com/lingodeer-review/); [Pratt IXD 2018](https://ixd.prattsi.org/2018/01/design-critique-lingodeer-android-app/)

**Busuu**
- The redesign added "a number of illustrations", including an illustrated progress bar, plus brighter imagery. — [Busuu blog (undated)](https://blog.busuu.com/?p=4601)

**Smaller and newer illustrated apps (weak evidence)**
- Portfolio cases show the Duolingo pattern spreading: an AI-tutor mascot as a "language partner" ([Riipen project](https://ssu.riipen.com/projects/dV3aQ5zy)), Oki, a Kazakh English app with a mascot, 100+ assets, motion assets and consistency guidelines ([Oki portfolio](https://aiyapaints.cargo.site/oki)), and a Japanese-learning concept with a "calm visual style and structured lesson flow" ([Contra](https://contra.com/p/lAOY32We-japanese-language-learning-mobile-app-ui-design)).

### Inferences
- There are three illustration strategies:
  1. **Companion-character world** (Duolingo, LingoDeer): flat, geometric, rounded vector art with a recurring cast. Characters are placed beside the path, react in lessons, and fill celebration and empty states.
  2. **Pictographic, no characters** (Drops): icons carry meaning on saturated gradients and read as premium or calm.
  3. **Photographic and cut-out** (Babbel 2024): adult and "high-quality" positioning, with human warmth from photos rather than drawings.
- Duolingo keeps character art from competing with progress information by reserving it for decoration and companionship, never for status. Status uses icons and counters. Since the path, color goes to characters, not progress.
- Duolingo's art reads as warm, not noisy, because of its strict shape grammar: three rounded primitives, flat perspective, pill shadows and minimal detail.

### Gaps
- I could not retrieve the full current design.duolingo.com guidelines (the site redirects). Color and highlight rules for illustrations are not captured.
- I found no 2023–2026 design writeups from Drops (now owned by Kahoot!), Busuu or LingoDeer explaining illustration rationale.
- No source covered per-unit scene art or empty-state art in detail for any app.
- I found no reliable source on whether Duolingo uses 3D. Everything cited describes flat 2D vector art animated in Rive.

## 3. How do they make a summary screen feel warm and inviting rather than a dry dashboard?

### Takeaway
They replace dashboard widgets with one friendly next step. Characters supply emotion, motion celebrates progress, and copy speaks in tasks ("get directions"). Numbers are kept to a few icon-paired counters.

### Cited Findings
- Duolingo's path is designed to feel "less dense" than the tree, with descriptive unit names and characters "cheering you along". — [Duolingo blog](https://blog.duolingo.com/new-duolingo-home-screen-design)
- Characters deliver emotional feedback (Lily's slow-clap, Eddy's energy, Duo's wing-flap), and "every micro-movement celebrates progress". — [60fps.design, 2024](https://60fpsdesign.substack.com/p/fun-in-every-frame)
- Ryan Sims: "You learn a language to connect to another human." Fun and motivation are the stated design priority. — [Apple Behind the Design, 2023](https://developer.apple.com/news/?id=jhkvppla)
- The 2018 move from "light gray background, hard-edged shapes" to vibrant color, rounded buttons and white backgrounds was explicitly about friendliness. — [Duolingo blog, 2020](https://blog.duolingo.com/shape-language-duolingos-art-style/)
- Busuu's "Next up" button and illustrated progress bar. — [Busuu blog](https://blog.busuu.com/?p=4601)
- Drops gets its warmth from color gradients, eased motion and a pulsing timer rather than from characters. — [Desirability Lab, 2019](https://desirabilitylab.com/posts/challenge-5-drops)
- Babbel aims for "approachable and fun, but… high-quality" through photography of real people and cut-outs. — [Babbel press, 2024](https://babbel.com/press/en-us/releases/babbel-unveils-a-bold-new-chapter-a-transformational-rebranding)

### Inferences
- Five levers make a summary screen warm:
  1. One hero action instead of many equal tiles.
  2. Illustration placed beside content, never behind text.
  3. Motion at moments of success.
  4. Human, task-based copy.
  5. Saturated but limited color on a white or gradient ground.
- Calm warmth (Drops, Babbel) comes from material and color rather than mascots. It is the safer choice for an adult audience.

### Gaps
- I found no designer writeup that discusses the home or summary screen as a composition, for example illustration placement rules on the home specifically.

## 4. What are the known criticisms of their visual design?

### Takeaway
Duolingo is criticized for looking childish to some adults, for the 2022 path's loss of overview and control, and, in academic work, for manipulative engagement patterns. I found little documented visual criticism of the others.

### Cited Findings
- The 2022 path update drew backlash. A designer who had used Duolingo for almost a decade called it a major step in the wrong direction. Its selling point was simplicity: one linear feed of exercises, stories and practice. — [UX Collective: "Down the wrong path"](https://uxdesign.cc/down-the-wrong-path-the-disaster-of-the-latest-duolingo-ui-update-a4cdd1e6ea1c) (the full text returned 403, so this is the search summary only); [PiunikaWeb: path UI backlash, Oct–Dec 2022](https://piunikaweb.com/2022/10/13/duolingo-app-update-with-path-ui-faces-backlash-from-users/)
- In the tree era, color showed skill strength. After the path, color serves the characters, which removes an at-a-glance progress signal. — [Silicon Republic (search summary)](https://www.siliconrepublic.com/?p=988615)
- Some users find the design "too childish" for adults, which is framed as a matter of taste. — search summary of [Pratt IXD Duolingo critiques (2020, 2021)](https://ixd.prattsi.org/2020/09/design-critique-duolingo-iphone-app/)
- Academic analysis identifies deceptive patterns, such as excessive notifications to keep engagement, alongside "bright" child-appropriate patterns like clear interface design. — [UFRPE thesis: "Teaching or manipulating?"](https://arandu.ufrpe.br/items/e55879b3-a7af-4aa1-839b-c91f56e1fbcd)
- In 2025, users were still asking for UI changes, including a more overview-style view. — [DuolingoGuides: UI change users want in 2025](https://duolingoguides.com/ui-change-that-duolingo-users-want/). This is a fan site; I did not fetch it to confirm specifics.
- Drops is praised as more sophisticated than "cartoon-like" Duolingo. The reviewer listed no substantive visual criticisms. — [Desirability Lab, 2019](https://desirabilitylab.com/posts/challenge-5-drops)

### Inferences
- The recurring risks for an adult self-learner are:
  - a mascot-heavy look reading as childish
  - a linear path hiding the overall map and the user's control
  - characters and celebrations becoming noise on repeat visits.

  A mitigation consistent with these sources is restrained illustration: one scene or companion, not a crowd. Keep an explicit overview or progress view next to the "next step" hero.

### Gaps
- I found no published critiques of Memrise's 2024–2025, Babbel's 2024 or Busuu's current visual design.
- Clutter complaints about Duolingo's top-bar counters and promo cards are anecdotal, and I did not find them in a citable source.
