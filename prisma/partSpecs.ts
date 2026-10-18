// Derives compatibility specs (sockets, memory type) that the raw dataset
// doesn't state directly. Socket names match the ones used in motherboard.json,
// except LGA1151, which is split into -v1 (6th/7th gen) and -v2 (8th/9th gen)

// Default socket per CPU microarchitecture. Architectures that span several
// sockets (HEDT, server, FX vs APU) are refined by name in cpuSocket()
const socketMap: Record<string, string> = {
    // ==========================================
    // AMD ARCHITECTURES
    // ==========================================
    "Zen 5": "AM5",
    "Zen 4": "AM5",          // incl. EPYC 4004
    "Zen 3": "AM4",
    "Zen 2": "AM4",
    "Zen+": "AM4",
    "Zen": "AM4",
    "Excavator": "AM4",      // A-9000 series, Athlon X4 900
    "Puma+": "FM2+",         // Desktop Carrizo
    "Steamroller": "FM2+",
    "Piledriver": "FM2",     // APUs (FX and Opteron handled by name)
    "Bulldozer": "AM3+",
    "Lynx": "FM1",           // Llano APUs
    "Jaguar": "AM1",         // Kabini
    "K10": "AM3",            // Phenom II, Athlon II

    // ==========================================
    // INTEL ARCHITECTURES
    // ==========================================
    "Arrow Lake": "LGA1851",
    "Raptor Lake Refresh": "LGA1700",
    "Raptor Lake": "LGA1700",
    "Alder Lake": "LGA1700",
    "Rocket Lake": "LGA1200",
    "Comet Lake": "LGA1200",
    "Cascade Lake": "LGA2066",           // Core i9-10900X series
    "Coffee Lake Refresh": "LGA1151-v2", // 9th Gen
    "Coffee Lake": "LGA1151-v2",         // 8th Gen
    "Kaby Lake": "LGA1151-v1",           // 7th Gen
    "Skylake": "LGA1151-v1",             // 6th Gen
    "Broadwell": "LGA1150",
    "Haswell Refresh": "LGA1150",
    "Haswell": "LGA1150",
    "Ivy Bridge": "LGA1155",
    "Sandy Bridge": "LGA1155",
    "Westmere": "LGA1156",
    "Nehalem": "LGA1156",
    "Yorkfield": "LGA775",
    "Wolfdale": "LGA775",
    "Core": "LGA775",                    // Core 2 (Conroe/Kentsfield)
};

export function cpuSocket(name: string, microarchitecture: string): string {
    // AMD exceptions
    if (name.includes("Threadripper")) return microarchitecture === "Zen 2" ? "sTRX4" : "sTR4";
    if (name.includes("Opteron")) return "G34";
    if (/\bFX-/.test(name)) return "AM3+";
    if (/Phenom II X4 9[24]0\b/.test(name)) return "AM2+";

    // Intel server / HEDT exceptions
    if (/Xeon E5-24/.test(name)) return "LGA1356";
    if (/Xeon E5-/.test(name)) {
        return microarchitecture === "Haswell" || microarchitecture === "Broadwell" ? "LGA2011-3" : "LGA2011";
    }
    if (/Core i7-9\d\dX?\b/.test(name)) return "LGA1366";      // Nehalem/Westmere i7-900
    if (/Core i7-(38|39|48|49)\d\d/.test(name)) return "LGA2011";   // Sandy/Ivy Bridge-E
    if (/Core i7-(58|59|68|69)\d\d/.test(name)) return "LGA2011-3"; // Haswell/Broadwell-E
    if ((microarchitecture === "Skylake" || microarchitecture === "Kaby Lake") && /Core i\d-\d{4}XE?\b/.test(name)) {
        return "LGA2066"; // Skylake-X / Kaby Lake-X
    }
    if (name.includes("QX9775")) return "LGA771";

    return socketMap[microarchitecture] ?? "Unknown";
}

// LGA1151 boards can't be told apart by socket, so use the chipset in the name:
// 100/200-series and C232/C236 are v1, 300-series and C246 are v2.
// Boards whose chipset can't be found stay "LGA1151"
export function motherboardSocket(socket: string, name: string): string {
    if (socket !== "LGA1151") return socket;

    // Workstation chipsets, often buried in the model (e.g. "E3C246D4U2")
    if (/C23\d/i.test(name)) return "LGA1151-v1";
    if (/C24\d/i.test(name)) return "LGA1151-v2";

    // Consumer chipsets, e.g. "GA-B250M", "H370M", "Z390", Supermicro "C7Z170";
    // X150 is C232 under another name
    const chipset = name.match(/(?:^|[\s\-/]|C\d)[HBZQX]([123])\d\d/i);
    if (chipset) return chipset[1] === "3" ? "LGA1151-v2" : "LGA1151-v1";

    // Asus ROG Maximus VIII/IX are Z170/Z270, X/XI are Z370/Z390
    const maximus = name.match(/MAXIMUS (VIII|IX|XI|X)\b/i);
    if (maximus) return ["VIII", "IX"].includes(maximus[1]!.toUpperCase()) ? "LGA1151-v1" : "LGA1151-v2";

    // Supermicro X11SC* are C246; X11SS*/X11SA* are C236. Asus P10S and "V5" boards target Xeon E3 v5 (C236)
    if (/X11SC/i.test(name)) return "LGA1151-v2";
    if (/X11S[SA]|P10S|\bV5\b|E3V5/i.test(name)) return "LGA1151-v1";

    return "LGA1151";
}

// Memory type supported by each socket's boards. LGA1700 boards come in DDR4 and
// DDR5 versions; the DDR4 ones say so in the name, so DDR5 is the default
const socketMemoryType: Record<string, string> = {
    "AM5": "DDR5",
    "LGA1851": "DDR5",
    "LGA1700": "DDR5",
    "AM4": "DDR4",
    "sTR4": "DDR4",
    "sTRX4": "DDR4",
    "LGA1200": "DDR4",
    "LGA1151": "DDR4",
    "LGA2066": "DDR4",
    "LGA2011-3": "DDR4",
    "AM3+/AM3": "DDR3",
    "AM3+": "DDR3",
    "AM3": "DDR3",
    "FM2+": "DDR3",
    "FM2": "DDR3",
    "FM1": "DDR3",
    "AM1": "DDR3",
    "G34": "DDR3",
    "LGA1150": "DDR3",
    "LGA1155": "DDR3",
    "LGA1156": "DDR3",
    "LGA1366": "DDR3",
    "LGA2011": "DDR3",
};

// Takes the raw socket from motherboard.json
export function motherboardMemoryType(socket: string, name: string): string {
    // Explicit tag in the name, e.g. "B660M DS3H DDR4" or "PRIME H110M-K D3".
    // Gigabyte uses "D3" as a model tier (the GA-Z270P-D3 is DDR4), so only
    // trust the short form from other brands
    const ddrTag = name.match(/DDR([2-5])/i);
    if (ddrTag) return "DDR" + ddrTag[1];
    const shortTag = name.match(/\bD([345])\b/i);
    if (shortTag && !name.startsWith("Gigabyte")) return "DDR" + shortTag[1];

    // Any board that takes AM2/AM2+ CPUs is DDR2
    if (socket.includes("AM2")) return "DDR2";

    // "2 x LGA2011-3 Narrow" -> "LGA2011-3"
    const base = socket.replace(/^2 x /, "").replace(/ Narrow$/, "");
    // LGA775 (DDR2 or DDR3) and boards with integrated CPUs vary too much to guess
    return socketMemoryType[base] ?? "Unknown";
}

// The dataset reuses one name for several variants (e.g. "Corsair Vengeance LPX 16 GB"
// covers dozens of speed/kit combos), but the app keys parts by name. Within each
// same-name group, appends the labels that differ, e.g. "Samsung 990 Pro (2TB)".
// Rows whose labels are identical too can't be told apart by anything the app
// stores (they differ only in color, latency...), so only the first is kept
export function uniqueNames<T>(items: T[], baseName: (item: T) => string, labels: (item: T) => string[]): { item: T; name: string }[] {
    const groups = new Map<string, T[]>();
    for (const item of items) {
        const base = baseName(item);
        groups.set(base, [...(groups.get(base) ?? []), item]);
    }

    const seen = new Set<string>();
    const result: { item: T; name: string }[] = [];

    for (const [base, group] of groups) {
        const groupLabels = group.map(labels);
        // Label positions whose value isn't the same across the whole group
        const differing = groupLabels[0]!
            .map((_, i) => i)
            .filter(i => new Set(groupLabels.map(l => l[i])).size > 1);

        group.forEach((item, index) => {
            const suffix = differing.map(i => groupLabels[index]![i]).filter(Boolean).join(", ");
            const name = suffix ? `${base} (${suffix})` : base;
            if (seen.has(name)) return;
            seen.add(name);
            result.push({ item, name });
        });
    }
    return result;
}

// "2000" -> "2TB", "500" -> "500GB"
export function capacityLabel(gb: number): string {
    return gb >= 1000 ? `${Number((gb / 1000).toFixed(1))}TB` : `${gb}GB`;
}

// eBay search keyword: the parts of the name that sellers put in titles.
// Parenthesized notes like "(2023)" rarely appear in titles, so they're dropped
export function searchQuery(...parts: string[]): string {
    return parts.join(" ").replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

// Adds `extra` to a search keyword unless the name already contains it
// (case-insensitive), e.g. "Corsair RM850x" doesn't need "850W"
export function withExtra(name: string, extra: string, contains = extra): string {
    return name.toLowerCase().includes(contains.toLowerCase()) ? name : `${name} ${extra}`;
}

// GPU chipset as sellers write it: "GeForce RTX 3060 12GB" -> "RTX 3060".
// The memory size is left out because titles write it as "12GB", "12G" or "12 GB"
export function gpuModel(chipset: string): string {
    return chipset.replace(/^(GeForce|Radeon|Intel Arc|Arc)\s+/i, "").replace(/\s+\d+\s?GB$/i, "");
}
