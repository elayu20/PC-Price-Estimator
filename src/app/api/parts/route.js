import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Turn on the Prisma engine
const prisma = new PrismaClient();

export async function GET() {
    try {
        // Tell Prisma to get every single part from 'parts' table
        const allParts = await prisma.part.findMany();
        
        // Set up an empty object that looks exactly like old prices.json
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
                // Creates structure { item_name: price }
                // Use basePrice. If null, default to 0
                formattedData[categoryKey][part.name] = part.basePrice || 0;
            }
        });

        // Send the formatted data to the Frontend
        return NextResponse.json(formattedData);
    }
     catch (error) {
        console.error("Failed to fetch partts from database:", error);
        return NextResponse.json({ error: "Failed to load parts"}, {status: 500});
     }
}