import { describe, expect, test } from "vitest";
import { checkCompatibility } from "../utils/compatibility.js";

const cpu = socket => ({ socket });
const board = (socket, memoryType = "DDR4", ramSlots = 4) => ({ socket, memoryType, ramSlots });
const ram = (generation, stickCount = 2) => ({ generation, stickCount });

describe("checkCompatibility", () => {
    test("no issues when nothing or only one part is selected", () => {
        expect(checkCompatibility({})).toEqual([]);
        expect(checkCompatibility({ cpu: cpu("AM5") })).toEqual([]);
    });

    describe("CPU socket", () => {
        test("7800X3D fits a B650 board but not a B550", () => {
            expect(checkCompatibility({ cpu: cpu("AM5"), motherboard: board("AM5", "DDR5") })).toEqual([]);
            const issues = checkCompatibility({ cpu: cpu("AM5"), motherboard: board("AM4") });
            expect(issues).toHaveLength(1);
            expect(issues[0].parts).toEqual(["cpu", "motherboard"]);
        });

        test("i7-8700K fits Z370 (v2) but not Z270 (v1)", () => {
            expect(checkCompatibility({ cpu: cpu("LGA1151-v2"), motherboard: board("LGA1151-v2") })).toEqual([]);
            expect(checkCompatibility({ cpu: cpu("LGA1151-v2"), motherboard: board("LGA1151-v1") })).toHaveLength(1);
        });

        test("plain LGA1151 boards accept v1 and v2 CPUs", () => {
            expect(checkCompatibility({ cpu: cpu("LGA1151-v1"), motherboard: board("LGA1151") })).toEqual([]);
            expect(checkCompatibility({ cpu: cpu("LGA1151-v2"), motherboard: board("LGA1151") })).toEqual([]);
        });

        test("FX-8350 fits a 990FX (AM3+/AM3) board", () => {
            expect(checkCompatibility({ cpu: cpu("AM3+"), motherboard: board("AM3+/AM3", "DDR3") })).toEqual([]);
        });

        test("dual-socket and Narrow boards are normalized", () => {
            expect(checkCompatibility({ cpu: cpu("LGA2011-3"), motherboard: board("2 x LGA2011-3 Narrow") })).toEqual([]);
        });

        test("integrated-CPU boards reject every CPU", () => {
            const issues = checkCompatibility({ cpu: cpu("AM4"), motherboard: board("Integrated Atom D2700") });
            expect(issues).toHaveLength(1);
            expect(issues[0].message).toContain("Atom D2700");
        });

        test("unknown CPU socket is skipped", () => {
            expect(checkCompatibility({ cpu: cpu("Unknown"), motherboard: board("AM4") })).toEqual([]);
        });
    });

    describe("RAM", () => {
        test("generation must match the board's memory type", () => {
            expect(checkCompatibility({ ram: ram("DDR5"), motherboard: board("AM5", "DDR5") })).toEqual([]);
            const issues = checkCompatibility({ ram: ram("DDR4"), motherboard: board("AM5", "DDR5") });
            expect(issues).toEqual([{ parts: ["ram", "motherboard"], message: expect.stringContaining("DDR4") }]);
        });

        test("unknown memory type is skipped", () => {
            expect(checkCompatibility({ ram: ram("DDR3"), motherboard: board("LGA775", "Unknown") })).toEqual([]);
        });

        test("stick count must fit the board's slots", () => {
            expect(checkCompatibility({ ram: ram("DDR4", 2), motherboard: board("AM4", "DDR4", 2) })).toEqual([]);
            expect(checkCompatibility({ ram: ram("DDR4", 4), motherboard: board("AM4", "DDR4", 2) })).toHaveLength(1);
        });

        test("reports both RAM issues at once", () => {
            expect(checkCompatibility({ ram: ram("DDR3", 4), motherboard: board("AM5", "DDR5", 2) })).toHaveLength(2);
        });
    });

    test("issues from different pairs are combined", () => {
        const issues = checkCompatibility({ cpu: cpu("AM4"), ram: ram("DDR4"), motherboard: board("AM5", "DDR5") });
        expect(issues.map(i => i.parts)).toEqual([["cpu", "motherboard"], ["ram", "motherboard"]]);
    });
});
