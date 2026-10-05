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

// Returns eBay's search results, or null if eBay couldn't be reached or returned an error
export async function searchEbay(keyword) {
    const token = await getEbayToken();
    if (!token) return null;

    // Format the eBay Search URL
    // We use encodeURIComponent to turn spaces into %20 (e.g. RTX 4090 -> RTX%204090)
    // limit=20 asks for the top 20 results to keep the data small but smooth out inconsistent listings
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(keyword)}&limit=20`;

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
