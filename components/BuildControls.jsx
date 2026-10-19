// Name box plus Save / Save as new / Reset for the build in the picker.
// `canUpdate` is true when the open build was created by this browser, so Save
// overwrites it. Otherwise Save creates a new build (a copy, for shared links)
export default function BuildControls({ name, onNameChange, canUpdate, isShared, saving, onSave, onSaveAsNew, onReset }) {
    let saveLabel = "Save Build";
    if (canUpdate) saveLabel = "Save Changes";
    else if (isShared) saveLabel = "Save a Copy";

    return (
        <form
            className="flex flex-col gap-2"
            onSubmit={(e) => { e.preventDefault(); onSave(); }}
        >
            <label className="text-[0.6875rem] font-bold tracking-wider text-muted uppercase" htmlFor="build-name">Build name</label>
            <input
                id="build-name"
                type="text"
                placeholder="Untitled build"
                value={name}
                maxLength={80}
                onChange={(e) => onNameChange(e.target.value)}
                className="field w-full"
            />
            <div className="mt-1 flex flex-wrap gap-2">
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                    {saving ? "Saving..." : saveLabel}
                </button>
                {canUpdate && <button type="button" onClick={onSaveAsNew} disabled={saving} className="btn">Save as New</button>}
                <button type="button" onClick={onReset} disabled={saving} className="btn">Reset</button>
            </div>
        </form>
    );
}
