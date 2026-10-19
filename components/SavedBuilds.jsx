"use client";

import { useState } from "react";
import { buildUrl } from "../utils/buildStorage";
import { formatCad } from "../utils/format";

// "My builds": the builds this browser saved, each with its parts, a total
// from cached prices and the last-saved date. `builds` is null while loading
export default function SavedBuilds({ builds, error, categories, currentId, onLoad, onRename, onDelete }) {
    // Id of the build being renamed, and the name typed so far
    const [renamingId, setRenamingId] = useState(null);
    const [draftName, setDraftName] = useState("");
    // Id of the build whose Delete was clicked once and awaits confirmation
    const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
    // Id of the build whose link was just copied
    const [copiedId, setCopiedId] = useState(null);

    function startRename(build) {
        setRenamingId(build.id);
        setDraftName(build.name);
    }

    async function submitRename(id) {
        const name = draftName.trim();
        if (!name) return;
        if (await onRename(id, name)) setRenamingId(null);
    }

    async function copyLink(id) {
        try {
            await navigator.clipboard.writeText(buildUrl(id));
            setCopiedId(id);
            setTimeout(() => setCopiedId(current => (current === id ? null : current)), 2000);
        } catch (err) {
            console.error("Failed to copy link", err);
        }
    }

    let content;
    if (error) {
        content = <p className="border-[1.5px] border-ink bg-paper px-4 py-3 text-sm"><strong className="font-bold">Couldn&apos;t load your builds.</strong> {error}. Reload the page to try again.</p>;
    } else if (!builds) {
        content = (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading your builds">
                {[0, 1, 2].map(i => <div key={i} className="h-60 animate-pulse border-[1.5px] border-rule bg-paper" />)}
            </div>
        );
    } else if (builds.length === 0) {
        content = (
            <p className="border-[1.5px] border-dashed border-ink px-4 py-8 text-center text-sm text-ink-2">
                No saved builds yet. Pick some parts and press Save Build; they&apos;ll be listed here with a share link.
            </p>
        );
    } else {
        content = (
            <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {builds.map(build => {
                    const isOpen = build.id === currentId;

                    return (
                        <li
                            key={build.id}
                            className={`flex flex-col bg-paper ${isOpen ? "border-2 border-ink" : "border-[1.5px] border-rule"}`}
                        >
                            <div className="border-b border-rule px-4 pt-3 pb-2.5">
                                {renamingId === build.id ? (
                                    <form
                                        onSubmit={(e) => { e.preventDefault(); submitRename(build.id); }}
                                        className="flex gap-2"
                                    >
                                        <input
                                            autoFocus
                                            aria-label="New build name"
                                            value={draftName}
                                            maxLength={80}
                                            onChange={(e) => setDraftName(e.target.value)}
                                            className="field btn-sm min-w-0 flex-1"
                                        />
                                        <button type="submit" className="btn btn-primary btn-sm">Save</button>
                                        <button type="button" onClick={() => setRenamingId(null)} className="btn btn-sm">Cancel</button>
                                    </form>
                                ) : (
                                    <div className="flex items-baseline justify-between gap-2">
                                        <h3 className="guide-head truncate text-xl" title={build.name}>{build.name}</h3>
                                        {isOpen && <span className="shrink-0 text-xs font-bold uppercase">Open now</span>}
                                    </div>
                                )}
                                <p className="mt-0.5 text-xs text-muted">
                                    Saved {new Date(build.updatedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
                                </p>
                            </div>

                            <ul className="flex-1 px-4 py-1.5 text-xs">
                                {categories
                                    .filter(({ key }) => build.parts[key])
                                    .map(({ key, label }) => (
                                        <li key={key} className="grid grid-cols-[6.75rem_minmax(0,1fr)] gap-2 border-b border-dotted border-rule py-1.5 last:border-b-0">
                                            <span className="font-bold tracking-wider text-muted uppercase">{label}</span>
                                            <span className="break-words text-ink">{build.parts[key]}</span>
                                        </li>
                                    ))}
                            </ul>

                            <div className="flex items-baseline justify-between gap-3 border-t-[1.5px] border-ink px-4 py-2.5" title="From recently cached eBay prices">
                                <span className="text-xs text-ink-2">
                                    Total, cached prices
                                    {build.unpricedCount > 0 && <span className="block text-muted">{build.unpricedCount} {build.unpricedCount === 1 ? "part" : "parts"} unpriced</span>}
                                </span>
                                <span className="guide-head text-2xl leading-none">{formatCad(build.totalCad)}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 border-t border-rule px-4 py-3">
                                <button onClick={() => onLoad(build)} className="btn btn-primary btn-sm">Load</button>
                                <button onClick={() => startRename(build)} className="btn btn-sm">Rename</button>
                                <button onClick={() => copyLink(build.id)} className="btn btn-sm" aria-live="polite">{copiedId === build.id ? "Copied!" : "Copy Link"}</button>
                                {confirmingDeleteId === build.id ? (
                                    <>
                                        <button onClick={() => { setConfirmingDeleteId(null); onDelete(build.id); }} className="btn btn-primary btn-sm">
                                            Confirm Delete
                                        </button>
                                        <button onClick={() => setConfirmingDeleteId(null)} className="btn btn-sm">Cancel</button>
                                    </>
                                ) : (
                                    <button onClick={() => setConfirmingDeleteId(build.id)} className="btn btn-sm ml-auto border-transparent underline underline-offset-2 hover:border-ink hover:no-underline">Delete</button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        );
    }

    return (
        <section id="my-builds" className="mt-16 scroll-mt-6">
            <div className="mb-5 flex items-baseline gap-3 border-b-2 border-ink pb-2">
                <h2 className="guide-head text-3xl leading-none">My Builds</h2>
                {builds?.length > 0 && <span className="text-sm font-semibold text-muted">{builds.length} saved in this browser</span>}
            </div>
            {content}
        </section>
    );
}
