export async function getEbayToken() {
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

        const data = await response.json();

        return data.access_token; // This is the "wristband"
    } catch (error) {
        console.error("Error getting eBay token:", error);
        return null;
    }
}

export async function searchEbay(keyword) {
    const token = await getEbayToken();
    if (!token) return null;

    // Format the eBay Search URL
    // We use encodedURIComponent to turn spaces into %20 (e.ge, RTX 4090 -> RTX%204090)
    // limit=3 tells eBay we only want the top 3 results to keep the data small
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(keyword)}&limited=3`;

    try {
        // Send the request with the token attached
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_CA', // Telling eBay we want the Canadian marketplace
            }
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Search Error:", error);
        return null;
    }
}