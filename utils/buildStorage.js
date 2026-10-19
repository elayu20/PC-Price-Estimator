// Builds are saved on the server (/api/builds). Until accounts exist, this
// browser remembers the builds it created, newest first, each with the edit
// token that lets it change that build: [{ id, editToken }]
const STORAGE_KEY = "pc-builds";

// The old single-slot save. Its part names mostly predate the re-seed, so it's
// dropped rather than migrated
const LEGACY_KEY = "pc-build";

function readOwned() {
    try {
        localStorage.removeItem(LEGACY_KEY);
        const owned = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(owned) ? owned : [];
    } catch {
        return [];
    }
}

function writeOwned(owned) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(owned));
}

// Edit token for a build this browser created, or undefined
export function editToken(id) {
    return readOwned().find(build => build.id === id)?.editToken;
}

function forgetBuild(id) {
    writeOwned(readOwned().filter(build => build.id !== id));
}

// fetch() that returns the parsed JSON, or throws with the API's error message
async function request(url, options) {
    const res = await fetch(url, options);
    if (res.status === 204) return null;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const error = new Error(data.error || `Request failed (${res.status})`);
        error.status = res.status;
        throw error;
    }
    return data;
}

function jsonOptions(method, body, id) {
    const headers = { "Content-Type": "application/json" };
    const token = id && editToken(id);
    if (token) headers.Authorization = `Bearer ${token}`;
    return { method, headers, body: body && JSON.stringify(body) };
}

// Any build by id (e.g. from a share link), or null if it doesn't exist
export async function fetchBuild(id) {
    try {
        const { build } = await request(`/api/builds/${encodeURIComponent(id)}`);
        return build;
    } catch (err) {
        if (err.status === 404) return null;
        throw err;
    }
}

// The builds this browser created, newest first, with cached-price totals.
// Builds that no longer exist on the server are forgotten
export async function fetchMyBuilds() {
    const owned = readOwned();
    if (owned.length === 0) return [];

    const params = new URLSearchParams({ ids: owned.map(build => build.id).join(",") });
    const { builds } = await request(`/api/builds?${params}`);

    const byId = new Map(builds.map(build => [build.id, build]));
    const missing = owned.filter(build => !byId.has(build.id));
    if (missing.length > 0) writeOwned(owned.filter(build => byId.has(build.id)));

    return owned.map(build => byId.get(build.id)).filter(Boolean);
}

// Saves a new build and remembers it as this browser's. `parts` is
// { cpu: "Part name", ... }
export async function createBuild(name, parts) {
    const { build, editToken } = await request("/api/builds", jsonOptions("POST", { name, parts }));
    writeOwned([{ id: build.id, editToken }, ...readOwned()]);
    return build;
}

// Changes the name and/or parts of a build this browser created
export async function updateBuild(id, changes) {
    const { build } = await request(`/api/builds/${encodeURIComponent(id)}`, jsonOptions("PATCH", changes, id));
    return build;
}

export async function deleteBuild(id) {
    try {
        await request(`/api/builds/${encodeURIComponent(id)}`, jsonOptions("DELETE", null, id));
    } catch (err) {
        // Already gone counts as deleted
        if (err.status !== 404) throw err;
    }
    forgetBuild(id);
}

// Full share link for a build
export function buildUrl(id) {
    return `${window.location.origin}/build/${id}`;
}
