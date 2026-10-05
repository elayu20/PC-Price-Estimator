import { NextResponse } from "next/server";
import { prisma } from "../../../../utils/prisma";

export async function GET() {
    try {
        // Tell Prisma to get every single part and all their specific details
        const allParts = await prisma.part.findMany({
            include: {
                cpuDetails: true,
                gpuDetails: true,
                motherboardDetails: true,
                ramDetails: true,
                storageDetails: true,
                psuDetails: true,
                coolerDetails: true,
            }
        });
        
        // Group parts by category: { cpu: { "Name": { specs } }, gpu: {...}, ... }
        const formattedData = {
            cpu: {},
            gpu: {},
            ram: {},
            storage: {},
            motherboard: {},
            psu: {},
            cooler: {}
        };

        // Loop through the database results and organize them
        allParts.forEach((part) => {
            // Frontend expects lowercase part name, database has capital part name
            const categoryKey = part.category.toLowerCase();

            // If the category exists in formattedData object, add the part
            if (formattedData[categoryKey] !== undefined) {
                // Find which specific detail object belongs to this part
                // Grab the one that isn't null
                const details = part.cpuDetails || part.gpuDetails || part.motherboardDetails || part.ramDetails || part.storageDetails || part.psuDetails || part.coolerDetails || {};

                // Prices come from eBay via /api/price, so only specs are sent here
                formattedData[categoryKey][part.name] = {
                    specs: details
                };
            }
        });

        // Send the formatted data to the Frontend
        return NextResponse.json(formattedData);
    }
     catch (error) {
        console.error("Failed to fetch parts from database:", error);
        return NextResponse.json({ error: "Failed to load parts"}, {status: 500});
     }
}