# Career Ride: build prompt for Claude Code

Paste everything below the line into a new Claude Code session opened in an empty folder.
Recommended effort: high.

---

## Goal

Build a personal showcase website for Umar Muhammad Sharif that plays like a small 3D toy-world game. A cyclist rides through nine islands, one per phase of Umar's career from 2004 to today, and ends at a classroom where he now teaches AI. Visitors are peers, former colleagues, friends and people curious about his AI work. The site succeeds if someone enjoys it enough to send the link to a friend, and leaves knowing what Umar did at each stop.

The work has two stages. Stage 1 proves the look and the steering feel on one island. Stage 2 builds everything else. Stop after Stage 1 and wait for Umar's approval, because approving nine worlds in a style he has not seen is the expensive way to find out he dislikes the rider.

## What finished looks like

**Stage 1 is done when:**

- The project runs locally with Vite, React, React Three Fiber, drei and a current Three.js from npm.
- The rider, the bicycle and the Foodpanda island (island 6, both districts) exist and look charming, with all of that island's pickups and its signboard working.
- Steering on the island feels good with arrow keys and WASD.
- One passenger ride plays: leaving through the exit gate and swooping along a road to a stub of the next island.
- You have looked at your own screenshots at desktop and phone sizes, fixed what looked wrong, and saved the final ones to `docs/stage-1/`.
- You have set a performance budget per island (draw calls and triangle count) from what the Foodpanda island needs, so the other eight have a number to stay under.
- You have written a short Stage 1 report and stopped.

**Stage 2 is done when:**

- All nine islands, both modes, the start screen, the mini-map, "Ride for me", the phone experience, the fallback timeline page, sound and the closing scene work as specified below.
- Every fact on screen comes from `src/content/career.json`.
- A production build succeeds and you have checked it in a browser.
- Every island stays inside the performance budget you set in Stage 1, measured as draw calls and triangle count per island. Report those numbers. Frame rates measured in your own browser are software-rendered and far below a real device, so report them with that caveat and ask Umar to ride the build on his laptop and phone.

## The experience

**Start screen.** Two choices. "Story" is highlighted as the default: the ride begins in 2004 and islands open in career order. "Open map" unlocks every island from the start. A "Ride for me" button plays the whole story hands-free. A plain-text CV link is visible here and on every screen.

**On an island.** The visitor steers the rider with arrow keys or WASD and the camera follows behind. Each island, or each district of a two-district island, holds up to three pickups and one signboard. A pickup is a glowing token carrying one number or fact; riding through it shows the fact and plays a small animation on the island that illustrates it, such as kitchen stalls lighting up along a street. The signboard shows company, years, role and one sentence. A corner counter tracks pickups found across the whole ride. Riding off an edge returns the rider to the island's entrance, with no fail state.

**Between islands.** Riding through the exit gate turns the visitor into a passenger. The camera swoops along a winding road to the next island while a year counter ticks forward to the year being entered. This is the showpiece camera work, so make the path generous: climbs, a spiral, a banked turn. Steering is disabled here on purpose, since steering across narrow bridges is where free-roam games frustrate people.

**Story mode.** The only way out of an island is forward to the next chapter. The ride ends at island 9 with a short closing scene and the contact links.

**Open map.** The mini-map jumps to any island at any time.

**Ride for me.** Story mode with the steering done for the visitor. The rider passes every pickup, pauses long enough to read each one, and continues. This run should also look good as a screen recording.

**Phones.** Phones get the hands-free story only. There is no joystick. The visitor taps to move from one pickup to the next and to continue to the next island.

**Fallback.** If the device cannot run WebGL, or the visitor has reduced motion switched on, show an illustrated timeline page with the same content from the same file. Serve that page at its own route as well, in real HTML text, so search engines and link previews have something to read.

**Sound.** Off until the visitor switches it on. A light soundscape generated in code: pedalling, a pickup chime, a soft change of ambience per island. Use no audio files, for the same reason the scene uses no downloaded assets.

## The look

A toy diorama. Low-poly islands floating in a soft sky, warm lighting, gentle shadows, a slightly tilted miniature feel. Everything is generated in code from simple shapes. Use no downloaded 3D models, no image textures and no generated video, because Umar has no asset pipeline and the site should be maintainable by editing code and one content file. This covers the 3D scene and the soundscape. The favicon and the link-preview image can be made from a screenshot of the finished site.

The rider is a toy figure with a helmet and a backpack, built from simple shapes, with no attempt at Umar's likeness. The legs pedal, the wheels turn at a speed that matches travel, and the figure leans into turns. The rider is on screen for the whole visit, so it deserves more care than any single island.

Each island evokes an industry and uses no company logos, wordmarks or brand colours. Company names appear as plain text on signboards only. This avoids trademark trouble.

Design an original world, because a copied look creates copyright risk and would make the site feel borrowed. Genre conventions such as floating islands, pickups and a follow camera are fine.

## Architecture constraints

- **One island engine, nine sets of scenery.** Ground, steering, bounds, pickups, signboard, gates and camera are shared. An island is a data entry plus a scenery component. Island nine should cost a fraction of island one.
- **Content is data.** Before writing any scene code, save the JSON in the Content section to `src/content/career.json`. All on-screen facts come from it. Invent no roles, dates, numbers, quotes or company descriptions. That rule covers facts about Umar and the companies. Interface text such as button labels, control hints and captions for pickup animations is yours to write. If a card needs a fact the file lacks, leave a visible placeholder and list it in your report.
- **No physics engine.** Steering is simple movement inside island bounds. Passenger rides follow a curve.
- **Keep it light.** Mount only the current island and what is visible of its neighbours. Cap the pixel ratio at 2. Share geometries and materials.
- **Flat interface layer.** Cards, counter, mini-map, start screen and the timeline page are ordinary HTML over the canvas, with keyboard access and visible focus. If the `ui-ux-pro-max` skill is available, use it for palette, type and spacing of this layer and as a checklist for Three.js mistakes. Its Three.js rules assume an old pinned CDN version (r128); ignore the version pinning and use current Three.js from npm.

## Content

Save this exactly as `src/content/career.json`. Facts come from Umar's CV of record and are fixed. The tagline, the closing line and the classroom board text are draft wording that Umar may edit. Themes and pickup animations are suggestions you may improve.

```json
{
  "person": {
    "name": "Umar Muhammad Sharif",
    "tagline": "AI transformation and training, after two decades in telecom, fintech and digital platforms",
    "links": {
      "linkedin": "https://www.linkedin.com/in/umarmsharif",
      "github": "https://github.com/umarmsharif",
      "cv": "/cv"
    }
  },
  "islands": [
    {
      "id": 1,
      "name": "The Workshop",
      "company": "Ultimus and Teradata (NCR)",
      "years": "2004 to 2008",
      "role": "Founding Engineer at Ultimus; Consultant at Teradata",
      "summary": "Started as a software engineer and consultant, working across Islamabad, Brussels and Madrid.",
      "theme": "An engineer's workshop with a road leading out toward two small European towns",
      "pickups": [
        { "fact": "BS Software Engineering, Foundation University, on a Ministry of Science and Technology merit scholarship" },
        { "fact": "Founding Engineer at Ultimus" },
        { "fact": "Worked in Islamabad, Brussels and Madrid" }
      ]
    },
    {
      "id": 2,
      "name": "Campus Hill",
      "company": "Lahore University of Management Sciences (LUMS)",
      "years": "2008 to 2010",
      "role": "MBA, Marketing and Strategy",
      "summary": "Stepped out of engineering to study marketing and strategy.",
      "theme": "A campus on a green hill with a library and a clock tower",
      "pickups": [
        { "fact": "MBA in Marketing and Strategy" }
      ]
    },
    {
      "id": 3,
      "name": "Signal Valley",
      "company": "Jazz (then Mobilink, VEON Group)",
      "years": "2010 to 2012",
      "role": "Specialist, Business Analysis and Growth Strategy",
      "summary": "First telecom role, in business analysis and growth strategy in Islamabad.",
      "theme": "A valley dotted with signal towers that light up as the rider passes",
      "pickups": [
        { "fact": "Business analysis and growth strategy for a national mobile operator" }
      ]
    },
    {
      "id": 4,
      "name": "Telecom City",
      "company": "Telenor Pakistan",
      "years": "2012 to 2020",
      "role": "Four roles, from Assistant Manager to Product Manager",
      "summary": "Eight years across pricing and analytics, the high-value segment, mobile wallet growth and personalised offers.",
      "theme": "A small city in two districts",
      "districts": [
        {
          "name": "Signal City",
          "theme": "Rooftops and antennas, with offers flying to individual houses",
          "pickups": [
            { "fact": "+5% incremental ARPU against control through one-to-one personalisation" },
            { "fact": "Loyalty programme for high-value customers reached 8% engagement, built with a 10-member cross-functional team" },
            { "fact": "Secured PKR 50M investment from JS Bank for a co-branded proposition" }
          ]
        },
        {
          "name": "Wallet Bazaar",
          "theme": "A market street where shopkeepers pay by phone",
          "pickups": [
            { "fact": "Managed a PKR 1B per month fintech portfolio on the EasyPaisa mobile wallet" },
            { "fact": "Grew telco bundle penetration from 17% to 25%" },
            { "fact": "Go Getter Award 2018 and 2019; Employee of the Quarter 2018" }
          ]
        }
      ]
    },
    {
      "id": 5,
      "name": "Parcel Port",
      "company": "Daraz (Alibaba Group)",
      "years": "2020",
      "role": "Head of Performance and Cost, Platform Logistics",
      "summary": "Ran logistics performance and cost for Pakistan's largest e-commerce marketplace.",
      "theme": "A port and depot with delivery routes drawn across the island as glowing lines",
      "pickups": [
        { "fact": "Modelled 10,000+ origin-destination permutations across 10 logistics partners" },
        { "fact": "Cut customer promise times by 40%" },
        { "fact": "Payment risk model raised transaction success by 3% and cut shipping costs by 4%" }
      ]
    },
    {
      "id": 6,
      "name": "Food Delivery Street",
      "company": "Foodpanda Pakistan",
      "years": "2020 to 2024",
      "role": "Head of Growth and Performance, then Head of Merchant Performance, Content and Experience",
      "summary": "Built a new vertical from zero, then ran merchant performance and experience for the platform.",
      "theme": "A street-food market in two districts",
      "districts": [
        {
          "name": "Home Kitchens",
          "theme": "Houses with kitchen windows that open into food stalls",
          "pickups": [
            { "fact": "Built the Home Kitchens vertical from zero to 15,000 orders a day at peak, with 4,000+ active merchants" },
            { "fact": "Became the platform's second most profitable unit; the playbook was exported to Malaysia and Singapore" },
            { "fact": "60% GMV increase alongside a 30% cut in subsidy per order" }
          ]
        },
        {
          "name": "Merchant Row",
          "theme": "Restaurant fronts with menu boards and a help desk",
          "pickups": [
            { "fact": "A Llama model wrote dish descriptions across the catalogue, lifting orders by 18%" },
            { "fact": "Partner NPS grew fivefold; escalations fell 70%" },
            { "fact": "Partner fail rates down 33% and order delays down 30%" }
          ]
        }
      ]
    },
    {
      "id": 7,
      "name": "The Airfield",
      "company": "Delivery Hero (Foodpanda, Yemeksepeti, Foodora)",
      "years": "2025",
      "role": "Head of Merchant Health and Engagement, Partner Growth",
      "summary": "Steered merchant strategy for a global food delivery group across APAC, the EU and Turkey.",
      "theme": "A small airfield ringed by 18 plain coloured flags, with roads forking toward different regions",
      "pickups": [
        { "fact": "Merchant strategy across 18 countries, reporting to C-level" },
        { "fact": "Designed and launched the Regional Incubation Program in all 18 markets" },
        { "fact": "Relaunched the partner health score and set OKR cycles across Product, Finance and Operations" }
      ]
    },
    {
      "id": 8,
      "name": "The AI Lab",
      "company": "Independent consulting, AI and digital platforms",
      "years": "2025 to 2026",
      "role": "Builder, fractional AI lead and co-founder",
      "summary": "Left corporate life to build AI agents that do real work.",
      "theme": "A workshop yard of four machines; riding up to one switches it on and opens its project card",
      "machines": [
        {
          "title": "Multilingual GenAI agent",
          "client": "Sarmaaya Financials (Fractional Head of AI and Transformation, 2026)",
          "card": "diagram",
          "facts": [
            "A production agent in Urdu, Roman Urdu and English, built on Gemini and FastAPI",
            "2,000 to 3,000 active user interactions per day",
            "Qualified leads routed to CRM after a five-interaction threshold",
            "Part of an enterprise AI roadmap designed as a three-layer Revenue Funnelling System"
          ]
        },
        {
          "title": "BlockNow",
          "client": "Co-founder, UK healthcare AI venture, 2025 to present",
          "card": "footage",
          "media": "/media/blocknow.mp4",
          "facts": [
            "A voice agent, front-end interface and dashboard for GP staff",
            "Handles appointment booking calls for GP practices",
            "Designed to run under UK data-protection rules"
          ]
        },
        {
          "title": "Urdu voice agent for restaurant leads",
          "client": "foodpanda Pakistan, 2025 to 2026",
          "card": "diagram",
          "facts": [
            "Calls restaurants, answers merchant queries and qualifies pre-signup leads",
            "Built on Python, ElevenLabs and n8n with calendar-integrated scheduling"
          ]
        },
        {
          "title": "A ten-minute animated film for kids",
          "client": "Personal project, 2026",
          "card": "footage",
          "media": "/media/kids-film.mp4",
          "facts": [
            "70 scenes drawn in Python, with no design tool",
            "97 lines of narration voiced through ElevenLabs and timed to each scene"
          ]
        }
      ]
    },
    {
      "id": 9,
      "name": "The Classroom",
      "company": "Today",
      "years": "2026 onward",
      "role": "AI training and transformation for leadership teams",
      "summary": "The rider gets off the bike and starts teaching.",
      "theme": "An open-air classroom on a summit, with boards the visitor can read and an open door",
      "boards": [
        { "title": "Where a beginner should start", "body": "What AI is in plain language, the few tools a beginner needs, and three paths to go deeper: content and media, automation and agents, building with code." },
        { "title": "Picking the right model for the job", "body": "Most teams overpay by running everything on their biggest model." },
        { "title": "What makes an agent", "body": "Memory, tools and a way to act. Without all three it is a chatbot." }
      ],
      "cards": [
        { "title": "Top Search Agency", "body": "Co-founder. SEO and AI search for early-stage SaaS founders.", "removable": true }
      ],
      "closing": "Eighteen years of building things that work. Now teaching others to do the same with AI."
    }
  ]
}
```

Notes on the content:

- "diagram" cards show a small animated diagram, drawn in code, of how the system works, using only the facts listed. Show no screenshots and no client data.
- "footage" cards play the listed file. The two clips do not exist yet. Show a tidy placeholder frame when a file is missing.
- The `/cv` route is the timeline page. If Umar adds a PDF later, it will go in `public/`.

## Working rules

**Finishing.** Within a stage, continue until everything that stage asks for is done. Do not stop to offer to continue or to ask whether to proceed with the next part of the same stage. When you meet ordinary obstacles such as build errors, failing installs, blank canvases or a tool timing out, diagnose them and work through them. If something is deliberately blocked, leave it alone, report it and look for another safe way to finish.

**Checking your own work.** A 3D scene can compile and still render nothing, or render something ugly. Run the site, take screenshots with the browser tools available to you, and look at them before calling anything done. Check that pixels render, the rider is in frame, the camera does not clip through scenery, text is readable over the scene, and the phone layout works. Fix what you see.

**Approvals.** Get Umar's go-ahead before any of these: starting Stage 2; creating the GitHub repository (one go-ahead covers later pushes to it); the first Vercel deploy (later preview deploys are covered, promoting to production is not); and signing up for any third-party service that needs an account. These need no approval: installing npm packages, running the dev server and builds, taking screenshots, making local git commits, and retrying any of those when they fail.

**Progress.** Write one line before you start a stage, brief updates at natural milestones, and a closing report that stands on its own.

**Subagents.** Stage 1 is one coherent piece of design, so do it yourself. In Stage 2, delegate island scenery only once the engine's island interface has stopped changing, and only for islands that share no open design decisions; otherwise build them yourself. Workers run on Sonnet 5.5. Give each worker the goal, the engine's island interface, that island's JSON entry, the Stage 1 island as the quality reference, the look rules above, and the format to return: one scenery component plus a screenshot. Review every island yourself against the Stage 1 look before accepting it. If one fails that review, rebuild it yourself and do not send it back a second time.

**Reports.** Write for a reader who saw none of your tool calls or files. Lead with what works and what does not, in plain words and short active sentences. Then list the decisions you made on Umar's behalf, any placeholders left, the performance numbers against budget, and what you need from him. For Stage 1, end by asking for approval of the look and the steering feel, and name anything you think should change before the other eight islands are built.
