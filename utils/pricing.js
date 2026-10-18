// Turns raw eBay search results into one price estimate

// Listings that aren't a working copy of the part: empty boxes, broken units,
// accessories and multi-item lots
const JUNK_TITLE = /\b(box only|empty box|for parts|parts only|not working|broken|faulty|defective|untested|as[- ]is|bracket|backplate|shroud|replacement|water ?block|lot)\b/i;

// Lowercase with spaces and punctuation removed, so "i9-14900K", "i9 14900K"
// and "I914900K" all compare equal
function squash(text) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// eBay's search is fuzzy: "Gigabyte GAMING OC RX 9070 XT" also returns RX 9060 XT
// cards. A title must contain every query word that has a digit in it (model
// numbers, capacities, speeds) to count
function matchesModel(title, query) {
    const squashedTitle = squash(title);
    return query
        .split(/\s+/)
        .filter(word => /\d/.test(word))
        .every(word => squashedTitle.includes(squash(word)));
}

// With fewer usable listings than this, the next, broader query is tried
export const MIN_LISTINGS = 5;

// Broader searches to try when a part's own query finds too few listings,
// most specific first. Only for categories where a near match prices the part
// fairly: a GPU by its chipset (board partner model names like "GAMING OC" are
// rarely searchable) and RAM without its exact speed (e.g. DDR4-3733 kits)
export function fallbackQueries(part) {
    if (part.category === "GPU" && part.gpuDetails) {
        // "GeForce RTX 3060 12GB" -> "RTX 3060", as in prisma/partSpecs.ts gpuModel()
        const model = part.gpuDetails.chipset
            .replace(/^(GeForce|Radeon|Intel Arc|Arc)\s+/i, "")
            .replace(/\s+\d+\s?GB$/i, "");
        return [`${part.brand} ${model}`, model];
    }
    if (part.category === "RAM" && part.searchQuery) {
        // "Kingston FURY Beast 32 GB DDR4 3733" -> "Kingston FURY Beast 32 GB DDR4"
        return [part.searchQuery.replace(/\s+\d+$/, "")];
    }
    return [];
}

function median(sortedValues) {
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2
        ? sortedValues[mid]
        : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
}

// Returns { priceCad, listingCount }: the median CAD price of the listings that
// look like the part itself, or a price of 0 if none do. The median ignores the
// overpriced and multi-model listings that skewed the old plain average
export function estimatePrice(itemSummaries, query) {
    const prices = (itemSummaries ?? [])
        .filter(item => item?.price?.currency === "CAD")
        // eBay counts "For parts or not working" (7000) as a used condition, so
        // the search's USED filter lets it through
        .filter(item => item.conditionId !== "7000")
        .filter(item => !JUNK_TITLE.test(item.title ?? "") && matchesModel(item.title ?? "", query))
        .map(item => Number(item.price.value))
        .filter(price => price > 0)
        .sort((a, b) => a - b);

    if (prices.length === 0) {
        return { priceCad: 0, listingCount: 0 };
    }
    return { priceCad: median(prices), listingCount: prices.length };
}
