"use client";

import { useMemo, useState, useEffect } from "react";

/*
    PartSelect: A custom Autocomplete Combobox component
    Replaces the standard <select> with a searchable text input + floating list
*/

export default function PartSelect({ label, value, setValue, options }) {
    // 1) Unified State
    // inputValue tracks exactly what is typed in the box
    // We initialize it with 'value' in case a saved build is loaded
    const [inputValue, setInputValue] = useState(value || ""); 

    // isOpen tracks whether the custom dropdown list is visible
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // If the parent chages the value (e.g., Load or Reset), update our local input box
        setInputValue(value || "");
    }, [value]);

    // If options isn't loaded yet, show a disabled input
    if (!options) {
        return (
            <div style={{ marginBottom: 16 }}>
                <input disabled placeholder={`Loading ${label} data...`} style={{ width: "100%", padding: "8px" }} />
            </div>
        );
    }

    // 2) Filter the data based on the text input
    const filteredEntries = useMemo ( () => {
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

    const limitedEntries = filteredEntries.slice(0, 50);

    // 3) Handle user selection
    const handleSelect = (name) => {
        setValue(name); // Update the actual build state in the parent
        setInputValue(name); // Lock the input text to the exact part name
        setIsOpen(false); // Close the dropdown
    }

    return (
        // The wrapper must be relative so the absolute dropdown positions correctly beneath it
        <div style={{ marginBottom: 16, position: "relative" }}>

            <input
                value={inputValue}
                placeholder={`Search or select ${label}...`}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}

                // When the user types:
                onChange={ (e) => {
                    setInputValue(e.target.value);
                    setValue(""); // Clear the parent's selected value because they are searching for a new one
                    setIsOpen(true); // Ensure dropdown opens when typing
                }}

                // Open dropdown when clicking into the input
                onFocus={ () => setIsOpen(true)}

                // Close dropdown when clicking away
                // The setTimeout is a classic React trick
                onBlur={() => setTimeout(() => setIsOpen(false), 150)}
            />

            {/* Custom Dropdown Menu */}
            {isOpen && (
                <ul style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                    maxHeight: "200px",
                    overflowY: "auto",
                    zIndex: 10, // Ensure it floats above other inputs below it
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                }}>
                    {limitedEntries.length > 0 ? (
                        limitedEntries.map(([name, price]) => (
                            <li
                                key={name}
                                // We use onMouseDown instead of onClick
                                onMouseDown={() => handleSelect(name)}
                                style={{
                                    padding: "8px",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #eee",
                                    color: "black"
                                }}
                            >
                                {name} <strong>(${price})</strong>
                            </li>
                        ))
                    ) : (
                        <li style={{ padding: "8px", color: "#888" }}>
                            No matches found
                        </li>
                    )}
                </ul>
            )}
        </div>
    )
}