"use client"
import { useEffect, useState, useMemo } from "react"
import PartSelect from "../../components/PartSelect";
import { saveBuild, loadBuild, clearBuild } from "../../utils/buildStorage";
import BuildControls from "../../components/BuildControls";
import { match } from "node:assert";

export default function Home() {
  // For ram options dropdown
  const [ramSticks, setRamSticks] = useState("");
  const [ramGen, setRamGen] = useState("");
  const [ramCap, setRamCap] = useState("");

  const [cpu, setCpu] = useState("");
  const [gpu, setGpu] = useState("");
  const [ram, setRam] = useState("");
  const [storage, setStorage] = useState("");
  const [motherboard, setMotherboard] = useState("");
  const [psu, setPsu] = useState("");
  const [cooler, setCooler] = useState("");
  const [prices, setPrices] = useState(null);
  const [liveEbayTotal, setLiveEbayTotal] = useState(null);
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [individualLivePrices, setIndividualLivePrices] = useState({
    cpu: null,
    gpu: null,
    ram: null,
    motherboard: null,
    storage: null,
    psu: null,
    cooler: null,
  });

  // Fetch prices from db
  useEffect(() => {
    // This runs once when the page first loads
    fetch("/api/parts")
      .then((res) => res.json())
      .then((data) => {
        console.log("Loaded prices:", data);
        setPrices(data);
      })
      .catch((err) => {
        console.error("Failed to load prices.json", err);
      })
  }, [])

  // Filter logic for RAM
  const filteredRamOptions = useMemo(() => {
    if (!prices?.ram) return {};

    return Object.fromEntries(
      Object.entries(prices.ram).filter(([name, data]) => {
        const specs = data.specs;

        // If a filter is selected, the part MUST match it
        // If no filter is selected (empty string), we ignore that check
        const matchesSticks = ramSticks === "" || String(specs.stickCount === ramSticks);
        const matchesGen = ramGen === "" || specs.generation === ramGen;
        const matchesCap = ramCap === "" || String(specs.capacityGb) === ramCap;

        return matchesSticks && matchesGen && matchesCap;
      })
    );
  }, [prices?.ram, ramSticks, ramGen, ramCap]);

  // Helper to get eBay price first, then fallabck to databes price
  const getBestPrice = (category, partName, livePrice) => {
    if (!partName) return 0; // Nothing selected
    if (livePrice && livePrice > 0) return livePrice; // use eBay if available
    return prices[category]?.[partName]?.price || 0; // Fallback to DB
  }

  const cpuPrice = getBestPrice("cpu", cpu, individualLivePrices.cpu);
  const gpuPrice = getBestPrice("gpu", gpu, individualLivePrices.gpu);
  const ramPrice = getBestPrice("ram", ram, individualLivePrices.ram);
  const storagePrice = getBestPrice("storage", storage, individualLivePrices.storage);
  const motherboardPrice = getBestPrice("motherboard", motherboard, individualLivePrices.motherboard);
  const psuPrice = getBestPrice("psu", psu, individualLivePrices.psu);
  const coolerPrice = getBestPrice("cooler", cooler, individualLivePrices.cooler);

  const total = cpuPrice + gpuPrice + ramPrice + storagePrice + motherboardPrice + psuPrice + coolerPrice; 

  const build = {
    cpu,
    gpu,
    ram,
    storage,
    motherboard,
    psu,
    cooler,
  }

  // Apply build into state (one state at a time)
  function applyBuildToState(b) {
    // Set the names
    setCpu(b.cpu ?? "");
    setGpu(b.gpu ?? "");
    setRam(b.ram ?? "");
    setStorage(b.storage ?? "");
    setMotherboard(b.motherboard ?? "");
    setPsu(b.psu ?? "");
    setCooler(b.cooler ?? ""); 

    // Immediately fetch live prices for the loaded parts
    if (b.cpu) fetchIndividualPrice("cpu", b.cpu);
    if (b.gpu) fetchIndividualPrice("gpu", b.gpu);
    if (b.ram) fetchIndividualPrice("ram", b.ram);
    if (b.storage) fetchIndividualPrice("storage", b.storage);
    if (b.motherboard) fetchIndividualPrice("motherboard", b.motherboard);
    if (b.psu) fetchIndividualPrice("psu", b.psu);
    if (b.cooler) fetchIndividualPrice("cooler", b.cooler);
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
    // Reset UI selections
    applyBuildToState({}); // all fields become "" because of ?? ""

    // Reset the live price memory bank to all nulls
    setIndividualLivePrices({
      cpu: null,
      gpu: null,
      ram: null,
      motherboard: null,
      storage: null,
      psu: null,
      cooler: null,
    });

    // Reset the live total
    setLiveEbayTotal(null);
  }

  // Fetches the live price for an array of parts one by one
  async function handleGetLiveTotal() {
    setIsFetchingLive(true);
    setLiveEbayTotal(null); // clear the old total

    // Make a list of whatever parts are currently selected
    const selectedParts = [cpu, gpu, ram, storage, motherboard, psu, cooler].filter(part => part !== "");

    let newLiveTotal = 0;

    // Loop through each selected part and ask backend for the eBay price
    for (const part of selectedParts) {
      try {
        console.log(`Asking API for: ${part}`); // DIAGNOSTIC LOG

        // Use encodeURIComponent so spaces become %20 (URL safe)
        const response = await fetch(`api/test?part=${encodeURIComponent(part)}`);
        if (!response.ok) {
          console.error(`Backend API failed for ${part} with status ${response.status}`);
          continue;
        }
        const data = await response.json();

        // Add the live pricing to running total
        if (data.price_cad) {
          newLiveTotal += data.price_cad;
        }
      } catch (error) {
        console.error(`Failed to fetch live price for ${part}`, error);
      }
    }

    setLiveEbayTotal(newLiveTotal);
    setIsFetchingLive(false);
  }

  // Fetches the price for one specific part and saves it to state
  async function fetchIndividualPrice(partType, partName) {
    // If the user selected "Choose a CPU..." (empty string), reset the price to null
    if (!partName) {
      setIndividualLivePrices(prev => ({ ...prev, [partType]: null}));
      return;
    }

    try {
      console.log(`Fetching individual price for ${partName}...`);
      const response = await fetch(`/api/test?part=${encodeURIComponent(partName)}`);

      if (!response.ok) throw new Error("API failed");

      const data = await response.json();

      // Update the specific part's price in memory bank
      if (data.price_cad) {
        setIndividualLivePrices(prev => ({ ...prev, [partType]: data.price_cad }));
      }     
    } catch (error) {
        console.error(`Failed to fetch individual price for ${partName}`, error);
    }
  }

  // If prices haven't loaded yet,t show something instead of a blank page
  if (!prices) {
    return <p>Loading prices...</p>
  }
  
  if (prices) {
    return (
      <main>
        <h1>PC Price Estimator</h1>

        {/* --- CPU --- */}
        <div style={{ marginBottom: "12px" }}>
          <PartSelect 
            label="CPU" 
            value={cpu} 
            setValue={(val) => { setCpu(val); fetchIndividualPrice("cpu", val); }} 
            options={prices?.cpu}
          /> 
        </div>

        {/* --- GPU --- */}
        <div style={{ marginBottom: "12px" }}>
          <PartSelect 
            label="GPU" 
            value={gpu} 
            setValue={(val) => { setGpu(val); fetchIndividualPrice("gpu", val); }} 
            options={prices?.gpu}
          /> 
        </div>

        {/* --- RAM WITH MINI FILTERS --- */}
        <div style={{ marginBottom: "12px", border: "1px solid #ddd", padding: "12px", borderRadius: "8px" }}>
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

          <PartSelect label="RAM" value={ram} setValue={(val) => { setRam(val); fetchIndividualPrice("ram", val); }} options={filteredRamOptions} /> 
        </div>

        {/* --- MOTHERBOARD --- */}
        <div style={{ marginBottom: "12px" }}>
          <PartSelect 
            label="Motherboard" 
            value={motherboard} 
            setValue={(val) => { setMotherboard(val); fetchIndividualPrice("motherboard", val); }} 
            options={prices?.motherboard}
          /> 
        </div>

        {/* --- STORAGE --- */}
        <div style={{ marginBottom: "12px" }}>
          <PartSelect 
            label="Storage" 
            value={storage} 
            setValue={(val) => { setStorage(val); fetchIndividualPrice("storage", val); }} 
            options={prices?.storage}
          /> 
        </div>

        {/* --- PSU --- */}
        <div style={{ marginBottom: "12px" }}>
          <PartSelect 
            label="PSU" 
            value={psu} 
            setValue={(val) => { setPsu(val); fetchIndividualPrice("psu", val); }} 
            options={prices?.psu}
          /> 
        </div>

        {/* --- COOLER --- */}
        <div style={{ marginBottom: "12px" }}>
          <PartSelect 
            label="Cooler" 
            value={cooler} 
            setValue={(val) => { setCooler(val); fetchIndividualPrice("cooler", val); }} 
            options={prices?.cooler}
          /> 
        </div>

        <div style={{ marginTop: "24px", padding: "16px", border: "1px solid #ccc" }}>
          <h3>Build Summary</h3>
          <p>CPU{cpu=="" ? "" : " " + `(${cpu})`}: ${cpuPrice.toFixed(2)}</p>
          <p>GPU{gpu=="" ? "" : " " + `(${gpu})`}: ${gpuPrice.toFixed(2)}</p>
          <p>RAM{ram=="" ? "" : " " + `(${ram})`}: ${ramPrice.toFixed(2)}</p>
          <p>Motherboard{motherboard=="" ? "" : " " + `(${motherboard})`}: ${motherboardPrice.toFixed(2)}</p>
          <p>Storage{storage=="" ? "" : " " + `(${storage})`}: ${storagePrice.toFixed(2)}</p>
          <p>PSU{psu=="" ? "" : " " + `(${psu})`}: ${psuPrice.toFixed(2)}</p>
          <p>Cooler{cooler=="" ? "" : " " + `(${cooler})`}: ${coolerPrice.toFixed(2)}</p>
  
          <h2>Total: ${total.toFixed(2)}</h2> 
        </div>

      <BuildControls onSave={handleSave} onLoad={handleLoad} onReset={handleReset} />
      </main>
    );
  }
}
