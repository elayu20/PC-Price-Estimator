"use client"
import { useEffect, useState, useMemo, useRef } from "react"
import PartSelect from "./PartSelect";
import PartCard, { PART_COLUMNS } from "./PartCard";
import BuildSummary from "./BuildSummary";
import BuildControls from "./BuildControls";
import SavedBuilds from "./SavedBuilds";
import { ChevronIcon } from "./Icons";
import { checkCompatibility } from "../utils/compatibility";
import { MIN_LISTINGS } from "../utils/pricing";
import { createBuild, deleteBuild, editToken, fetchBuild, fetchMyBuilds, updateBuild } from "../utils/buildStorage";

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

// Selected part names only, e.g. { cpu: "...", ram: "..." }
function selectedParts(build) {
  return Object.fromEntries(Object.entries(build).filter(([, name]) => name));
}

// Shows the address of the open build (or "/") without a navigation, so the
// picker state isn't reset
function showUrl(path) {
  if (window.location.pathname !== path) window.history.replaceState(null, "", path);
}

// The part picker. `buildId` (from /build/<id>) opens that saved build on load
export default function Builder({ buildId }) {
  // For ram options dropdown
  const [ramSticks, setRamSticks] = useState("");
  const [ramGen, setRamGen] = useState("");
  const [ramCap, setRamCap] = useState("");

  // Selected part name per category ("" = nothing selected)
  const [build, setBuild] = useState(() => perCategory(""));
  // Part names and specs from the DB, by category: { cpu: { "Name": { specs } } }.
  // A category is only fetched once it's needed (see loadCategory)
  const [catalog, setCatalog] = useState({});
  // Categories requested so far, so each is fetched only once
  const catalogRequests = useRef({});
  // Live eBay price per category: the /api/price response { priceCad,
  // listingCount, fetchedAt, stale }, or null (nothing selected, still loading,
  // or unavailable)
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

  // The saved build open in the picker: { id, name, parts, owned }, or null for
  // an unsaved one. `owned` = this browser created it and can overwrite it.
  // Anyone else's Save makes a copy, so a share link never changes for others
  const [openBuild, setOpenBuild] = useState(null);
  const [buildName, setBuildName] = useState("");
  // This browser's saved builds (null = loading) and the error loading them
  const [myBuilds, setMyBuilds] = useState(null);
  const [myBuildsError, setMyBuildsError] = useState(null);
  // Result of the last save/load/delete, e.g. "Saved." or an error
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  // Id of the build last opened, so the /build/<id> effect doesn't reopen it
  const openedId = useRef(null);

  // Fetches one category's parts from the DB, the first time its dropdown opens
  // or a part in it is picked (the compatibility check and summary need its specs)
  function loadCategory(key) {
    if (catalogRequests.current[key]) return;
    catalogRequests.current[key] = true;

    fetch(`/api/parts?category=${key}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((parts) => setCatalog(prev => ({ ...prev, [key]: parts })))
      .catch((err) => {
        console.error(`Failed to load ${key} parts`, err);
        // Opening the dropdown again retries
        catalogRequests.current[key] = false;
        setStatus("Couldn't load some parts. Open the list again to retry.");
      });
  }

  // Load the "My builds" list
  useEffect(() => {
    refreshMyBuilds();
  }, [])

  // Open the build from the share link
  useEffect(() => {
    if (!buildId || openedId.current === buildId) return;
    openedId.current = buildId;

    fetchBuild(buildId)
      .then((b) => {
        if (b) showBuild(b);
        else setStatus("That build doesn't exist (it may have been deleted).");
      })
      .catch((err) => setStatus(`Couldn't load build: ${err.message}`));
    // Only a new link id should reopen anything, not a new showBuild each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId])

  // Filter logic for RAM
  const filteredRamOptions = useMemo(() => {
    // null tells the dropdown the parts are still loading
    if (!catalog.ram) return null;

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
  }, [catalog.ram, ramSticks, ramGen, ramCap]);

  // Specs of each selected part (undefined = nothing selected, or not loaded yet)
  const selectedSpecs = useMemo(() => Object.fromEntries(
    CATEGORIES.map(({ key }) => [key, catalog[key]?.[build[key]]?.specs])
  ), [catalog, build]);

  // Conflicts between the selected parts
  const compatibilityIssues = useMemo(() => checkCompatibility(selectedSpecs), [selectedSpecs]);

  // Messages for the conflicts a dropdown option would cause with the rest of
  // the build if it were picked in category `key`
  function optionIssues(key, specs) {
    return checkCompatibility({ ...selectedSpecs, [key]: specs })
      .filter(({ parts }) => parts.includes(key))
      .map(({ message }) => message);
  }

  // livePrices only ever holds a real (> 0) eBay price or null, so missing counts as 0
  const total = CATEGORIES.reduce((sum, { key }) => sum + (livePrices[key]?.priceCad ?? 0), 0);

  // Compatibility messages per category, shown on that category's row. The full
  // message goes on the first part's row; the other parts just point to it
  const labelOf = Object.fromEntries(CATEGORIES.map(({ key, label }) => [key, label]));
  const issuesByCategory = Object.fromEntries(CATEGORIES.map(({ key }) => [
    key,
    // A Set, so two RAM issues give the motherboard one pointer, not two
    [...new Set(compatibilityIssues
      .filter(({ parts }) => parts.includes(key))
      .map(({ parts, message }) => (parts[0] === key ? message : `Conflicts with the ${labelOf[parts[0]]} (see above)`)))],
  ]));

  // Parts left out of the total because eBay had no price for them
  const unpricedCount = Object.values(priceErrors).filter(Boolean).length;

  // Footnotes for prices worth a caveat (missing, few listings, outdated),
  // numbered in category order. `priceMarkers` maps a category to its number
  const priceNotes = [];
  const priceMarkers = {};
  CATEGORIES.forEach(({ key, label }) => {
    const price = livePrices[key];
    const caveats = [];
    if (build[key] && priceErrors[key]) caveats.push("no usable eBay listings, so it's left out of the total");
    if (price && price.listingCount < MIN_LISTINGS) {
      caveats.push(`only ${price.listingCount} matching ${price.listingCount === 1 ? "listing" : "listings"}, so treat it as rough`);
    }
    if (price?.stale) caveats.push("eBay couldn't be reached, so this is the last known price");
    if (caveats.length === 0) return;

    const n = priceNotes.length + 1;
    priceMarkers[key] = n;
    priceNotes.push({ n, text: `${label}: ${caveats.join("; ")}.` });
  });

  // Selects a part in one category and fetches its live price
  function selectPart(partType, partName) {
    setBuild(prev => ({ ...prev, [partType]: partName }));
    if (partName) loadCategory(partType);
    fetchLivePrice(partType, partName);
  }

  // Apply a saved (or empty) build to state
  function applyBuildToState(b) {
    // Empty categories just get cleared, so no part or price from the
    // previous build is left behind
    CATEGORIES.forEach(({ key }) => selectPart(key, b[key] ?? ""));
  }

  // True when the picker or name differ from the open build as last saved
  const hasUnsavedChanges = openBuild !== null && (
    buildName.trim() !== openBuild.name ||
    CATEGORIES.some(({ key }) => (openBuild.parts[key] ?? "") !== build[key])
  );

  function refreshMyBuilds() {
    fetchMyBuilds()
      .then((builds) => {
        setMyBuilds(builds);
        setMyBuildsError(null);
      })
      .catch((err) => setMyBuildsError(err.message));
  }

  // Puts a saved build into the picker and the address bar
  function showBuild(b) {
    openedId.current = b.id;
    setOpenBuild({ ...b, owned: Boolean(editToken(b.id)) });
    setBuildName(b.name);
    applyBuildToState(b.parts);
    showUrl(`/build/${b.id}`);
    setStatus("");
  }

  // Saves the picker: overwrites the open build if this browser owns it,
  // otherwise (or with asNew) creates a new build and opens that
  async function save(asNew) {
    const parts = selectedParts(build);
    if (Object.keys(parts).length === 0) {
      setStatus("Pick at least one part before saving.");
      return;
    }
    const name = buildName.trim() || "Untitled build";

    setSaving(true);
    try {
      const saved = openBuild?.owned && !asNew
        ? await updateBuild(openBuild.id, { name, parts })
        : await createBuild(name, parts);
      openedId.current = saved.id;
      setOpenBuild({ ...saved, owned: true });
      setBuildName(saved.name);
      showUrl(`/build/${saved.id}`);
      setStatus("Saved.");
      refreshMyBuilds();
    } catch (err) {
      setStatus(`Couldn't save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    // All fields become "", which also clears their prices and errors
    applyBuildToState({});
    openedId.current = null;
    setOpenBuild(null);
    setBuildName("");
    setStatus("");
    showUrl("/");
  }

  // Returns true if the rename worked, so the list can close its name box
  async function handleRename(id, name) {
    try {
      const saved = await updateBuild(id, { name });
      if (openBuild?.id === id) {
        setOpenBuild(prev => ({ ...prev, name: saved.name, updatedAt: saved.updatedAt }));
        setBuildName(saved.name);
      }
      refreshMyBuilds();
      return true;
    } catch (err) {
      setStatus(`Couldn't rename: ${err.message}`);
      return false;
    }
  }

  async function handleDelete(id) {
    try {
      await deleteBuild(id);
      // The picked parts stay, they just aren't a saved build any more
      if (openBuild?.id === id) {
        openedId.current = null;
        setOpenBuild(null);
        showUrl("/");
      }
      refreshMyBuilds();
    } catch (err) {
      setStatus(`Couldn't delete: ${err.message}`);
    }
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
      const params = new URLSearchParams({ category: partType, part: partName });
      const response = await fetch(`/api/price?${params}`);

      if (!response.ok) throw new Error("API failed");

      const data = await response.json();
      if (isStale()) return;

      // priceCad > 0 means we got a real median from eBay listings
      // priceCad === 0 means the API found no usable listings - treat that
      // as a failure to fetch a price, not a real $0 price
      if (data.priceCad && data.priceCad > 0) {
        setLivePrices(prev => ({ ...prev, [partType]: data }));
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

  const ramFilters = (
    <>
      <span className="relative">
        <select aria-label="RAM sticks" value={ramSticks} onChange={(e) => setRamSticks(e.target.value)} className="field field-select">
          <option value="">Any sticks</option>
          {[1, 2, 4, 8].map(num => <option key={num} value={num}>{num} {num === 1 ? "stick" : "sticks"}</option>)}
        </select>
        <ChevronIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2" />
      </span>

      <span className="relative">
        <select aria-label="RAM generation" value={ramGen} onChange={(e) => setRamGen(e.target.value)} className="field field-select">
          <option value="">Any gen</option>
          {["DDR3", "DDR4", "DDR5"].map(gen => <option key={gen} value={gen}>{gen}</option>)}
        </select>
        <ChevronIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2" />
      </span>

      <span className="relative">
        <select aria-label="RAM capacity" value={ramCap} onChange={(e) => setRamCap(e.target.value)} className="field field-select">
          <option value="">Any capacity</option>
          {[8, 16, 32, 64, 128].map(cap => <option key={cap} value={cap}>{cap}GB total</option>)}
        </select>
        <ChevronIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2" />
      </span>
    </>
  );

  return (
    <main className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6">
      <div className="mb-5">
        <h1 className="guide-head text-4xl leading-none sm:text-5xl">{openBuild?.name ?? "New build"}</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-2">
          Pick a part in each category. Prices are the median of filtered new and used eBay.ca listings, and incompatible parts are flagged.
        </p>
      </div>

      {openBuild && (
        <p className="mb-5 border-[1.5px] border-ink bg-paper px-4 py-3 text-sm">
          {openBuild.owned ? (
            <>
              <strong className="font-bold">Your build.</strong> Save Changes updates it, and its link shows the new version.
              {hasUnsavedChanges && <strong className="ml-2 bg-ink px-1.5 py-0.5 text-xs font-bold text-paper uppercase">Unsaved changes</strong>}
            </>
          ) : (
            <>
              <strong className="font-bold">Shared build.</strong>{" "}
              <span className="text-ink-2">Change any part you like. Saving makes a copy in your builds and leaves the original as is.</span>
            </>
          )}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_25rem] xl:gap-10">
        <div className="border-2 border-ink">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-[1.5px] border-ink bg-paper px-4 py-3 md:px-5">
            <h2 className="guide-head text-xl">Parts</h2>
            <span className="text-xs text-ink-2">Compatible parts are listed first in each search</span>
          </div>
          <div className={`hidden border-b-[1.5px] border-ink bg-paper px-5 py-2 text-[0.6875rem] font-bold tracking-wider text-muted uppercase md:grid ${PART_COLUMNS} md:gap-x-4`}>
            <span>Category</span>
            <span>Part</span>
            <span className="text-right">Listings</span>
            <span className="pr-3 text-right">Median</span>
          </div>
          {CATEGORIES.map(({ key, label }) => (
            <PartCard
              key={key}
              category={key}
              label={label}
              partName={build[key]}
              specs={selectedSpecs[key]}
              price={livePrices[key]}
              priceError={priceErrors[key]}
              issues={issuesByCategory[key]}
              note={priceMarkers[key]}
              // RAM gets mini filters above its search box
              filters={key === "ram" ? ramFilters : null}
            >
              <PartSelect
                category={key}
                label={label}
                value={build[key]}
                onChange={(val) => selectPart(key, val)}
                onOpen={() => loadCategory(key)}
                options={key === "ram" ? filteredRamOptions : catalog[key] ?? null}
                getIssues={(specs) => optionIssues(key, specs)}
              />
            </PartCard>
          ))}
        </div>

        <BuildSummary
          title={buildName.trim() || "Untitled build"}
          categories={CATEGORIES}
          build={build}
          livePrices={livePrices}
          priceErrors={priceErrors}
          issues={compatibilityIssues}
          total={total}
          unpricedCount={unpricedCount}
          notes={priceNotes}
          markers={priceMarkers}
          status={status}
          controls={
            <BuildControls
              name={buildName}
              onNameChange={setBuildName}
              canUpdate={Boolean(openBuild?.owned)}
              isShared={Boolean(openBuild && !openBuild.owned)}
              saving={saving}
              onSave={() => save(false)}
              onSaveAsNew={() => save(true)}
              onReset={handleReset}
            />
          }
        />
      </div>

      <SavedBuilds
        builds={myBuilds}
        error={myBuildsError}
        categories={CATEGORIES}
        currentId={openBuild?.id}
        onLoad={showBuild}
        onRename={handleRename}
        onDelete={handleDelete}
      />
    </main>
  );
}
