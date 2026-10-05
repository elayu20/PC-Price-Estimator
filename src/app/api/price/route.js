import { NextResponse } from "next/server";
import { searchEbay } from "../../../../utils/ebay";

// GET /api/price?part=NAME -> { priceCad } averaged from live eBay listings
export async function GET(request) {
    // Grab the requested part from the URL
    const { searchParams } = new URL(request.url);
    const partToSearch = searchParams.get("part");

    // if the frontend didn't send a part, return an error
    if (!partToSearch) {
        return NextResponse.json({ error: "No part requested" }, { status: 400 });
    }

    // Search eBay for the specific part
    const results = await searchEbay(partToSearch);

    // eBay itself failed (bad credentials, rate limit, outage), which is
    // different from eBay answering with no listings
    if (!results) {
        return NextResponse.json({ error: "eBay request failed" }, { status: 502 });
    }

    // If eBay has no results for this item, return 0$ safely
    if (!results.itemSummaries || results.itemSummaries.length === 0) {
        return NextResponse.json({ priceCad: 0 });
    }

    // Average the price across all returned listings with a valid price
    const prices = results.itemSummaries
        .map(item => Number(item?.price?.value))
        .filter(price => !isNaN(price));

    if (prices.length === 0) {
        return NextResponse.json({ priceCad: 0 });
    }

    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    // Send just the clean number back
    return NextResponse.json({ priceCad: averagePrice });
}
