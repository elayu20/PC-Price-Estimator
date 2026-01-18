"use client";

import { useMemo, useState } from "react";

/*
    PartSelect is a reusable dropdown component.

    It works for any part category (cpu, gpu, ram, etc.) as long as you pass:
    - label: what the user sees (e.g., "CPU")
    - value: the currently selected id (string)
    - setValue: the setter from useState (e.g. setCpu)
    - options: the object from your JSON (e.g. prices.cpu)
*/

export default function PartSelect({ label, value, setValue, options }) {
    // ------------------
    // 1) Local UI state (SEARCH)
    // This is ONLY for filtering what the user sees.
    // It does NOT replace selected value
    const [query, setQuery] = useState("");

    // If options isn't loaded yet, show a disabled dropdown
    // (Prevents crashes if prices hasn't loaded)
    if (!options) {
        return (
            <div>
                <input disabled placeholder={`Search ${label}...`} />
                <select disabled value="">
                    <option>Loading...</option>
                </select>
            </div>
        )
    };

    // -------------------------------------------
    // 2) Convert object -> array, then filter it
    // -------------------------------------------
    // Object.entries(options) gives:
    //  [ [name1, price1], [name2, price2], ... ]
    //
    // We filter it so only matching names remain.
    //
    // useMemo = performance helper (optional but nice):
    // It avoids re-filtering on every render unless
    // options or query actually changes.
    const filteredEntries = useMemo(() => {
        // Make searching forgiving:
        // - ignore uppercase/lowercase
        // - ignore leading/trailing spaces
        const q = query.trim().toLowerCase();

        // If the search box is empty, show everything
        if (q === "") {
            return Object.entries(options);
        }

        // Otherwise, show only items whose name contains q
        return Object.entries(options).filter(([name]) =>
            name.toLowerCase().includes(q)
        );
    }, [options, query]);

    // Optional: limit results so dropdown isn't insanely long
    // (Adjust 50 to whatever you want)
    const limitedEntries = filteredEntries.slice(0, 50);

    // ------------------------------
    // 3) Render search input + dropdown
    // ------------------------------
    return (
        <div style={{ marginBottom: 16}}>
            {/* Search box */}
            <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} // updates query as user types
                placeholder={`Search ${label}...`}
                style={{ width: "100%", marginBottom: 8}}
            />

            {/* Dropdown (still a normal <select>) */}
            <select
                value={value}
                onChange={(e) => {
                    // When user chooses something:
                    // 1) Update the selected value in the parent
                    setValue(e.target.value);
                }}
                style={{ width: "100%"}}
            >
                <option value="" disabled>
                    Choose {label}...
                </option>

                {/* Render filtered options */}
                {limitedEntries.map(([name, price]) => (
                    <option key={name} value={name}>
                        {name} (${price})
                    </option>
                ))}

                {/* If nothing matches, show a helpful message */}
                {limitedEntries.length === 0 && (
                    <option disabled value="">
                        No matches found
                    </option>
                )}
            </select>
        </div>
    )
}