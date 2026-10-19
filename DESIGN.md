---
name: PC Price Estimator
description: Pick PC parts and value the build at eBay.ca market prices, in CAD.
colors:
  ground: "#f1f3f4"
  paper: "#ffffff"
  paper-2: "#eceef0"
  ink: "#141414"
  ink-2: "#3b3b37"
  muted: "#5b5b55"
  faint: "#6b6b64"
  rule: "#d4d4cc"
  rule-strong: "#141414"
  guide-yellow: "#f2c200"
  conflict: "#b30f29"
  conflict-bg: "#fbecee"
typography:
  display:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1
    fontVariation: "'wdth' 75"
  total:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 75"
  headline:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1
    fontVariation: "'wdth' 75"
  title:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.4
    fontVariation: "'wdth' 75"
  category:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.25
    fontVariation: "'wdth' 75"
  figure:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.55
    fontFeature: "'tnum' 1"
  body:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
    fontFeature: "'tnum' 1"
  picker:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.375
  spec:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.05em"
  note-marker:
    fontFamily: "Archivo, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
rounded:
  none: "0px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "40px"
components:
  masthead:
    backgroundColor: "{colors.guide-yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    height: "64px"
    padding: "0 24px"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    height: "40px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.ink-2}"
    textColor: "{colors.paper}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "40px"
    padding: "0 16px"
  button-secondary-hover:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink}"
  button-small:
    height: "32px"
    padding: "0 10px"
  field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "40px"
    padding: "0 12px"
  part-picker:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.picker}"
    rounded: "{rounded.none}"
    height: "44px"
    padding: "10px 40px 10px 36px"
  part-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "16px 20px"
  part-row-conflict:
    backgroundColor: "{colors.conflict-bg}"
    textColor: "{colors.ink}"
  valuation-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    width: "400px"
  total-band:
    backgroundColor: "{colors.guide-yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.total}"
    padding: "16px 20px"
  conflict-box:
    backgroundColor: "{colors.conflict-bg}"
    textColor: "{colors.conflict}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  saved-build-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
---

# Design System: PC Price Estimator

## Overview

**Creative North Star: "The Price Guide"**

The app reads like a collector's printed price guide for used PC parts: ruled tables of market evidence, an honest footnote wherever a figure is thin, and one valuation total that matters more than anything else on the page. It is a light, paper-and-ink world built for a desk where bright eBay and Marketplace tabs sit alongside it, so nothing glows and nothing is dark. Density is moderate and tabular: every category gets the same row anatomy, and the price always lands in the same column.

Hierarchy comes from rule weight, condensed uppercase type and one reserved ink, not from cards, color fills or shadows. Black rules frame the major containers, grey hairlines separate rows, and corners are square everywhere. Guide yellow marks only the masthead and the total. Red only ever means a compatibility conflict. Price caveats are numbered footnotes, never colored badges.

The world rejects gamer and RGB styling and the generic SaaS dashboard look (a card per part with a brand-blue sidebar summary).

**Key Characteristics:**
- Light cool-grey ground, white tables, near-black ink and rules.
- One typeface (Archivo) on a variable width axis: condensed extrabold uppercase for headings, category names and totals, normal width for everything else.
- Tabular figures everywhere, right-aligned into one decimal-aligned price column.
- Guide yellow reserved for the masthead and the total band.
- Square corners; flat surfaces; one soft shadow, on the open dropdown only.
- A total that rolls up as each price lands.

## Colors

A printed-guide palette: cool off-white paper, near-black ink, one reserved yellow and one reserved red.

### Primary
- **Guide Yellow** (guide-yellow): the masthead band and the build total band (the sheet's band and the phone's pinned total bar). Nothing else. Ink text always sits on it.

### Secondary
- **Conflict Red** (conflict): compatibility conflicts only: the reason lines under a part, the flagged options in a dropdown, and the bordered compatibility box in the valuation sheet. Darkened from a brighter signal red so it passes AA on its own pink tint.
- **Conflict Tint** (conflict-bg): the background of a part row that has a conflict, of incompatible dropdown options, and of the compatibility box. The highlighted incompatible option uses a slightly deeper pink so the keyboard cursor stays visible.

### Neutral
- **Cool Ground** (ground): the page background behind the tables.
- **Table White** (paper): tables, the valuation sheet, cards, fields, buttons.
- **Pressed Paper** (paper-2): hover on secondary buttons and dropdown rows, and loading skeleton blocks.
- **Ink** (ink): body text, heavy rules, primary button fill, focus outlines, selection highlight.
- **Soft Ink** (ink-2): secondary prose (intro, notes, status lines, listing counts) and primary-button hover.
- **Muted** (muted): spec lines, column heads, field labels, "n/a" prices, clear-button icons.
- **Faint** (faint): placeholders, empty-value dashes, "Not picked".
- **Hairline** (rule): grey row dividers, dotted sheet lines, unselected card borders.
- **Rule Black** (rule-strong): the same value as ink, named for its role as the 1.5–2px structural rule.

### Named Rules
**The Reserved Yellow Rule.** Guide yellow appears on the masthead and the total band, and nowhere else. No yellow buttons, highlights, badges or hover states. If a new surface needs emphasis, use rule weight or condensed type.

**The Red Means Conflict Rule.** Conflict red and its tint are used only for part compatibility problems. Price caveats, unsaved changes, errors and destructive actions do not borrow it.

## Typography

**Display Font:** Archivo, condensed cut (variable `wdth` 75), with ui-sans-serif / system-ui fallback
**Body Font:** Archivo, normal width
**Label/Mono Font:** none distinct; labels are small bold uppercase Archivo

**Character:** One family doing two voices. The condensed extrabold uppercase cut is the guide's headline and price-board voice; the normal width is the plain reading voice for part names, specs and notes.

### Hierarchy
- **Display** (800, condensed, 2.25rem on phones, 3rem from 640px, line-height 1, uppercase): the page title, which is the open build's name or "New build".
- **Total** (800, condensed, 2.75rem, line-height 1, -0.025em, uppercase, tabular): the estimated total in the yellow band; the pinned phone bar uses 1.875rem. It is the largest figure on the page.
- **Headline** (800, condensed, 1.875rem, uppercase): section heads outside the main tables ("My Builds").
- **Title** (800, condensed, 1.25rem, uppercase): table and sheet heads ("Parts", the sheet's build name), saved-build card names; the masthead wordmark uses this voice at 1.25rem / 1.75rem.
- **Category** (800, condensed, 1.125rem, uppercase): the category name at the start of each part row.
- **Figure** (700, 1.125rem, tabular): the median price in each part row. Sheet line prices are 600 at 0.875rem; card totals use the condensed 1.5rem voice.
- **Picker** (600, 0.9375rem): a picked part's full name inside its search box; typed queries use the same size at 400.
- **Body** (400, 0.875rem): banners, intro, status lines, sheet line items, dropdown option names (600).
- **Spec** (400, 0.8125rem, muted): the spec line under a part, joined with " · ". Conflict reasons use the same size at 600 in red.
- **Label** (700, 0.6875rem, 0.05em tracking, uppercase, muted): table column heads, sheet category labels, field labels, "Estimated total".
- **Note marker** (700, 0.6875rem superscript): footnote numbers after a price.

### Named Rules
**The Condensed Voice Rule.** Condensed uppercase extrabold is for headings, category names and totals. Part names, specs, prose and buttons stay at normal width and in sentence or title case.

**The One Column Rule.** Every figure is tabular (set on the body) and right-aligned. Each price is followed by a fixed 12px footnote slot, empty or not, so decimals line up down the parts table, the valuation sheet and the saved-build totals.

## Layout

Content sits in a 1280px max container with 16px side padding, 24px from 640px. Under the yellow masthead (64px tall) come the page title and a short intro (max ~42rem), then an optional ownership banner, then the working area.

From 1024px the working area is two columns: the parts table takes the flexible width and the valuation sheet is a fixed 400px column, sticky 16px from the top, with a 24px gap (40px from 1280px). Below 1024px the sheet stacks under the table.

The parts table uses one shared four-column grid from 768px, used by the column-head row and every part row: category (8.5rem) | part search, filters and specs (flexible) | listings (5.5rem) | median (8rem). Below 768px each row stacks: the category name with listings and price on one line, then the search box full width beneath it. The table never shrinks into a tiny grid.

On phones (below 1024px) a yellow total bar pins to the bottom of the screen with the total and a "N of M priced · issues" line; it slides away while the sheet's own total band is visible, so only one total shows at a time. Tapping it jumps to the sheet. The footer pads its bottom so the bar never covers it.

"My Builds" follows 64px below as a 1/2/3-column card grid (768px / 1280px) with 20px gaps. Row rhythm is 16px vertical by 16–20px horizontal; small gaps run 8px.

## Elevation & Depth

The system is flat. Depth comes from rule weight and from white tables on the cool ground, not from shadows. The only shadow is the soft drop under an open part dropdown, which has to read as floating over the rows below it; an open row also lifts in stacking order so its list covers the next rows.

### Shadow Vocabulary
- **Dropdown lift** (`box-shadow: 0 12px 28px -8px rgb(20 20 20 / 0.35)`): the open part-search listbox only.

### Named Rules
**The Flat Except Open Rule.** Surfaces never carry a shadow at rest or on hover. Only a temporarily open overlay may lift.

**The Rule Weight Rule.** 2px ink frames the major containers (masthead bottom edge, the parts table, the valuation sheet, the total band, the My Builds heading rule, the open saved build). 1.5px ink draws controls and inner section dividers. 1px grey hairlines separate rows; dotted hairlines separate line items in the sheet and on cards.

## Shapes

Square corners everywhere (0px): tables, sheet, cards, buttons, fields, dropdowns, skeletons. Form comes from straight ruled lines in three weights. Line icons are 20×20 with a 1.75 stroke, round caps and joins, sized 14–16px: search, clear, chevron, and the conflict triangle.

## Components

### Buttons
Printed and plain: ink outline or ink fill, no rounding.
- **Shape:** square (0px), 1.5px ink border, 40px tall, 16px side padding, 0.875rem semibold.
- **Primary:** ink fill with white text: Save, Load, and the confirming Delete. One per group.
- **Secondary:** white with ink text and border: Save as New, Reset, Rename, Copy Link, Cancel.
- **Hover / Focus:** primary goes to soft ink, secondary to pressed paper, as a color transition. Focus shows a 2px ink outline 2px out. Disabled drops to 50% opacity.
- **Small:** 32px tall, 10px padding, 0.75rem, used on saved-build cards.
- **Text-style Delete:** a borderless underlined small button that gains its border on hover; a second click swaps it for the black confirm button plus Cancel (no dialog).

### Inputs / Fields
- **Style:** white, 1.5px ink border, square, 40px tall, 12px padding, 0.875rem; placeholders in faint.
- **Focus:** 2px ink outline offset 2px; no glow, no color shift.
- **Selects:** native selects in the field style at 0.8125rem semibold with an overlaid chevron icon (the RAM sticks / generation / capacity filters).

### Part Picker (signature)
A searchable combobox that becomes the picked part's label.
- **Rest:** 44px white box with a search icon at the left and a clear (×) button at the right. Once a part is picked, its full name shows in picker semibold and wraps instead of truncating; the input sits invisibly on top, so clicking or tabbing in starts a new search.
- **Open list:** directly below, 1.5px ink border, max 384px tall, the dropdown lift shadow. Options are separated by hairlines: name (semibold), spec line (muted), and any conflict reasons in red with the triangle icon. The active option takes pressed paper.
- **Incompatible options:** conflict tint background with faded names, still clickable, and sorted after compatible options. A sticky footer says "Showing 50 of N. Type to narrow down."

### Part Row
Identical anatomy for all seven categories: condensed category name, the picker (plus filters for RAM), the spec line, conflict reasons, then listings and median in fixed right-aligned columns. A row with a conflict switches to the conflict tint. Loading shows pulse skeleton bars where the figures go; an unavailable price shows "n/a" in muted with its footnote marker; nothing picked shows faint dashes.

### Valuation Sheet (signature)
The sticky receipt beside the table, framed in 2px ink.
- **Head:** condensed build name with "N of 7 parts".
- **Lines:** label | part name | price per category on dotted hairlines; unpicked lines read "Not picked" in faint.
- **Total band:** guide yellow between 2px ink rules, "Estimated total" label left, the total figure right. The figure rolls up from its previous value over 700ms with an exponential ease-out as each price lands, and jumps straight there under reduced motion; screen readers get only the settled value.
- **Notes:** a 0.75rem summary (priced count, CAD, eBay.ca median, before shipping, oldest fetch time), then numbered footnotes for missing, thin (fewer than 5 listings) or stale prices. The same numbers appear as superscript markers after the prices they qualify, in both the table and the sheet.
- **Compatibility box:** 1.5px conflict border on the conflict tint, red text, a triangle icon and an issue count, then the list.
- **Controls:** build-name field with its label, then the primary Save button (taking the spare width) and the secondary buttons.

### Banner
A white strip with a 1.5px ink border above the table for shared or owned builds: a bold lead ("Shared build." / "Your build.") then the explanation in body.

### Navigation
The yellow masthead: condensed uppercase wordmark at the left; from 768px, an outlined "eBay.ca market values, CAD" tag beside it; at the right, two semibold links ("New build", "My Builds") that underline on hover. Same on phones, with the tag hidden. No counts or badges.

### Saved Build Card
White, square, 1.5px hairline border; the open build gets a 2px ink border and an "Open now" label. Condensed name and saved date, dotted part list, a 1.5px ink rule over "Total, cached prices" with the condensed figure right-aligned, then a row of small buttons. Loading shows three pulse blocks; the empty state is a dashed ink box.

## Do's and Don'ts

### Do:
- **Do** keep guide yellow to the masthead and the total band (The Reserved Yellow Rule).
- **Do** use conflict red and its tint only for compatibility, and keep incompatible options clickable with the reason shown.
- **Do** put price caveats in numbered footnotes with matching superscript markers after the price, not in badges or colors.
- **Do** right-align every price with tabular figures and a fixed 12px marker slot, so one decimal column runs down each table.
- **Do** give every category row the same anatomy, with the price in the same column.
- **Do** separate with rules: 2px ink for containers, 1.5px ink for controls and inner dividers, 1px grey hairlines for rows, dotted lines for line items.
- **Do** keep the pinned total on phones and stack rows rather than shrinking the table.
- **Do** respect reduced motion: the total jumps instead of rolling and the phone bar stops sliding.
- **Do** show focus as a 2px ink outline offset 2px on every interactive element.

### Don't:
- **Don't** round corners or add shadows to resting surfaces; the dropdown lift is the only shadow.
- **Don't** use yellow or red outside their reserved roles, as accents, hover colors or general status colors.
- **Don't** use condensed uppercase for part names, prose or buttons.
- **Don't** set small uppercase labels above headings as eyebrows; that voice labels columns, fields and sheet lines only.
- **Don't** introduce a second typeface, a dark theme panel, gradients or glow.
- **Don't** add a card per part or a colored dashboard sidebar.
