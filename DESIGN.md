---
name: Sapu Berita
description: The article alone, set like a great newspaper's own web edition, swept clean on the reader's device.
colors:
  paper: "rgb(255 255 255)"
  ink: "rgb(18 18 18)"
  muted: "rgb(92 92 92)"
  rule: "rgb(0 0 0 / 0.1)"
  rule-strong: "rgb(0 0 0 / 0.26)"
  chip: "rgb(0 0 0 / 0.045)"
  panel: "rgb(255 255 255)"
  lidi-ochre: "rgb(176 122 18)"
  plate: "transparent"
  shadow: "rgb(0 0 0 / 0.16)"
  sepia-paper: "rgb(247 241 228)"
  sepia-ink: "rgb(44 34 22)"
  sepia-muted: "rgb(104 88 68)"
  sepia-rule: "rgb(60 40 10 / 0.12)"
  sepia-rule-strong: "rgb(60 40 10 / 0.3)"
  sepia-chip: "rgb(60 40 10 / 0.06)"
  sepia-panel: "rgb(251 247 238)"
  sepia-lidi-ochre: "rgb(160 106 10)"
  sepia-plate: "rgb(255 255 255)"
  sepia-shadow: "rgb(60 40 10 / 0.2)"
  dark-paper: "rgb(18 18 18)"
  dark-ink: "rgb(232 232 230)"
  dark-muted: "rgb(168 168 165)"
  dark-rule: "rgb(255 255 255 / 0.12)"
  dark-rule-strong: "rgb(255 255 255 / 0.28)"
  dark-chip: "rgb(255 255 255 / 0.07)"
  dark-panel: "rgb(30 30 30)"
  dark-lidi-ochre: "rgb(222 172 70)"
  dark-plate: "rgb(255 255 255)"
  dark-shadow: "rgb(0 0 0 / 0.5)"
  logo-ground-fallback: "rgb(24 24 24)"
typography:
  headline:
    fontFamily: 'Charter, "Bitstream Charter", "Iowan Old Style", "Sitka Heading", Cambria, Georgia, "Noto Serif", serif'
    fontSize: "clamp(1.55em, 1.05em + 2.2vw, 2.15em)"
    fontWeight: 700
    lineHeight: 1.14
    letterSpacing: "-0.012em"
  deck:
    fontFamily: 'Charter, "Bitstream Charter", "Iowan Old Style", "Sitka Text", Cambria, Georgia, "Noto Serif", serif'
    fontSize: "1.08em"
    fontWeight: 400
    lineHeight: 1.45
  title:
    fontFamily: 'Charter, "Bitstream Charter", "Iowan Old Style", "Sitka Text", Cambria, Georgia, "Noto Serif", serif'
    fontSize: "1.28em"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: 'Charter, "Bitstream Charter", "Iowan Old Style", "Sitka Text", Cambria, Georgia, "Noto Serif", serif'
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.62
  body-sans:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.62
  body-legible:
    fontFamily: 'Verdana, "Segoe UI", Tahoma, "DejaVu Sans", sans-serif'
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0.005em"
  meta:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: "0.74em"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: '"tnum"'
  caption:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: "0.72em"
    fontWeight: 400
    lineHeight: 1.45
  control:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
  outlet-name:
    fontFamily: 'Charter, "Bitstream Charter", "Iowan Old Style", "Sitka Text", Cambria, Georgia, "Noto Serif", serif'
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
rounded:
  plate: "4px"
  icon: "6px"
  segment: "7px"
  control: "10px"
  panel: "14px"
  sheet: "16px"
  pill: "999px"
spacing:
  hair: "1px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  bar-height: "56px"
  column: "34em"
components:
  masthead-bar:
    backgroundColor: "{colors.paper}"
    height: "{spacing.bar-height}"
    padding: "0 16px"
  logo-plate-dark:
    backgroundColor: "{colors.logo-ground-fallback}"
    rounded: "{rounded.plate}"
    padding: "4px 8px"
  button-pill:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    height: "34px"
    padding: "0 13px"
  button-pill-hover:
    backgroundColor: "{colors.chip}"
  button-pill-expanded:
    backgroundColor: "{colors.chip}"
  progress-hairline:
    backgroundColor: "{colors.lidi-ochre}"
    height: "2px"
  settings-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    width: "320px"
    padding: "14px 16px 18px"
  segmented-control:
    rounded: "{rounded.control}"
    padding: "3px"
  segmented-option:
    backgroundColor: "transparent"
    rounded: "{rounded.segment}"
    height: "38px"
    padding: "6px 4px"
  segmented-option-selected:
    backgroundColor: "{colors.chip}"
  switch:
    backgroundColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    width: "42px"
    height: "26px"
    padding: "3px"
  switch-on:
    backgroundColor: "{colors.lidi-ochre}"
  size-stepper-button:
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    width: "44px"
    height: "38px"
  reopen-button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 16px 0 14px"
---

# Design System: Sapu Berita

## Overview

**Creative North Star: "The Paper's Own Web Edition"**

Sapu Berita sets a swept Indonesian news article the way a great newspaper sets its own web edition: serif authority for the journalism, generous white space, order kept by hairline rules rather than boxes. The reader should feel they are reading the outlet's story in its best possible form, not a generic reader-mode card and not the outlet's cluttered chrome. Everything that belongs to the journalism (headline, deck, body, subheads) is serif; everything that belongs to Sapu Berita or to the page's bookkeeping (bylines, dates, captions, labels, controls) is a quiet grey sans.

Density is low and vertical: one centered column, one slim bar above it, nothing in the margins. Colour is almost absent. Paper and ink carry the page; a single accent, lidi ochre (the straw colour of a sapu lidi broom), appears only where Sapu itself is acting: the reading-progress hairline, the active setting, the sweep line at the end. Three grounds exist and are first-class: paper white, warm newsprint sepia, and ink-black dark.

The overlay lives inside one Shadow DOM over the original page, so the system is self-contained: system font stacks only, colours written as `rgb()` only, no external assets. The Sapu broom mark and lidi ochre are the shared identity with the planned sibling product Sapu Buzzer and must stay recognisably the same across both.

**Key Characteristics:**
- Serif for the journalism, grey sans for everything that is ours.
- Hairline rules (1px, low-alpha ink) instead of cards, fills or shadows on the page.
- One accent, lidi ochre, reserved for Sapu marks; never decoration, never text.
- Three grounds (paper, sepia newsprint, ink-black) with per-theme tuned tokens.
- The outlet's own logo, trimmed, sized optically and recoloured only when it would vanish, credits whose journalism this is.
- System font stacks, `rgb()` colours, one Shadow DOM: constraints, not preferences.

## Colors

Paper and ink with one straw-coloured mark; every token is re-tuned per ground rather than inverted.

### Primary
- **Lidi Ochre** (`lidi-ochre`; `sepia-lidi-ochre` and `dark-lidi-ochre` per ground): the Sapu mark. Reading-progress hairline, the border of an active segmented option and of the expanded Aa button, a switch's on track, the active size dot, the broom in the sweep line, focus rings, link underlines on hover, and (at 32% mixed with transparency) text selection. Brighter on dark, deeper on sepia, so it keeps its weight on each ground.

### Neutral
- **Paper** (`paper`, `sepia-paper` warm newsprint, `dark-paper` ink-black): the page ground and the masthead bar ground (the bar is the page, separated only by a hairline).
- **Ink** (`ink`, `sepia-ink`, `dark-ink`): headline, body, section name in the meta row, active controls. Near-black, never pure black; warm brown-black on sepia; off-white on dark.
- **Grey Sans Muted** (`muted` and per-ground variants): deck, byline and date, captions, setting labels, hints, list markers, and the switch's off track (chosen over the rule colour to hold 3:1 against the panel).
- **Hairline** (`rule`): bar bottom border, blockquote and table rules, `hr`, settings group dividers, panel border, segmented-control outline.
- **Strong Hairline** (`rule-strong`): pill button outlines, swatch rings, inactive size dots, the meta-row `·` separator, link underline at rest, scrollbar thumb.
- **Chip** (`chip`): the only fill: hover and selected states, image placeholder ground.
- **Panel** (`panel`, `sepia-panel`, `dark-panel`): the settings popover/sheet ground; one step lifted from the page on sepia and dark.
- **Plate** (`plate`, `sepia-plate`, `dark-plate`): fallback ground behind the outlet logo, used only when its pixels cannot be read. Transparent on paper; white on sepia and dark.
- **Logo Ground Fallback** (`logo-ground-fallback`): used only when a logo was detected on a dark header but its exact colour is unknown. Normally the plate takes the site's own header colour, read live from the page.

### Named Rules
**The Lidi Rule.** Lidi ochre marks only what Sapu is doing: progress, the active setting, the sweep. It never fills a surface, never colours text, never decorates. If removing it would not lose information about Sapu's state, it should not be there.

**The rgb() Rule.** Every colour is written as `rgb()` (space-separated, `/ alpha` for translucency). No hex anywhere in shipped CSS or markup: the iOS Shortcut build chokes on `#`.

**The Retune Rule.** A new token gets a value for every ground (light, sepia, dark). Grounds are tuned, not inverted.

## Typography

**Display Font:** Charter (with Bitstream Charter, Iowan Old Style, Sitka Heading, Cambria, Georgia, Noto Serif, serif)
**Body Font:** Charter (with Bitstream Charter, Iowan Old Style, Sitka Text, Cambria, Georgia, Noto Serif, serif); reader-switchable to the sans stack or to the legible stack (Verdana, Segoe UI, Tahoma, DejaVu Sans)
**Label Font:** the platform UI sans (-apple-system, BlinkMacSystemFont, Segoe UI Variable Text, Segoe UI, Roboto, Helvetica Neue, Arial)

**Character:** A transitional book serif with newspaper sturdiness, paired with the reader's own system UI sans kept small and grey so it reads as apparatus, not voice. The display stack differs from the body stack only in pulling Sitka's heading cut on Windows.

### Hierarchy
The article column's sizes are in `em` against the reader's text size, five steps (16, 17.5, 19, 21, 23.5px; default 19px), 1.5px smaller on phones under 600px. Chrome sizes are fixed px.
- **Headline** (700, fluid clamp, 1.14, -0.012em, balanced wrap): the article title, the largest thing on the page. Nothing sits above it.
- **Deck** (400, 1.08em, 1.45, muted, pretty wrap): the standfirst, shown only when it does not repeat the article's opening.
- **Title** (700, 1.28em / 1.12em / 1em for h2 / h3 / h4, 1.25, balanced): subheads inside the article, always serif even when the body is switched to sans.
- **Body** (400, 19px default, 1.62; legible face 1.7 with 0.005em tracking): the journalism. Column capped at 34em.
- **Meta** (400, 0.74em, 1.5, tabular numerals): section (ink, 600) · byline · date in the reader's timezone label. Each part stays whole; the row breaks only at the separators.
- **Caption** (400, 0.72em, 1.45, muted): figcaptions and the sweep line. Tables use the sans at 0.78em with tabular numerals.
- **Control** (600, 14px): pill buttons, reopen button, segmented options (400, 600 when selected).
- **Label** (600, 12px, muted, sentence case): settings group labels. Panel heading 600 15px.

### Named Rules
**The Two Voices Rule.** Serif is the journalism's voice; sans is ours. A new element is serif only if it is the outlet's words.

**The System Stack Rule.** System font stacks only. News-site CSP blocks web fonts and the bundle must stay small for the iOS Shortcut time limit.

**The Bold Is B Rule.** Bold is rendered as `<b>`, never `<strong>`: Brave Shields hides every `<strong>` on some news domains, even inside Shadow DOM.

## Layout

One centered column, `min(100% - 32px, 34em)` wide, measured in the reader's text size so line length stays comfortable at every size step. The column opens 2.2em below the bar: headline, deck, meta row, then the hero image at full column width (1.4em above it), then the article body 1.6em lower. Vertical rhythm inside the article is em-based: paragraphs 1.05em apart, subheads 1.7em above and 0.5em below, figures and tables 1.6em, blockquotes 1.7em, `hr` 2em. The sweep line closes the column 2.6em below the last paragraph, with 3.5em of run-out beneath.

The masthead bar is sticky, 56px tall, 16px side padding (respecting safe-area insets), logo left and controls right with 8px between them. Chrome spacing runs on a 4 / 8 / 12 / 16px set.

Single breakpoint at 600px: body text drops 1.5px, and the settings panel turns from a 320px popover anchored under the bar (top 64px, right 12px) into a full-width bottom sheet capped at 82vh, padded for the home indicator.

## Elevation & Depth

The page is flat. Depth on the reading surface comes only from hairlines and the sticky bar's bottom rule. Shadows exist on exactly the things that float above the article: the settings panel, the switch knob, and the reopen button.

### Shadow Vocabulary
- **Panel float** (`box-shadow: 0 16px 40px -8px var(--shadow), 0 2px 6px var(--shadow)`): the Aa settings popover and bottom sheet. The `shadow` token is retuned per ground.
- **Knob** (`box-shadow: 0 1px 3px rgb(0 0 0 / 0.3)`): the white thumb of a switch.
- **Reopen lift** (`box-shadow: 0 6px 20px -4px rgb(0 0 0 / 0.4)`): the floating button over the original page.

### Named Rules
**The Hairline Order Rule.** On the reading surface, structure is drawn with 1px rules, never with cards, fills or shadows. Shadows are for things that float over the page.

## Shapes

Square on the page, softly rounded in the chrome. Article images, the hero, rules and the summary box have no radius. Controls are pills (outline buttons, switches, reopen button) or gently rounded rectangles (segmented control 10px outer / 7px inner, size stepper 10px); the settings panel is 14px, its sheet form 16px on the top corners only. The logo plate is 4px, square app-icon logos 6px. Circles are reserved for swatches, size dots, the close button and the switch thumb.

Icons are authored SVG on a 24px grid, 1.6 stroke, round caps and joins, `currentColor`: the broom (Sapu mark), a close cross, and an out-arrow. No icon fonts, no emoji, no character glyphs as icons.

## Components

### Buttons
Quiet outlined pills that read as part of the masthead, not as calls to action.
- **Shape:** full pill, 34px tall, 1px strong-hairline outline, transparent ground.
- **Aa (settings):** serif bold "A" at 18px beside "a" at 13px, tight tracking; opens the settings panel. When expanded its outline turns lidi ochre over a chip fill.
- **Asli / Original:** the same pill with a sans label; hides the overlay and reveals the untouched original page.
- **Hover / Focus:** chip fill on hover (160ms, shared ease); a 2px lidi-ochre focus ring offset 2px on every focusable element.
- **Icon button:** 36px circle, muted glyph, chip fill and ink on hover (panel close).

### Masthead Bar and Outlet Logo
The outlet's identity, at the top-left of every view. The logo is found automatically from the live page (no per-site lists) and loaded once in CORS mode so its pixels can be read:
- **Trimmed** to its drawn pixels (the padding logos ship with is cropped away).
- **Sized optically**: equal visual weight, not equal height. Height = √(3200 / aspect), clamped 20 to 34px and capped at 210px wide; square app-icon badges are 30px and paired with the outlet name in bold serif.
- **Recoloured per theme only when needed**: if the logo's lighter part has under 3:1 contrast against paper/sepia it renders as ink (`brightness(0)`, 86% opacity); if its darker part has under 3:1 against the dark ground it renders white (`brightness(0) invert(1)`, 92%). Mid-tone logos (Liputan6 orange) and opaque badges (CNN) are never recoloured.
- **Plate fallback** only when the server forbids pixel reads: the whole logo on the site's own dark header colour, or white in dark themes.
A broken logo falls back to the name alone. The whole logo links to the original article.

### Progress Hairline
A 2px lidi-ochre line along the bar's bottom edge, scaled from the left as the reader scrolls. The first of the three Sapu marks.

### Article Header
Headline, deck (only when distinct from the opening), then the meta row in grey sans. No kicker, label or section tag above the headline; the section name lives in the meta row.

### Summary Box (blockquote)
Outlets' own summary boxes are set between a 2px ink rule above and a hairline below, at 0.94em, no fill and no side bar. A leading bold line becomes the box's title in sans 700 at 0.74em, uppercase with 0.04em tracking. This uppercase treatment belongs to the summary box alone.

### Sweep Line
The end-of-article receipt, after a hairline: the broom mark in lidi ochre with "N distractions swept" in ink 600, "N pages merged" in muted, and "Read on the original site" with an out-arrow pushed to the right. Caption-sized sans. Optional in settings; when off, the column just ends.

### Settings Panel
- **Container:** panel ground, 1px hairline border, 14px radius, panel-float shadow; 320px popover on wide screens, bottom sheet at 600px and under. Opens with a 6px (16px on phones) rise and fade (opacity 160ms, transform 200ms).
- **Groups:** separated by hairlines, each with a 12px muted label.
- **Segmented control:** hairline-outlined track, 3px inset, equal columns. Selected option takes a chip fill, lidi-ochre 1px border and weight 600. The Font control previews each face in itself; the Theme control prefixes each option with an 18px swatch of its ground.
- **Size stepper:** "A−" and "A+" in bold serif in 44x38px hairline boxes either side of five dots; the current dot grows to 9px in lidi ochre. Disabled ends fade to 35%.
- **Switches:** 42x26px pill, muted track off, lidi-ochre track on, 20px white thumb sliding 16px (180ms).

### Reopen Button
While the original page is showing, a 44px ink-black pill floats bottom-right with the broom mark and "Baca bersih / Clean view" in white. It sits outside the themed root, so it is ink-black on every ground.

## Do's and Don'ts

### Do:
- **Do** set the outlet's words in the serif and everything of ours in the grey sans (The Two Voices Rule).
- **Do** keep lidi ochre to Sapu marks: progress, active setting, sweep line, focus.
- **Do** write every colour as `rgb()` and give every new token a light, sepia and dark value.
- **Do** draw order with 1px hairlines (`rule`, `rule-strong`) and white space.
- **Do** size article elements in `em` against the reader's text size; keep the column at 34em.
- **Do** use the shared ease `cubic-bezier(0.2, 0.8, 0.2, 1)` at 160 to 200ms for state changes, and drop transitions under reduced motion.
- **Do** draw icons as authored 24px SVG at 1.6 stroke in `currentColor`, and reuse the broom mark as is; it is shared with Sapu Buzzer.
- **Do** keep each meta-row part (section, byline, date) unbroken; wrap only at the separators.

### Don't:
- **Don't** load web fonts or external assets; system font stacks only, everything inside the one Shadow DOM.
- **Don't** write hex colours anywhere in shipped code.
- **Don't** emit `<strong>`; bold is `<b>`.
- **Don't** put a kicker, eyebrow or section label above the headline.
- **Don't** use lidi ochre for text, fills, backgrounds or decoration.
- **Don't** wrap the article in cards, tinted panels or side-striped callouts; the reader-mode card with blue accents is the anti-reference.
- **Don't** hard-code per-site logos or colours; the logo and its dark ground are detected from the live page.
- **Don't** spread the summary box's uppercase tracked title to other labels; labels are sentence case.
