import { formatCad } from "../utils/format";

// A fixed-width footnote slot after a price. Empty slots keep the same width,
// so figures stay aligned down a column whether or not a note attaches
export function NoteMarker({ n }) {
    return <sup className="inline-block w-3 text-left text-[0.6875rem] font-bold">{n ?? ""}</sup>;
}

// The listing count and median price cells of one parts-table row. `price` is
// the /api/price response, or null while loading; `error` means eBay had no
// usable price; `note` is the row's footnote number in the valuation sheet
export default function PriceTag({ price, error, picked, note }) {
    const marker = <NoteMarker n={note} />;

    let listings = <span className="text-faint max-md:hidden">—</span>;
    let median = <span className="text-faint">—{marker}</span>;

    if (picked && error) {
        median = <span className="text-sm font-semibold text-muted">n/a{marker}</span>;
    } else if (picked && !price) {
        listings = <span aria-hidden className="inline-block h-3.5 w-6 animate-pulse bg-paper-2" />;
        median = (
            <span className="inline-flex items-center" aria-label="Loading price">
                <span aria-hidden className="inline-block h-5 w-20 animate-pulse bg-paper-2" />
                {marker}
            </span>
        );
    } else if (price) {
        listings = (
            <>
                {price.listingCount}
                <span className="text-muted md:hidden"> {price.listingCount === 1 ? "listing" : "listings"}</span>
            </>
        );
        median = <>{formatCad(price.priceCad)}{marker}</>;
    }

    return (
        <>
            <span className="text-right text-sm text-ink-2 md:pt-2.5 md:text-[0.9375rem]">
                {listings}
            </span>
            <span className="text-right text-lg font-bold whitespace-nowrap md:pt-2">{median}</span>
        </>
    );
}
