---
version: 1
slug: "components-builder-jsx"
primary_target: "components/Builder.jsx"
related_targets: ["components/SavedBuilds.jsx","components/BuildSummary.jsx","components/PartCard.jsx","src/app/layout.jsx","src/app/globals.css"]
---

# Builder surface (picker, /build/<id> share view, My Builds)

Mode: Operate. Audience: Canadian DIY builders budgeting from used parts; reviewers secondary. Task: pick a part per category and watch a trustworthy CAD total form; save, reopen, share. Must keep all current behavior (compatibility flags, compatible-first sort, RAM filters, save / save as new / save a copy / reset, rename / copy link / delete with confirm, shared/owned banner, price loading / unavailable / low-confidence / outdated states). Must not feel like gamer/RGB styling or a generic SaaS dashboard. Light ground: used at a desk next to bright eBay / Marketplace tabs, cross-checking listings; a dark island makes that harsh.

## Direction contract

THESIS: The build is valued like a used-goods price guide values stock: market evidence in ruled tables, honest footnotes, one valuation total. Refuses the category default of a card-per-part dashboard with a sidebar summary in brand blue.

OWN-WORLD: Guide-yellow (#F2C200-ish) is a reserved ink: masthead band and the total band only. Ink-black type and 1.5–2px black rules; hairline grey row rules; cool off-white ground, white tables. Archivo across, condensed widths (wdth ~62–75) for headings, category names and the total, normal width for body; all figures tabular. Conflict red (#C8102E-ish) only for compatibility; low confidence and unpriced shown as numbered footnote markers, not badges. Square corners, no shadows except a soft one on the open dropdown.

STORY: The builder sees seven category rows in one ruled table, picks parts, and watches the valuation sheet fill line by line and the total count up. Footnotes say which prices are thin, outdated or missing. They save, then reopen or share from My Builds.

FIRST VIEWPORT: Yellow masthead (name, "eBay.ca market values, CAD", nav: New build, My Builds; no count, since the layout is server-rendered and saved builds live in localStorage). Left ~2/3: "Parts" heading over the ruled table: category | part search or picked part with specs | listings | median, price column fixed. Right ~420px, sticky: valuation sheet with line items, yellow total band (largest figure on page), footnotes, compatibility box, name field, Save/Reset. Banner for shared/owned builds sits above the table. Phone: table rows stack, the total band pins to the bottom of the screen.

FORM: The Price Guide, position 3 on the ordered list (collector price guides). seed: 5cb276ba1959413d. Signature move: the valuation sheet's total counts up (tabular digits rolling) as each price lands, and footnote markers attach to the lines they qualify. Raises: reserved yellow (orienteering); pinned total and focused category on phones, never a shrunk table (transit); identical row anatomy with the price always in one column (botanical); one decimal-aligned tabular figure column across picker, sheet and My Builds (datamatics).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
