// Display helpers shared by the picker and the saved-builds list

const cad = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

// 1234.5 -> "$1,234.50"
export function formatCad(amount) {
    return cad.format(amount);
}

// A past date as "just now", "12 min ago", "3 h ago" or "2 d ago"
export function timeAgo(date) {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    return `${Math.floor(hours / 24)} d ago`;
}

function capacityText(gb) {
    return gb >= 1000 ? `${(gb / 1000).toFixed(1).replace(".0", "")}TB` : `${gb}GB`;
}

// The key specs of a part as short labels, e.g. ["AM5", "8 cores"]. `category`
// is the frontend category key. Empty when the specs are missing
export function specLabels(category, s) {
    if (!s) return [];

    switch (category) {
        case "cpu":
            return s.socket ? [s.socket, `${s.cores} cores`] : [];
        case "gpu":
            return s.chipset ? [s.chipset, `${s.vramGb}GB`] : [];
        case "ram":
            return s.generation
                ? [`${s.generation}-${s.speedMhz}`, `${s.stickCount} x ${s.capacityGb / s.stickCount}GB`]
                : [];
        case "motherboard": {
            if (!s.socket) return [];
            const memText = s.memoryType && s.memoryType !== "Unknown" ? ` ${s.memoryType}` : "";
            return [s.socket, s.formFactor, `${s.ramSlots}x${memText} slots`, ...(s.hasWifi ? ["WiFi"] : [])];
        }
        case "storage":
            return s.capacityGb ? [capacityText(s.capacityGb), s.type, s.interface] : [];
        case "psu": {
            if (!s.wattage) return [];
            const efficiency = s.efficiency && s.efficiency !== "None" ? s.efficiency : "Standard";
            const modular = s.modularity !== "None" ? `${s.modularity} modular` : "Non-modular";
            return [`${s.wattage}W`, efficiency, modular];
        }
        case "cooler":
            return s.rpm ? [`${s.rpm} RPM`, `${s.noise_level} dB`] : [];
        default:
            return [];
    }
}
