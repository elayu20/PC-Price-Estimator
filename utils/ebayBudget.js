import { prisma } from "./prisma";

// eBay allows 5,000 Browse API calls a day. Stop a bit short so a burst of
// concurrent lookups can't overshoot it. The token request isn't counted
// (it has its own, much larger quota)
export const DAILY_EBAY_CALLS = 4500;

function utcDay(date = new Date()) {
    return date.toISOString().slice(0, 10);
}

// Seconds until the count resets at the next UTC midnight
export function secondsUntilReset(now = new Date()) {
    const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    return Math.ceil((midnight - now.getTime()) / 1000);
}

// Counts one eBay call against today's budget. Returns false (and the call
// shouldn't be made) once the budget is used up. The count lives in Postgres,
// so unlike the per-IP limit it holds across server instances and restarts
export async function countEbayCall() {
    const day = utcDay();
    const { calls } = await prisma.ebayUsage.upsert({
        where: { day },
        create: { day, calls: 1 },
        update: { calls: { increment: 1 } },
        select: { calls: true },
    });
    return calls <= DAILY_EBAY_CALLS;
}
