"use client";

import { useMemo, useState } from "react";

/*
    PartSelect: A custom Autocomplete Combobox component
    Replaces the standard <select> with a searchable text input + floating list
*/

export default function PartSelect({ label, value, onChange, options }) {
    // 1) State
    // query is what the user is typing, or null when they aren't searching.
    // While it's null the box just shows the selected part (value)
    const [query, setQuery] = useState(null);
    const inputValue = query ?? value ?? "";

    // isOpen tracks whether the custom dropdown list is visible
    const [isOpen, setIsOpen] = useState(false);

    // If the parent picks a part (e.g. Load), stop showing any half-typed search.
    // Done during render instead of in an effect so there's no extra render pass
    const [prevValue, setPrevValue] = useState(value);
    if (value !== prevValue) {
        setPrevValue(value);
        if (value) setQuery(null);
    }

    // 2) Filter the data based on the text input
    const filteredEntries = useMemo ( () => {
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

    // If options isn't loaded yet, show a disabled input
    if (!options) {
        return (
            <div style={{ marginBottom: 16 }}>
                <input disabled placeholder={`Loading ${label} data...`} style={{ width: "100%", padding: "8px" }} />
            </div>
        );
    }

    const limitedEntries = filteredEntries.slice(0, 50);

    // 3) Handle user selection
    const handleSelect = (name) => {
        onChange(name); // Update the actual build state in the parent
        setQuery(null); // Stop searching, the box now shows the selected name
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
                    setQuery(e.target.value);
                    // Clear the parent's selected value because they are searching for a new one
                    if (value) onChange("");
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
                        limitedEntries.map(([name, data]) => {
                            // Extract specs to build a helpful label
                            const s = data.specs || {};
                            let specLabel = "";

                            // Check what kind of part it is to show the right specs
                            if (label === "RAM" && s.generation) {
                                specLabel = `${s.generation}-${s.speedMhz} MHz | ${s.stickCount} x ${s.capacityGb / s.stickCount}GB`;
                            }
                            else if (label === "CPU" && s.socket) {
                                specLabel = `${s.socket} | ${s.cores} Cores`;
                            }
                            else if (label === "GPU" && s.chipset) {
                                specLabel = `${s.vramGb}GB | ${s.chipset}`;
                            }
                            else if (label === "Motherboard" && s.socket) {
                                const wifiText = s.hasWifi ? " | WiFi" : "";
                                specLabel = `${s.socket} | ${s.formFactor} | ${s.ramSlots} RAM Slots${wifiText}`;
                            }
                            else if (label === "Storage" && s.capacityGb) {
                                let capacityText = s.capacityGb >= 1000
                                    ? `${(s.capacityGb / 1000).toFixed(1).replace('.0', '')}TB`
                                    : `${s.capacityGb}GB`;

                                specLabel = `${capacityText} | ${s.type} | ${s.interface}`;
                            }
                            else if (label === "PSU" && s.wattage) {
                                const efficiencyText = s.efficiency && s.efficiency !== "None" ? s.efficiency : "Standard";
                                const modularText = s.modularity !== "None" ? `${s.modularity} Modularity` : "Non-Modular";
                                specLabel = `${s.wattage}W | ${efficiencyText} | ${modularText}`;
                            }
                            else if (label === "Cooler" && s.rpm) {
                                specLabel = `${s.rpm} RPM | ${s.noise_level} dB`;
                            }

                            return (
                                <li
                                    key={name}
                                    // We use onMouseDown instead of onClick
                                    onMouseDown={() => handleSelect(name)}
                                    style={{
                                        padding: "10px 8px",
                                        cursor: "pointer",
                                        borderBottom: "1px solid #eee",
                                        color: "black",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px"
                                    }}
                                >
                                    <span style={{ fontWeight: "500" }}>{name}</span>

                                    {specLabel && (
                                        <span style={{ color: "#666", fontSize: "0.85em" }}>
                                            {specLabel}
                                        </span>
                                    )}
                                </li>
                            );
                        })
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