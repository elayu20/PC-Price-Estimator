import { NextResponse } from "next/server";
import { searchEbay } from "../../../../utils/ebay";

// creates an actual API endpoint at http://localhost:3000/api/test
export async function GET() {
    // Test with this part
    const testPart = "RTX 3060 12GB";
    const results = await searchEbay(testPart);

    if (!results) {
        return NextResponse.json({ error: "No items found or search failed" }, { status: 500 });
    }

    // Grab the first listing in array
    const firstItem = results.itemSummaries[0];
    // Extract name of listing
    const itemName = firstItem.title;
    // Extract the price
    const itemPrice = Number(firstItem.price.value);

    // Send only the clean data
    return NextResponse.json({
        success: true,
        part_searched: testPart,
        found_title: itemName,
        price_cad: itemPrice
    });
}