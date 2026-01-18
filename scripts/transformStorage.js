// Node's built-in file system module (lets us read/write files)
const fs = require("fs");

// -------------- Main transform ----------------

// 1) Read the raw JSON file as a string
const rawText = fs.readFileSync("data/storage.json", "utf8");

// 2) Convert JSON string -> JS array of objects
const storageArray = JSON.parse(rawText);

// 3) Build desired JSON object shape: { storage: {id: price, ...} }
const output = { storage: {} };

for (const item of storageArray) {
    // Safety: skip entries without required fields
    if (!item.name || item.price == null) continue;

    const id = item.name;
    const price = item.price;

    // If this storage already exists, skip it
    if (output.storage[id] !== undefined) {
        continue;
    }

    // Otherwise, store it
    output.storage[id] = price;
}

// 4) Write pretty JSON (multi-line + indented)
// JSON.stringify(obj, null, 2) makes it formatted nicely
fs.writeFileSync("output/prices_storage.json", JSON.stringify(output, null, 2), "utf8");
console.log("Wrote output/prices_storage.json with", Object.keys(output.storage).length, "Storage");