// Fixed-window request counter per key (e.g. client IP), kept in memory. Each
// server instance counts on its own, so on a multi-instance deploy the real
// limit is this times the number of instances
const windows = new Map();

// Returns { allowed: true } and counts the request, or { allowed: false,
// retryAfterSeconds } once `key` has made `limit` requests in the current window
export function rateLimit(key, limit, windowMs) {
    const now = Date.now();

    // Drop finished windows now and then so the map doesn't grow forever
    if (windows.size > 10000) {
        for (const [k, w] of windows) {
            if (now >= w.resetAt) windows.delete(k);
        }
    }

    const current = windows.get(key);
    if (!current || now >= current.resetAt) {
        windows.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true };
    }

    if (current.count >= limit) {
        return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
    }

    current.count++;
    return { allowed: true };
}

// Client IP from the proxy header (set by Vercel and most hosts), or "unknown"
// when running locally without a proxy
export function clientIp(request) {
    const forwarded = request.headers.get("x-forwarded-for");
    return forwarded?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
}
