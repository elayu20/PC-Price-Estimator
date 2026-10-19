import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { DB_CATEGORIES } from "./categories";
import { rateLimit, clientIp } from "./rateLimit";

const MAX_NAME_LENGTH = 80;
const MAX_PART_NAME_LENGTH = 200;

// Creates, renames, updates and deletes allowed per client IP per window
const WRITES_PER_WINDOW = 30;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

// Build ids are 8 URL-safe characters (48 random bits)
export const BUILD_ID_PATTERN = /^[A-Za-z0-9_-]{8}$/;

export function newBuildId() {
    return randomBytes(6).toString("base64url");
}

export function newEditToken() {
    return randomBytes(24).toString("base64url");
}

export function hashToken(token) {
    return createHash("sha256").update(token).digest("hex");
}

// True if the request's `Authorization: Bearer <token>` matches the build
export function canEdit(request, build) {
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return false;
    return timingSafeEqual(Buffer.from(hashToken(token)), Buffer.from(build.editTokenHash));
}

// Returns a 429 response once the client has made too many build writes,
// otherwise null. Counted separately from eBay price lookups
export function limitWrites(request) {
    const limit = rateLimit(`builds:${clientIp(request)}`, WRITES_PER_WINDOW, RATE_LIMIT_WINDOW_MS);
    if (limit.allowed) return null;
    return NextResponse.json(
        { error: "Too many changes, try again later" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
}

// What clients get to see of a build (never the token hash)
export function publicBuild(build) {
    return {
        id: build.id,
        name: build.name,
        parts: build.parts,
        createdAt: build.createdAt,
        updatedAt: build.updatedAt,
    };
}

// Checks the name and/or parts in a request body. With `partial`, either may
// be left out (for updates). Returns { data } ready for Prisma, or { error }
export async function parseBuildInput(body, { partial = false } = {}) {
    if (!body || typeof body !== "object") return { error: "Expected a JSON object" };
    const data = {};

    if (body.name !== undefined || !partial) {
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (!name) return { error: "Build name is required" };
        if (name.length > MAX_NAME_LENGTH) return { error: `Build name is over ${MAX_NAME_LENGTH} characters` };
        data.name = name;
    }

    if (body.parts !== undefined || !partial) {
        const parts = body.parts;
        if (!parts || typeof parts !== "object" || Array.isArray(parts)) return { error: "parts must be an object" };

        // Empty categories are just left out
        const entries = Object.entries(parts).filter(([, name]) => name !== "" && name != null);
        for (const [key, name] of entries) {
            if (!DB_CATEGORIES[key]) return { error: `Unknown category: ${key}` };
            if (typeof name !== "string" || name.length > MAX_PART_NAME_LENGTH) return { error: `Bad part name for ${key}` };
        }
        if (entries.length === 0) return { error: "A build needs at least one part" };

        // Every part must be in the catalog, so a build always opens cleanly
        const found = await prisma.part.count({
            where: { OR: entries.map(([key, name]) => ({ category: DB_CATEGORIES[key], name })) },
        });
        if (found !== entries.length) return { error: "Build contains unknown parts" };

        data.parts = Object.fromEntries(entries);
    }

    return { data };
}

// Adds { totalCad, unpricedCount } to each build from the cached eBay prices.
// This never calls eBay, so a part nobody has priced yet counts as unpriced
export async function withCachedTotals(builds) {
    const wanted = builds.flatMap(build =>
        Object.entries(build.parts).map(([key, name]) => ({ category: DB_CATEGORIES[key], name }))
    );
    const rows = wanted.length === 0 ? [] : await prisma.part.findMany({
        where: { OR: wanted },
        select: { category: true, name: true, priceCache: { select: { priceCad: true } } },
    });
    const prices = new Map(rows.map(row => [`${row.category}\n${row.name}`, row.priceCache?.priceCad ?? 0]));

    return builds.map(build => {
        let totalCad = 0;
        let unpricedCount = 0;
        for (const [key, name] of Object.entries(build.parts)) {
            const price = prices.get(`${DB_CATEGORIES[key]}\n${name}`) ?? 0;
            if (price > 0) totalCad += price;
            else unpricedCount++;
        }
        return { ...build, totalCad, unpricedCount };
    });
}
