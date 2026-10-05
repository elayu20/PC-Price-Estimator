const STORAGE_KEY = "pc-build";

export function saveBuild(build) {
    // Converts object to JSON string
    const savedBuild = JSON.stringify(build);
    // Save it under STORAGE_KEY in user's browser
    localStorage.setItem(STORAGE_KEY, savedBuild);
}

// Returns an object or null
export function loadBuild() {
    // Get the string from local storage
    const saved = localStorage.getItem(STORAGE_KEY);

    // If nothing is saved, do nothing
    if (!saved) {
        return null;
    }

    // Convert JSON string back into object
    try {
        return JSON.parse(saved);
    } catch (err) {
        console.error("Saved build was corrupted, clearing it.", err);
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}