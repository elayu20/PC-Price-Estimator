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

    // Grab the price of the first three result
    const firstItem = results.itemSummaries[0];
    const firstItemPrice = Number(firstItem.price.value);
    const secondItem = results.itemSummaries[1];
    const secondItemPrice = Number(secondItem.price.value);
    const thirdItem = results.itemSummaries[2];
    const thirdItemPrice = Number(thirdItem.price.value);

    const totalItemPrice = (firstItemPrice + secondItemPrice + thirdItemPrice) / 3;

    // Send just the clean number back
    return NextResponse.json({ price_cad: totalItemPrice });
}