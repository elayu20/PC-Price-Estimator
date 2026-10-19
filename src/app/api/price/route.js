import { NextResponse } from "next/server";
import { prisma } from "../../../../utils/prisma";
import { searchEbay, ebayCategoryId } from "../../../../utils/ebay";
import { estimatePrice, fallbackQueries, MIN_LISTINGS } from "../../../../utils/pricing";
import { rateLimit, clientIp } from "../../../../utils/rateLimit";
import { DB_CATEGORIES } from "../../../../utils/categories";

// Cached prices are reused for this long before eBay is asked again
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// eBay lookups (cache misses) allowed per client IP per window. A lookup can
// make up to 6 eBay searches (3 queries x nearby/worldwide), though most stop
// at the first. Loading a saved build costs up to 7 lookups, so this leaves
// room for normal use but not for scraping
const EBAY_LOOKUPS_PER_WINDOW = 30;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

// eBay lookups currently running, by part id. A second request for the same
// part waits for the first instead of searching eBay again
const pendingLookups = new Map();

// Searches eBay for a part and caches the result. Tries North American sellers
// first, with the part's own query and then the broader ones, and only then
// worldwide, so a near match from a local seller beats an exact overseas one.
// Stops at the first search with enough usable listings, otherwise keeps the
// estimate with the most. Returns the cache row, or null if eBay failed
// (failures aren't cached, so the next request retries)
async function lookUpPrice(part) {
    const categoryId = ebayCategoryId(part.category, part.storageDetails?.type);
    const queries = [part.searchQuery || part.name, ...fallbackQueries(part)];
    const searches = [true, false].flatMap(nearbyOnly => queries.map(query => ({ query, nearbyOnly })));
    let best = null;

    for (const { query, nearbyOnly } of searches) {
        const results = await searchEbay(query, categoryId, nearbyOnly);
        if (!results) return null;

        const estimate = estimatePrice(results.itemSummaries, query);
        if (!best || estimate.listingCount > best.listingCount) best = estimate;
        if (best.listingCount >= MIN_LISTINGS) break;
    }

    const data = { priceCad: best.priceCad, listingCount: best.listingCount, fetchedAt: new Date() };

    return prisma.priceCache.upsert({
        where: { partId: part.id },
        create: { partId: part.id, ...data },
        update: data,
    });
}

function priceResponse(cache, stale = false) {
    return NextResponse.json({
        priceCad: cache.priceCad,
        listingCount: cache.listingCount,
        fetchedAt: cache.fetchedAt,
        // true when eBay couldn't be asked for a fresher price
        stale,
    });
}

// GET /api/price?category=cpu&part=NAME -> { priceCad, listingCount, fetchedAt, stale }
// priceCad is the median of matching eBay listings, 0 if there were none
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const category = DB_CATEGORIES[searchParams.get("category")];
    const name = searchParams.get("part");

    // if the frontend didn't send a part, return an error
    if (!category || !name) {
        return NextResponse.json({ error: "Missing or unknown category or part" }, { status: 400 });
    }

    // Only parts in the catalog can be priced, so the endpoint can't be used to
    // run arbitrary eBay searches
    const part = await prisma.part.findUnique({
        where: { category_name: { category, name } },
        select: {
            id: true,
            name: true,
            brand: true,
            category: true,
            searchQuery: true,
            gpuDetails: { select: { chipset: true } },
            storageDetails: { select: { type: true } },
            priceCache: true,
        },
    });
    if (!part) {
        return NextResponse.json({ error: "Unknown part" }, { status: 404 });
    }

    const cached = part.priceCache;
    if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
        return priceResponse(cached);
    }

    // Only requests that would reach eBay count toward the limit
    const limit = rateLimit(clientIp(request), EBAY_LOOKUPS_PER_WINDOW, RATE_LIMIT_WINDOW_MS);
    if (!limit.allowed) {
        if (cached) return priceResponse(cached, true);
        return NextResponse.json(
            { error: "Too many price lookups, try again later" },
            { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
        );
    }

    if (!pendingLookups.has(part.id)) {
        pendingLookups.set(part.id, lookUpPrice(part).finally(() => pendingLookups.delete(part.id)));
    }
    const fresh = await pendingLookups.get(part.id);

    if (fresh) return priceResponse(fresh);

    // eBay itself failed (bad credentials, rate limit, outage). An old price
    // beats none
    if (cached) return priceResponse(cached, true);
    return NextResponse.json({ error: "eBay request failed" }, { status: 502 });
}
