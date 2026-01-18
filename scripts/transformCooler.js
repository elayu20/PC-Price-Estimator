// Node's built-in file system module (lets us read/write files)
const fs = require("fs");

// -------------- Main transform ----------------

// 1) Read the raw JSON file as a string
const rawText = fs.readFileSync("data/cooler.json", "utf8");

// 2) Convert JSON string -> JS array of objects
const coolerArray = JSON.parse(rawText);

// 3) Build desired JSON object shape: { cooler: {id: price, ...} }
const output = { cooler: {} };

for (const item of coolerArray) {
    // Safety: skip entries without required fields
    if (!item.name || item.price == null) continue;

    const id = item.name;
    const price = item.price;

    // If this cooler already exists, skip it
    if (output.cooler[id] !== undefined) {
        continue;
    }

    // Otherwise, store it
    output.cooler[id] = price;
}

// 4) Write pretty JSON (multi-line + indented)
// JSON.stringify(obj, null, 2) makes it formatted nicely
fs.writeFileSync("output/prices_cooler.json", JSON.stringify(output, null, 2), "utf8");
console.log("Wrote output/prices_cooler.json with", Object.keys(output.cooler).length, "Cooler");