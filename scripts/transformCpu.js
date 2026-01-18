// Node's built-in file system module (lets us read/write files)
const fs = require("fs");

// -------------- Main transform ----------------

// 1) Read the raw JSON file as a string
const rawText = fs.readFileSync("data/cpus.json", "utf8");

// 2) Convert JSON string -> JS array of objects
const cpuArray = JSON.parse(rawText);

// 3) Build desired JSON object shape: { cpu: {id: price, ...} }
const output = { cpu: {} };

for (const item of cpuArray) {
    // Safety: skip entries without required fields
    if (!item.name || item.price == null) continue;

    const id = item.name;
    const price = item.price;

    // If two items produce the same id, this would overwrite.
    // For now, that's usually fine, but we can guard it:
    if (output.cpu[id] !== undefined) {
        // If duplicate, add a suffix (simple approach)
        const dupId = `${id}-2`;
        output.cpu[dupId] = price;
    } else {
        output.cpu[id] = price;
    }
}

// 4) Write pretty JSON (multi-line + indented)
// JSON.stringify(obj, null, 2) makes it formatted nicely
fs.writeFileSync("output/prices_cpu.json", JSON.stringify(output, null, 2), "utf8");
console.log("Wrote output/prices_cpu.json with", Object.keys(output.cpu).length, "CPUs");