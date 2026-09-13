import { NextResponse } from "next/server";
import { searchEbay } from "../../../../utils/ebay";

// creates an actual API endpoint at http://localhost:3000/api/test
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

    // If eBay has no results for this item, return 0$ safely
    if (!results || !results.itemSummaries || results.itemSummaries.length === 0) {
        return NextResponse.json({ price_cad: 0 });
    }

    // Average the price across all returned listings with a valid price
    const prices = results.itemSummaries
        .map(item => Number(item?.price?.value))
        .filter(price => !isNaN(price));

    if (prices.length === 0) {
        return NextResponse.json({ price_cad: 0});
    }

    const totalItemPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    // Send just the clean number back
    return NextResponse.json({ price_cad: totalItemPrice });
}
