// Node's built-in file system module (lets us read/write files)
const fs = require("fs");

// -------------- Main transform ----------------

// 1) Read the raw JSON file as a string
const rawText = fs.readFileSync("data/gpus.json", "utf8");

// 2) Convert JSON string -> JS array of objects
const gpuArray = JSON.parse(rawText);

// 3) Build desired JSON object shape: { gpu: {id: price, ...} }
const output = { gpu: {} };

for (const item of gpuArray) {
    // Safety: skip entries without required fields
    if (!item.chipset || item.price == null) continue;

    const id = item.chipset;
    const price = item.price;

    // If this chipset already exists, skip it
    if (output.gpu[id] !== undefined) {
        continue;
    }

    // Otherwise, store it
    output.gpu[id] = price;
}

// 4) Write pretty JSON (multi-line + indented)
// JSON.stringify(obj, null, 2) makes it formatted nicely
fs.writeFileSync("output/prices_gpu.json", JSON.stringify(output, null, 2), "utf8");
console.log("Wrote output/prices_gpu.json with", Object.keys(output.gpu).length, "GPUs");