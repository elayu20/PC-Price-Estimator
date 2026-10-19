"use client";

import { useEffect, useRef, useState } from "react";
import { ConflictIcon } from "./Icons";
import { NoteMarker } from "./PriceTag";
import { useCountUp } from "./useCountUp";
import { formatCad, timeAgo } from "../utils/format";

// The valuation sheet: each category's pick and price, the total (which rolls
// up as prices land), footnotes on thin or missing prices, compatibility issues,
// then `controls` (name box and save buttons) and `status`.
// `notes` is [{ n, text }] and `markers` maps a category key to its note number
export default function BuildSummary({ title, categories, build, livePrices, priceErrors, issues, total, unpricedCount, notes, markers, controls, status }) {
    const pickedCount = categories.filter(({ key }) => build[key]).length;
    const pricedCount = categories.filter(({ key }) => livePrices[key]).length;
    const shownTotal = useCountUp(total);
    const pricedTimes = categories.map(({ key }) => livePrices[key]?.fetchedAt).filter(Boolean);
    const oldestFetch = pricedTimes.length > 0 ? pricedTimes.reduce((a, b) => (new Date(a) < new Date(b) ? a : b)) : null;

    // The phone bar hides while the sheet's own total band is on screen, so
    // only one total shows at a time
    const bandRef = useRef(null);
    const [bandVisible, setBandVisible] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => setBandVisible(entry.isIntersecting));
        observer.observe(bandRef.current);
        return () => observer.disconnect();
    }, []);

    let countText = "No parts picked";
    if (pickedCount > 0) {
        countText = `${pricedCount} of ${pickedCount} priced`;
        if (unpricedCount > 0) countText += ` · ${unpricedCount} left out`;
    }
    if (issues.length > 0) countText += ` · ${issues.length} ${issues.length === 1 ? "issue" : "issues"}`;

    return (
        <>
            <aside id="valuation" aria-label="Valuation" className="scroll-mt-4 border-2 border-ink bg-paper lg:sticky lg:top-4">
                <div className="flex items-baseline justify-between gap-3 border-b-[1.5px] border-ink px-5 py-3">
                    <h2 className="guide-head min-w-0 truncate text-xl">{title}</h2>
                    <span className="shrink-0 text-xs font-semibold text-muted">{pickedCount} of {categories.length} parts</span>
                </div>

                <ul className="px-5 py-1 text-sm">
                    {categories.map(({ key, label }) => {
                        const marker = <NoteMarker n={markers[key]} />;
                        let price = <span className="text-faint">—{marker}</span>;
                        if (priceErrors[key]) price = <span className="text-muted">n/a{marker}</span>;
                        else if (livePrices[key]) price = <>{formatCad(livePrices[key].priceCad)}{marker}</>;
                        else if (build[key]) price = <span aria-label="Loading price"><span className="inline-block h-3.5 w-16 animate-pulse bg-paper-2 align-middle" />{marker}</span>;

                        return (
                            <li key={key} className="grid grid-cols-[6.75rem_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-dotted border-rule py-2 last:border-b-0">
                                <span className="text-[0.6875rem] font-bold tracking-wider text-muted uppercase">{label}</span>
                                <span className={`break-words ${build[key] ? "text-ink" : "text-faint"}`} title={build[key] || undefined}>
                                    {build[key] || "Not picked"}
                                </span>
                                <span className="text-right font-semibold whitespace-nowrap">{price}</span>
                            </li>
                        );
                    })}
                </ul>

                <div ref={bandRef} className="flex items-baseline justify-between gap-4 border-y-2 border-ink bg-guide px-5 py-4">
                    <span className="text-xs font-bold tracking-wider uppercase">Estimated total</span>
                    <span className="guide-head text-[2.75rem] leading-none tracking-tight" aria-hidden>{formatCad(shownTotal)}</span>
                    {/* The rolling figure is hidden from screen readers; they get the settled value */}
                    <span className="sr-only" aria-live="polite">{formatCad(total)}</span>
                </div>

                <div className="space-y-1 px-5 pt-3 pb-4 text-xs leading-relaxed text-ink-2">
                    <p>
                        {pickedCount === 0
                            ? "No parts picked yet."
                            : <>{pricedCount} of {pickedCount} picked {pickedCount === 1 ? "part" : "parts"} priced{unpricedCount > 0 && <>, {unpricedCount} left out of the total</>}.</>}
                        {" "}CAD, eBay.ca median, before shipping.
                        {oldestFetch && <> Oldest price fetched {timeAgo(oldestFetch)}.</>}
                    </p>
                    {notes.length > 0 && (
                        <ol className="space-y-1">
                            {notes.map(({ n, text }) => (
                                <li key={n} className="flex gap-1.5">
                                    <span className="font-bold">{n}</span>
                                    <span>{text}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>

                {issues.length > 0 && (
                    <div role="alert" className="mx-5 mb-4 border-[1.5px] border-conflict bg-conflict-bg px-3 py-2.5 text-sm text-conflict">
                        <p className="flex items-center gap-1.5 font-bold">
                            <ConflictIcon className="size-4 shrink-0" />
                            {issues.length} compatibility {issues.length === 1 ? "issue" : "issues"}
                        </p>
                        <ul className="mt-1 space-y-1 pl-5.5">
                            {issues.map(({ message }) => <li key={message}>{message}</li>)}
                        </ul>
                    </div>
                )}

                <div className="border-t-[1.5px] border-ink px-5 pt-4 pb-5">
                    {controls}
                    {status && <p role="status" className="mt-3 text-sm text-ink-2">{status}</p>}
                </div>
            </aside>

            {/* Phones: the total stays pinned to the bottom while the parts scroll */}
            <a
                href="#valuation"
                aria-hidden={bandVisible || undefined}
                tabIndex={bandVisible ? -1 : undefined}
                className={`fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t-2 border-ink bg-guide px-4 py-3 transition-transform duration-200 ease-out motion-reduce:transition-none lg:hidden ${
                    bandVisible ? "translate-y-full" : ""
                }`}
            >
                <span className="text-xs leading-tight font-bold uppercase">
                    Estimated total, CAD
                    <span className="block font-semibold text-ink-2 normal-case">{countText}</span>
                </span>
                <span className="guide-head text-3xl leading-none" aria-hidden>{formatCad(shownTotal)}</span>
                <span className="sr-only">{formatCad(total)}, see the valuation</span>
            </a>
        </>
    );
}
