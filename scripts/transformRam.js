// Node's built-in file system module (lets us read/write files)
const fs = require("fs");

// -------------- Main transform ----------------

// 1) Read the raw JSON file as a string
const rawText = fs.readFileSync("data/ram.json", "utf8");

// 2) Convert JSON string -> JS array of objects
const ramArray = JSON.parse(rawText);

// 3) Build desired JSON object shape: { ram: {id: price, ...} }
const output = { ram: {} };

for (const item of ramArray) {
    // Safety: skip entries without required fields
    if (!item.name || item.price == null) continue;

    const id = item.name;
    const price = item.price;

    // If duplicate, skip it
    if (output.ram[id] !== undefined) {
        continue;
    }

    // Otherwise, store it
    output.ram[id] = price;
}

// 4) Write pretty JSON (multi-line + indented)
// JSON.stringify(obj, null, 2) makes it formatted nicely
fs.writeFileSync("output/prices_ram.json", JSON.stringify(output, null, 2), "utf8");
console.log("Wrote output/prices_ram.json with", Object.keys(output.ram).length, "RAM");