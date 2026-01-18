const STORAGE_KEY = "pc-build";

export function saveBuild(build) {
    // Converts object to JSON string
    const savedBuild = JSON.stringify(build);
    // Save it under STORAGE_KEY in user's browser
    localStorage.setItem(STORAGE_KEY, savedBuild);
    console.log("Saved build:", build)
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
    const loadedBuild = JSON.parse(saved);
    console.log("Loaded build:", loadedBuild);
    return loadedBuild;
}

export function clearBuild() {
    localStorage.removeItem(STORAGE_KEY);
}