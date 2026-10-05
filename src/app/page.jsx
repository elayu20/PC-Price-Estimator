"use client"
import { useEffect, useState, useMemo, useRef } from "react"
import PartSelect from "../../components/PartSelect";
import { saveBuild, loadBuild } from "../../utils/buildStorage";
import BuildControls from "../../components/BuildControls";

// Every part category, in display order. `key` matches the /api/parts catalog
// keys and the saved-build keys
const CATEGORIES = [
  { key: "cpu", label: "CPU" },
  { key: "gpu", label: "GPU" },
  { key: "ram", label: "RAM" },
  { key: "motherboard", label: "Motherboard" },
  { key: "storage", label: "Storage" },
  { key: "psu", label: "PSU" },
  { key: "cooler", label: "Cooler" },
];

// Builds an object with one entry per category, all set to `value`
function perCategory(value) {
  return Object.fromEntries(CATEGORIES.map(({ key }) => [key, value]));
}

export default function Home() {
  // For ram options dropdown
  const [ramSticks, setRamSticks] = useState("");
  const [ramGen, setRamGen] = useState("");
  const [ramCap, setRamCap] = useState("");

  // Selected part name per category ("" = nothing selected)
  const [build, setBuild] = useState(() => perCategory(""));
  // Part names and specs from the DB, grouped by category
  const [catalog, setCatalog] = useState(null);
  // Live eBay price per category (null = nothing selected, still loading, or unavailable)
  const [livePrices, setLivePrices] = useState(() => perCategory(null));

  // Tracks, per part, whether we tried to fetch a live price and failed
  // (either the API call errored, or eBay had no usable listings)
  // This is what lets us show "Price unavailable" instead of silently
  // showing a made-up number
  const [priceErrors, setPriceErrors] = useState(() => perCategory(false));

  // The part name most recently requested per category. A price response is
  // only applied if it's still for this part, so a slow response for an old
  // pick can't overwrite the price of the current one
  const latestPriceRequest = useRef({});

  // Fetch the part catalog from the DB
  useEffect(() => {
    // This runs once when the page first loads
    fetch("/api/parts")
      .then((res) => res.json())
      .then((data) => {
        setCatalog(data);
      })
      .catch((err) => {
        console.error("Failed to load parts catalog", err);
      })
  }, [])

  // Filter logic for RAM
  const filteredRamOptions = useMemo(() => {
    if (!catalog?.ram) return {};

    return Object.fromEntries(
      Object.entries(catalog.ram).filter(([name, data]) => {
        const specs = data.specs;

        // If a filter is selected, the part MUST match it
        // If no filter is selected (empty string), we ignore that check
        const matchesSticks = ramSticks === "" || Number(specs.stickCount) === Number(ramSticks);
        const matchesGen = ramGen === "" || specs.generation === ramGen;
        const matchesCap = ramCap === "" || String(specs.capacityGb) === ramCap;

        return matchesSticks && matchesGen && matchesCap;
      })
    );
  }, [catalog?.ram, ramSticks, ramGen, ramCap]);

  // livePrices only ever holds a real (> 0) eBay price or null, so missing counts as 0
  const total = CATEGORIES.reduce((sum, { key }) => sum + (livePrices[key] ?? 0), 0);

  // Parts left out of the total because eBay had no price for them
  const unpricedCount = Object.values(priceErrors).filter(Boolean).length;

  // Selects a part in one category and fetches its live price
  function selectPart(partType, partName) {
    setBuild(prev => ({ ...prev, [partType]: partName }));
    fetchLivePrice(partType, partName);
  }

  // Apply a saved (or empty) build to state
  function applyBuildToState(b) {
    // Empty categories just get cleared, so no part or price from the
    // previous build is left behind
    CATEGORIES.forEach(({ key }) => selectPart(key, b[key] ?? ""));
  }

  function handleSave() {
    saveBuild(build);
  }

  function handleLoad() {
    // Load returns an object OR null
    const loaded = loadBuild();
    if (!loaded) return;

    applyBuildToState(loaded);
  }

  function handleReset() {
    // All fields become "", which also clears their prices and errors
    applyBuildToState({});
  }

  // Fetches the live eBay price for one part and saves it to state
  async function fetchLivePrice(partType, partName) {
    latestPriceRequest.current[partType] = partName;

    // Clear the old price right away so it isn't shown next to the new part
    setLivePrices(prev => ({ ...prev, [partType]: null }));
    setPriceErrors(prev => ({ ...prev, [partType]: false }));

    // Nothing selected (e.g. the user is typing a new search), nothing to fetch
    if (!partName) return;

    // True if the user has picked something else since this request started
    const isStale = () => latestPriceRequest.current[partType] !== partName;

    try {
      const response = await fetch(`/api/price?part=${encodeURIComponent(partName)}`);

      if (!response.ok) throw new Error("API failed");

      const data = await response.json();
      if (isStale()) return;

      // price_cad > 0 means we got a real average from eBay listings
      // price_cad === 0 means the API found no usable listings - treat that
      // as a failure to fetch a price, not a real $0 price
      if (data.price_cad && data.price_cad > 0) {
        setLivePrices(prev => ({ ...prev, [partType]: data.price_cad }));
      } else {
        setPriceErrors(prev => ({ ...prev, [partType]: true }));
      }
    } catch (error) {
        if (isStale()) return;
        console.error(`Failed to fetch live price for ${partName}`, error);
        // Network/API failure - mark as unavailable rather than leaving
        // a stale or misleading price on screen
        setPriceErrors(prev => ({ ...prev, [partType]: true }));
    }
  }

  // If the catalog hasn't loaded yet, show something instead of a blank page
  if (!catalog) {
    return <p>Loading parts...</p>
  }

  return (
      <main>
        <h1>PC Price Estimator</h1>

        {CATEGORIES.map(({ key, label }) => {
          const select = (
            <PartSelect
              label={label}
              value={build[key]}
              setValue={(val) => selectPart(key, val)}
              options={key === "ram" ? filteredRamOptions : catalog[key]}
            />
          );

          if (key !== "ram") {
            return <div key={key} style={{ marginBottom: "12px" }}>{select}</div>;
          }

          // RAM gets mini filters above its dropdown
          return (
            <div key={key} style={{ marginBottom: "12px", border: "1px solid #ddd", padding: "12px", borderRadius: "8px" }}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                <select value={ramSticks} onChange={(e) => setRamSticks(e.target.value)} style={{ padding: "6px", flex: 1 }}>
                  <option value="">Any Sticks</option>
                  {[1, 2, 4, 8].map(num => <option key={num} value={num}>{num} Sticks</option>)}
                </select>

                <select value={ramGen} onChange={(e) => setRamGen(e.target.value)} style={{ padding: "6px", flex: 1 }}>
                  <option value="">Any Gen</option>
                  {["DDR3", "DDR4", "DDR5"].map(gen => <option key={gen} value={gen}>{gen}</option>)}
                </select>

                <select value={ramCap} onChange={(e) => setRamCap(e.target.value)} style={{ padding: "6px", flex: 1 }}>
                  <option value="">Any Capacity</option>
                  {[8, 16, 32, 64, 128].map(cap => <option key={cap} value={cap}>{cap}GB Total</option>)}
                </select>
              </div>

              {select}
            </div>
          );
        })}

        <div style={{ marginTop: "24px", padding: "16px", border: "1px solid #ccc" }}>
          <h3>Build Summary</h3>
          {CATEGORIES.map(({ key, label }) => (
            <p key={key}>
              {label}{build[key] ? ` (${build[key]})` : ""}:{" "}
              {priceErrors[key] ? "Price unavailable" : `$${(livePrices[key] ?? 0).toFixed(2)}`}
            </p>
          ))}

          <h2>
            Total: ${total.toFixed(2)}
            {unpricedCount > 0 && ` (${unpricedCount} ${unpricedCount === 1 ? "part" : "parts"} unpriced)`}
          </h2>
        </div>

      <BuildControls onSave={handleSave} onLoad={handleLoad} onReset={handleReset} />
      </main>
  );
}
