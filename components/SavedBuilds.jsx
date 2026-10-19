"use client";

import { useState } from "react";
import { buildUrl } from "../utils/buildStorage";

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
        content = <p style={{ color: "#a00" }}>Couldn&apos;t load your builds: {error}</p>;
    } else if (!builds) {
        content = <p>Loading builds...</p>;
    } else if (builds.length === 0) {
        content = <p>No saved builds yet. Pick some parts and click Save Build.</p>;
    } else {
        content = (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
                {builds.map(build => (
                    <li
                        key={build.id}
                        style={{
                            padding: 12,
                            border: build.id === currentId ? "2px solid #4a7bd0" : "1px solid #ccc",
                            borderRadius: 8,
                        }}
                    >
                        {renamingId === build.id ? (
                            <form
                                onSubmit={(e) => { e.preventDefault(); submitRename(build.id); }}
                                style={{ display: "flex", gap: 8, marginBottom: 8 }}
                            >
                                <input
                                    autoFocus
                                    value={draftName}
                                    maxLength={80}
                                    onChange={(e) => setDraftName(e.target.value)}
                                    style={{ padding: "4px", flex: 1 }}
                                />
                                <button type="submit">Save</button>
                                <button type="button" onClick={() => setRenamingId(null)}>Cancel</button>
                            </form>
                        ) : (
                            <strong>{build.name}{build.id === currentId && " (open)"}</strong>
                        )}

                        <div style={{ fontSize: 13, color: "#666", margin: "4px 0 8px" }}>
                            Saved {new Date(build.updatedAt).toLocaleString()}
                        </div>

                        <ul style={{ margin: "0 0 8px", paddingLeft: 20, fontSize: 14 }}>
                            {categories
                                .filter(({ key }) => build.parts[key])
                                .map(({ key, label }) => <li key={key}>{label}: {build.parts[key]}</li>)}
                        </ul>

                        <div style={{ marginBottom: 8 }} title="From recently cached eBay prices">
                            Total: ${build.totalCad.toFixed(2)}
                            {build.unpricedCount > 0 && ` (${build.unpricedCount} unpriced)`}
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button onClick={() => onLoad(build)}>Load</button>
                            <button onClick={() => startRename(build)}>Rename</button>
                            <button onClick={() => copyLink(build.id)}>{copiedId === build.id ? "Copied!" : "Copy Link"}</button>
                            {confirmingDeleteId === build.id ? (
                                <>
                                    <button onClick={() => { setConfirmingDeleteId(null); onDelete(build.id); }} style={{ color: "#a00" }}>
                                        Confirm Delete
                                    </button>
                                    <button onClick={() => setConfirmingDeleteId(null)}>Cancel</button>
                                </>
                            ) : (
                                <button onClick={() => setConfirmingDeleteId(build.id)}>Delete</button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <section style={{ marginTop: 24 }}>
            <h2>My Builds</h2>
            {content}
        </section>
    );
}
