// Cached app token, reused until shortly before it expires (eBay tokens last ~2 hours)
let cachedToken = null;
let cachedTokenExpiresAt = 0;

export async function getEbayToken() {
    if (cachedToken && Date.now() < cachedTokenExpiresAt) {
        return cachedToken;
    }

    const clientID = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;

    // eBay requires these two keys to be mashed together and encoded in "Base64"
    const authHeader = Buffer.from(`${clientID}:${clientSecret}`).toString('base64');

    try {
        const response = await fetch ('https://api.ebay.com/identity/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${authHeader}`,
            },
            // This tells eBay: "I'm not acting as a user, I'm just an app wanting public data"
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                scope: 'https://api.ebay.com/oauth/api_scope'
            }),
        });

        if (!response.ok) {
            console.error(`eBay token request failed with status ${response.status}`);
            return null;
        }

        const data = await response.json();

        // Refresh a minute early so a token never expires mid-request
        cachedToken = data.access_token;
        cachedTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

        return cachedToken;
    } catch (error) {
        console.error("Error getting eBay token:", error);
        return null;
    }
}

// eBay category per part category, so searches skip cables, fans, "PLC" listings
// and other look-alikes. The Browse API takes only one category per search, so
// storage picks SSD or HDD by drive type
const EBAY_CATEGORY_IDS = {
    CPU: "164",          // CPUs/Processors
    GPU: "27386",        // Graphics/Video Cards
    RAM: "170083",       // Memory (RAM)
    Motherboard: "1244", // Motherboards
    PSU: "42017",        // Power Supplies
    Cooler: "131486",    // CPU Fans & Heatsinks
    SSD: "175669",       // Solid State Drives
    HDD: "56083",        // Internal Hard Disk Drives
};

// Takes a DB category ("CPU", "Storage"...) and, for storage, the drive type
export function ebayCategoryId(category, storageType) {
    if (category === "Storage") return EBAY_CATEGORY_IDS[storageType === "HDD" ? "HDD" : "SSD"];
    return EBAY_CATEGORY_IDS[category];
}

// Returns eBay's search results, or null if eBay couldn't be reached or returned an error.
// nearbyOnly limits results to sellers in North America. Overseas listings on
// eBay CA (often new-old-stock from Japan or Europe) ask far above what a
// Canadian buyer pays, and they fill most of the top results for GPUs
export async function searchEbay(keyword, categoryId, nearbyOnly = false) {
    const token = await getEbayToken();
    if (!token) return null;

    // Format the eBay Search URL
    // We use encodeURIComponent to turn spaces into %20 (e.g. RTX 4090 -> RTX%204090)
    // Only fixed-price new/used listings: auctions show the current bid, not
    // what the part sells for, and "for parts" condition items aren't working parts.
    // limit=50 leaves enough listings after pricing.js drops the junk
    const filters = ["buyingOptions:{FIXED_PRICE}", "conditions:{NEW|USED}"];
    if (nearbyOnly) filters.push("itemLocationRegion:NORTH_AMERICA");
    const params = new URLSearchParams({ q: keyword, limit: "50", filter: filters.join(",") });
    if (categoryId) params.set("category_ids", categoryId);
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`;

    try {
        // Send the request with the token attached
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_CA', // Telling eBay we want the Canadian marketplace
            }
        });

        if (!response.ok) {
            // A rejected token shouldn't be reused on the next request
            if (response.status === 401) cachedToken = null;
            console.error(`eBay search failed for "${keyword}" with status ${response.status}`);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Search Error:", error);
        return null;
    }
}
