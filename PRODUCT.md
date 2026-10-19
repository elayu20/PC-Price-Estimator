# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: Canadian DIY PC builders planning a budget build, mostly from second-hand parts.** They're choosing parts one category at a time and want to know what the whole build will really cost on the used market before buying anything. They come back to compare variants of a build and send a build to a friend for a second opinion.
- **Secondary: recruiters, hiring managers and engineers looking at the project as a portfolio piece.** They spend a few minutes clicking around and judge both whether it works and how well it's made. They shouldn't drive product decisions over the builder.

## Product Purpose

Pick a part in each category (CPU, GPU, RAM, motherboard, PSU, storage, cooler), see what it sells for on eBay Canada right now, and get a build total in CAD. Incompatible combinations are flagged. Builds can be saved, listed and shared by link.

It works if a builder can go from nothing to a priced, compatible build they trust enough to budget around, and can come back to it or share it.

## Positioning

A budgeting tool for the used market. Other part pickers price parts at retailer list prices. This one prices each part at the median of recent filtered eBay Canada listings, new and used. Listings for parts-only, box-only and broken items, accessories and lots are dropped, and North American sellers are searched before the rest of the world. So the total is a realistic second-hand market price, not MSRP.

## Operating Context

- Builders usually have retailer sites, eBay or Marketplace open in other tabs and check the estimate against real listings.
- A build is put together over one or more sessions, then reopened, tweaked, or saved as a variant.
- Sharing happens by pasting a `/build/<id>` link into chat or a forum. The person who opens it is often seeing the app for the first time.
- Prices load per part and can be slow, cached, stale or missing. The UI has to handle waiting and gaps without the user losing trust in the total.

## Capabilities and Constraints

- **Catalog:** ~31k parts across 7 categories from the open docyx/pc-part-dataset, kept in Postgres. Variant names are made unique (e.g. `Samsung 990 Pro (2TB)`).
- **Pricing:** live eBay Browse API on `EBAY_CA`. Prices are in CAD and exclude shipping, duty and brokerage. They're cached for 6 hours, and stale values are served when eBay fails or the rate limit is hit. A part can be "Price unavailable", and the total then counts unpriced parts. `listingCount` and `fetchedAt` exist but aren't shown yet.
- **Compatibility:** CPU socket vs motherboard, RAM generation vs motherboard, RAM stick count vs slots. Incompatible options stay selectable but are flagged, and compatible options sort first. No cooler-socket or PSU-wattage checks (the dataset has no data for them).
- **Builds:** saved server-side with no accounts yet. Share links are read-only for everyone except the creating browser, which holds an edit token. Anyone else saves a copy. Accounts (GitHub/Google sign-in) are planned for later.
- **Terminology:** "build", "part", category names as above, "My Builds", "share link", "Save a Copy".
- **Stack:** Next.js 16 App Router, React 19, JavaScript, Tailwind CSS 4, Prisma + Postgres. Hosting on Vercel is planned.
- **Language:** English only. No i18n or French needed for now.

## Brand Commitments

Name: **PC Price Estimator**. No logo or brand assets yet. There's no committed voice beyond plain, direct UI copy.

## Evidence on Hand

- Real price data from eBay CA for any catalog part, plus real compatibility results.
- Notable before/after price-accuracy examples in `CLAUDE.md`'s work log (e.g. RTX 3070 LHR $1,404 → $661 after the filtering and North-America-first changes).
- No users, testimonials, usage stats, press or deployed URL exist yet. Don't invent any.
- The dataset source must be credited (docyx/pc-part-dataset).

## Product Principles

1. **Trustworthy totals over impressive ones.** Make clear where a price comes from, how fresh it is and what's missing, rather than hiding gaps. A wrong price that looks confident is worse than "unavailable".
2. **The used market is the default.** Design for someone budgeting from second-hand listings, not someone checking MSRP.
3. **Warn, don't block.** Compatibility problems are shown clearly, but the builder decides. Nothing is disabled.
4. **A shared link must make sense alone.** Someone opening `/build/<id>` with no context should understand what they're seeing and what they can do with it.
5. **Usable on a phone.** Every core task (search, pick, check the total, save, share) works fully on mobile.

## Accessibility & Inclusion

- WCAG 2.2 AA is required: contrast, full keyboard operation (including the part comboboxes), visible focus, and screen-reader-labelled states for compatibility warnings and price loading/errors.
- Full mobile support for every core flow, not a reduced view.
