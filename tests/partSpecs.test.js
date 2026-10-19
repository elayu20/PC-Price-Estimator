import { describe, expect, test } from "vitest";
import {
    capacityLabel,
    cpuSocket,
    gpuModel,
    motherboardMemoryType,
    motherboardSocket,
    searchQuery,
    uniqueNames,
    withExtra,
} from "../prisma/partSpecs.ts";

describe("cpuSocket", () => {
    test.each([
        ["AMD Ryzen 7 7800X3D", "Zen 4", "AM5"],
        ["AMD Ryzen 5 5600X", "Zen 3", "AM4"],
        ["Intel Core i9-14900K", "Raptor Lake Refresh", "LGA1700"],
        ["Intel Core i7-8700K", "Coffee Lake", "LGA1151-v2"],
        ["Intel Core i7-7700K", "Kaby Lake", "LGA1151-v1"],
        ["Intel Core i5-4690K", "Haswell", "LGA1150"],
    ])("%s (%s) -> %s by microarchitecture", (name, arch, socket) => {
        expect(cpuSocket(name, arch)).toBe(socket);
    });

    test.each([
        ["AMD Threadripper 3970X", "Zen 2", "sTRX4"],
        ["AMD Threadripper 2950X", "Zen+", "sTR4"],
        ["AMD FX-8350", "Piledriver", "AM3+"],
        ["AMD Opteron 6380", "Piledriver", "G34"],
        ["Intel Xeon E5-2690 V3", "Haswell", "LGA2011-3"],
        ["Intel Xeon E5-2670", "Sandy Bridge", "LGA2011"],
        ["Intel Xeon E5-2420", "Sandy Bridge", "LGA1356"],
        ["Intel Core i7-5820K", "Haswell", "LGA2011-3"],
        ["Intel Core i7-3930K", "Sandy Bridge", "LGA2011"],
        ["Intel Core i7-920", "Nehalem", "LGA1366"],
        ["Intel Core i9-7900X", "Skylake", "LGA2066"],
    ])("%s (%s) -> %s by name exception", (name, arch, socket) => {
        expect(cpuSocket(name, arch)).toBe(socket);
    });

    test("unknown microarchitecture", () => {
        expect(cpuSocket("Mystery CPU", "Nope")).toBe("Unknown");
    });
});

describe("motherboardSocket", () => {
    test("leaves sockets other than LGA1151 alone", () => {
        expect(motherboardSocket("AM5", "Gigabyte B650 AORUS ELITE AX")).toBe("AM5");
    });

    test.each([
        ["Asus PRIME Z270-A", "LGA1151-v1"],
        ["Gigabyte GA-B250M-DS3H", "LGA1151-v1"],
        ["Asus ROG STRIX Z370-E GAMING", "LGA1151-v2"],
        ["MSI H370M BAZOOKA", "LGA1151-v2"],
        ["ASRock E3C246D4U2", "LGA1151-v2"],
        ["Supermicro X11SSL-F", "LGA1151-v1"],
        ["Asus ROG MAXIMUS IX HERO", "LGA1151-v1"],
        ["Asus ROG MAXIMUS XI HERO", "LGA1151-v2"],
        ["Some Board Without Chipset", "LGA1151"],
    ])("%s -> %s", (name, socket) => {
        expect(motherboardSocket("LGA1151", name)).toBe(socket);
    });
});

describe("motherboardMemoryType", () => {
    test.each([
        ["AM5", "Gigabyte B650 AORUS ELITE AX", "DDR5"],
        ["AM4", "Gigabyte B550 AORUS ELITE AX V2", "DDR4"],
        ["LGA1700", "MSI PRO Z790-A", "DDR5"],
        ["LGA1700", "Gigabyte B660M DS3H DDR4", "DDR4"],
        ["LGA1151", "Asus PRIME H110M-K D3", "DDR3"],
        ["AM3+/AM3", "Gigabyte GA-990FXA-UD3", "DDR3"],
        ["AM3/AM2+/AM2", "Asus M4A78LT-M", "DDR2"],
        ["2 x LGA2011-3 Narrow", "Supermicro X10DRL-i", "DDR4"],
        ["LGA775", "Asus P5G41T-M LX", "Unknown"],
        ["Integrated Atom D2700", "ASRock AD2700B-ITX", "Unknown"],
    ])("%s %s -> %s", (socket, name, type) => {
        expect(motherboardMemoryType(socket, name)).toBe(type);
    });

    test("Gigabyte D3 is a model tier, not DDR3", () => {
        expect(motherboardMemoryType("LGA1151", "Gigabyte GA-Z270P-D3")).toBe("DDR4");
    });
});

describe("uniqueNames", () => {
    const names = items => uniqueNames(items, i => i.name, i => i.labels).map(r => r.name);

    test("appends only the labels that differ within a same-name group", () => {
        expect(names([
            { name: "Corsair Vengeance LPX 16 GB", labels: ["DDR4-3200", "2 x 8GB"] },
            { name: "Corsair Vengeance LPX 16 GB", labels: ["DDR4-3600", "2 x 8GB"] },
            { name: "Samsung 990 Pro", labels: ["2TB"] },
        ])).toEqual([
            "Corsair Vengeance LPX 16 GB (DDR4-3200)",
            "Corsair Vengeance LPX 16 GB (DDR4-3600)",
            "Samsung 990 Pro",
        ]);
    });

    test("drops rows whose labels are identical too", () => {
        expect(names([
            { name: "Noctua NH-D15", labels: ["140mm"] },
            { name: "Noctua NH-D15", labels: ["140mm"] },
        ])).toEqual(["Noctua NH-D15"]);
    });
});

describe("search query helpers", () => {
    test("capacityLabel", () => {
        expect(capacityLabel(500)).toBe("500GB");
        expect(capacityLabel(2000)).toBe("2TB");
        expect(capacityLabel(1500)).toBe("1.5TB");
    });

    test("searchQuery drops parenthesized notes and extra spaces", () => {
        expect(searchQuery("Samsung 990 Pro (2023)", " 2TB")).toBe("Samsung 990 Pro 2TB");
    });

    test("withExtra skips what the name already has", () => {
        expect(withExtra("Corsair RM850x", "850W", "850")).toBe("Corsair RM850x");
        expect(withExtra("Corsair RMx", "850W")).toBe("Corsair RMx 850W");
    });

    test("gpuModel", () => {
        expect(gpuModel("GeForce RTX 3060 12GB")).toBe("RTX 3060");
        expect(gpuModel("Radeon RX 7900 GRE")).toBe("RX 7900 GRE");
        expect(gpuModel("Intel Arc A770 16 GB")).toBe("A770");
    });
});
