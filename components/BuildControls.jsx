// Name box plus Save / Save as new / Reset for the build in the picker.
// `canUpdate` is true when the open build was created by this browser, so Save
// overwrites it. Otherwise Save creates a new build (a copy, for shared links)
export default function BuildControls({ name, onNameChange, canUpdate, isShared, saving, onSave, onSaveAsNew, onReset }) {
    let saveLabel = "Save Build";
    if (canUpdate) saveLabel = "Save Changes";
    else if (isShared) saveLabel = "Save a Copy";

    return (
        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <input
                type="text"
                placeholder="Build name"
                value={name}
                maxLength={80}
                onChange={(e) => onNameChange(e.target.value)}
                style={{ padding: "6px", minWidth: 220 }}
            />
            <button onClick={onSave} disabled={saving}>{saveLabel}</button>
            {canUpdate && <button onClick={onSaveAsNew} disabled={saving}>Save as New</button>}
            <button onClick={onReset} disabled={saving}>Reset</button>
        </div>
    );
}
