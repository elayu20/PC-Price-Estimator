import PriceTag from "./PriceTag";
import { ConflictIcon } from "./Icons";
import { specLabels } from "../utils/format";

// Grid columns shared by the parts table header and every row, so the listings
// and median figures line up down the whole table
export const PART_COLUMNS = "md:grid-cols-[8.5rem_minmax(0,1fr)_5.5rem_8rem]";

// One category row in the parts table: its search box (`children`), optional
// filters, the selected part's specs, listing count and median price.
// `issues` are this category's compatibility messages, `note` the number of
// its footnote in the valuation sheet (or undefined)
export default function PartCard({ category, label, partName, specs, price, priceError, issues, note, filters, children }) {
    const labels = specLabels(category, specs);
    const hasIssue = issues.length > 0;

    return (
        // focus-within raises the open row so its dropdown covers the rows below
        <section
            aria-label={label}
            className={`relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 border-b border-rule last:border-b-0 px-4 py-4 focus-within:z-10 md:items-start md:gap-y-0 md:px-5 ${PART_COLUMNS} ${
                hasIssue ? "bg-conflict-bg" : "bg-paper"
            }`}
        >
            <h3 className="guide-head self-center text-lg leading-tight md:self-start md:pt-2">{label}</h3>

            {/* Listings + price: beside the label on phones, in their own columns from md up */}
            <div className="flex items-baseline justify-end gap-4 self-center md:contents">
                <PriceTag price={price} error={priceError} picked={Boolean(partName)} note={note} />
            </div>

            <div className="col-span-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
                {filters && <div className="mb-2 flex flex-wrap gap-2">{filters}</div>}
                {children}
                {partName && labels.length > 0 && (
                    <p className="mt-1.5 text-[0.8125rem] text-muted">{labels.join(" · ")}</p>
                )}
                {issues.map((message, i) => (
                    <p key={i} className="mt-1.5 flex items-start gap-1.5 text-[0.8125rem] font-semibold text-conflict">
                        <ConflictIcon className="mt-px size-4 shrink-0" />
                        {message}
                    </p>
                ))}
            </div>
        </section>
    );
}
