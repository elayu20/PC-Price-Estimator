import { describe, expect, test } from "vitest";
import { estimatePrice, fallbackQueries } from "../utils/pricing.js";

const listing = (title, value, extra = {}) => ({ title, price: { value: String(value), currency: "CAD" }, conditionId: "3000", ...extra });

describe("estimatePrice", () => {
    test("median of an odd and an even number of listings", () => {
        const query = "Ryzen 7 7800X3D";
        expect(estimatePrice([
            listing("AMD Ryzen 7 7800X3D", 400),
            listing("AMD Ryzen 7 7800X3D CPU", 450),
            listing("Ryzen 7 7800X3D processor", 500),
        ], query)).toEqual({ priceCad: 450, listingCount: 3 });
        expect(estimatePrice([
            listing("AMD Ryzen 7 7800X3D", 400),
            listing("AMD Ryzen 7 7800X3D", 500),
        ], query)).toEqual({ priceCad: 450, listingCount: 2 });
    });

    test("drops junk, other currencies, for-parts and other models", () => {
        expect(estimatePrice([
            listing("AMD Ryzen 7 7800X3D", 420),
            listing("AMD Ryzen 7 7800X3D BOX ONLY", 15),
            listing("Ryzen 7 7800X3D broken pins", 100),
            listing("Lot of 3 Ryzen 7800X3D", 1200),
            listing("AMD Ryzen 7 7800X3D", 300, { price: { value: "300", currency: "USD" } }),
            listing("AMD Ryzen 7 7800X3D", 90, { conditionId: "7000" }),
            listing("AMD Ryzen 7 7700X", 280),
        ], "Ryzen 7 7800X3D")).toEqual({ priceCad: 420, listingCount: 1 });
    });

    test("model numbers match regardless of spacing and punctuation", () => {
        expect(estimatePrice([listing("Intel I9 14900K desktop CPU", 700)], "Intel Core i9-14900K").listingCount).toBe(1);
    });

    test("no usable listings gives a price of 0", () => {
        expect(estimatePrice([], "RTX 3060")).toEqual({ priceCad: 0, listingCount: 0 });
        expect(estimatePrice(undefined, "RTX 3060")).toEqual({ priceCad: 0, listingCount: 0 });
    });
});

describe("fallbackQueries", () => {
    test("GPU tries brand + chipset model, then the model alone", () => {
        expect(fallbackQueries({ category: "GPU", brand: "Gigabyte", gpuDetails: { chipset: "Radeon RX 7900 GRE" } }))
            .toEqual(["Gigabyte RX 7900 GRE", "RX 7900 GRE"]);
    });

    test("RAM drops the trailing speed", () => {
        expect(fallbackQueries({ category: "RAM", searchQuery: "Kingston FURY Beast 32 GB DDR4 3733" }))
            .toEqual(["Kingston FURY Beast 32 GB DDR4"]);
    });

    test("other categories get no fallback", () => {
        expect(fallbackQueries({ category: "CPU", searchQuery: "AMD Ryzen 7 7800X3D" })).toEqual([]);
    });
});
