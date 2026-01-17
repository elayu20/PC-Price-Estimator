"use client";

/*
    PartSelect is a reusable dropdown component.

    It works for any part category (cpu, gpu, ram, etc.) as long as you pass:
    - label: what the user sees (e.g., "CPU")
    - value: the currently selected id (string)
    - setValue: the setter from useState (e.g. setCpu)
    - options: the object from your JSON (e.g. prices.cpu)
*/

export default function PartSelect({ label, value, setValue, options }) {
    // If options isn't loaded yet, show a disabled dropdown.
    // (This prevents crashes if prices hasn't loaded)
    if (!options) {
        return (
            <div>
                <select disabled value="">
                    <option>Loading...</option>
                </select>
            </div>
        )
    }

    return (
        <div>
            <select value={value} onChange={(e) => setValue(e.target.value)}>
                <option value="" disabled>
                    Choose {label}...
                </option>

                {Object.entries(options).map(([id, price]) => (
                    <option key={id} value={id}>
                        {id} (${price})
                    </option>
                ))}
            </select>
        </div>
    )
}