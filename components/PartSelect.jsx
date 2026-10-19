"use client";

import { useId, useMemo, useRef, useState } from "react";
import { specLabels } from "../utils/format";
import { CloseIcon, ConflictIcon, SearchIcon } from "./Icons";

// Most options rendered at once. The rest are reached by typing
const MAX_SHOWN = 50;

/*
    PartSelect: A custom Autocomplete Combobox component
    Replaces the standard <select> with a searchable text input + floating list.
    Keyboard: Up/Down move through the list, Enter picks, Escape closes
*/

// `options` is null until the category's parts have loaded; `onOpen` is called
// whenever the list opens, so the parent can load them then.
// getIssues(specs) returns the compatibility problems an option would cause with
// the rest of the build. Those options stay clickable but are flagged in red
export default function PartSelect({ category, label, value, onChange, options, getIssues, onOpen }) {
    // 1) State
    // query is what the user is typing, or null when they aren't searching.
    // While it's null the box just shows the selected part (value)
    const [query, setQuery] = useState(null);
    const inputValue = query ?? value ?? "";

    // isOpen tracks whether the custom dropdown list is visible
    const [isOpen, setIsOpen] = useState(false);
    // Index of the keyboard-highlighted option in the shown list
    const [activeIndex, setActiveIndex] = useState(0);

    const listRef = useRef(null);
    const inputRef = useRef(null);
    const listId = useId();

    // If the parent picks a part (e.g. Load), stop showing any half-typed search.
    // Done during render instead of in an effect so there's no extra render pass
    const [prevValue, setPrevValue] = useState(value);
    if (value !== prevValue) {
        setPrevValue(value);
        if (value) setQuery(null);
    }

    // 2) Filter the data based on the text input
    const filteredEntries = useMemo(() => {
        if (!options) return [];

        const q = inputValue.trim().toLowerCase();

        // If the box is empty, show everything
        if (q === "") {
            return Object.entries(options);
        }

        // Show items containing the search string
        return Object.entries(options).filter(([name]) =>
            name.toLowerCase().includes(q)
        );
    }, [options, inputValue]);

    // Attach each option's compatibility issues and move compatible options to the
    // top (sort is stable, so each group keeps its order). Only done while the list
    // is open, since it checks every matching option, not just the 50 shown
    const checkedEntries = isOpen
        ? filteredEntries
            .map(([name, data]) => [name, data, getIssues ? getIssues(data.specs || {}) : []])
            .sort((a, b) => (a[2].length > 0) - (b[2].length > 0))
        : [];

    const limitedEntries = checkedEntries.slice(0, MAX_SHOWN);

    function open() {
        if (!isOpen) {
            setIsOpen(true);
            setActiveIndex(0);
        }
        onOpen?.();
    }

    // 3) Handle user selection
    const handleSelect = (name) => {
        onChange(name); // Update the actual build state in the parent
        setQuery(null); // Stop searching, the box now shows the selected name
        setIsOpen(false); // Close the dropdown
    }

    function handleClear() {
        onChange("");
        setQuery(null);
        inputRef.current?.focus();
    }

    // Highlights option `index` and scrolls it into view
    function moveTo(index) {
        setActiveIndex(index);
        listRef.current?.children[index]?.scrollIntoView({ block: "nearest" });
    }

    function handleKeyDown(e) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!isOpen) return open();
            const last = limitedEntries.length - 1;
            if (last < 0) return;
            const next = e.key === "ArrowDown" ? Math.min(activeIndex + 1, last) : Math.max(activeIndex - 1, 0);
            moveTo(next);
        } else if (e.key === "Enter" && isOpen) {
            e.preventDefault();
            const entry = limitedEntries[activeIndex];
            if (entry) handleSelect(entry[0]);
        } else if (e.key === "Escape" && isOpen) {
            e.preventDefault();
            setIsOpen(false);
            setQuery(null);
        }
    }

    const showClear = Boolean(value || query);
    // A picked part's full name, wrapped, instead of a cut-off input value.
    // Typing (or opening the list) goes back to the normal input
    const showPicked = Boolean(value) && query === null && !isOpen;

    return (
        // The wrapper must be relative so the absolute dropdown positions correctly beneath it
        <div className="relative">
            <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted" />
                {showPicked && (
                    <div aria-hidden className="min-h-11 border-[1.5px] border-ink bg-paper py-2.5 pr-10 pl-9 text-[0.9375rem] leading-snug font-semibold break-words">
                        {value}
                    </div>
                )}
                <input
                    ref={inputRef}
                    role="combobox"
                    aria-label={label}
                    aria-expanded={isOpen}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={isOpen && limitedEntries[activeIndex] ? `${listId}-${activeIndex}` : undefined}
                    value={inputValue}
                    placeholder={`Search ${label}...`}
                    className={`w-full border-[1.5px] border-ink pr-10 pl-9 text-[0.9375rem] placeholder:text-faint outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                        // While a part is shown in full (below), the input sits on top of it
                        // with invisible text, so clicking or tabbing in still starts a search
                        showPicked ? "absolute inset-0 h-full bg-transparent text-transparent" : "h-11 bg-paper text-ink"
                    }`}

                    // When the user types:
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setActiveIndex(0);
                        listRef.current?.scrollTo(0, 0);
                        // Clear the parent's selected value because they are searching for a new one
                        if (value) onChange("");
                        open(); // Ensure dropdown opens when typing
                    }}

                    // Open dropdown when clicking into the input
                    onFocus={open}
                    onKeyDown={handleKeyDown}

                    // Close dropdown when clicking away
                    // The setTimeout lets a click on an option land first
                    onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                />
                {showClear && (
                    <button
                        type="button"
                        aria-label={`Clear ${label}`}
                        // Keeps focus in the input, so the list doesn't close and reopen
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleClear}
                        className="absolute top-1.5 right-1.5 grid size-8 place-items-center text-muted hover:bg-paper-2 hover:text-ink"
                    >
                        <CloseIcon className="size-4" />
                    </button>
                )}
            </div>

            {/* Custom Dropdown Menu */}
            {isOpen && (
                <ul
                    ref={listRef}
                    id={listId}
                    role="listbox"
                    aria-label={`${label} options`}
                    className="absolute inset-x-0 top-full z-20 mt-1 max-h-96 overflow-y-auto border-[1.5px] border-ink bg-paper shadow-[0_12px_28px_-8px_rgb(20_20_20/0.35)]"
                >
                    {!options ? (
                        <li className="px-3 py-3 text-sm text-ink-2">Loading {label} parts...</li>
                    ) : limitedEntries.length > 0 ? (
                        limitedEntries.map(([name, data, issues], index) => {
                            const specs = specLabels(category, data.specs);
                            const incompatible = issues.length > 0;
                            const active = index === activeIndex;

                            return (
                                <li
                                    key={name}
                                    id={`${listId}-${index}`}
                                    role="option"
                                    aria-selected={active}
                                    // onMouseDown instead of onClick, so it fires before the input's blur
                                    onMouseDown={() => handleSelect(name)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    className={`flex cursor-pointer flex-col gap-0.5 border-b border-rule px-3 py-2.5 last:border-b-0 ${
                                        // Pink rows so incompatible options stand out while scrolling
                                        incompatible ? (active ? "bg-[#f5dde1]" : "bg-conflict-bg") : active ? "bg-paper-2" : ""
                                    }`}
                                >
                                    <span className={`text-sm font-semibold ${incompatible ? "text-ink-2" : "text-ink"}`}>{name}</span>

                                    {specs.length > 0 && (
                                        <span className="text-xs text-muted">
                                            {specs.join(" · ")}
                                        </span>
                                    )}

                                    {issues.map((issue) => (
                                        <span key={issue} className="flex items-start gap-1 text-xs font-semibold text-conflict">
                                            <ConflictIcon className="mt-px size-3.5 shrink-0" />
                                            {issue}
                                        </span>
                                    ))}
                                </li>
                            );
                        })
                    ) : (
                        <li className="px-3 py-3 text-sm text-ink-2">No matches. Try fewer words or part of a model number.</li>
                    )}
                    {checkedEntries.length > MAX_SHOWN && (
                        <li aria-hidden className="sticky bottom-0 border-t-[1.5px] border-ink bg-paper px-3 py-2 text-xs font-semibold text-ink-2">
                            Showing {MAX_SHOWN} of {checkedEntries.length.toLocaleString()}. Type to narrow down.
                        </li>
                    )}
                </ul>
            )}
        </div>
    )
}
