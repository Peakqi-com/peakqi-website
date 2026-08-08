---
title: I can't code. I built a website with Claude Code.
summary: 414 commits across 16 working days, July 16 to August 8, 2026. One person, a 32-page bilingual company site, built from nothing. This is the working record — including the day I got stuck, what I threw away, and one solution I didn't see coming.
date: 2026-08-08
tags: build-notes, ai-adoption
cover: /assets/blog/tower.webp
coverAlt: The Brand House 3D tower — six rooms for six businesses, walked through floor by floor as you scroll
updated:
---

I'm Allen, part of the team at PEAKQI Co., Ltd. in Taiwan. Before this project, I couldn't write code.

Between July 16 and August 8, 2026, I built our company site [peakqi.com](https://peakqi.com) from scratch using [Claude Code](https://claude.com/claude-code) — 32 pages across two languages, a three.js scroll-driven sequence, a WebGL enhancement layer that can be switched off entirely, and two asset generation pipelines I wrote along the way.

All of it is public on [GitHub](https://github.com/Peakqi-com/peakqi-website). The commit history has not been cleaned up.

This isn't a success story. It's a working record.

---

## What the site actually is

Not a template. The specs:

| Item | Detail |
|---|---|
| Architecture | Vanilla JavaScript, no frontend framework. All copy, pricing and case data live in a single `content.js` |
| Homepage | three.js loads a 42-mesh camera GLB that assembles, disassembles, walks through each component, unfolds into a blueprint, reassembles and flips — six scroll-driven stages |
| Render layers | `hero-engine.js` (Canvas 2D sequence), `gl-engine.js` (WebGL enhancement, fully disableable), `micro-engine.js` (micro-interactions) |
| Degradation | reduced-motion, save-data, deviceMemory < 4, width < 900, context lost, shader failure — any one triggers automatic fallback with the narrative fully intact |
| Asset generators | `tools/gen-allen-art.mjs` (194 SVG paths sorted into nine rigid bodies) and `tools/gen-allen-room-assets.py` (40-layer decomposition with a built-in self-check) |
| Deployment | Vercel + GitHub Actions; form submissions route through a serverless function to Google Sheets / Email / Notion |
| Languages | Traditional Chinese and English, 16 pages each |

![Homepage sequence, stage 02 "disassemble": the camera body and its caption card on screen together, stage index on the right](/assets/blog/camera.webp)

If you'd rather just look at the result, the [homepage](/en/), [case studies](/en/cases) and [pricing](/en/pricing) show the differences most clearly.

---

## The 16 days

| Date | Commits | What happened |
|---|---|---|
| Jul 16–18 | 28 | Skeleton, deployment pipeline, solutions page animation |
| Jul 19 | 60 | Homepage camera sequence; the LCD video problem (next section) |
| Jul 20–21 | 52 | Scene architecture refactor, full mobile pass |
| Jul 22 | 61 | Six creatures, brand card animations, sitewide copy rewrite |
| Jul 23 | 2 | Responsive fixes |
| *Jul 24–31* | *0* | *Stopped* |
| Aug 1–2 | 12 | Clean URLs, form endpoint live |
| Aug 3–4 | 51 | Mobile audit, technical SEO, design sprint |
| Aug 5 | 57 | Three rounds of real-device feedback, character scenes, menu easter eggs |
| Aug 6 | 45 | The entire English site, 16 pages |
| Aug 7–8 | 41 | Final polish |

Most days ran 3–4 hours. Sprint days ran longer.

As of August 8, 2026 the repo holds **414 commits**, 409 of them inside those 16 working days (the other 5 are from setting up the domain and repo back in May). You can count them yourself with `git rev-list --count HEAD`.

---

## The day I got stuck: July 19

I wanted five short business videos playing on the LCD screen on the back of the 3D camera. It sounds small. More than half of that day's 60 commits went into this one thing.

The sequence, straight from the log:

1. three.js `VideoTexture` on a plane → video overflowed the screen
2. Endless coordinate tweaking (`vpx0.88/vpy-0.06`, `vpx0.667/vpy-0.251`, `vpx0.851/vpy-0.268`…)
3. A shader rounded-box SDF mask for the corners
4. Custom 8-control-point BufferGeometry with beveled corners to match the screen opening
5. **Stuttering, sharp corners, drift — approach abandoned entirely**
6. Switched to a DOM video overlay: project the 3D screen's control points to viewport pixels every frame, set `clip-path` dynamically
7. Anchor points were still guesses → re-anchored to the actual screen mesh inside the GLB (`Object_12`)
8. Angle hunting: +3° → clipped the corners → 0° → +1.5° → −2°
9. Bumped the corners to 24 control points, but the `clip-path` loop was still hardcoded to 8 → **the video rendered as a thin strip along the top edge**
10. Fixed, moved to four-corner positioning with quadratic Bézier rounding
11. Adjusted the bottom-right corner alone

Eleven attempts. At that point I was out of ideas.

Then Claude Code did something I didn't expect: **it built a tool that let me drag the four corners into place with my mouse.**

Four blue handles appeared on screen. I dragged them; it reprojected onto the 3D mesh in real time and rebuilt the clip path, while a panel in the corner displayed a coordinate array I could paste straight back into the source. I dragged, copied, pasted.

The next commit reads:

> Video corners now use the exact values the user positioned with `__cornerTool` — precise fit to the screen

![Homepage sequence, stage 03 "glowing linework": the camera separated into components, rendered as wireframe](/assets/blog/blueprint.webp)

The thing I couldn't compute all day was solved by not computing it — by building an interface and handing the judgment back to the person who could see the screen.

I had assumed the value of AI writing code was that it calculates better than I do. That day I learned otherwise. The value was that it knew when to stop calculating, hand the decision back to me, and build the handoff tool on its way out.

---

## Failures and rollbacks

On July 22 I tried letting it automatically redesign the "six capabilities" section. The result was unusable.

The commit:

> Restore six capabilities section: remove failed automated editorial design experiment (583c6f7)

After the rollback I did it by hand instead: a Swiss editorial grid first, then six characters breaking out of it one at a time — 01 sits on a grid line and bends the hairline under its weight, 02 does pull-ups on the top rule, 03 lies flat across it, 04 swings one-handed, 05 walks a tightrope, 06 hangs upside down beneath the line. Six separate commits, one character at a time.

![Six component creatures, each breaking the grid in a different posture; the 2px black line under their feet is the Swiss editorial grid](/assets/blog/creatures.webp)

It took longer than the automated pass. It came out far better. The division of labour I took from this: **structure can be delegated. Taste cannot.**

---

## Honesty turned out to be an engineering problem

A few commits I want to single out:

> `PeakOps P4: honesty corrections (remove untrue and self-contradictory statements)`
>
> `Pricing rebuild: … remove unsupportable promises`
>
> `Cases page Phase B: card states, case numbering, lightbox copy (honest, not invented)`

Marketing copy slides easily into sentences that sound impressive, say nothing, and sometimes contradict the previous paragraph. Claude flagged those. I didn't ask it to — it raised them while working through drafts.

There is still a set of things on the site left deliberately blank, because writing them would mean inventing them: contract terms, the exact nature of any guarantee, specific security claims, outcome numbers for case studies. I don't have evidence I can stand behind yet, so I'd rather not write it. That's also why [pricing](/en/pricing) says "quoted to your needs" instead of a number.

The most common failure of a new company's website is describing itself as bigger than it is. A collaborator who catches that is worth more than one who writes better CSS.

---

## How we ended up working

### Verification probes

The repo has a `.peakops-audit/` directory holding pages that aren't on any route. Headless browsers barely run `requestAnimationFrame`, so those pages accept a `?step=N` parameter: swap rAF for a manual fixed-dt clock and advance N frames. Screenshots become reproducible.

This turned "does the animation look right" from a matter of opinion into a pixel diff.

### Parallel agent review

The August 3 mobile audit commit reads:

> 32 confirmed issues fixed and re-verified (55+8 agents, two rounds)

Agents ran different viewports and scenarios, reported findings, and re-verified after fixes.

### Shared vocabulary

"Parent animation" meant the scroll-driven spine; "child animation" meant the self-running timeline inside a given scene. That vocabulary emerged partway through on its own. After that I could say "the child animation in this scene is frozen" and it knew where to look.

### Root causes, not symptoms

An August 5 commit:

> Real reason the robots aren't standing on the line: the line under their feet is nearly invisible

What I reported was "the robots aren't standing properly." The actual problem was contrast.

---

## One indulgence

There's a robot on the [about page](/en/about), standing in his own workshop. His name is Allen.

The workshop is built from 40 hand-separated layers. It shifts between day, dusk and night based on the visitor's local clock. Clouds drift past the window; at night there are stars and a moon that rises slowly. The clouds occlude the stars, a cloud glows faintly when the moon rises behind it, and moonlight falls on the buildings outside. Six things are clickable — the window, the desk lamp switch, the mug, the poster, the console, the tool rail — and he turns his head to look at whichever one you touch.

![Allen's workshop in daylight](/assets/blog/allen-day.webp)

![The same workshop at night: stars, the moon, and moonlight spilling in through the window](/assets/blog/allen-night.webp)

Technically it's the hardest thing on the site. The time-of-day system isn't three prepared background images; it's two grading layers — multiply for darkening, screen for lifting — derived analytically in sRGB space (measured average deviation: 0.3 levels).

The asset generator validates itself by recomposing base plate plus components and comparing against the original, pixel by pixel. One detail is worth stating precisely: **the gate is not RMSE.** Rasterising at a larger size and scaling back shifts every outline by about a pixel — a difference RMSE sees and the eye does not. What actually needs catching is "a whole block went missing", so the gate is: zero connected regions where the difference exceeds 60. Current RMSE is 3.74, with zero failing regions.

There was no business reason to build any of it. I just wanted to put a version of myself inside the site I'd built.

---

## August 6: the entire English site in one day

45 commits, 16 English pages shipped.

That covered the i18n foundation, the canvas-drawn strings throughout `hero-scenes.js` wrapped in `t()`, 153 asset paths made absolute, a bilingual sitemap (33 URLs each carrying the hreflang triplet), bilingual JSON-LD, and `/en` routing. Zero pixel regression on the Chinese site.

That's the day of this project I still find hardest to believe.

---

## Numbers

| Item | Value |
|---|---|
| Total commits | 414 (as of 2026-08-08) |
| Working days | 16, spanning 24 calendar days |
| Developers | 1 (company team of 3) |
| Most days | 3–4 hours |
| Pages | 16 per language, 32 total |
| Tooling | Claude Code on a Claude Max subscription |
| Other AI tools used | None, at any stage |
| My programming background | None |

---

## If you're on the fence

If you're where I was a year ago — able to judge whether something is good, unable to build it — my experience is that the "unable to build it" half is now something you can delegate.

Don't delegate the judgment. The automated redesign on July 22 failed precisely because I handed over taste along with structure. Everything in this project that came out well came from knowing what I wanted and spending the time to say it clearly.

All source is public at [github.com/Peakqi-com/peakqi-website](https://github.com/Peakqi-com/peakqi-website). The commit history is unedited. Every claim above can be checked against it.

If you want to talk about wiring AI into your own workflow, [book a 15-minute assessment](/en/demo).
