import { NextResponse } from "next/server";
import { getEbayToken } from "../../../../utils/ebay";

// creates an actual API endpoint at http://localhost:3000/api/test
export async function GET() {
    // Try to get the token from eBay
    const token = await getEbayToken();

    // if it fails, tell us why
    if (!token) {
        return NextResponse.json({
            success: false,
            error: "Could not get token. Check your .env.local keys!"
        }, { status: 500 });
    }

    // If it works, show the token on the screen
    return NextResponse.json({
        success: true,
        message: "Handshake successful!",
        your_token: token
    });
}