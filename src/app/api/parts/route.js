import { NextResponse } from "next/server";
import { prisma } from "../../../../utils/prisma";
import { DB_CATEGORIES } from "../../../../utils/categories";

// The catalog only changes when the DB is re-seeded, so each category is built
// once and reused for this long (server memory and browser cache). After
// re-seeding, restart the server and hard-refresh to see the new parts right away
const CATALOG_TTL_MS = 60 * 60 * 1000;

// Built categories by frontend key: { cpu: { parts, expiresAt }, ... }
const cachedCategories = {};

// Spec rows without their DB keys, which the frontend never uses
const specs = { omit: { id: true, partId: true } };

// { "Name": { specs } } for one frontend category key. Every category's spec
// relation is named `<key>Details` (cpuDetails, motherboardDetails, ...)
async function buildCategory(key) {
    const detailsField = `${key}Details`;
    const parts = await prisma.part.findMany({
        where: { category: DB_CATEGORIES[key] },
        select: { name: true, [detailsField]: specs },
    });

    // Prices come from eBay via /api/price, so only specs are sent here
    return Object.fromEntries(parts.map(part => [part.name, { specs: part[detailsField] || {} }]));
}

// GET /api/parts?category=cpu -> { "Name": { specs }, ... }
export async function GET(request) {
    const key = new URL(request.url).searchParams.get("category");
    if (!Object.hasOwn(DB_CATEGORIES, key ?? "")) {
        return NextResponse.json({ error: "Missing or unknown category" }, { status: 400 });
    }

    try {
        const cached = cachedCategories[key];
        if (!cached || Date.now() >= cached.expiresAt) {
            cachedCategories[key] = { parts: await buildCategory(key), expiresAt: Date.now() + CATALOG_TTL_MS };
        }

        return NextResponse.json(cachedCategories[key].parts, {
            headers: { "Cache-Control": `public, max-age=${CATALOG_TTL_MS / 1000}` },
        });
    } catch (error) {
        console.error(`Failed to fetch ${key} parts from database:`, error);
        return NextResponse.json({ error: "Failed to load parts" }, { status: 500 });
    }
}
