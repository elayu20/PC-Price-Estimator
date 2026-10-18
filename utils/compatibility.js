// Compatibility checks between the selected parts. Each check only runs when
// both parts involved are selected and the specs it needs are known

// Turns a motherboard socket into the CPU sockets it accepts, e.g.
// "AM3+/AM3" -> ["AM3+", "AM3"], "2 x LGA2011-3 Narrow" -> ["LGA2011-3"]
function boardSockets(socket) {
    return socket.replace(/^2 x /, "").replace(/ Narrow$/, "").split("/");
}

function socketIssue(cpu, board) {
    if (board.socket.startsWith("Integrated")) {
        return `This motherboard has a built-in CPU (${board.socket.replace("Integrated ", "")}), so it can't take a separate CPU`;
    }
    if (cpu.socket === "Unknown") return null;

    const accepted = boardSockets(board.socket);
    if (accepted.includes(cpu.socket)) return null;

    // A few LGA1151 boards couldn't be split into v1/v2, so they may fit either
    if (accepted.includes("LGA1151") && cpu.socket.startsWith("LGA1151-")) return null;

    return `CPU socket ${cpu.socket} doesn't match motherboard socket ${board.socket}`;
}

function memoryTypeIssue(ram, board) {
    if (ram.generation === "Unknown" || board.memoryType === "Unknown") return null;
    if (ram.generation === board.memoryType) return null;
    return `${ram.generation} RAM won't fit this motherboard, which takes ${board.memoryType}`;
}

function ramSlotsIssue(ram, board) {
    if (ram.stickCount <= board.ramSlots) return null;
    return `This RAM kit has ${ram.stickCount} sticks but the motherboard only has ${board.ramSlots} slots`;
}

// `specs` holds the specs of each selected part by category key (missing = not selected).
// Returns a list of { parts: [categoryKey, ...], message }
export function checkCompatibility(specs) {
    const { cpu, ram, motherboard } = specs;
    const issues = [];

    function add(parts, message) {
        if (message) issues.push({ parts, message });
    }

    if (cpu && motherboard) add(["cpu", "motherboard"], socketIssue(cpu, motherboard));
    if (ram && motherboard) {
        add(["ram", "motherboard"], memoryTypeIssue(ram, motherboard));
        add(["ram", "motherboard"], ramSlotsIssue(ram, motherboard));
    }

    return issues;
}
