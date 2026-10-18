import { NextResponse } from "next/server";
import { prisma } from "../../../../utils/prisma";

// The catalog only changes when the DB is re-seeded, so it's built once and
// reused for this long (server memory and browser cache). After re-seeding,
// restart the server and hard-refresh to see the new parts right away
const CATALOG_TTL_MS = 60 * 60 * 1000;

let cachedCatalog = null;
let cachedCatalogExpiresAt = 0;

// Spec rows without their DB keys, which the frontend never uses
const specs = { omit: { id: true, partId: true } };

async function buildCatalog() {
    // Tell Prisma to get every single part and all their specific details
    const allParts = await prisma.part.findMany({
        select: {
            name: true,
            category: true,
            cpuDetails: specs,
            gpuDetails: specs,
            motherboardDetails: specs,
            ramDetails: specs,
            storageDetails: specs,
            psuDetails: specs,
            coolerDetails: specs,
        }
    });

    // Group parts by category: { cpu: { "Name": { specs } }, gpu: {...}, ... }
    const formattedData = {
        cpu: {},
        gpu: {},
        ram: {},
        storage: {},
        motherboard: {},
        psu: {},
        cooler: {}
    };

    // Loop through the database results and organize them
    allParts.forEach((part) => {
        // Frontend expects lowercase part name, database has capital part name
        const categoryKey = part.category.toLowerCase();

        // If the category exists in formattedData object, add the part
        if (formattedData[categoryKey] !== undefined) {
            // Find which specific detail object belongs to this part
            // Grab the one that isn't null
            const details = part.cpuDetails || part.gpuDetails || part.motherboardDetails || part.ramDetails || part.storageDetails || part.psuDetails || part.coolerDetails || {};

            // Prices come from eBay via /api/price, so only specs are sent here
            formattedData[categoryKey][part.name] = {
                specs: details
            };
        }
    });

    return formattedData;
}

export async function GET() {
    try {
        if (!cachedCatalog || Date.now() >= cachedCatalogExpiresAt) {
            cachedCatalog = await buildCatalog();
            cachedCatalogExpiresAt = Date.now() + CATALOG_TTL_MS;
        }

        // Send the formatted data to the Frontend
        return NextResponse.json(cachedCatalog, {
            headers: { "Cache-Control": `public, max-age=${CATALOG_TTL_MS / 1000}` },
        });
    }
     catch (error) {
        console.error("Failed to fetch parts from database:", error);
        return NextResponse.json({ error: "Failed to load parts"}, {status: 500});
     }
}
