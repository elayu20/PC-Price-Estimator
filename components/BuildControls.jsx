export default function BuildControls({ onSave, onLoad, onReset }) {
    /*
        onSave -> function to save current build
        onLoad -> function to load saved build
        onReset -> function to clear selections
    */

        return (
            <div>
                <button onClick={onSave}>Save Build</button>
                <button onClick={onLoad}>Load Build</button>
                <button onClick={onReset}>Reset</button>
            </div>
        )
}